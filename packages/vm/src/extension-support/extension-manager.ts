import dispatch from '../dispatch/central-dispatch';
import log from '../util/log';
import maybeFormatMessage from '../util/maybe-format-message';
import BlockType from './block-type';

import type Runtime from '../engine/runtime';
import type {
    Extension,
    ExtensionMetadata,
    ExtensionMenuItem,
    ExtensionMenuItemObject,
    ExtensionItemMetadata,
    NormalizedExtensionMetadata,
    NormalizedExtensionBlockMetadata,
    ExtensionButtonMetadata,
    NormalizedExtensionItemMetadata
} from './extension-metadata';
import type {BlockArgs} from '../blocks/category_prototype';
import type BlockUtility from '../engine/block-utility';

type CallBlockFunc = (args: BlockArgs, util: BlockUtility, realBlockInfo: Record<string, unknown>) => unknown;

// These extensions are currently built into the VM repository but should not be loaded at startup.
// TODO: move these out into a separate repository?
// TODO: change extension spec so that library info, including extension ID, can be collected through static methods

/* eslint-disable global-require, @typescript-eslint/no-require-imports */
const builtinExtensions = {
    // This is an example that isn't loaded with the other core blocks,
    // but serves as a reference for loading core blocks as extensions.
    coreExample: (): typeof import('../blocks/scratch3_core_example') => require('../blocks/scratch3_core_example'),
    // These are the non-core built-in extensions.
    pen: (): typeof import('../extensions/scratch3_pen') => require('../extensions/scratch3_pen'),
    wedo2: (): typeof import('../extensions/scratch3_wedo2') => require('../extensions/scratch3_wedo2'),
    music: (): typeof import('../extensions/scratch3_music') => require('../extensions/scratch3_music'),
    microbit: (): typeof import('../extensions/scratch3_microbit') => require('../extensions/scratch3_microbit'),
    text2speech: ():
        typeof import('../extensions/scratch3_text2speech') => require('../extensions/scratch3_text2speech'),
    translate: (): typeof import('../extensions/scratch3_translate') => require('../extensions/scratch3_translate'),
    videoSensing: ():
        typeof import('../extensions/scratch3_video_sensing') => require('../extensions/scratch3_video_sensing'),
    ev3: (): typeof import('../extensions/scratch3_ev3') => require('../extensions/scratch3_ev3'),
    makeymakey: (): typeof import('../extensions/scratch3_makeymakey') => require('../extensions/scratch3_makeymakey'),
    boost: (): typeof import('../extensions/scratch3_boost') => require('../extensions/scratch3_boost'),
    gdxfor: (): typeof import('../extensions/scratch3_gdx_for') => require('../extensions/scratch3_gdx_for')
};
/* eslint-enable global-require, @typescript-eslint/no-require-imports */

export type BuiltinExtensionId = keyof typeof builtinExtensions;

/**
 *  Information about an extension worker still initializing
 */
interface PendingExtensionWorker {
    /** The URL of the extension to be loaded by this worker */
    extensionURL: string;
    /** Function to call on successful worker startup */
    resolve: (id: number) => void;
    /** Function to call on failed worker startup */
    reject: (e: Error) => void;
}

class ExtensionManager {
    /**
     * The ID number to provide to the next extension worker.
     */
    nextExtensionWorker = 0;

    /**
     * FIFO queue of extensions which have been requested but not yet loaded in a worker,
     * along with promise resolution functions to call once the worker is ready or failed.
     */
    pendingExtensions: PendingExtensionWorker[] = [];

    /**
     * Map of worker ID to workers which have been allocated but have not yet finished initialization.
     */
    pendingWorkers: PendingExtensionWorker[] = [];

    /**
     * Map of loaded extension URLs/IDs (equivalent for built-in extensions) to service name.
     * @private
     */
    _loadedExtensions: Map<string, string> = new Map();
    constructor (
        /**
         * Keep a reference to the runtime so we can construct internal extension objects.
         * TODO: remove this in favor of extensions accessing the runtime as a service.
         */
        public runtime: Runtime
    ) {
        dispatch.setService('extensions', this).catch(e => {
            log.error(`ExtensionManager was unable to register extension service: ${JSON.stringify(e)}`);
        });
    }

    /**
     * Check whether an extension is registered or is in the process of loading. This is intended to control loading or
     * adding extensions so it may return `true` before the extension is ready to be used. Use the promise returned by
     * `loadExtensionURL` if you need to wait until the extension is truly ready.
     * @param extensionID - the ID of the extension.
     * @returns true if loaded, false otherwise.
     */
    isExtensionLoaded (extensionID: string) {
        return this._loadedExtensions.has(extensionID);
    }

