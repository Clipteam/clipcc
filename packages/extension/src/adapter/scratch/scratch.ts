import { Emitter } from 'strict-event-emitter';
import {
    StandardScratchExtensionClass as ExtensionClass,
    ExtensionMetadata,
    ExtensionMenu,
    ExtensionBlockMetadata,
    BlockType,
    MenuItems,
    BlockArgs
} from '../../types/scratch';
import { Runtime, VirtualMachine } from '../../types/virtual-machine';
import {
    maybeFormatMessage
} from '../../util';
import { CentralDispatch as dispatch } from '../../dispatch/central-dispatch';
import { makeCtx } from './make-ctx';
import { Extension } from '../../manager';
import ExtensionSandbox from './scratch.worker';

interface PendingExtensionWorker {
    extensionURL: string;
    resolve: (value: number) => void;
    reject: (reason?: unknown) => void;
}

export interface ScratchExtension extends Extension {
    type: 'scratch';
    info: ExtensionMetadata;
    instance: string | ExtensionClass;
}

export interface ScratchAdapterEvents {
    LOADED: [url: string, extension: ScratchExtension];
    [eventName: string]: [...params: unknown[]];
}

export class ScratchAdapter extends Emitter<ScratchAdapterEvents> {
    /**
     * Editor's Virtual Machine instance.
     * Should be set by `attachVM` while initializing.
     * @todo add more strict type check when VM adds TS support.
     */
    private vm?: VirtualMachine;

    /**
     * The ID number to provide to the next extension worker.
     */
    private nextExtensionWorker = 0;

    /**
     * FIFO queue of extensions which have been requested but not yet loaded in a worker,
     * along with promise resolution functions to call once the worker is ready or failed.
     */
    private pendingExtensions: PendingExtensionWorker[] = [];

    /**
     * Map of worker ID to workers which have been allocated but have not yet finished initialization.
     */
    private pendingWorkers: Record<number, PendingExtensionWorker> = {};
    private loadedScratchExtension = new Map<string, ScratchExtension>();

    constructor () {
        super();
        dispatch.setService('scratchAdapter', this).catch((e: Error) => {
            console.error(`ScratchAdapter was unable to register extension service: ${JSON.stringify(e)}`);
        });
    }

    /**
     * Set the VM for the extension manager.
     * @param vm - the VM instance.
     */
    attachVM (vm: VirtualMachine): void {
        this.vm = vm;
    }

    /**
     * Load a scratch-standard extension.
     * @param ext - Extension's data.
     * @param env - Extension's running environment.
     */
    async load (ext: string | { new(runtime: Runtime): ExtensionClass }, env: 'sandboxed' | 'unsandboxed' = 'sandboxed'): Promise<ExtensionMetadata | void> {
        if (!this.vm) throw new Error('VM hadn\'t been attached');

        if (typeof ext === 'string') {
            switch (env) {
            case 'sandboxed':
                return new Promise<number>((resolve, reject) => {
                    const ExtensionWorker = new ExtensionSandbox();
                    this.pendingExtensions.push({
                        extensionURL: ext,
                        resolve,
                        reject
                    });
                    dispatch.addWorker(ExtensionWorker);
                }).then();
            case 'unsandboxed': {
                const response = await fetch(ext);
                const originalScript = await response.text();
                const closureFunc = new Function('Scratch', originalScript);
                const ctx = makeCtx();
                ctx.vm = this.vm;
                ctx.extensions.register = (extensionObj: ExtensionClass) => {
                    const extensionInfo = extensionObj.getInfo();
                    this._registerExtensionInfo(extensionObj, extensionInfo, ext);
                    this.emit('LOADED', extensionInfo.id, this.loadedScratchExtension.get(extensionInfo.id) as ScratchExtension);
                };
                closureFunc(ctx);
                return;
            }
            default:
                throw new Error('unexpected env');
            }
        }

        // Load as builtin extension.
        const extensionObject = new ext(this.vm.runtime);
        const extensionInfo = extensionObject.getInfo();
        this._registerExtensionInfo(extensionObject, extensionInfo, extensionInfo.id);
        this.emit('LOADED', extensionInfo.id, this.loadedScratchExtension.get(extensionInfo.id) as ScratchExtension);
        return extensionInfo;
    }

    async reload (extensionId: string): Promise<ExtensionMetadata> {
        if (!this.vm) {
            throw new Error('VM hadn\'t been attached');
        }

        const targetExt = this.loadedScratchExtension.get(extensionId);
        if (!targetExt) {
            throw new Error(`Cannot locate extension ${extensionId}.`);
        }

        if (typeof targetExt.instance === 'string') {
            const info = await dispatch.call<ExtensionMetadata>(targetExt.instance, 'getInfo');
            const processedInfo = this._prepareExtensionInfo(null, info, targetExt.instance);
            this.vm.runtime._refreshExtensionPrimitives(processedInfo);
            return processedInfo;
        }

        let info = targetExt.instance.getInfo();
        info = this._prepareExtensionInfo(targetExt.instance, info);
        this.vm.runtime._refreshExtensionPrimitives(info);
        return info;
    }

