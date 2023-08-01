import {
    CategoryPrototype,
    BlockPrototype,
    VmInstance,
    GuiInstance,
    BlockInstance
} from './type';

export interface API {
    addCategory(category: CategoryPrototype): void;
    removeCategory(categoryId: string): void;
    addBlock(block: BlockPrototype): void;
    addBlocks(blocks: BlockPrototype[]): void;
    removeBlock(opcode: string): void;
    removeBlocks(opcodes: string[]): void;

    getVmInstance(): VmInstance;
    getGuiInstance(): GuiInstance;
    getBlockInstance(): BlockInstance;
    getStageCanvas(): HTMLCanvasElement;

    getSettings(id: string): any;

    registerGlobalFunction(name: string, func: Function): void;
    unregisterGlobalFunction(name: string): void;
    callGlobalFunction(name: string, ...args: any[]): any;

    migrateChangeBlock(targets: Object, srcBlockId: string, dstBlockId: string): void;
}
