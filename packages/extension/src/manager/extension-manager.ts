interface Extension {
    type: 'scratch';
    env: 'unsandboxed' | 'sandboxed';
    url: string;
}

interface DuckTypedScratchExtensionClass {
    new: (runtime: object) => void;
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
    internalExtensions = new Map<string, DuckTypedScratchExtensionClass>();

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
     * @param {DuckTypedScratchExtensionClass} extensionClass - the class of the extension.
     */
    registerInternalExtension (extensionId: string, extensionClass: DuckTypedScratchExtensionClass) {
        if (this.internalExtensions.has(extensionId)) {
            console.warn(`${extensionId} had been registered before. re-registering...`);
        }

        this.internalExtensions.set(extensionId, extensionClass);
    }

    /**
     * Synchronously load an internal extension (core or non-core) by ID. This call will
     * fail if the provided id is not does not match an internal extension.
     * @param {string} extensionId - the ID of an internal extension
     */
    loadExtensionIdSync (extensionId: string) {
        if (!this.internalExtensions.hasOwnProperty(extensionId)) {
            throw new Error(`Could not find extension ${extensionId} in the internal extensions.`);
        }

        this.loadedExtensions.set(extensionId, {
            type: 'scratch',
            env: 'unsandboxed',
            url: extensionId
        });
    }

    /**
     * Set the VM for the extension manager.
     * @param {VirtualMachine} vm - the VM instance.
     */
    attachVM (vm: Record<string, unknown>) {
        this.vm = vm;
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