    /**
     * Reload all scratch-standard extensions.
     * This method is only a replacement of refreshBlocks in
     *  original extension manager to reload locales. It should
     * be replaced when there's a better solution.
    */
    reloadAll (): Promise<(ExtensionMetadata | void)[]> {
        const allPromises: Promise<ExtensionMetadata | void>[] = [];
        for (const [extId] of this.loadedScratchExtension.entries()) {
            allPromises.push(this.reload(extId));
        }
        return Promise.all(allPromises);
    }

    /**
     * Sanitize extension info then register its primitives with the VM.
     * @param extensionObject - the extension object providing the menu.
     * @param extensionInfo - the extension's metadata
     * @param serviceName - the name of the service hosting the extension
     */
    private _registerExtensionInfo (extensionObject: ExtensionClass | null, extensionInfo: ExtensionMetadata, extensionURL: string, serviceName?: string): void {
        if (!this.vm) throw new Error('VM hadn\'t been attached');

        if (!this.loadedScratchExtension.has(extensionInfo.id)) {
            if (!extensionObject && !serviceName) {
                throw new Error(`Cannot mark ${extensionInfo.id} as loaded.`);
            }

            this.loadedScratchExtension.set(extensionInfo.id, {
                type: 'scratch',
                id: extensionInfo.id,
                url: extensionURL,
                info: extensionInfo,
                instance: (extensionObject ?? serviceName) as ExtensionClass | string,
                env: serviceName ? 'sandboxed' : 'unsandboxed'
            });
        }
        extensionInfo = this._prepareExtensionInfo(extensionObject, extensionInfo, serviceName);

        this.vm.runtime._registerExtensionPrimitives(extensionInfo);
    }

