import { Emitter } from 'strict-event-emitter';
import {
    CCXExtensionClass as ExtensionClass,
    ExtensionInfo,
    SettingsItem
} from '../../types/ccx';
import { VirtualMachine } from '../../types/virtual-machine';
import { CentralDispatch as dispatch } from '../../dispatch/central-dispatch';
import { Extension } from '../../manager';
import * as JSZip from 'jszip';
import mime from 'mime-types';
import {
    makeUnsandboxedCtx,
    ExtensionCentralAPI,
    Ctx,
    WorkerCtx,
    BlockJSON
} from './make-ctx';
import ExtensionSandbox from './ccx.worker';

declare global {
    // eslint-disable-next-line no-var
    var ClipCCExtension: Ctx | WorkerCtx | undefined;
}

interface Target {
    isStage: boolean;
}

interface PendingExtensionWorker {
    extensionId: string;
    mainScript: string;
    resolve: (id: number) => void;
    reject: (e: unknown) => void;
}

export interface CCXExtension extends Extension {
    type: 'ccx';
    info: ExtensionInfo;
    locales: Record<string, Record<string, string>>;
    enabled: boolean;
    fileContent: ArrayBufferLike;
    instance: string | ExtensionClass; // The serviceName or extensionClass.
    warnings?: string[];
}

export interface CCXAdapterEvents {
    LOADED: [id: string, extension: CCXExtension];
    ENABLED: [id: string, extension: CCXExtension];
    DISABLED: [id: string, extension: CCXExtension];
    REFRESH_TOOLBOX: [];
    REGISTER_BLOCK: [blocks: BlockJSON[]];
    REGISTER_BUTTON: [id: string, func: () => void];
    LOCALE_ADDED: [Record<string, unknown>];
    SETTINGS_ADDED: [id: string, settings: SettingsItem[]];
    [eventName: string]: [...params: unknown[]];
}

