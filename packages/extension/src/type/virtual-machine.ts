import { ExtensionMetadata } from './scratch';

interface Target {
    id: string;
}

interface Runtime {
    _registerExtensionPrimitives: (extensionInfo: ExtensionMetadata) => void;
    _refreshExtensionPrimitives: (extensionInfo: ExtensionMetadata) => void;
    getEditingTarget: () => Target;
    getTargetForStage: () => Target;
    makeMessageContextForTarget: (target: Target) => void;
    _blockInfo: unknown[];
}

export interface VM {
    runtime: Runtime;
}