    /**
     * Modify the provided text as necessary to ensure that it may be used as an attribute value in valid XML.
     * @param text - the text to be sanitized
     * @returns the sanitized text
     */
    private _sanitizeID (text: string): string {
        return text.toString().replace(/[<"&]/g, '_');
    }

    /**
     * Apply minor cleanup and defaults for optional extension fields.
     * TODO: make the ID unique in cases where two copies of the same extension are loaded.
     * @param extensionObject - the extension object providing the menu.
     * @param extensionInfo - the extension info to be sanitized
     * @param serviceName - the name of the service hosting this extension block
     * @returns a new extension info object with cleaned-up values
     */
    private _prepareExtensionInfo (extensionObject: ExtensionClass | null, extensionInfo: ExtensionMetadata, serviceName?: string): ExtensionMetadata {
        extensionInfo = { ...extensionInfo };
        if (!/^[a-z0-9]+$/i.test(extensionInfo.id)) {
            throw new Error('Invalid extension id');
        }
        extensionInfo.name = extensionInfo.name || extensionInfo.id;
        extensionInfo.blocks = extensionInfo.blocks || [];
        extensionInfo.targetTypes = extensionInfo.targetTypes || [];
        extensionInfo.blocks = extensionInfo.blocks.reduce((results: Array<'---' | ExtensionBlockMetadata>, blockInfo) => {
            try {
                let result: '---' | ExtensionBlockMetadata;
                if (blockInfo === '---') {
                    result = '---';
                } else {
                    result = this._prepareBlockInfo(extensionObject, blockInfo as ExtensionBlockMetadata, serviceName);
                }
                results.push(result);
            } catch (e: unknown) {
                console.error(`Error processing block: ${(e as Error).message}, Block:\n${JSON.stringify(blockInfo)}`);
            }
            return results;
        }, []);
        extensionInfo.menus = extensionInfo.menus || {};
        extensionInfo.menus = this._prepareMenuInfo(extensionObject, extensionInfo.menus, serviceName);
        return extensionInfo;
    }

    /**
     * Prepare extension menus. e.g. setup binding for dynamic menu functions.
     * @param extensionObject - the extension object providing the menu.
     * @param menus - the menu defined by the extension.
     * @param serviceName - the name of the service hosting this extension block
     * @returns a menuInfo object with all preprocessing done.
     */
    private _prepareMenuInfo (extensionObject: ExtensionClass | null, menus: Record<string, ExtensionMenu>, serviceName?: string): Record<string, ExtensionMenu> {
        const menuNames = Object.getOwnPropertyNames(menus);
        for (const menuName of menuNames) {
            let menuInfo = menus[menuName];

            /*
             * If the menu description is in short form (items only) then normalize it to general form: an object with
             * its items listed in an `items` property.
             */
            if (!menuInfo.items) {
                menuInfo = {
                    items: menuInfo as unknown as MenuItems
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
                // @ts-expect-error Overwitten internally
                menuInfo.items = this._getExtensionMenuItems.bind(this, extensionObject, menuItemFunctionName, serviceName);
            }
        }
        return menus;
    }

    /**
    * Fetch the items for a particular extension menu, providing the target ID for context.
    * @param extensionObject - the extension object providing the menu.
    * @param menuItemFunctionName - the name of the menu function to call.
    * @param serviceName - the name of the service hosting this extension block
    * @returns menu items ready for scratch-blocks.
    */
    private _getExtensionMenuItems (extensionObject: ExtensionClass | null, menuItemFunctionName: string): MenuItems {
        if (!this.vm) throw new Error('VM hadn\'t been attached');

        const editingTarget = this.vm.runtime.getEditingTarget() || this.vm.runtime.getTargetForStage();
        const editingTargetID = editingTarget ? editingTarget.id : null;

        if (!extensionObject) {
            throw new Error('Extension object is null');
        }

        const menuFunc = extensionObject[menuItemFunctionName as keyof ExtensionClass] as ((editingTargetID: string | null) => MenuItems) | undefined;

        if (!menuFunc || typeof menuFunc !== 'function') {
            throw new Error(`Extension menu function not found: ${menuItemFunctionName}`);
        }

        const menuItems = menuFunc.call(extensionObject, editingTargetID).map(
            item => {
                item = maybeFormatMessage(item);
                if (typeof item === 'object' && item !== null) {
                    return [
                        maybeFormatMessage(item.text),
                        item.value
                    ];
                }
                return [String(item), String(item)];
            });

        if (!menuItems || menuItems.length < 1) {
            throw new Error(`Extension menu returned no items: ${menuItemFunctionName}`);
        }

        // @ts-expect-error Overwritten internally
        return menuItems;
    }

    private _prepareBlockInfo (extensionObject: ExtensionClass | null, blockInfo: ExtensionBlockMetadata, serviceName?: string): ExtensionBlockMetadata {
        blockInfo = {
            blockType: BlockType.COMMAND,
            terminal: false,
            blockAllThreads: false,
            arguments: {},
            ...blockInfo
        };
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

            const funcName = blockInfo.func ? this._sanitizeID(blockInfo.func) : blockInfo.opcode;

            const getBlockInfo = blockInfo.isDynamic ?
                (args: BlockArgs) => args && args.mutation && args.mutation.blockInfo :
                () => blockInfo;

            const callBlockFunc = (() => {
                if (extensionObject === null) {
                    if (serviceName && dispatch.isRemoteService(serviceName)) {
                        return (args: BlockArgs, _util: unknown, realBlockInfo: unknown) =>
                            dispatch.call(serviceName, funcName, args, undefined, realBlockInfo);
                    }
                    console.warn(`Could not find extension block function called ${funcName}`);
                    return () => { };
                }

                if (!(funcName in extensionObject)) {
                    console.warn(`Could not find extension block function called ${funcName}`);
                }
                return (args: BlockArgs, util: unknown, realBlockInfo: unknown) =>
                    (extensionObject[funcName as keyof ExtensionClass] as (args: BlockArgs, util: unknown, realBlockInfo: unknown) => unknown)(args, util, realBlockInfo);
            })();

            // @ts-expect-error Overwritten internally
            blockInfo.func = (args: BlockArgs, util: unknown) => {
                const realBlockInfo = getBlockInfo(args);
                return callBlockFunc(args, util, realBlockInfo);
            };
            break;
        }
        }

        return blockInfo;
    }

    async updateLocales (): Promise<void> {
        await this.reloadAll();
    }

    /**
     * Regenerate blockinfo for any loaded extensions
     * @returns resolved once all the extensions have been reinitialized
     */
    async refreshBlocks (): Promise<void> {
        await this.reloadAll();
    }

    allocateWorker (): [number, string] | undefined {
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
     * Collect extension metadata from the specified service and begin the extension registration process.
     * @param serviceName - the name of the service hosting the extension.
     */
    async registerExtensionService (extensionURL: string, serviceName: string): Promise<void> {
        const info = await dispatch.call<ExtensionMetadata>(serviceName, 'getInfo');
        this._registerExtensionInfo(null, info, extensionURL, serviceName);
        this.emit('LOADED', info.id, this.loadedScratchExtension.get(info.id) as ScratchExtension);
    }

    /**
     * Called by an extension worker to indicate that the worker has finished initialization.
     * @param id - the worker ID.
     * @param e - the error encountered during initialization, if any.
     */
    onWorkerInit (id: number, e?: Error): void {
        const workerInfo = this.pendingWorkers[id];
        delete this.pendingWorkers[id];
        if (e) {
            workerInfo.reject(e);
        } else {
            workerInfo.resolve(id);
        }
    }
}
