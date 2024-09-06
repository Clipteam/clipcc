import { CCX } from "./types/ccx";
import { ParameterType, BlockType, FilterType } from './types/enum';
import type VirtualMachine from 'clipcc-vm';
import { ScratchBlocksConstants } from "./util/scratch-blocks-constants";

let context: CCX.Context | undefined;

declare global {
    var ClipCCExtension: CCX.Context | undefined;
}

type XMLSetter = (xml: string) => void;
type ScratchBlocks = any;

let scratchBlocks: ScratchBlocks | undefined;

type ShadowType = {
    type: string;
    fieldName: string;
};

type ParameterTypeInfo = {
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
    value: string;
}

function initCtx (vm: VirtualMachine, setXML: XMLSetter) {
    let hasWarned = false;
    const globalFunctions = new Map<string, (...args: unknown[]) => unknown>();

    function generateToolboxXML () {
        
    }
    globalThis.ClipCCExtension = context = {
        api: {
            addCategory (category) {},
            addBlock(block) {},
            addBlocks(blocks) {},
            addButton(button) {},

            removeCategory(categoryId) {},
            removeBlock(opcode) {},
            removeBlocks(opcodes) {},
            removeButton(buttonId) {},

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
            getBlockInstance() {}
        },
        type: {
            BlockType,
            ParameterType,
            FilterType
        }
    };
}

function attachScratchBlocks (blocks: ScratchBlocks) {
    scratchBlocks = blocks;
}

export {
    context as default,
    initCtx,
    attachScratchBlocks
};
