import {
    BlockType,
    TargetType,
    ArgumentType,
    ReporterScope,
    StandardScratchExtensionClass as ExtensionClass
} from '../../types/scratch';
import { VirtualMachine } from '../../types/virtual-machine';
import { Cast } from '../../util';

export interface Ctx {
    ArgumentType: typeof ArgumentType
    BlockType: typeof BlockType
    TargetType: typeof TargetType
    ReporterScope: typeof ReporterScope
    Cast: Cast
    extensions: {
        register: (extensionObj: ExtensionClass) => void,
        unsandboxed: boolean
    }
    vm?: VirtualMachine
}

export function makeCtx (sandboxed = false) {
    const ctx: Ctx = {
        ArgumentType: ArgumentType,
        BlockType: BlockType,
        TargetType: TargetType,
        ReporterScope: ReporterScope,
        Cast: Cast,
        extensions: {
            register: () => {
                throw new Error('not implemented');
            },
            unsandboxed: !sandboxed
        }
    };
    if (!sandboxed) {
        ctx.vm = null as unknown as VirtualMachine;
    }
    return ctx;
}
