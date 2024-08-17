import {
    CategoryPrototype,
    BlockPrototype,
    ButtonPrototype,
    VmInstance,
    BlockInstance
} from './type';

export interface API {
    /**
     * Add category to editor. You should call this before adding
     * blocks.
     * @param category Category's prototype
     */
    addCategory(category: CategoryPrototype): void;
    /**
     * Remove a category from editor.
     * @param categoryId Category's id.
     */
    removeCategory(categoryId: string): void;
    /**
     * Add a block to the category. All blocks added to the editor
     * CANNOT be removed.
     * @param block Block's prototype
     */
    addBlock(block: BlockPrototype): void;
    /**
     * Add a button to the category.
     @param button Button's prototype
     */
    addButton(button: ButtonPrototype): void;
    /**
     * Remove a button from the category.
     @ param buttonId Button's id
     */
    removeButton(buttonId: string): void;
    /**
     * Add blocks to the category. All blocks added to the editor
     * CANNOT be removed.
     * @param blocks A list of block's prototype
     */
    addBlocks(blocks: BlockPrototype[]): void;
    /**
     * Hide a block from the toolbox.
     * @param opcode The opcode of the block;
     */
    removeBlock(opcode: string): void;
    /**
     * Hide blocks from the toolbox.
     * @param opcode The list of the block's opcode;
     */
    removeBlocks(opcodes: string[]): void;

    /**
     * Get virtual machine instance of the editor, Doesn't work in
     * sandboxed environment.
     * You can accomplish more complex functionality by directly
     * modifying or invoking instances, but the results of all
     * operations on instances are entirely dependent on the editor's
     * implementation, whose stability and feasibility are not guaranteed
     * and may change between versions.
     */
    getVmInstance(): VmInstance;
    /**
     * Get blockly machine instance of the editor, Doesn't work in
     * sandboxed environment.
     * You can accomplish more complex functionality by directly
     * modifying or invoking instances, but the results of all
     * operations on instances are entirely dependent on the editor's
     * implementation, whose stability and feasibility are not guaranteed
     * and may change between versions.
     */
    getBlockInstance(): BlockInstance;
    /**
     * Get stage's canvas element, Doesn't work in sandboxed environment.
     * You can accomplish more complex functionality by directly
     * modifying or invoking instances, but the results of all
     * operations on instances are entirely dependent on the editor's
     * implementation, whose stability and feasibility are not guaranteed
     * and may change between versions.
     */
    getStageCanvas(): HTMLCanvasElement | undefined;

    /**
     * Get settings from GUI.
     * @param id Full setting id.
     */
    getSettings(id: string): unknown;

    /**
     * Register the function ``func`` with ``name`` as a global function.
     * Doesn't work in sandboxed environment.
     * @param name Function's name
     * @param func Function
     */
    registerGlobalFunction(name: string, func: (...args: unknown[]) => unknown): void;
    /**
     * Unregister a registered function. Doesn't work in sandboxed environment.
     * @param name Function's name
     */
    unregisterGlobalFunction(name: string): void;
    /**
     * Calls the global function name and passes ``...args`` as an argument.
     *  Doesn't work in sandboxed environment.
     * @param name Function's name
     * @param args Function's arguments
     * @returns the return value of the corresponding function.
     */
    callGlobalFunction(name: string, ...args: unknown[]): unknown;
}
