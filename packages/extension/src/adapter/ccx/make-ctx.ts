import formatMessage from "format-message";
import {
    API,
    BlockPrototype,
    BlockType,
    CategoryPrototype,
    ParameterType
} from "../../type/ccx";
import { VM } from "../../type/virtual-machine";
import type { CCXAdapter } from "./ccx";

class ExtensionAPI implements API {
    /**
     * Whether toolbox's update request is queued.
     * @type {boolean}
     */
    private toolboxRefreshQueued = false;

    /**
     * Whether block's update request is queued.
     * @type {boolean}
     */
    private blockRefreshQueued = false;
    /**
     * Editor's Virtual Machine instance.
     * Should be set by `attachVM` while initializing.
     * @todo add more strict type check when VM adds TS support.
     */
    private vm?: VM;
    /**
     * All cateogires which needs to be refresh at next event loop.
     * @type {Record<string, CategoryPrototype>}
     */
    private categoriesToProcess: Record<string, CategoryPrototype> = {};

    /**
     * Process category's id.
     * @type {Set<string>}
     */
    private processedCategories = new Set<string>();

    /**
     * CCX Adapter.
     * @type {CCXAdapter}
     */
    private adapter: CCXAdapter;

    constructor (adapter: CCXAdapter) {
        this.adapter = adapter;
    }
    /**
     * Set the VM for the extension manager.
     * @param {VirtualMachine} vm - the VM instance.
     */
    attachVM (vm: VM) {
        this.vm = vm;
    }

    private requestUpdateToolbox () {
        if (!this.toolboxRefreshQueued) {
            this.toolboxRefreshQueued = true;
            queueMicrotask(() => {
                if (!this.vm) throw new Error(`VM hadn't been attached`);
                this.toolboxRefreshQueued = false;
                const processedCategoryInfo = this.processCategory();
                this.vm.runtime._blockInfo.push(...processedCategoryInfo);
                this.adapter.emit('ADD_CATEGORY', processedCategoryInfo);
            });
        }
    }

    addCategory (category: CategoryPrototype) {
        this.categoriesToProcess[category.categoryId] = category;
        this.requestUpdateToolbox();
    }

    private processCategory () {
        const processCategories = [];
        for (const categoryId in this.categoriesToProcess) {
            // Don't process a same cateogory twice.
            if (this.processedCategories.has(categoryId)) continue;
            const category = this.categoriesToProcess[categoryId];
            processCategories.push({
                id: categoryId,
                messageId: category.messageId,
                name: formatMessage({
                    id: category.messageId,
                    default: category.messageId
                }),
                color1: category.color || '#0FBD8C',
                blocks: [],
                customFieldTypes: {},
                menus: [],
                menuInfo: {}
            });
            this.processedCategories.add(categoryId);
        }
        return processCategories;
    }

    removeCategory (categoryId: string) {}
    addBlock (block: BlockPrototype) {}
    addBlocks (blocks: BlockPrototype[]) {}
    removeBlock (opcode: string) {}
    removeBlocks (opcodes: string[]) {}

    getVmInstance() {}
    getGuiInstance() {}
    getBlockInstance() {}
    getStageCanvas() {
        return document.createElement('canvas');
    }

    getSettings(id: string) {}

    registerGlobalFunction (name: string, func: Function) {}
    unregisterGlobalFunction (name: string) {}
    callGlobalFunction(name: string, ...args: any[]) {}

    migrateChangeBlock (targets: Object, srcBlockId: string, dstBlockId: string) {}
}

class Extension {}

export interface Ctx {
    api: ExtensionAPI,
    type: {
        BlockType: typeof BlockType,
        ParameterType: typeof ParameterType
    },
    Extension: typeof Extension,
    ExtensionManager: CCXAdapter
}

export function makeCtx (adapter: CCXAdapter) : Ctx {
    return {
        api: new ExtensionAPI(adapter),
        type: {
            BlockType,
            ParameterType 
        },
        ExtensionManager: adapter,
        Extension: Extension
    };
}
