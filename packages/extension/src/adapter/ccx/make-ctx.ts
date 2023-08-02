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


interface BlockInfo {
    categoryId: string;
    messageId: string;
    blocks: [];
    color: `#${string}`;
}
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
     * Store all blocks added by CCX extension.
     * @type {Record<string, CategoryInfo>}
     */
    private blockInfo: Record<string, BlockInfo> = {};
    /**
     * Editor's Virtual Machine instance.
     * Should be set by `attachVM` while initializing.
     * @todo add more strict type check when VM adds TS support.
     */
    private vm?: VM;

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
                this.adapter.emit('REFRESH_TOOLBOX');
            });
        }
    }

    addCategory (category: CategoryPrototype) {
        if (category.categoryId in this.blockInfo) {
            throw new Error('Cannot add a category twice');
        }

        this.blockInfo[category.categoryId] = {
            categoryId: category.categoryId,
            messageId: category.messageId,
            blocks: [],
            color: category.color
        };
        this.requestUpdateToolbox();
    }

    getBlocksXML () {
        const processedXML = [];
        for (const categoryId in this.blockInfo) {
            const category = this.blockInfo[categoryId];
            let toolboxXML = 
            `<category
                name="${formatMessage({id: category.messageId, default: category.messageId})}"
                id="${category.categoryId}"
                colour="${category.color}"
                secondaryColour="${category.color}"
            >`;
            // Add blocks
            for (const block of category.blocks) {}
            toolboxXML += `</category>`;
            processedXML.push({
                id: category.categoryId,
                xml: toolboxXML
            });
        }
        return processedXML;
    }

    removeCategory (categoryId: string) {
        delete this.blockInfo[categoryId];
        this.requestUpdateToolbox();
        
    }
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
