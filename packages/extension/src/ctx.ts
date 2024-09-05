import { CCX } from "./types/ccx";
import { ParameterType, BlockType, FilterType } from './types/enum';
import type VirtualMachine from 'clipcc-vm';

let context: CCX.Context | undefined;

declare global {
    var ClipCCExtension: CCX.Context | undefined;
}

function initCtx (vm: VirtualMachine) {
    globalThis.ClipCCExtension = context = {
        api: {
            addCategory(category) {},
            addBlock(block) {},
            addBlocks(blocks) {},
            addButton(button) {},

            removeCategory(categoryId) {},
            removeBlock(opcode: string) {},
            removeBlocks(opcodes: string[]) {},
            removeButton(buttonId: string) {},

            getSettings(id) {
                return 'stub';
            },

            registerGlobalFunction(name, func) {},
            unregisterGlobalFunction(name: string) {},
            callGlobalFunction(name, ...args) {},

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

export {
    context as default,
    initCtx
};
