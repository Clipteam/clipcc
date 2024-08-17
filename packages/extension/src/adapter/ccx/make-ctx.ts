import formatMessage from 'format-message';
import xmlEscape from 'xml-escape';
import {
    API,
    BlockPrototype,
    BlockType,
    CategoryPrototype,
    ButtonPrototype,
    ParameterPrototype,
    ParameterType,
    MenuItemPrototype,
    BaseBlockPrim
} from '../../types/ccx';
import { VM } from '../../types/virtual-machine';
import { ScratchBlocksConstants, Cast } from '../../util';
import type { CCXAdapter } from './ccx';
import type { WorkerDispatch } from '../../dispatch/worker-dispatch';
import { CentralDispatch as centralDispatch } from '../../dispatch/central-dispatch';
import { TargetType } from '../../types/scratch';

interface BlockInfo {
    categoryId: string;
    messageId: string;
    blocks: Record<string, BlockPrototype | WorkerBlockPrototype | ButtonPrototype | WorkerButtonPrototype>;
    color: `#${string}`;
}

/**
 * Information used for converting CCX argument types into scratch-blocks data.
 * @type {object.<ParameterType, {shadowType: string, fieldType: string}>}
 */
const ParameterTypeMap = (() => {
    const map: Record<string, {
        shadow?: {
            type: string;
            fieldName: string;
        },
        check?: string;
    }> = {};
    map[ParameterType.ANGLE] = {
        shadow: {
            type: 'math_angle',
            // We specify fieldNames here so that we can pick
            // create and populate a field with the defaultValue
            // specified in the extension.
            // When the `fieldName` property is not specified,
            // the <field></field> will be left out of the XML and
            // the scratch-blocks defaults for that field will be
            // used instead (e.g. default of 0 for number fields)
            fieldName: 'NUM'
        }
    };
    map[ParameterType.COLOR] = {
        shadow: {
            type: 'colour_picker',
            fieldName: 'COLOUR'
        }
    };
    map[ParameterType.NUMBER] = {
        shadow: {
            type: 'math_number',
            fieldName: 'NUM'
        }
    };
    map[ParameterType.STRING] = {
        shadow: {
            type: 'text',
            fieldName: 'TEXT'
        }
    };
    map[ParameterType.BOOLEAN] = {
        check: 'Boolean'
    };
    map[ParameterType.MATRIX] = {
        shadow: {
            type: 'matrix',
            fieldName: 'MATRIX'
        }
    };
    map[ParameterType.NOTE] = {
        shadow: {
            type: 'note',
            fieldName: 'NOTE'
        }
    };
    return map;
})();

export interface BlockJSON {
    type: string;
    inputsInline: boolean;
    category?: string;
    colour: `#${string}`;
    colourSecondary?: `#${string}`;
    colourTertiary?: `#${string}`;
    previousStatement?: null | undefined;
    nextStatement?: null | undefined;
    outputShape: ScratchBlocksConstants;
    output: string;
    [prop: `args${number}`]: BlocklyArg[];
    [prop: `message${number}`]: string;
    checkboxInFlyout?: boolean;
}

interface BlocklyArg {
    type: string;
    name: string;
    check?: string;
    options?: [string, unknown][] | FieldMenuItems | (() => MenuItemPrototype[]);
}

type FieldMenuItems = {
    text: string;
    value: string;
}[];

interface Target {
    isStage: boolean;
}

export class ExtensionCentralAPI implements API {
    /**
     * Store all blocks added by CCX extension.
     * @type {Record<string, CategoryInfo>}
     */
    blockInfo: Record<string, BlockInfo> = {};
    /**
     * Editor's Virtual Machine instance.
     * Should be set by `attachVM` while initializing.
     * @todo add more strict type check when VM adds TS support.
     */
    vm?: VM;

    /**
     * Editor's Blockly instance.
     * Should be set by `attachBlockly` while initializing.
     * @todo add more strict type check when Blockly adds TS support.
     */
    block?: Record<string, unknown>;

    /**
     * A mapping table from opcode to extensionId to handle non-standard id blocks
     * for original Scratch.
     */
    opcodeMap: Record<string, string> = {};

