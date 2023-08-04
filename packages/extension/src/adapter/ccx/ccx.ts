import { Emitter } from 'strict-event-emitter';
import {
    CCXExtensionClass as ExtensionClass,
    ExtensionInfo,
    SettingsItem
} from '../../type/ccx';
import { VM } from '../../type/virtual-machine';
import { CentralDispatch as dispatch } from '../../dispatch/central-dispatch';
import { Extension } from '../../manager';
import * as JSZip from 'jszip';
import mime from 'mime-types';
import { makeCtx, Ctx, WorkerCtx, BlockJSON } from './make-ctx';
import ExtensionSandbox from './ccx.worker';

declare global {
    var ClipCCExtension: Ctx | WorkerCtx | undefined;
}


interface Target {
    isStage: boolean;
}

interface PendingExtensionWorker {
    extensionURL: string;
    mainScript: string;
    resolve: (value: unknown) => void;
    reject: (value: unknown) => void;
}

export interface CCXExtension extends Extension {
    type: 'ccx';
    info: ExtensionInfo;
    locales: Record<string, Record<string, string>>;
    enabled: boolean;
    class: string | ExtensionClass; // The serviceName or extensionClass.
    warnings?: string[];
}

export interface CCXAdapterEvents {
    LOADED: [url: string, extension: CCXExtension];
    REFRESH_TOOLBOX: [];
    REGISTER_BLOCK: [blocks: BlockJSON[]];
    REGISTER_BUTTON: [id: string, func: Function];
    LOCALE_ADDED: [Record<string, unknown>];
    SETTINGS_ADDED: [id: string, settings: SettingsItem[]];
    [eventName: string]: [...params: any[]];
}

class CCXAdapter extends Emitter<CCXAdapterEvents> {
    /**
     * Editor's Virtual Machine instance.
     * Should be set by `attachVM` while initializing.
     * @todo add more strict type check when VM adds TS support.
     */
    vm?: VM;
    /**
     * CCXAdapter's context.
     * @type {Ctx}
     */
    ctx = makeCtx(this, dispatch);

    /**
     * The ID number to provide to the next extension worker.
     * @type {int}
     */
    private nextExtensionWorker = 0;

    /**
     * FIFO queue of extensions which have been requested but not yet loaded in a worker,
     * along with promise resolution functions to call once the worker is ready or failed.
     *
     * @type {Array.<PendingExtensionWorker>}
     */
    private pendingExtensions: PendingExtensionWorker[] = [];

    /**
     * Map of worker ID to workers which have been allocated but have not yet finished initialization.
     * @type {Array.<PendingExtensionWorker>}
     */
    private pendingWorkers: PendingExtensionWorker[] = [];

    /**
    * Loaded scratch extensions, URL with extension info.
    * @type {Map<string, ExtensionClass>}
    */
    private loadedCCXExtension = new Map<string, CCXExtension>();

    /**
     * GUI's settings.
     * @type {Record<string, unknown>}
     */
    guiSettings: Record<string, unknown> = {};

    constructor () {
        super();
        dispatch.setService('ccxAdapter', this).catch((e: Error) => {
            console.error(`ccxAdapter was unable to register extension service: ${JSON.stringify(e)}`);
        });
        dispatch.setService('ccxAPI', this.ctx.api).catch((e: Error) => {
            console.error(`ccxAPI was unable to register extension service: ${JSON.stringify(e)}`);
        });
    }

    /**
     * Set the VM for the extension manager.
     * @param {VirtualMachine} vm - the VM instance.
     */
    attachVM (vm: VM) {
        this.vm = vm;
        this.ctx.api.attachVM(vm);
    }

    /**
     * Set the Block for the extension manager.
     * @param {Blockly} block - the Blockly instance.
     */
    attachBlock (block: Record<string, unknown>) {
        this.ctx.api.attachBlock(block);
    }

