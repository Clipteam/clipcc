import {
    API,
    BlockPrototype,
    BlockType,
    CategoryPrototype,
    ParameterType
} from "../../type/ccx";

class ExtensionAPI implements API {
    addCategory (category: CategoryPrototype) {}
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
    Extension: typeof Extension
}

export function makeCtx () : Ctx {
    return {
        api: new ExtensionAPI(),
        type: {
            BlockType,
            ParameterType 
        },
        Extension: Extension
    };
}
