import {
    BlockType,
    TargetType,
    ArgumentType,
    ReporterScope,
    StandardScratchExtensionClass as ExtensionClass
} from '../../type/scratch';
import { VM } from '../../type/virtual-machine';

export interface Ctx {
    ArgumentType: typeof ArgumentType,
    BlockType: typeof BlockType,
    TargetType: typeof TargetType,
    ReporterScope: typeof ReporterScope,
    extensions: {
        register: (extensionObj: ExtensionClass) => void,
        sandboxed: boolean
    },
    vm?: VM;
}

export function makeCtx (sandboxed = false) {
    const ctx: Ctx = {
        ArgumentType: ArgumentType,
        BlockType: BlockType,
        TargetType: TargetType,
        ReporterScope: ReporterScope,
        extensions: {
            register: () => {
                throw new Error('not implemented');
            },
            sandboxed: sandboxed
        }
    };
    if (!sandboxed) {
        ctx.vm = null as unknown as VM;
    }
    return ctx;
}
