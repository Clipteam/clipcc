import formatMessage from "format-message";
import {
    API,
    BlockPrototype,
    BlockType,
    CategoryPrototype,
    ParameterPrototype,
    ParameterType,
    CCXExtensionClass as ExtensionClass
} from "../../type/ccx";
import { VM } from "../../type/virtual-machine";
import { ScratchBlocksConstants } from '../../util';
import type { CCXAdapter } from "./ccx";
import type { WorkerDispatch } from '../../dispatch/worker-dispatch';
import type { CentralDispatch } from '../../dispatch/central-dispatch';
interface BlockInfo {
    categoryId: string;
    messageId: string;
    blocks: Record<string, BlockPrototype | WorkerBlockPrototype>;
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
    category: string;
    colour: `#${string}`;
    colourSecondary: `#${string}`;
    colourTertiary: `#${string}`;
    previousStatement: null | undefined;
    nextStatement: null | undefined;
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
    options?: FieldMenuItems;
}

type FieldMenuItems = {
    text: string;
    value: string;
}[];

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
     * Editor's Blockly instance.
     * Should be set by `attachBlockly` while initializing.
     * @todo add more strict type check when Blockly adds TS support.
     */
    private block?: Record<string, unknown>;

    /**
     * All blocks which need to be added to Blockly.
     */
    private blocksToBeRegistered: BlockJSON[] = [];

    /**
     * CCX Adapter.
     * @type {CCXAdapter}
     */
    private adapter: CCXAdapter;

    /**
     * Global functions
     * @type {Record<string, Function>}
     */
    private globalFuncion: Record<string, Function> = {};

    /**
     * Central Dispatcher.
     * @type {CentralDispatch}
     */
    private dispatch: CentralDispatch;

    constructor (adapter: CCXAdapter, dispatch: CentralDispatch) {
        this.adapter = adapter;
        this.dispatch = dispatch;
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
        if (!this.blockRefreshQueued) {
            this.blockRefreshQueued = true;
            queueMicrotask(() => {
                this.blockRefreshQueued = false;
                this.adapter.emit('REGISTER_BLOCK', this.blocksToBeRegistered);
            });
        }
    }

    private requestUpdateToolbox () {
        if (!this.toolboxRefreshQueued) {
            this.toolboxRefreshQueued = true;
            queueMicrotask(() => {
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
            blocks: {},
            color: category.color
        };
        this.requestUpdateToolbox();
    }

    removeCategory (categoryId: string) {
        delete this.blockInfo[categoryId];
        this.requestUpdateToolbox();
        
    }
    addBlock (block: BlockPrototype | WorkerBlockPrototype) {
        if (!this.vm) throw new Error(`VM hadn't been attached`);

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
        let inBranchNum = 0;
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
                ++inBranchNum;
                ++outLineNum;
                // clear next arg
                blockJSON[`args${outLineNum}`] = [];
                continue;
            }

            // create param lazily in order to avoid errors caused by BRANCH
            const param = block.param ? block.param[placeholder] as Partial<ParameterPrototype> : {};

            let argTypeInfo = ParameterTypeMap[block.type] || {};
            // Layout a block argument (e.g. an input slot on the block)
            let argJSON: Partial<BlocklyArg> = {
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
                    argJSON.options = param.menu.map(item => ([
                        formatMessage({
                            id: item.messageId,
                            default: item.messageId
                        }),
                        item.value
                    ])) as unknown as FieldMenuItems;
                }

            blockJSON[`args${outLineNum}`] = blockJSON[`args${outLineNum}`] || []
            const blockArgs = blockJSON[`args${outLineNum}`];
            if (argJSON) blockArgs!.push(argJSON as BlocklyArg);
            const argNum = blockArgs!.length;

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

        if (typeof block.function === 'string') {
            this.vm.runtime._primitives[block.opcode] = (args: unknown, util: unknown) => {
                return this.dispatch.call(block.function as string, block.opcode, args, util);
            };
        } else {
            this.vm.runtime._primitives[block.opcode] = block.function;
        }

        this.blocksToBeRegistered.push(blockJSON as BlockJSON);
        this.requestRegisterBlock();
        this.requestUpdateToolbox();
    }

    addBlocks (blocks: (BlockPrototype | WorkerBlockPrototype)[]) {
        for (const block of blocks) {
            this.addBlock(block);
        }
    }

    removeBlock (opcode: string) {}
    removeBlocks (opcodes: string[]) {}


    updateLocales () {
        for (const categoryId in this.blockInfo) {
            const category = this.blockInfo[categoryId];
            this.addBlocks(Object.values(category.blocks));
        }
    }

    getBlocksXML () {
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
                        let fieldName;
                        const param = block.param ? block.param[placeholder] : null;
                        const argTypeInfo = ParameterTypeMap[block.type] || {};
                        let shadowType = param ? param[placeholder as keyof ParameterPrototype]?.menuId : null;
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
                            toolboxXML += `<field name="${fieldName}">${param?.default}</field>`;
                        }
                        if (shadowType) toolboxXML += '</shadow>';
                        toolboxXML += `</value>`;
                    }
                }
                toolboxXML += `</block>`;
            }
            toolboxXML += `</category>`;
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

    registerGlobalFunction (name: string, func: Function) {
        if (this.globalFuncion.hasOwnProperty(name)) {
            throw 'Register an existed global function.';
        }
        this.globalFuncion[name] = func;
    }

    unregisterGlobalFunction (name: string) {
        if (!this.globalFuncion.hasOwnProperty(name)) {
            throw 'Try to unregister an unexisted global function.';
        }
        delete this.globalFuncion[name];
    }

    callGlobalFunction (name: string, ...args: any[]) {
        if (!this.globalFuncion.hasOwnProperty(name)) {
            throw 'Call an unexisted global function.';
        }
        return this.globalFuncion[name](...args);
    }
}