    /**
     * Load a CCX extension.
     * @param {string} url - Extension's URL.
     * @param {'sandboxed' | 'unsandboxed'} env - Extension's running environment.
     */
    async load (url: string, env?: 'sandboxed' | 'unsandboxed') {
        const response = await fetch(url);
        const buffer = response.arrayBuffer();
        const zipData = await JSZip.loadAsync(buffer);

        // Validate
        if (!('info.json' in zipData.files)) throw new Error('missing info.json');
        if (!('main.js' in zipData.files)) throw new Error('missing main.js');

        // Load info.json
        const infoContent = await zipData.files['info.json'].async('text');
        const info = JSON.parse(infoContent);

        env = env ?? (info.sandboxed ? 'sandboxed' : 'unsandboxed');

        if (info.icon) {
            const data = await zipData.files[info.icon].async('arraybuffer');
            info.icon = URL.createObjectURL(new Blob(
                [data], { type: mime.lookup(info.icon) || 'image/png' }
            ));
        }
        if (info.inset_icon) {
            const data = await zipData.files[info.inset_icon].async('arraybuffer');
            info.inset_icon = URL.createObjectURL(new Blob(
                [data], { type: mime.lookup(info.inset_icon) || 'image/svg+xml' }
            ));
        }

        // Load settings
        if ('settings.json' in zipData.files) {
            const content = await zipData.files['settings.json'].async('text');
            info.settings = JSON.parse(content);
        }
        this.emit('SETTINGS_ADDED', info.id, info.settings);

        const locales: Record<string, Record<string, string>> = {};
        // Load locales
        for (const fileName in zipData.files) {
            const result = fileName.match(/^locales\/([A-Za-z0-9_-]+).json$/);
            if (result) {
                locales[result[1]] = JSON.parse(await zipData.files[fileName].async('text'));
            }
        }
        if (info.default_language && locales.hasOwnProperty(info.default_language)) { // default language param
            locales.default = locales[info.default_language];
        } else {
            locales.default = locales.en;
        }
        // Load locales before ``main.js`` executed to prevent block locale issues.
        this.emit('LOCALE_ADDED', locales);

        // Load main.js
        switch (env) {
        case 'sandboxed':
            const originalScript = await zipData.files['main.js'].async('text');
            return new Promise((resolve, reject) => {
                // If we `require` this at the global level it breaks non-webpack targets, including tests
                const ExtensionWorker = new ExtensionSandbox();
                this.loadedCCXExtension.set(url, {
                        type: 'ccx',
                        info: info,
                        locales,
                        enabled: true,
                        env: 'sandboxed'
                    } as CCXExtension);
                this.pendingExtensions.push({
                    extensionURL: url,
                    mainScript: URL.createObjectURL(new Blob([originalScript], { type: "text/javascript" })),
                    resolve,
                    reject
                });
                dispatch.addWorker(ExtensionWorker);
            });
            break;
        case 'unsandboxed':
                let extensionObject = null as unknown as ExtensionClass;
                try {
                    const originalScript = await zipData.files['main.js'].async('text');
                    const closureFunc = new Function('module', originalScript);
                    // "__webpack_require__" can load modules from global env.
                    // so we exposure ctx globally until extension is loaded.
                    global.ClipCCExtension = this.ctx;
                    // rewrite "module.exports" to get extension class.
                    closureFunc(new Proxy({}, {
                        set(target: Record<string, unknown>, prop: string, value: unknown) {
                            if (prop === 'exports') {
                                extensionObject = value as ExtensionClass;
                            }
                            target[prop] = value;
                            return true;
                        }
                    }));
                    // @ts-expect-error
                    extensionObject = (new extensionObject()) as ExtensionClass;
                    if (extensionObject.onInit) {
                        extensionObject.onInit();
                    }
                    this.loadedCCXExtension.set(url, {
                        type: 'ccx',
                        info: info,
                        locales,
                        class: extensionObject,
                        enabled: true,
                        env: 'unsandboxed'
                    } as CCXExtension);
                    this.emit('LOADED', url, {
                        type: 'ccx',
                        info: info,
                        locales,
                        url,
                        class: extensionObject,
                        enabled: true,
                        env: 'unsandboxed'
                    });
                } catch (e) {
                    throw e;
                } finally {
                    // revoke temporary ctx
                    delete global.ClipCCExtension;
                }
                break;
        default:
            throw new Error('unexpected env');
        }
    }

    /**
     * Reload a scratch-standard extension.
     * @param {string} extensionURL - Extension's URL
    */
    async reload (extensionURL: string) {
        // @todo
    }

    /**
     * Reload all ccx extensions.
    */
    reloadAll () {}

    /**
     * Update locales.
    */
    updateLocales () {
        this.ctx.api.updateLocales();
    }

    /**
     * Generate toolbox items by blocks added by CCX.
     * @param target VM's target.
     */
    getBlocksXML (target: Target) {
        return this.ctx.api.getBlocksXML(target);
    }

    allocateWorker () {
        const workerInfo = this.pendingExtensions.shift();
        if (!workerInfo) {
            console.warn('pending extension queue is empty');
            return;
        }
        const id = this.nextExtensionWorker++;
        this.pendingWorkers[id] = workerInfo;
        return [id, workerInfo.extensionURL, workerInfo.mainScript];
    }

    /**
     * Collect extension metadata from the specified service and begin the extension registration process.
     * @param {string} serviceName - the name of the service hosting the extension.
     */
    registerExtensionService (extensionURL: string, serviceName: string) {
        const extensionInfo = this.loadedCCXExtension.get(extensionURL)!;
        extensionInfo.class = serviceName;
        this.loadedCCXExtension.set(extensionURL, extensionInfo);
        this.emit('LOADED', extensionURL, extensionInfo);
    }

    /**
     * Called by an extension worker to indicate that the worker has finished initialization.
     * @param {int} id - the worker ID.
     * @param {*?} e - the error encountered during initialization, if any.
     */
    onWorkerInit (id: number, e?: Error) {
        const workerInfo = this.pendingWorkers[id];
        URL.revokeObjectURL(workerInfo.mainScript);
        delete this.pendingWorkers[id];
        if (e) {
            workerInfo.reject(e);
        } else {
            workerInfo.resolve(id);
        }
    }
}

export {
    CCXAdapter
};