    /**
     * All blocks which need to be added to Blockly.
     */
    blocksToBeRegistered: BlockJSON[] = [];

    /**
     * CCX Adapter.
     * @type {CCXAdapter}
     */
    adapter: CCXAdapter;

    /**
     * Global functions
     * @type {Record<string, Function>}
     */
    globalFuncion: Record<string, (...args: unknown[]) => unknown | undefined> = {};

    /**
     * Central Dispatcher.
     */
    dispatch = centralDispatch;

    constructor (adapter: CCXAdapter) {
        this.adapter = adapter;
    }

    /**
     * Set the VM for the api.
     * @param {VirtualMachine} vm - the VM instance.
     */
    attachVM (vm: VM) {
        this.vm = vm;
    }

    /**
     * Set the Block for the api.
     * @param {Blockly} block - the Blockly instance.
     */
    attachBlock (block: Record<string, unknown>) {
        this.block = block;
    }

    private requestRegisterBlock () {
        this.adapter.emit('REGISTER_BLOCK', this.blocksToBeRegistered);
        this.blocksToBeRegistered = [];
    }

    private requestRegisterButton (id: string, func: () => void) {
        this.adapter.emit('REGISTER_BUTTON', id, func);
    }

    private requestUpdateToolbox () {
        this.adapter.emit('REFRESH_TOOLBOX');
    }

    addCategory (category: CategoryPrototype) {
        if (category.categoryId in this.blockInfo) {
            throw new Error('cannot add a category twice');
        }

        this.blockInfo[category.categoryId] = {
            categoryId: category.categoryId,
            messageId: category.messageId,
            blocks: {},
            color: category.color
        };
        this.requestUpdateToolbox();
    }

