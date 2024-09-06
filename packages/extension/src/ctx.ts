import { CCX } from "./types/ccx";
import { ParameterType, BlockType, FilterType } from './types/enum';
import type VirtualMachine from 'clipcc-vm';
import { ScratchBlocksConstants } from "./util/scratch-blocks-constants";
import { xmlEscape } from "./util/xml-escape";
import type { Store } from 'redux';

let context: CCX.Context | undefined;

declare global {
    var ClipCCExtension: CCX.Context | undefined;
}

type XMLSetter = (xml: string) => void;
type ScratchBlocks = any;

let scratchBlocks: ScratchBlocks | null = null;

interface ShadowType {
    type: string;
    fieldName: string;
};

interface ParameterTypeInfo {
    shadow?: ShadowType;
    check?: string;
};

const ParameterTypeMap: Record<ParameterType, ParameterTypeInfo> = {
    [ParameterType.ANGLE]: {
        shadow: {
            type: 'math_angle',
            fieldName: 'NUM'
        }
    },
    [ParameterType.COLOR]: {
        shadow: {
            type: 'colour_picker',
            fieldName: 'COLOUR'
        }
    },
    [ParameterType.NUMBER]: {
        shadow: {
            type: 'math_number',
            fieldName: 'NUM'
        }
    },
    [ParameterType.STRING]: {
        shadow: {
            type: 'text',
            fieldName: 'TEXT'
        }
    },
    [ParameterType.BOOLEAN]: {
        check: 'Boolean'
    },
    [ParameterType.MATRIX]: {
        shadow: {
            type: 'matrix',
            fieldName: 'MATRIX'
        }
    },
    [ParameterType.NOTE]: {
        shadow: {
            type: 'note',
            fieldName: 'NOTE'
        }
    }
};

export interface BlockJSON {
    type: string;
    inputsInline: boolean;
    category?: string;
    colour: `#${string}`;
    colourSecondary?: `#${string}`;
    colourTertiary?: `#${string}`;
    colourQuanternary?: `#${string}`;
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
    options?: [string, unknown][] | FieldMenuItem[] | (() => FieldMenuItem[]);
}

interface FieldMenuItem {
    text: string;
    value: CCX.SafeScratchValue;
}

interface CategoryInfo {
    categoryId: string;
    messageId: string;
    blocks: Record<string, CCX.BlockPrototype | CCX.ButtonPrototype>;
    color: `#${string}`;
}

