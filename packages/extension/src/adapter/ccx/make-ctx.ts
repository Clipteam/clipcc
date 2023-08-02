import formatMessage from "format-message";
import {
    API,
    BlockPrototype,
    BlockType,
    CategoryPrototype,
    ParameterPrototype,
    ParameterType
} from "../../type/ccx";
import { VM } from "../../type/virtual-machine";
import { ScratchBlocksConstants } from '../../util';
import type { CCXAdapter } from "./ccx";
interface BlockInfo {
    categoryId: string;
    messageId: string;
    blocks: Record<string, BlockPrototype>;
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
     * All blocks which need to be added to Blockly.
     */
    private blocksToBeRegistered: BlockJSON[] = [];

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
    addBlock (block: BlockPrototype) {
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

        this.vm.runtime._primitives[block.opcode] = block.function;

        this.blocksToBeRegistered.push(blockJSON as BlockJSON);
        this.requestRegisterBlock();
        this.requestUpdateToolbox();
    }

    addBlocks (blocks: BlockPrototype[]) {
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

    getBlocksXML() {
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

    getVmInstance() {
        return this.vm;
    }

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