    /**
     * Synchronously load an internal extension (core or non-core) by ID. This call will
     * fail if the provided id is not does not match an internal extension.
     * @param extensionId - the ID of an internal extension
     */
    loadExtensionIdSync (extensionId: BuiltinExtensionId) {
        if (!Object.prototype.hasOwnProperty.call(builtinExtensions, extensionId)) {
            log.warn(`Could not find extension ${extensionId} in the built in extensions.`);
            return;
        }

        /** @todo dupe handling for non-builtin extensions. See commit 670e51d33580e8a2e852b3b038bb3afc282f81b9 */
        if (this.isExtensionLoaded(extensionId)) {
            const message = `Rejecting attempt to load a second extension with ID ${extensionId}`;
            log.warn(message);
            return;
        }

        const {default: extension} = builtinExtensions[extensionId]();
        const extensionInstance = new extension(this.runtime);
        // @ts-expect-error Returned manifest should always const. remove this since we migrated all extension to ts.
        const serviceName = this._registerInternalExtension(extensionInstance);
        this._loadedExtensions.set(extensionId, serviceName);
    }

    /**
     * Load an extension by URL or internal extension ID
     * @param extensionURL - the URL for the extension to load OR the ID of an internal extension
     * @returns resolved once the extension is loaded and initialized or rejected on failure
     */
    loadExtensionURL (extensionURL: string) {
        if (Object.prototype.hasOwnProperty.call(builtinExtensions, extensionURL)) {
            /** @todo dupe handling for non-builtin extensions. See commit 670e51d33580e8a2e852b3b038bb3afc282f81b9 */
            if (this.isExtensionLoaded(extensionURL)) {
                const message = `Rejecting attempt to load a second extension with ID ${extensionURL}`;
                log.warn(message);
                return Promise.resolve();
            }

            const {default: extension} = builtinExtensions[extensionURL as BuiltinExtensionId]();
            const extensionInstance = new extension(this.runtime);
            // @ts-expect-error Returned manifest should always const. remove this since we migrated all extension to ts
            const serviceName = this._registerInternalExtension(extensionInstance);
            this._loadedExtensions.set(extensionURL, serviceName);
            return Promise.resolve();
        }

        return new Promise<number>((resolve, reject) => {
            const worker = new Worker(
                /* webpackChunkName: "extension-worker" */ new URL('./extension-worker', import.meta.url)
            );

            this.pendingExtensions.push({extensionURL, resolve, reject});
            dispatch.addWorker(worker);
        }).then(() => {});
    }

    /**
     * Regenerate blockinfo for any loaded extensions
     * @returns resolved once all the extensions have been reinitialized
     */
    refreshBlocks () {
        const allPromises = Array.from(this._loadedExtensions.values()).map(serviceName =>
            dispatch.call(serviceName, 'getInfo')
                .then(info => {
                    info = this._prepareExtensionInfo(serviceName, info);
                    dispatch.call('runtime', '_refreshExtensionPrimitives', info);
                })
                .catch(e => {
                    log.error(`Failed to refresh built-in extension primitives: ${JSON.stringify(e)}`);
                })
        );
        return Promise.all(allPromises);
    }

    allocateWorker () {
        const id = this.nextExtensionWorker++;
        const workerInfo = this.pendingExtensions.shift()!;
        this.pendingWorkers[id] = workerInfo;
        return [id, workerInfo.extensionURL];
    }

    /**
     * Synchronously collect extension metadata from the specified service and begin the extension registration process.
     * @param serviceName - the name of the service hosting the extension.
     */
    registerExtensionServiceSync (serviceName: string) {
        const info = dispatch.callSync(serviceName, 'getInfo');
        this._registerExtensionInfo(serviceName, info);
    }

    /**
     * Collect extension metadata from the specified service and begin the extension registration process.
     * @param serviceName - the name of the service hosting the extension.
     */
    registerExtensionService (serviceName: string) {
        dispatch.call(serviceName, 'getInfo').then(info => {
            this._registerExtensionInfo(serviceName, info);
        });
    }

    /**
     * Called by an extension worker to indicate that the worker has finished initialization.
     * @param id - the worker ID.
     * @param e - the error encountered during initialization, if any.
     */
    onWorkerInit (id: number, e: Error | null) {
        const workerInfo = this.pendingWorkers[id];
        delete this.pendingWorkers[id];
        if (e) {
            workerInfo.reject(e);
        } else {
            workerInfo.resolve(id);
        }
    }