function initCtx (vm: VirtualMachine, setXML: XMLSetter, store: Store) {
    if (context) return;
    let hasWarned = false, suspendedRefresh = false;
    const globalFunctions = new Map<string, (...args: unknown[]) => unknown>();
    const categoryInfo: Record<string, CategoryInfo> = {};
 
    // Listen locale changes
    let prevLocale: string | undefined;
    store.subscribe(() => {
        const {locales: {locale}} = store.getState();
        if (prevLocale !== locale) {
            prevLocale = locale;
            refreshToolbox();
        }
    });

    function blockTranslate (messageId: string) {
        return scratchBlocks ? scratchBlocks.Msg[messageId] : messageId;
    }

    function makeBlocklyJSON (block: CCX.BlockPrototype) {
        const blocksToBeRegistered: BlockJSON[] = [];
        const category = categoryInfo[block.categoryId];
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

            let menuItems: [string, unknown][] | (() => FieldMenuItem[]);
            if (typeof block.param[paramId].menu === 'function') {
                const originalMenuGenerator = block.param[paramId].menu;
                menuItems = () => (
                    originalMenuGenerator().map(prototype => ({
                        text: blockTranslate(prototype.messageId),
                        value: prototype.value
                    }))
                )
            } else {
                menuItems = [];
                for (const item of block.param[paramId].menu) {
                    menuItems.push([
                        blockTranslate(item.messageId),
                        item.value
                    ]);
                }
            }

            blocksToBeRegistered.push({
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
                vm.runtime._hats[block.opcode] = {
                    edgeActivated: true // CCX doesn't support spicify this
                };
                blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE;
                blockJSON.nextStatement = null; // null = available connection; undefined = terminal
                break;
            default:
                throw new Error('unknown block type');
        }

        // Process arguments
        const text = blockTranslate(block.messageId);
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
            const param = block.param ? block.param[placeholder] as Partial<CCX.ParameterPrototype> : {};

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
                    argJSON.options = param.menu().map(item => ([
                        blockTranslate(item.messageId),
                        item.value
                    ]));
                } else {
                    argJSON.options = param.menu.map(item => ([
                        blockTranslate(item.messageId),
                        item.value
                    ]));
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

        vm.runtime._primitives[block.opcode] = block.function;

        blocksToBeRegistered.push(blockJSON as BlockJSON);

        return blocksToBeRegistered;
    }

    function generateLocalizedData (block: CCX.BlockPrototype): Pick<BlockJSON, 'message0' | 'args0'> {
        const text = blockTranslate(block.messageId);
        const args0: BlocklyArg[] = [];
        let message0 = '';
        let argIndex = 0;

        const re = /\[(.+?)]/g;
        let lastIndex = 0;
        let match;

        while ((match = re.exec(text)) !== null) {
            message0 += text.substring(lastIndex, match.index);
            lastIndex = re.lastIndex;

            const placeholder = match[1].replace(/[<"&]/, '_');
            argIndex++;

            if (placeholder.startsWith('SUBSTACK')) {
                message0 += `%${argIndex}`;
                args0.push({
                    type: 'input_statement',
                    name: placeholder === 'SUBSTACK1' ? 'SUBSTACK' : placeholder
                });
            } else {
                const param = block.param?.[placeholder] as Partial<CCX.ParameterPrototype> | undefined;
                const argTypeInfo = param ? (ParameterTypeMap[param.type!] || {}) : {};

                const arg: Partial<BlocklyArg> = {
                    type: param?.menu && param.field ? 'field_dropdown' : 'input_value',
                    name: placeholder
                };

                if (argTypeInfo.check) {
                    arg.check = argTypeInfo.check;
                }

                if (param?.menu && param.field) {
                    arg.options = typeof param.menu === 'function'
                        ? param.menu().map(item => [blockTranslate(item.messageId), item.value])
                        : param.menu.map(item => [blockTranslate(item.messageId), item.value]);
                }

                message0 += `%${argIndex}`;
                args0.push(arg as BlocklyArg);
            }
        }

        message0 += text.substring(lastIndex);

        return { message0, args0 };
    }

    function registerBlock (block: CCX.BlockPrototype) {
        if (!scratchBlocks) return;
        const blocklyJSONs = makeBlocklyJSON(block);
        const mainBlocklyJSON = blocklyJSONs.pop();
        scratchBlocks.defineBlocksWithJsonArray(blocklyJSONs);
        scratchBlocks.Blocks[block.opcode] = {
            init () {
                return this.jsonInit({
                    ...mainBlocklyJSON,
                    ...generateLocalizedData(block)
                });
            }
        };
    }

    function refreshToolbox () {
        if (suspendedRefresh) return;
        suspendedRefresh = true;
        queueMicrotask(() => {
            const generatedXML = generateToolboxXML();
            let xmlString = '';
            for (const { xml } of generatedXML) {
                xmlString += xml;
            }
            setXML(xmlString);

            suspendedRefresh = false;
        });
    }

    function generateToolboxXML () {
        const processedXML = [];
        for (const categoryId in categoryInfo) {
            const category = categoryInfo[categoryId];
            let toolboxXML =
                `<category
                name="${blockTranslate(category.messageId)}"
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
                        text="${blockTranslate(block.messageId)}"
                        callbackKey="${block.messageId}">
                    </button>`;
                    continue;
                }

                // Skip show if necessary
                if (Array.isArray(block.option?.filter)) {
                    // Hide from palette
                    if (block.option?.filter.length) continue;
                    if (!block.option?.filter.includes(
                        vm.editingTarget?.isStage ? FilterType.STAGE : FilterType.SPRITE
                    )) {
                        continue;
                    }
                }

                toolboxXML += `<block type="${block.opcode}" >`;
                const text = blockTranslate(block.messageId);
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

                        toolboxXML += `<value name="${xmlEscape(placeholder)}">`;
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
    globalThis.ClipCCExtension = context = {
        api: {
            addCategory (category) {
                categoryInfo[category.categoryId] = {
                    categoryId: category.categoryId,
                    messageId: category.messageId,
                    blocks: {},
                    color: category.color
                };
            },
            addBlock(block) {
                if (!(block.categoryId in categoryInfo)) {
                    throw new Error(`missing category "${block.categoryId}"`);
                }

                const category = categoryInfo[block.categoryId];
                category.blocks[block.opcode] = block;
                registerBlock(block);
                refreshToolbox();
            },
            addBlocks (blocks) {
                for (const block of blocks) {
                    context!.api.addBlock(block);
                }
            },
            addButton(button) {
                const toolboxWs = scratchBlocks?.getMainWorkspace().getFlyout().getWorkspace();
                toolboxWs.registerButtonCallback(button.messageId, button.callback);
            },

            removeCategory(categoryId) {
                console.warn('removeCategory() was stubbed in CCX V2');
            },
            removeBlock(opcode) {
                console.warn('removeBlock() was stubbed in CCX V2');
            },
            removeBlocks(opcodes) {
                console.warn('removeBlocks() was stubbed in CCX V2');
            },
            removeButton(buttonId) {
                console.warn('removeButton() was stubbed in CCX V2');
            },

            getSettings(id) {
                return 'stub';
            },

            registerGlobalFunction(name, func) {
                if (!hasWarned) {
                    hasWarned = true;
                    console.warn('globalFunction API has been deprecated since CCX V2, please manage global function by yourself.');
                }
                globalFunctions.set(name, func);
            },
            unregisterGlobalFunction(name) {
                globalFunctions.delete(name);
            },
            callGlobalFunction(name, ...args) {
                const func = globalFunctions.get(name);
                if (!func) throw `global function ${name} not found`;
                return func(...args);
            },

            getVmInstance () {
                return vm;
            },
            getBlockInstance () {
                return scratchBlocks;
            },
            getReduxStore () {
                return store;
            }
        },
        type: {
            BlockType,
            ParameterType,
            FilterType
        },
        Extension: class {}
    };
}

function attachScratchBlocks (blocks: ScratchBlocks) {
    scratchBlocks = blocks;
}

export {
    context as default,
    scratchBlocks,
    initCtx,
    attachScratchBlocks
};
