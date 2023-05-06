import {
    StandardScratchExtensionClass as ExtensionClass,
    ExtensionMetadata,
    ExtensionMenu,
    ExtensionBlockMetadata,
    BlockType,
    MenuItems,
    BlockArgs
} from '../type/scratch';
import {
    maybeFormatMessage
} from '../util';
import { CentralDispatch as dispatch } from '../dispatch/central-dispatch';
import ExtensionSandbox from './scratch.worker';

interface PendingExtensionWorker {
    extensionURL: string,
    resolve: (value: unknown) => void;
    reject: (value: unknown) => void;
}

class ScratchAdapter {
    /**
     * Editor's Virtual Machine instance.
     * Should be set by `attachVM` while initializing.
     * @todo add more strict type check when VM adds TS support.
     */
    vm?: Record<string, unknown>;

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
    pendingExtensions: PendingExtensionWorker[] = [];

    /**
     * Map of worker ID to workers which have been allocated but have not yet finished initialization.
     * @type {Array.<PendingExtensionWorker>}
     */
    pendingWorkers: PendingExtensionWorker[] = [];

    constructor () {
        dispatch.setService('extensions', this).catch((e: Error) => {
            console.error(`ExtensionManager was unable to register extension service: ${JSON.stringify(e)}`);
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
     * Load a scratch-standard extension.
     * @param {ExtensionClass | string} ext - Extension's data.
     */
    async load (ext: string | ExtensionClass) {
        if (!this.vm) throw new Error(`VM hadn't been attached`);

        // It's running in sandbox because it's a url.
        if (typeof ext === 'string') {
            return new Promise((resolve, reject) => {
                // If we `require` this at the global level it breaks non-webpack targets, including tests
                const ExtensionWorker = new ExtensionSandbox();
                this.pendingExtensions.push({
                    extensionURL: ext,
                    resolve,
                    reject
                });
                dispatch.addWorker(ExtensionWorker);
            });
        } 
        // @ts-expect-error
        const extensionObject = new ext(this.vm.runtime);
        const extensionInfo = extensionObject.getInfo();
        this._registerExtensionInfo(extensionObject, extensionInfo);
        return extensionInfo.id;
        
    }

    /**
     * Sanitize extension info then register its primitives with the VM.
     * @param {ExtensionClass} extensionObject - the extension object providing the menu.
     * @param {ExtensionInfo} extensionInfo - the extension's metadata
     * @param {string} serviceName - the name of the service hosting the extension
     * @private
     */
    private _registerExtensionInfo (extensionObject: ExtensionClass, extensionInfo: ExtensionMetadata, serviceName?: string) {
        extensionInfo = this._prepareExtensionInfo(extensionObject, extensionInfo, serviceName);
        if (!this.vm) throw new Error(`VM hadn't been attached`);

        // @ts-expect-error pending VM's TS support
        this.vm.runtime._registerExtensionPrimitives(extensionInfo);
    }

    /**
     * Modify the provided text as necessary to ensure that it may be used as an attribute value in valid XML.
     * @param {string} text - the text to be sanitized
     * @returns {string} - the sanitized text
     * @private
     */
    private _sanitizeID (text: string) {
        return text.toString().replace(/[<"&]/, '_');
    }

    /**
     * Apply minor cleanup and defaults for optional extension fields.
     * TODO: make the ID unique in cases where two copies of the same extension are loaded.
     * @param {ExtensionClass} extensionObject - the extension object providing the menu.
     * @param {ExtensionInfo} extensionInfo - the extension info to be sanitized
     * @param {string} serviceName - the name of the service hosting this extension block
     * @returns {ExtensionInfo} - a new extension info object with cleaned-up values
     * @private
     */
    private _prepareExtensionInfo (extensionObject: ExtensionClass, extensionInfo: ExtensionMetadata, serviceName?: string) {
        extensionInfo = Object.assign({}, extensionInfo);
        if (!/^[a-z0-9]+$/i.test(extensionInfo.id)) {
            throw new Error('Invalid extension id');
        }
        extensionInfo.name = extensionInfo.name || extensionInfo.id;
        extensionInfo.blocks = extensionInfo.blocks || [];
        extensionInfo.targetTypes = extensionInfo.targetTypes || [];
        extensionInfo.blocks = extensionInfo.blocks.reduce((results: Array<string | ExtensionBlockMetadata>, blockInfo) => {
            try {
                let result;
                switch (blockInfo) {
                case '---': // Separator
                    result = '---';
                    break;
                default: // An ExtensionBlockMetadata object
                    result = this._prepareBlockInfo(extensionObject, blockInfo as ExtensionBlockMetadata, serviceName);
                    break;
                }
                results.push(result);
            } catch (e) {
                // TODO: more meaningful error reporting
                // @ts-expect-error
                console.error(`Error processing block: ${e.message}, Block:\n${JSON.stringify(blockInfo)}`);
            }
            return results;
        }, []);
        extensionInfo.menus = extensionInfo.menus || {};
        extensionInfo.menus = this._prepareMenuInfo(extensionObject, extensionInfo.menus, serviceName);
        return extensionInfo as ExtensionMetadata;
    }

    /**
     * Prepare extension menus. e.g. setup binding for dynamic menu functions.
     * @param {ExtensionClass} extensionObject - the extension object providing the menu.
     * @param {Array.<MenuInfo>} menus - the menu defined by the extension.
     * @param {string} serviceName - the name of the service hosting this extension block
     * @returns {Array.<MenuInfo>} - a menuInfo object with all preprocessing done.
     * @private
     */
    private _prepareMenuInfo (extensionObject: ExtensionClass, menus: Record<string, ExtensionMenu>, serviceName?: string) {
        const menuNames = Object.getOwnPropertyNames(menus);
        for (let i = 0; i < menuNames.length; i++) {
            const menuName = menuNames[i];
            let menuInfo = menus[menuName];

            /*
             * If the menu description is in short form (items only) then normalize it to general form: an object with
             * its items listed in an `items` property.
             */
            if (!menuInfo.items) {
                menuInfo = {
                    // @ts-expect-error
                    items: menuInfo
                };
                menus[menuName] = menuInfo;
            }
            /*
             * If `items` is a string, it should be the name of a function in the extension object. Calling the
             * function should return an array of items to populate the menu when it is opened.
             */
            if (typeof menuInfo.items === 'string') {
                const menuItemFunctionName = menuInfo.items;
                // Bind the function here so we can pass a simple item generation function to Scratch Blocks later
                // @ts-expect-error
                menuInfo.items = this._getExtensionMenuItems.bind(this, extensionObject, menuItemFunctionName, serviceName);
            }
        }
        return menus;
    }

    /**
     * Fetch the items for a particular extension menu, providing the target ID for context.
     * @param {ExtensionClass} extensionObject - the extension object providing the menu.
     * @param {string} menuItemFunctionName - the name of the menu function to call.
     * @param {string} serviceName - the name of the service hosting this extension block
     * @returns {Array} menu items ready for scratch-blocks.
     * @private
     */
    private _getExtensionMenuItems (extensionObject: ExtensionClass, menuItemFunctionName: string, serviceName?: string) {
        /*
         * Fetch the items appropriate for the target currently being edited. This assumes that menus only
         * collect items when opened by the user while editing a particular target.
         */
        if (!this.vm) throw new Error(`VM hadn't been attached`);

        // @ts-expect-error
        const editingTarget = this.vm.runtime.getEditingTarget() || this.vm.runtime.getTargetForStage();
        const editingTargetID = editingTarget ? editingTarget.id : null;
        // @ts-expect-error
        const extensionMessageContext = this.vm.runtime.makeMessageContextForTarget(editingTarget);

        // TODO: Fix this to use dispatch.call when extensions are running in workers.
        const menuFunc = extensionObject[menuItemFunctionName] as (editingTargetID: string | null) => MenuItems;
        const menuItems = menuFunc.call(extensionObject, editingTargetID).map(
            item => {
                item = maybeFormatMessage(item, extensionMessageContext);
                switch (typeof item) {
                case 'object':
                    return [
                        maybeFormatMessage(item.text, extensionMessageContext),
                        item.value
                    ];
                case 'string':
                    return [item, item];
                default:
                    return item;
                }
            });

        if (!menuItems || menuItems.length < 1) {
            throw new Error(`Extension menu returned no items: ${menuItemFunctionName}`);
        }
        return menuItems;
    }

    /**
     * Apply defaults for optional block fields.
     * @param {ExtensionClass} extensionObject - the extension object providing the menu.
     * @param {ExtensionBlockMetadata} blockInfo - the block info from the extension
     * @param {string} serviceName - the name of the service hosting this extension block
     * @returns {ExtensionBlockMetadata} - a new block info object which has values for all relevant optional fields.
     * @private
     */
    private _prepareBlockInfo (extensionObject: ExtensionClass, blockInfo: ExtensionBlockMetadata, serviceName?: string) {
        blockInfo = Object.assign({}, {
            blockType: BlockType.COMMAND,
            terminal: false,
            blockAllThreads: false,
            arguments: {}
        }, blockInfo);
        blockInfo.opcode = blockInfo.opcode && this._sanitizeID(blockInfo.opcode);
        blockInfo.text = blockInfo.text || blockInfo.opcode;

        switch (blockInfo.blockType) {
        case BlockType.EVENT:
            if (blockInfo.func) {
                console.warn(`Ignoring function "${blockInfo.func}" for event block ${blockInfo.opcode}`);
            }
            break;
        case BlockType.BUTTON:
            if (blockInfo.opcode) {
                console.warn(`Ignoring opcode "${blockInfo.opcode}" for button with text: ${blockInfo.text}`);
            }
            break;
        default: {
            if (!blockInfo.opcode) {
                throw new Error('Missing opcode for block');
            }

            /*
             *Const funcName = blockInfo.func ? this._sanitizeID(blockInfo.func) : blockInfo.opcode;
             *
             *const getBlockInfo = blockInfo.isDynamic ?
             *    (args: BlockArgs) => args && args.mutation && args.mutation.blockInfo :
             *    () => blockInfo;
             *const callBlockFunc = (() => {
             *    if (serviceName && dispatch._isRemoteService(serviceName)) {
             *        return (args: BlockArgs, util: unknown, realBlockInfo: unknown) =>
             *            dispatch.call(serviceName, funcName, args, util, realBlockInfo);
             *    }
             *
             *    if (!extensionObject[funcName]) {
             *        // The function might show up later as a dynamic property of the service object
             *        console.warn(`Could not find extension block function called ${funcName}`);
             *    }
             *    return (args: BlockArgs, util: unknown, realBlockInfo: unknown) =>
             *        extensionObject[funcName](args, util, realBlockInfo);
             *})();
             *
             *blockInfo.func = (args: BlockArgs, util: unknown) => {
             *    const realBlockInfo = getBlockInfo(args);
             *    // TODO: filter args using the keys of realBlockInfo.arguments? maybe only if sandboxed?
             *    return callBlockFunc(args, util, realBlockInfo);
             *};
             *break;
             */
        }
        }

        return blockInfo;
    }

    /**
     * Regenerate blockinfo for any loaded extensions
     * @returns {Promise} resolved once all the extensions have been reinitialized
     */
    refreshBlocks () {
        /**
         * @todo
         * Here we need to refresh according to whether the extension is in the
         * sandbox, so we need to refactor the original logic.
         */
    }

    allocateWorker () {
        const workerInfo = this.pendingExtensions.shift();
        if (!workerInfo) {
            console.warn('pending extension queue is empty');
            return;
        }
        const id = this.nextExtensionWorker++;
        this.pendingWorkers[id] = workerInfo;
        return [id, workerInfo.extensionURL];
    }

    /**
     * Called by an extension worker to indicate that the worker has finished initialization.
     * @param {int} id - the worker ID.
     * @param {*?} e - the error encountered during initialization, if any.
     */
    onWorkerInit (id: number, e?: Error) {
        const workerInfo = this.pendingWorkers[id];
        delete this.pendingWorkers[id];
        if (e) {
            workerInfo.reject(e);
        } else {
            workerInfo.resolve(id);
        }
    }
}

export {
    ScratchAdapter
};