    /**
     * Register an internal (non-Worker) extension object
     * @param extensionObject - the extension object to register
     * @returns The name of the registered extension service
     */
    _registerInternalExtension (extensionObject: Extension) {
        const extensionInfo = extensionObject.getInfo();
        const fakeWorkerId = this.nextExtensionWorker++;
        const serviceName = `extension_${fakeWorkerId}_${extensionInfo.id}`;
        dispatch.setServiceSync(serviceName, extensionObject);
        dispatch.callSync('extensions', 'registerExtensionServiceSync', serviceName);
        return serviceName;
    }

    /**
     * Sanitize extension info then register its primitives with the VM.
     * @param serviceName - the name of the service hosting the extension
     * @param extensionInfo - the extension's metadata
     * @private
     */
    _registerExtensionInfo (serviceName: string, extensionInfo: ExtensionMetadata) {
        (extensionInfo as NormalizedExtensionMetadata) = this._prepareExtensionInfo(serviceName, extensionInfo);
        dispatch.call('runtime', '_registerExtensionPrimitives', extensionInfo).catch(e => {
            log.error(`Failed to register primitives for extension on service ${serviceName}:`, e);
        });
    }

    /**
     * Modify the provided text as necessary to ensure that it may be used as an attribute value in valid XML.
     * @param text - the text to be sanitized
     * @returns the sanitized text
     * @private
     */
    _sanitizeID (text: string) {
        return text.toString().replace(/[<"&]/, '_');
    }

    /**
     * Apply minor cleanup and defaults for optional extension fields.
     * TODO: make the ID unique in cases where two copies of the same extension are loaded.
     * @param serviceName - the name of the service hosting this extension block
     * @param extensionInfo - the extension info to be sanitized
     * @returns a new extension info object with cleaned-up values
     * @private
     */
    _prepareExtensionInfo (serviceName: string, extensionInfo: ExtensionMetadata) {
        extensionInfo = Object.assign({}, extensionInfo);
        if (!/^[a-z0-9]+$/i.test(extensionInfo.id)) {
            throw new Error('Invalid extension id');
        }
        extensionInfo.name = extensionInfo.name || extensionInfo.id;
        extensionInfo.blocks = extensionInfo.blocks || [];
        extensionInfo.targetTypes = extensionInfo.targetTypes || [];
        extensionInfo.blocks = extensionInfo.blocks.reduce((results, blockInfo) => {
            try {
                let result: NormalizedExtensionItemMetadata;
                switch (blockInfo) {
                case '---': // separator
                    result = '---';
                    break;
                default: // an ExtensionBlockMetadata object
                    result = this._prepareBlockInfo(serviceName, blockInfo);
                    break;
                }
                results.push(result);
            } catch (e) {
                // TODO: more meaningful error reporting
                log.error(`Error processing block: ${(e as Error).message}, Block:\n${JSON.stringify(blockInfo)}`);
            }
            return results;
        }, [] as NormalizedExtensionItemMetadata[]) as ExtensionItemMetadata[];
        extensionInfo.menus = extensionInfo.menus || {};
        extensionInfo.menus = this._prepareMenuInfo(serviceName, extensionInfo.menus);
        return extensionInfo as NormalizedExtensionMetadata;
    }

    /**
     * Prepare extension menus. e.g. setup binding for dynamic menu functions.
     * @param serviceName - the name of the service hosting this extension block
     * @param menus - the menu defined by the extension.
     * @returns a menuInfo object with all preprocessing done.
     * @private
     */
    _prepareMenuInfo (serviceName: string, menus: Record<string, ExtensionMenuItem>) {
        const menuNames = Object.getOwnPropertyNames(menus);
        for (let i = 0; i < menuNames.length; i++) {
            const menuName = menuNames[i];
            let menuInfo = menus[menuName];

            // If the menu description is in short form (items only) then normalize it to general form: an object with
            // its items listed in an `items` property.
            if (typeof menuInfo === 'string' || !('items' in menuInfo)) {
                menuInfo = {
                    items: menuInfo
                };
                menus[menuName] = menuInfo;
            }
            // If `items` is a string, it should be the name of a function in the extension object. Calling the
            // function should return an array of items to populate the menu when it is opened.
            if (typeof menuInfo.items === 'string') {
                const menuItemFunctionName = menuInfo.items;
                const serviceObject = dispatch.services[serviceName] as Extension;
                // Bind the function here so we can pass a simple item generation function to Scratch Blocks later.
                menuInfo.items = this._getExtensionMenuItems.bind(this, serviceObject, menuItemFunctionName);
            }
        }
        return menus;
    }

    /**
     * Fetch the items for a particular extension menu, providing the target ID for context.
     * @param extensionObject - the extension object providing the menu.
     * @param menuItemFunctionName - the name of the menu function to call.
     * @returns menu items ready for scratch-blocks.
     * @private
     */
    _getExtensionMenuItems (extensionObject: Extension, menuItemFunctionName: string) {
        // Fetch the items appropriate for the target currently being edited. This assumes that menus only
        // collect items when opened by the user while editing a particular target.
        const editingTarget = this.runtime.getEditingTarget() || this.runtime.getTargetForStage();
        const editingTargetID = editingTarget ? editingTarget.id : null;
        // const extensionMessageContext = this.runtime.makeMessageContextForTarget(editingTarget);

        // TODO: Fix this to use dispatch.call when extensions are running in workers.
        const menuFunc =
            extensionObject[menuItemFunctionName as keyof Extension] as unknown as
                (editingTargetID?: string | null) => ExtensionMenuItem[];
        const menuItems = menuFunc.call(extensionObject, editingTargetID).map(
            item => {
                item = maybeFormatMessage(item);
                switch (typeof item) {
                case 'object':
                    return [
                        maybeFormatMessage((item as unknown as ExtensionMenuItemObject).text),
                        (item as unknown as ExtensionMenuItemObject).value
                    ] as [string, string];
                case 'string':
                    return [item, item] as [string, string];
                default:
                    console.warn(`Invalid menu item returned by ${menuItemFunctionName}`, item);
                    return item as unknown as [string, string];
                }
            });

        if (!menuItems || menuItems.length < 1) {
            throw new Error(`Extension menu returned no items: ${menuItemFunctionName}`);
        }
        return menuItems;
    }

    /**
     * Apply defaults for optional block fields.
     * @param serviceName - the name of the service hosting this extension block
     * @param blockInfo - the block info from the extension
     * @returns a new block info object which has values for all relevant optional fields.
     * @private
     */
    _prepareBlockInfo (serviceName: string, blockInfo: Exclude<ExtensionItemMetadata, '---'>) {
        blockInfo = Object.assign({}, {
            blockType: BlockType.COMMAND,
            terminal: false,
            blockAllThreads: false,
            arguments: {}
        }, blockInfo);

        switch (blockInfo.blockType) {
        case BlockType.EVENT:
            blockInfo.opcode = blockInfo.opcode && this._sanitizeID(blockInfo.opcode);
            blockInfo.text = blockInfo.text || blockInfo.opcode;
            if (blockInfo.func) {
                log.warn(`Ignoring function "${blockInfo.func}" for event block ${blockInfo.opcode}`);
            }
            break;
        case BlockType.BUTTON:
            if ('opcode' in blockInfo) {
                log.warn(`Ignoring opcode "${blockInfo.opcode}" for button with text: ${blockInfo.text}`);
            }
            break;
        default: {
            blockInfo.opcode = blockInfo.opcode && this._sanitizeID(blockInfo.opcode);
            blockInfo.text = blockInfo.text || blockInfo.opcode;
            if (!blockInfo.opcode) {
                throw new Error('Missing opcode for block');
            }

            const funcName = typeof blockInfo.func === 'string' ? this._sanitizeID(blockInfo.func) : blockInfo.opcode;

            const getBlockInfo = blockInfo.isDynamic ?
                (args: BlockArgs) => args && args.mutation && args.mutation.blockInfo :
                () => blockInfo;
            const callBlockFunc = (() => {
                if (dispatch.isRemoteService(serviceName)) {
                    return (args: BlockArgs, util: BlockUtility, realBlockInfo: Record<string, unknown>) =>
                        dispatch.call(serviceName, funcName, args, util, realBlockInfo);
                }

                // avoid promise latency if we can call direct
                const serviceObject = dispatch.services[serviceName] as Extension;
                if (!(funcName in serviceObject)) {
                    // The function might show up later as a dynamic property of the service object
                    log.warn(`Could not find extension block function called ${funcName}`);
                }
                return (args: BlockArgs, util: BlockUtility, realBlockInfo: Record<string, unknown>) =>
                    (serviceObject[funcName as keyof Extension] as CallBlockFunc)(args, util, realBlockInfo);
            })();

            (blockInfo as unknown as NormalizedExtensionBlockMetadata).func =
                (args: BlockArgs, util: BlockUtility) => {
                    const realBlockInfo = getBlockInfo(args);
                    // TODO: filter args using the keys of realBlockInfo.arguments? maybe only if sandboxed?
                    return callBlockFunc(args, util, realBlockInfo);
                };
            break;
        }
        }

        return blockInfo as (ExtensionButtonMetadata | NormalizedExtensionBlockMetadata);
    }
}

export default ExtensionManager;
