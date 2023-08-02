import {
    CategoryPrototype,
    BlockPrototype,
    VmInstance,
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
    getBlockInstance(): BlockInstance;
    getStageCanvas(): HTMLCanvasElement | undefined;

    getSettings(id: string): any;

    registerGlobalFunction(name: string, func: Function): void;
    unregisterGlobalFunction(name: string): void;
    callGlobalFunction(name: string, ...args: any[]): any;
}
