import { ExtensionMetadata } from './scratch';

interface Target {
    id: string;
}

export interface Runtime {
    _registerExtensionPrimitives: (extensionInfo: ExtensionMetadata) => void;
    _refreshExtensionPrimitives: (extensionInfo: ExtensionMetadata) => void;
    getEditingTarget: () => Target;
    getTargetForStage: () => Target;
    makeMessageContextForTarget: (target: Target) => void;
    _blockInfo: unknown[];
    _hats: Record<string, unknown>;
    _primitives: Record<string, (args: Record<string, unknown>) => unknown>;
}

export interface VirtualMachine {
    runtime: Runtime;
    renderer?: {
        canvas: HTMLCanvasElement
    }
}
