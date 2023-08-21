import formatMessage from "format-message";
import { Emitter } from 'strict-event-emitter';
import {
    ScratchAdapter,
    CCXAdapter,
    ScratchExtension
} from '../adapter';
import {
    StandardScratchExtensionClass as ExtensionClass
} from '../type/scratch';
import {
    SettingsItem
} from '../type/ccx';
import { VM } from '../type/virtual-machine';
export interface Extension {
    id: string;
    type: 'scratch' | 'ccx';
    env: 'unsandboxed' | 'sandboxed';
    url: string;
}

export interface Events {
    EXTENSION_LOADING: [extensionURL: string];
    LOCALE_ADDED: [locales: Record<string, unknown>];
    SETTINGS_ADDED: [id: string, settings: SettingsItem[]];
    EXTENSION_LOADED: [extensionURL: string, extension: Extension];
    EXTENSION_LOAD_ERROR: [extensionURL: string, reason: unknown];
    [eventName: string]: [...params: any[]]
}

class ExtensionManager extends Emitter<Events> {
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
    vm?: VM;

    /**
     * Editor's Blockly instance.
     * Should be set by `attachBlock` while initializing.
     * @todo add more strict type check when Blockly adds TS support.
     */
    block?: Record<string, unknown>;

    /**
     * Adapter instance to load scratch standard extensions.
     */
    scratchAdapter = new ScratchAdapter();

    /**
     * Adapter instance to load CCX extensions.
     */
    ccxAdapter = new CCXAdapter();

    constructor () {
        super();
        formatMessage.setup({locale: 'uninit', translations: {}});
        this.scratchAdapter.on('LOADED', this.handleExtensionLoaded.bind(this));
        this.ccxAdapter.on('SETTINGS_ADDED', this.handleAddSettings.bind(this));
        this.ccxAdapter.on('LOCALE_ADDED', this.handleAddLocale.bind(this));
        this.ccxAdapter.on('LOADED', this.handleExtensionLoaded.bind(this));
    }
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
     * Get all loaded extensions.
     * @returns {Extension[]} all extensions.
     */
    getLoadedExtensions () {
        return Object.fromEntries(this.loadedExtensions.entries());
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
     * @returns {Promise<string>} resolved with extensionId once the extension is loaded and initialized or rejected on failure
     */
    async loadExtensionURL (
        extensionURL: string,
        type: 'scratch' | 'ccx' = 'scratch',
        env: 'sandboxed' | 'unsandboxed' = 'sandboxed'
    ) {
        if (this.loadedExtensions.has(extensionURL)) {
            throw new Error(`Cannot load extension (${extensionURL}) twice`);
        }
        this.emit('EXTENSION_LOADING', extensionURL);
        try {
            if (this.internalExtensions.has(extensionURL)) {
                const internalExtensionGetter = this.internalExtensions.get(extensionURL) as () => ExtensionClass;
                await this.scratchAdapter.load(internalExtensionGetter());
                return extensionURL;
            }

            switch (type) {
            case 'scratch': {
                const extensionId = await this.scratchAdapter.load(extensionURL, env);
                return extensionId;
            }
            case 'ccx':
                const extensionId = await this.ccxAdapter.load(extensionURL, env);
                return extensionId;
            default:
                throw new Error(`Invaild extension type`);
            }
        } catch (e: unknown) {
            this.emit('EXTENSION_LOAD_ERROR', extensionURL, e);
            throw e;
        }
    }

    /**
     * Reload all extensions. It's useful while setting locales.
     */
    async reloadAllExtensions () {
        const reloadPromises: Promise<unknown>[] = [];
        for (const [extensionURL] of this.loadedExtensions.entries()) {
            reloadPromises.push(this.reloadExtension(extensionURL));
        }
        return Promise.all(reloadPromises);
    }

    /**
     * Reload extension by URL.
     * @param {string} extensionURL - Extension's URL
     */
    reloadExtension (extensionURL: string) {
        const extension = this.loadedExtensions.get(extensionURL);
        if (!extension) {
            throw new Error(`Cannot locate extension ${extensionURL}.`);
        }

        switch (extension.type) {
        case 'scratch':
            return this.scratchAdapter.reload(extensionURL);
        case 'ccx':
            return this.ccxAdapter.reload(extensionURL);
        default:
            throw new Error(`Invaild extension type`);
        }
    }

    /**
     * Update all extension's locales
     */
    async updateExtensionLocales () {
        await this.ccxAdapter.updateLocales();
        await this.scratchAdapter.updateLocales();
    }


    /**
     * set the current locale and builtin messages for the Extension Manager
     * @param {!string} locale       current locale
     * @param {!object} messages     builtin messages map for current locale
     * @returns {Promise} Promise that resolves when all the blocks have been
     *     updated for a new locale (or empty if locale hasn't changed.)
     */
    async setLocale (locale: string, messages: any) {
        if (locale !== formatMessage.setup().locale) {
            formatMessage.setup({locale: locale, translations: {[locale]: messages}});
        }

        await this.updateExtensionLocales();
    }

    /**
     * Set the VM for the extension manager.
     * @param {VirtualMachine} vm - the VM instance.
     */
    attachVM (vm: VM) {
        this.vm = vm;
        this.scratchAdapter.attachVM(vm);
        this.ccxAdapter.attachVM(vm);
    }

    /**
     * Set the Block for the extension manager.
     * @param {Blockly} block - the Blockly instance.
     */
    attachBlock (block: Record<string, unknown>) {
        this.block = block;
        this.ccxAdapter.attachBlock(block);
    }

    private handleExtensionLoaded (id: string, extension: Extension) {
        this.loadedExtensions.set(id, extension);
        this.emit('EXTENSION_LOADED', id, extension);
    }

    private handleAddLocale (locales: Record<string, unknown>) {
        this.emit('LOCALE_ADDED', locales);
    }

    private handleAddSettings (id: string, settings: SettingsItem[]) {
        this.emit('SETTINGS_ADDED', id, settings);
    }
}

export {
    ExtensionManager
};
