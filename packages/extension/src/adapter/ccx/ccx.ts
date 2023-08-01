import { Emitter } from 'strict-event-emitter';
import {
    CCXExtensionClass as ExtensionClass,
    ExtensionInfo
} from '../../type/ccx';
import { VM } from '../../type/virtual-machine';
import { CentralDispatch as dispatch } from '../../dispatch/central-dispatch';
import { Extension } from '../../manager';
import * as JSZip from 'jszip';
import mime from 'mime-types';
import { makeCtx, Ctx } from './make-ctx';

declare global {
    var ClipCCExtension: Ctx | undefined;
}

interface PendingExtensionWorker {
    extensionURL: string,
    resolve: (value: unknown) => void;
    reject: (value: unknown) => void;
}

export interface CCXExtension extends Extension {
    type: 'ccx';
    info: ExtensionInfo;
    locales: Record<string, Record<string, string>>;
    enabled: boolean;
    class: string | ExtensionClass; // The serviceName or extensionClass.
}

export interface CCXAdapterEvents {
    LOADED: [url: string, extension: CCXExtension];
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
    * Loaded scratch extensions, URL with extension info.
    * @type {Map<string, ExtensionClass>}
    */
    private loadedScratchExtension = new Map<string, CCXExtension>();

    constructor () {
        super();
        dispatch.setService('ccxAdapter', this).catch((e: Error) => {
            console.error(`CCXAdapter was unable to register extension service: ${JSON.stringify(e)}`);
        });
    }

    /**
     * Set the VM for the extension manager.
     * @param {VirtualMachine} vm - the VM instance.
     */
    attachVM (vm: VM) {
        this.vm = vm;
    }

    /**
     * Load a CCX extension.
     * @param {string} url - Extension's URL.
     * @param {'sandboxed' | 'unsandboxed'} env - Extension's running environment.
     */
    async load (url: string, env: 'sandboxed' | 'unsandboxed' = 'unsandboxed') {
        const response = await fetch(url);
        const buffer = response.arrayBuffer();
        const zipData = await JSZip.loadAsync(buffer);

        // Validate
        if (!('info.json' in zipData.files)) throw new Error('missing info.json');
        if (!('main.js' in zipData.files)) throw new Error('missing main.js');

        // Load info.json
        const infoContent = await zipData.files['info.json'].async('text');
        const info = JSON.parse(infoContent);

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

        // Load main.js
        switch (env) {
        case 'sandboxed':
        case 'unsandboxed':
                let extensionObject = null as unknown as ExtensionClass;
                try {
                    const originalScript = await zipData.files['main.js'].async('text');
                    const closureFunc = eval(`(function(module){${originalScript}})`);
                    const ctx = makeCtx();
                    // "__webpack_require__" can load modules from global env.
                    // so we exposure ctx globally until extension is loaded.
                    window.ClipCCExtension = ctx;
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
                    // init extension
                    if (extensionObject.onInit) extensionObject.onInit();
                    this.loadedScratchExtension.set(url, {
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
                    delete window.ClipCCExtension;
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
    async reload(extensionURL: string) {}

    /**
     * Reload all ccx extensions.
    */
    reloadAll() {}
}

export {
    CCXAdapter
};