interface WorkerBlockPrototype extends Omit<BlockPrototype, 'function'> {
    // service's name
    function: string;
}

class ExtensionWorkerAPI implements API {
    /**
     * Service's name.
     * @type {string}
     */
    private serviceName: string;
    /**
     * Block's function. A pair of opcode + function.
     * @type {Record<string, Function>}
     */
    private blockPrimitives: Record<string, Function> = {};
    // Make it private to prevent security issues.
    #dispatch: WorkerDispatch;

    constructor (dispatch: WorkerDispatch, serviceName: string) {
        dispatch.setService(`${serviceName}.primitives`, this.blockPrimitives);
        this.#dispatch = dispatch;
        this.serviceName = serviceName;
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
        return this.#dispatch.call('ccxAPI', 'addBlock', purified);
    }

    addBlocks (blocks: BlockPrototype[]) {
        const purified = [];
        for (const block of blocks) {
            purified.push(this.purifyBlockPrototype(block));
        }
        return this.#dispatch.call('ccxAPI', 'addBlocks', purified);
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

    getBlockInstance() {
        throw new Error('getBlockInstance is not avaiable in sandboxed environment');
    }

    // @ts-expect-error
    getStageCanvas () {
        throw new Error('getStageCanvas is not avaiable in sandboxed environment');
    }

    getSettings (id: string) {
        // It can be tranferred safely.
        return this.#dispatch.call('ccxAPI', 'getSettings', id);
    }

    registerGlobalFunction (name: string, func: Function) {
        throw new Error('registerGlobalFunction is not avaiable in sandboxed environment');
    }

    unregisterGlobalFunction (name: string) {
        throw new Error('unregisterGlobalFunction is not avaiable in sandboxed environment');
    }

    callGlobalFunction (name: string, ...args: any[]) {
        throw new Error('callGlobalFunction is not avaiable in sandboxed environment');
    };
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

export interface WorkerCtx {
    api: ExtensionWorkerAPI,
    type: {
        BlockType: typeof BlockType,
        ParameterType: typeof ParameterType
    },
    Extension: typeof Extension
}

export function makeCtx (adapter: CCXAdapter, dispatch: CentralDispatch) : Ctx {
    return {
        api: new ExtensionAPI(adapter, dispatch),
        type: {
            BlockType,
            ParameterType 
        },
        ExtensionManager: adapter,
        Extension: Extension
    };
}

export function makeCtxForWorker (dispatch: WorkerDispatch, serviceName: string) {
    return {
        api: new ExtensionWorkerAPI(dispatch, serviceName),
        type: {
            BlockType,
            ParameterType
        },
        Extension: Extension
    };
}