    removeCategory (categoryId: string) {
        delete this.blockInfo[categoryId];
        this.requestUpdateToolbox();
        
    }
    private _addBlock (block: BlockPrototype | WorkerBlockPrototype, id?: string) {
        // skip process button as a block while updating locales.
        if ('callback' in block) return;

        const category = this.blockInfo[block.categoryId];
        if (!category) throw new Error('category not found');
        category.blocks[block.opcode] = block;
        const blockJSON: Partial<BlockJSON> = {
            type: block.opcode,
            inputsInline: true,
            category: block.categoryId,
            colour: category.color,
            colourSecondary: undefined,
            colourTertiary: undefined
        };

        // Process input menus
        for (const paramId in block.param) {
            // if the param doesn't have menu or it's an field
            if (!block.param[paramId].menu || block.param[paramId].field) continue;
            // check whether the menu specified an id
            if (!block.param[paramId].menuId) {
                // automatically generate an id
                block.param[paramId].menuId = `${block.opcode}.menu.${paramId}`;
            }

            let menuItems: [string, unknown][] | (() => MenuItemPrototype[]);
            if (typeof block.param[paramId].menu === 'function') {
                menuItems = block.param[paramId].menu as (() => MenuItemPrototype[]);
            } else {
                menuItems = [];
                for (const item of (block.param[paramId].menu as MenuItemPrototype[])) {
                    menuItems.push([
                        formatMessage({
                            id: item.messageId,
                            default: item.messageId
                        }),
                        item.value
                    ]);
                }
            }

            this.blocksToBeRegistered.push({
                message0: '%1',
                type: block.param[paramId].menuId!,
                inputsInline: true,
                output: 'String',
                colour: category.color,
                colourSecondary: undefined,
                colourTertiary: undefined,
                outputShape: ScratchBlocksConstants.OUTPUT_SHAPE_ROUND,
                args0: [{
                    type: 'field_dropdown',
                    name: paramId,
                    options: menuItems
                }]
            });
        }

        // Set block type
        switch (block.type) {
        case BlockType.COMMAND:
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE;
            blockJSON.previousStatement = null; // null = available connection; undefined = hat
            if (!block.option?.terminal) {
                blockJSON.nextStatement = null; // null = available connection; undefined = terminal
            }
            break;
        case BlockType.REPORTER:
            blockJSON.output = 'String'; // TODO: distinguish number & string here?
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_ROUND;
            break;
        case BlockType.BOOLEAN:
            blockJSON.output = 'Boolean';
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_HEXAGONAL;
            break;
        case BlockType.HAT:
            if (!this.vm) throw new Error('VM hadn\'t been attached');
            this.vm.runtime._hats[block.opcode] = {
                edgeActivated: true // CCX doesn't support spicify this
            };
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE;
            blockJSON.nextStatement = null; // null = available connection; undefined = terminal
            break;
        default:
            throw new Error('unknown block type');
        }

        // Process arguments
        const text = formatMessage({
            id: block.messageId,
            default: block.messageId
        });
        let outLineNum = 0;
        // clear next arg
        blockJSON[`args${outLineNum}`] = [];
        const re = /\[(.+?)]/g;

        let searchResult = null;
        let convertedText = '';
        let lastIndex = 0;
        while ((searchResult = re.exec(text)) !== null) {
            convertedText += text.substring(lastIndex, searchResult.index);
            lastIndex = re.lastIndex;

            // Sanitize the placeholder to ensure valid XML
            let placeholder = searchResult[1].replace(/[<"&]/, '_');

            // Check whether it is an substack
            if (placeholder.startsWith('SUBSTACK')) { // script
                if (placeholder === 'SUBSTACK1') placeholder = 'SUBSTACK';
                blockJSON[`message${outLineNum}`] = convertedText;
                ++outLineNum;
                convertedText = '';

                blockJSON[`message${outLineNum}`] = '%1';
                blockJSON[`args${outLineNum}`] = [{
                    type: 'input_statement',
                    name: placeholder
                }];
                ++outLineNum;
                // clear next arg
                blockJSON[`args${outLineNum}`] = [];
                continue;
            }

            // create param lazily in order to avoid errors caused by BRANCH
            const param = block.param ? block.param[placeholder] as Partial<ParameterPrototype> : {};

            const argTypeInfo = param ? (ParameterTypeMap[param.type!] || {}) : {};
            // Layout a block argument (e.g. an input slot on the block)
            const argJSON: Partial<BlocklyArg> = {
                type: 'input_value',
                name: placeholder
            };

            if (argTypeInfo.check) {
                // Right now the only type of 'check' we have specifies that the
                // input slot on the block accepts Boolean reporters, so it should be
                // shaped like a hexagon
                argJSON.check = argTypeInfo.check;
            }

            if (param.menu && param.field) {
                argJSON.type = 'field_dropdown';
                if (typeof param.menu === 'function') {
                    argJSON.options = param.menu;
                } else {
                    argJSON.options = param.menu.map(item => ([
                        formatMessage({
                            id: item.messageId,
                            default: item.messageId
                        }),
                        item.value
                    ])) as unknown as FieldMenuItems;
                }
            }

            blockJSON[`args${outLineNum}`] = blockJSON[`args${outLineNum}`] || [];
            const blockArgs = blockJSON[`args${outLineNum}`];
            if (!blockArgs) continue;
            if (argJSON) blockArgs.push(argJSON as BlocklyArg);
            const argNum = blockArgs.length;

            convertedText += `%${argNum}`;
        }

        convertedText += text.substring(lastIndex, text.length);

        // Process the remaining string
        if (convertedText.length) {
            blockJSON[`message${outLineNum}`] = convertedText;
        }

        if (block.option?.monitor) {
            blockJSON.checkboxInFlyout = true;
        }

        if (this.vm) {
            if (typeof block.function === 'string') {
                this.vm.runtime._primitives[block.opcode] = (args: unknown) => {
                    return this.dispatch.call(block.function as string, block.opcode, args);
                };
            } else {
                this.vm.runtime._primitives[block.opcode] = block.function;
            }
        } else {
            console.warn('VM hadn\'t be attached, skip register primitives');
        }

        this.blocksToBeRegistered.push(blockJSON as BlockJSON);
        if (id) this.opcodeMap[block.opcode] = id;
    }

    addBlock (block: BlockPrototype | WorkerBlockPrototype, id?: string) {
        this._addBlock(block, id);
        this.requestRegisterBlock();
        this.requestUpdateToolbox();
    }

    addBlocks (blocks: (BlockPrototype | WorkerBlockPrototype)[], id?: string) {
        for (const block of blocks) {
            this._addBlock(block, id);
        }
        this.requestRegisterBlock();
        this.requestUpdateToolbox();
    }

    addButton (button: ButtonPrototype | WorkerButtonPrototype) {
        const category = this.blockInfo[button.categoryId];
        if (!category) throw new Error('category not found');
        category.blocks[button.messageId] = button;
        if (typeof button.callback === 'string') {
            this.requestRegisterButton(button.messageId, () => {
                return this.dispatch.call(button.callback as string, button.messageId);
            });
        } else {
            this.requestRegisterButton(button.messageId, button.callback);
        }
        this.requestUpdateToolbox();
    }

    removeButton (buttonId: string) {
        this.removeBlock(buttonId);
    }

    removeBlock (targetOpcode: string) {
        let flag = false;
        for (const categotyId in this.blockInfo) {
            const category = this.blockInfo[categotyId];
            if (targetOpcode in category.blocks) {
                delete category.blocks[targetOpcode];
                flag = true;
                break;
            }
        }
        if (flag) {
            this.requestUpdateToolbox();
        } else {
            throw new Error('cannot find block');
        }
    }

    removeBlocks (opcodes: string[]) {
        for (const opcode of opcodes) {
            this.removeBlock(opcode);
        }
    }

    updateLocales () {
        for (const categoryId in this.blockInfo) {
            const category = this.blockInfo[categoryId];
            // @ts-expect-error (TS2345) We skip process button in addBlock.
            this.addBlocks(Object.values(category.blocks));
        }
    }

    getBlocksXML (target?: Target) {
        const processedXML = [];
        for (const categoryId in this.blockInfo) {
            const category = this.blockInfo[categoryId];
            let toolboxXML =
            `<category
                name="${formatMessage({ id: category.messageId, default: category.messageId })}"
                id="${category.categoryId}"
                colour="${category.color}"
                secondaryColour="undefined"
            >`;
            // Add blocks
            for (const opcode in category.blocks) {
                const block = category.blocks[opcode];
                // It's a button
                if ('callback' in block) {
                    toolboxXML += `
                    <button
                        text="${formatMessage({ id: block.messageId, default: block.messageId })}"
                        callbackKey="${block.messageId}">
                    </button>`;
                    continue;
                }

                // Skip show if necessary
                if (target && Array.isArray(block.option?.filter)) {
                    // Hide from palette
                    if ((block.option?.filter as TargetType[]).length < 1) continue;
                    if (!block.option?.filter.includes(
                        target.isStage ? TargetType.STAGE : TargetType.SPRITE
                    )) {
                        continue;
                    }
                }

                toolboxXML += `<block type="${block.opcode}" >`;
                const text = formatMessage({
                    id: block.messageId,
                    default: block.messageId
                });
                const re = /\[(.+?)]/g;
                let searchResult = null;
                while ((searchResult = re.exec(text)) !== null) {
                    if (searchResult) {
                        const placeholder = searchResult[1].replace(/[<"&]/, '_');
                        if (placeholder.startsWith('SUBSTACK')) continue;
                        let fieldName;
                        const param = block.param ? block.param[placeholder] : null;
                        const argTypeInfo = param ? (ParameterTypeMap[param.type] || {}) : {};
                        let shadowType = param ? param.menuId : null;
                        if ((param?.menu && param?.field) || param?.menuId) {
                            fieldName = placeholder;
                        } else {
                            shadowType = (argTypeInfo.shadow && argTypeInfo.shadow.type) || null;
                            fieldName = (argTypeInfo.shadow && argTypeInfo.shadow.fieldName) || null;
                        }

                        toolboxXML += `<value name="${placeholder}">`;
                        // The <shadow> is a placeholder for a reporter and is visible when there's no reporter in this input.
                        // Boolean inputs don't need to specify a shadow in the XML.
                        if (shadowType) toolboxXML += `<shadow type="${shadowType}">`;

                        // A <field> displays a dynamic value: a user-editable text field, a drop-down menu, etc.
                        // Leave out the field if defaultValue or fieldName are not specified
                        if (param?.default && fieldName) {
                            toolboxXML += `<field name="${fieldName}">${xmlEscape(param?.default ?? '')}</field>`;
                        }
                        if (shadowType) toolboxXML += '</shadow>';
                        toolboxXML += '</value>';
                    }
                }
                toolboxXML += '</block>';
            }
            toolboxXML += '</category>';
            processedXML.push({
                id: category.categoryId,
                xml: toolboxXML
            });
        }
        return processedXML;
    }

    getVmInstance () {
        return this.vm;
    }

    getBlockInstance () {
        return this.block;
    }

    getStageCanvas () {
        return this.vm?.renderer?.canvas;
    }

    getSettings (id: string) {
        return this.adapter.guiSettings[id];
    }

    registerGlobalFunction (name: string, func: (...args: unknown[]) => unknown) {
        if (name in this.globalFuncion) {
            throw 'Register an existed global function.';
        }
        this.globalFuncion[name] = func;
    }

    unregisterGlobalFunction (name: string) {
        if (!(name in this.globalFuncion)) {
            throw 'Try to unregister an unexisted global function.';
        }
        delete this.globalFuncion[name];
    }

    callGlobalFunction (name: string, ...args: unknown[]) {
        if (!(name in this.globalFuncion)) {
            throw 'Call an unexisted global function.';
        }
        return this.globalFuncion[name](...args);
    }
}

interface WorkerBlockPrototype extends Omit<BlockPrototype, 'function'> {
    // service's name
    function: string;
}

interface WorkerButtonPrototype extends Omit<ButtonPrototype, 'callback'> {
    // service's name
    callback: string;
}

class ExtensionWorkerAPI implements API {
    /**
     * Service's name.
     * @type {string}
     */
    private serviceName: string;
    /**
     * Extension's ID.
     * @type {string}
     */
    id: string;
    /**
     * Block's function. A pair of opcode + function.
     * @type {Record<string, Function>}
     */
    private blockPrimitives: Record<string, BaseBlockPrim> = {};
    // Make it private to prevent security issues.
    #dispatch: WorkerDispatch;

    constructor (dispatch: WorkerDispatch, serviceName: string, extensionId: string) {
        dispatch.setService(`${serviceName}.primitives`, this.blockPrimitives);
        this.#dispatch = dispatch;
        this.serviceName = serviceName;
        this.id = extensionId;
    }

    addCategory (category: CategoryPrototype) {
        // It can be tranferred safely.
        return this.#dispatch.call('ccxAPI', 'addCategory', category);
    }

    removeCategory (categoryId: string) {
        // It can be tranferred safely.
        return this.#dispatch.call('ccxAPI', 'removeCategory', categoryId);
    }

    private purifyBlockPrototype (block: BlockPrototype) {
        const purified = block as unknown as WorkerBlockPrototype;
        this.blockPrimitives[block.opcode] = block.function;
        purified.function = `${this.serviceName}.primitives`;
        return purified;
    }

    addBlock (block: BlockPrototype) {
        const purified = this.purifyBlockPrototype(block);
        return this.#dispatch.call('ccxAPI', 'addBlock', purified, this.id);
    }

    addBlocks (blocks: BlockPrototype[]) {
        const purified = [];
        for (const block of blocks) {
            purified.push(this.purifyBlockPrototype(block));
        }
        return this.#dispatch.call('ccxAPI', 'addBlocks', purified, this.id);
    }

    addButton (button: ButtonPrototype) {
        const purified = button as unknown as WorkerButtonPrototype;
        this.blockPrimitives[button.messageId] = button.callback;
        purified.callback = `${this.serviceName}.primitives`;
        return this.#dispatch.call('ccxAPI', 'addButton', purified);
    }

    removeButton (buttonId: string) {
        return this.#dispatch.call('ccxAPI', 'removeButton', buttonId);
    }

    removeBlock (opcode: string) {
        // It can be tranferred safely.
        return this.#dispatch.call('ccxAPI', 'removeBlock', opcode);
    }

    removeBlocks (opcodes: string[]) {
        // It can be tranferred safely.
        return this.#dispatch.call('ccxAPI', 'removeBlocks', opcodes);
    }

    getVmInstance () {
        throw new Error('getVmInstance is not avaiable in sandboxed environment');
    }

    getBlockInstance () {
        throw new Error('getBlockInstance is not avaiable in sandboxed environment');
    }

    // @ts-expect-error it's stub in sandbox
    getStageCanvas () {
        throw new Error('getStageCanvas is not avaiable in sandboxed environment');
    }

    getSettings (id: string) {
        // It can be tranferred safely.
        return this.#dispatch.call('ccxAPI', 'getSettings', id);
    }

    registerGlobalFunction () {
        throw new Error('registerGlobalFunction is not avaiable in sandboxed environment');
    }

    unregisterGlobalFunction () {
        throw new Error('unregisterGlobalFunction is not avaiable in sandboxed environment');
    }

    callGlobalFunction () {
        throw new Error('callGlobalFunction is not avaiable in sandboxed environment');
    }
}

class ExtensionUnsandboxedAPI implements API {
    private centralAPI: ExtensionCentralAPI;
    /**
     * Extension's ID
     */
    id: string;

    constructor (api: ExtensionCentralAPI, id: string) {
        this.centralAPI = api;
        this.id = id;
    }

    addCategory (category: CategoryPrototype) {
        return this.centralAPI.addCategory(category);
    }

    removeCategory (categoryId: string) {
        return this.centralAPI.removeCategory(categoryId);
    }

    addBlock (block: BlockPrototype) {
        return this.centralAPI.addBlock(block, this.id);
    }

    addBlocks (blocks: BlockPrototype[]) {
        return this.centralAPI.addBlocks(blocks, this.id);
    }

    addButton (button: ButtonPrototype) {
        return this.centralAPI.addButton(button);
    }

    removeButton (buttonId: string) {
        return this.centralAPI.removeButton(buttonId);
    }

    removeBlock (opcode: string) {
        return this.centralAPI.removeBlock(opcode);
    }

    removeBlocks (opcodes: string[]) {
        return this.centralAPI.removeBlocks(opcodes);
    }

    getVmInstance () {
        throw this.centralAPI.getVmInstance();
    }

    getBlockInstance () {
        return this.centralAPI.getBlockInstance();
    }

    getStageCanvas () {
        return this.centralAPI.getStageCanvas();
    }

    getSettings (id: string) {
        return this.centralAPI.getSettings(id);
    }

    registerGlobalFunction (name: string, func: (...args: unknown[]) => unknown) {
        return this.centralAPI.registerGlobalFunction(name, func);
    }

    unregisterGlobalFunction (name: string) {
        return this.centralAPI.unregisterGlobalFunction(name);
    }

    callGlobalFunction (name: string, ...args: unknown[]) {
        return this.centralAPI.callGlobalFunction(name, ...args);
    }
}

class Extension {}

export interface Ctx {
    api: ExtensionUnsandboxedAPI,
    type: {
        BlockType: typeof BlockType,
        ParameterType: typeof ParameterType
    },
    Extension: typeof Extension,
    Cast: typeof Cast,
    ExtensionManager: CCXAdapter
}

export interface WorkerCtx {
    api: ExtensionWorkerAPI,
    type: {
        BlockType: typeof BlockType,
        ParameterType: typeof ParameterType
    },
    Extension: typeof Extension,
    Cast: typeof Cast
}

export function makeUnsandboxedCtx (api: ExtensionCentralAPI, id: string) : Ctx {
    return {
        api: new ExtensionUnsandboxedAPI(api, id),
        type: {
            BlockType,
            ParameterType 
        },
        ExtensionManager: api.adapter,
        Cast: Cast,
        Extension: Extension
    };
}

export function makeCtxForWorker (dispatch: WorkerDispatch, serviceName: string, extensionId: string) {
    return {
        api: new ExtensionWorkerAPI(dispatch, serviceName, extensionId),
        type: {
            BlockType,
            ParameterType
        },
        Cast: Cast,
        Extension: Extension
    };
}
