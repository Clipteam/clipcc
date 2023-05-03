import { ScratchAdapter } from '../adapter';
import {
    StandardScratchExtensionClass as ExtensionClass
} from '../type/scratch';
interface Extension {
    type: 'scratch';
    env: 'unsandboxed' | 'sandboxed';
    url: string;
}

class ExtensionManager {
    /**
     * Map of loaded extensions.
     * The key name as the extension's id.
     */
    loadedExtensions = new Map<string, Extension>();

    /**
     * Map of internal extensions.
     * The key name as the extension's id.
     */
    internalExtensions = new Map<string, () => ExtensionClass>();

    /**
     * Editor's Virtual Machine instance.
     * Should be set by `attachVM` while initializing.
     * @todo add more strict type check when VM adds TS support.
     */
    vm?: Record<string, unknown>;

    /**
     * Editor's Blockly instance.
     * Should be set by `attachBlockly` while initializing.
     * @todo add more strict type check when Blockly adds TS support.
     */
    block?: Record<string, unknown>;

    /**
     * Adapter instance to load scratch standard extensions.
     */
    scratchAdapter = new ScratchAdapter();

    /**
     * Check whether an extension is registered or is in the process of loading. This is intended to control loading or
     * adding extensions so it may return `true` before the extension is ready to be used. Use the promise returned by
     * `loadExtensionURL` if you need to wait until the extension is truly ready.
     * @param {string} extensionId - the ID of the extension.
     * @returns {boolean} - true if loaded, false otherwise.
     */
    isExtensionLoaded (extensionId: string) {
        return this.loadedExtensions.has(extensionId);
    }

    /**
     * Register a internal extension (Eg: pen, music, etc).
     * These extensions will be load synchronously in original environment.
     * This method should only work when dealing with extensions that are too deeply coupled to Scratch.
     * @param {string} extensionId - the ID of the extension.
     * @param {ScratchExtensionClass} extensionClass - the class of the extension.
     */
    registerInternalExtension (extensionId: string, extensionClassGetter: () => ExtensionClass) {
        if (this.internalExtensions.has(extensionId)) {
            console.warn(`${extensionId} had been registered before. re-registering...`);
        }

        this.internalExtensions.set(extensionId, extensionClassGetter);
    }

    /**
     * Synchronously load an internal extension (core or non-core) by ID. This call will
     * fail if the provided id is not does not match an internal extension.
     * @param {string} extensionId - the ID of an internal extension
     * @deprecated use loadExtensionURL instead.
     */
    loadExtensionIdSync () {
        console.warn('this method is deprecated. use loadExtensionURL instead.');
    }

    /**
     * Load an extension by URL or internal extension ID
     * @param {string} extensionURL - the URL for the extension to load OR the ID of an internal extension
     * @returns {Promise} resolved once the extension is loaded and initialized or rejected on failure
     */
    async loadExtensionURL (
        extensionURL: string,
        type: 'scratch' = 'scratch',
        env: 'sandboxed' | 'unsandboxed' = 'sandboxed'
    ) {
        if (this.internalExtensions.has(extensionURL)) {
            this.loadedExtensions.set(extensionURL, {
                type: 'scratch',
                env: 'unsandboxed',
                url: extensionURL
            });
            const internalExtensionGetter = this.internalExtensions.get(extensionURL) as () => ExtensionClass;
            await this.scratchAdapter.load(internalExtensionGetter());
            return;
        }

        if (
            typeof extensionURL !== 'string' ||
            !extensionURL.startsWith('data:') ||
            !extensionURL.startsWith('http')
        ) {
            throw new Error(`Invalid url ${extensionURL}`);
            return;
        }

        switch (env) {
        case 'unsandboxed': {
            // @todo fetch extension
            break;
        }
        case 'sandboxed': {
            break;
        }
        default:
            throw new Error(`Invaild running environment`);
        }

        switch (type) {
        case 'scratch': {
            const extensionId = await this.scratchAdapter.load(extensionURL);
            this.loadedExtensions.set(extensionId, {
                type: 'scratch',
                env: env,
                url: extensionURL
            });
            break;
        }
        default:
            throw new Error(`Invaild extension type`);
        }
    }

    /**
     * Set the VM for the extension manager.
     * @param {VirtualMachine} vm - the VM instance.
     */
    attachVM (vm: Record<string, unknown>) {
        this.vm = vm;
        this.scratchAdapter.attachVM(vm);
    }

    /**
     * Set the Block for the extension manager.
     * @param {Blockly} block - the Blockly instance.
     */
    attachBlock (block: Record<string, unknown>) {
        this.block = block;
    }
}

export {
    ExtensionManager
};