class CCXAdapter extends Emitter<CCXAdapterEvents> {
    /**
     * Editor's Virtual Machine instance.
     * Should be set by `attachVM` while initializing.
     * @todo add more strict type check when VM adds TS support.
     */
    vm?: VirtualMachine;
    /**
     * CCXAdapter's central api.
     * @type {ExtensionCentralAPI}
     */
    api = new ExtensionCentralAPI(this);

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
    * Loaded scratch extensions, ID with extension info.
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
        dispatch.setService('ccxAPI', this.api).catch((e: Error) => {
            console.error(`ccxAPI was unable to register extension service: ${JSON.stringify(e)}`);
        });
    }

    /**
     * Set the VM for the extension manager.
     * @param {VirtualMachine} vm - the VM instance.
     */
    attachVM (vm: VirtualMachine) {
        this.vm = vm;
        this.api.attachVM(vm);
    }

    /**
     * Set the Block for the extension manager.
     * @param {Blockly} block - the Blockly instance.
     */
    attachBlock (block: Record<string, unknown>) {
        this.api.attachBlock(block);
    }

    /**
     * Load a CCX extension.
     * @param {string} url - Extension's URL.
     * @param {'sandboxed' | 'unsandboxed'} env - Extension's running environment.
     */
    async load (url: string, env?: 'sandboxed' | 'unsandboxed') {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
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
            this.emit('SETTINGS_ADDED', info.id, info.settings);
        }

        const locales: Record<string, Record<string, string>> = {};
        // Load locales
        for (const fileName in zipData.files) {
            const result = fileName.match(/^locales\/([A-Za-z0-9_-]+).json$/);
            if (result) {
                locales[result[1]] = JSON.parse(await zipData.files[fileName].async('text'));
            }
        }
        if (info.default_language && info.default_language in locales) { // default language param
            locales.default = locales[info.default_language];
        } else {
            locales.default = locales.en;
        }
        // Load locales before ``main.js`` executed to prevent block locale issues.
        this.emit('LOCALE_ADDED', locales);

        // Load main.js
        switch (env) {
        case 'sandboxed': {
            const originalScript = await zipData.files['main.js'].async('text');
            return new Promise((resolve, reject) => {
                // If we `require` this at the global level it breaks non-webpack targets, including tests
                const ExtensionWorker = new ExtensionSandbox();
                this.loadedCCXExtension.set(info.id, {
                    type: 'ccx',
                    id: info.id,
                    info: info,
                    locales,
                    url,
                    enabled: true,
                    env: 'sandboxed',
                    fileContent: buffer
                } as CCXExtension);
                this.pendingExtensions.push({
                    extensionId: info.id,
                    mainScript: URL.createObjectURL(new Blob([originalScript], { type: 'text/javascript' })),
                    resolve,
                    reject
                });
                dispatch.addWorker(ExtensionWorker);
            });
        }
        case 'unsandboxed': {
            let extensionObject = null as unknown as ExtensionClass;
            try {
                const originalScript = await zipData.files['main.js'].async('text');
                const closureFunc = new Function('module', originalScript);
                // "__webpack_require__" can load modules from global env.
                // so we exposure ctx globally until extension is loaded.
                global.ClipCCExtension = makeUnsandboxedCtx(this.api, info.id);
                // rewrite "module.exports" to get extension class.
                closureFunc(new Proxy({}, {
                    set (target: Record<string, unknown>, prop: string, value: unknown) {
                        if (prop === 'exports') {
                            extensionObject = value as ExtensionClass;
                        }
                        target[prop] = value;
                        return true;
                    }
                }));
                // @ts-expect-error Assume it is
                extensionObject = (new extensionObject()) as ExtensionClass;
                if (typeof extensionObject.onInit === 'function') {
                    await extensionObject.onInit();
                }
                this.loadedCCXExtension.set(info.id, {
                    type: 'ccx',
                    id: info.id,
                    info: info,
                    locales,
                    url,
                    instance: extensionObject,
                    enabled: true,
                    env: 'unsandboxed',
                    fileContent: buffer
                } as CCXExtension);
                this.emit('LOADED', info.id, {
                    type: 'ccx',
                    id: info.id,
                    info: info,
                    locales,
                    url,
                    instance: extensionObject,
                    enabled: true,
                    env: 'unsandboxed',
                    fileContent: buffer
                });
            } finally {
                // revoke temporary ctx
                delete global.ClipCCExtension;
            }
            break;
        }
        default:
            throw new Error('unexpected env');
        }
    }

    /**
     * Switch a ccx extension's status.
     * @param {string} extensionId - Extension's ID
    */
    async switchStatus (extensionId: string, status: boolean) {
        const targetExt = this.loadedCCXExtension.get(extensionId);
        if (!targetExt) {
            throw new Error(`Cannot locate extension ${extensionId}.`);
        }

        if (targetExt.enabled === status) {
            return;
        }

        // It's running in worker
        if (typeof targetExt.instance === 'string') {
            try {
                if (status) {
                    await dispatch.call(targetExt.instance, 'onInit');
                } else {
                    await dispatch.call(targetExt.instance, 'onUninit');
                }
            } catch (e: unknown) {
                // We can't know if the function exists, just ignore it.
                console.error(e);
            }
        } else if (status) {
            if (typeof targetExt.instance.onInit === 'function') {
                await targetExt.instance.onInit();
            }
        } else if (typeof targetExt.instance.onUninit === 'function') {
            await targetExt.instance.onUninit();
        }

        targetExt.enabled = status;
        if (status) {
            this.emit('ENABLED', extensionId, targetExt);
        } else {
            this.emit('DISABLED', extensionId, targetExt);
        }
    }

    /**
     * Reload a ccx extension.
     * @param {string} extensionId - Extension's ID
    */
    async reload (extensionId: string) {
        const targetExt = this.loadedCCXExtension.get(extensionId);
        await this.switchStatus(extensionId, !targetExt?.enabled);
        await this.switchStatus(extensionId, !targetExt?.enabled);
    }

    /**
     * Reload all ccx extensions.
    */
    reloadAll () {
        const allPromises: Promise<void>[] = [];
        for (const [extId] of this.loadedCCXExtension.entries()) {
            allPromises.push(this.reload(extId));
        }
        return Promise.all(allPromises);
    }

    /**
     * Update locales.
    */
    updateLocales () {
        this.api.updateLocales();
    }

    /**
     * Generate toolbox items by blocks added by CCX.
     * @param target VM's target.
     */
    getBlocksXML (target: Target) {
        return this.api.getBlocksXML(target);
    }

    allocateWorker () {
        const workerInfo = this.pendingExtensions.shift();
        if (!workerInfo) {
            console.warn('pending extension queue is empty');
            return;
        }
        const id = this.nextExtensionWorker++;
        this.pendingWorkers[id] = workerInfo;
        return [id, workerInfo.extensionId, workerInfo.mainScript] as const;
    }

    /**
     * Collect extension metadata from the specified service and begin the extension registration process.
     * @param {string} serviceName - the name of the service hosting the extension.
     */
    registerExtensionService (extensionId: string, serviceName: string) {
        const extensionInfo = this.loadedCCXExtension.get(extensionId);
        if (!extensionInfo) return;

        extensionInfo.instance = serviceName;
        this.loadedCCXExtension.set(extensionId, extensionInfo);
        this.emit('LOADED', extensionInfo.id, extensionInfo);
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
