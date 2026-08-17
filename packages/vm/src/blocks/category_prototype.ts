/* eslint-disable @typescript-eslint/no-explicit-any */
import type BlockUtility from '../engine/block-utility';
import type {HatMetadata, MonitorBlockInfo} from '../engine/runtime';
import type Runtime from '../engine/runtime';

export type BlockArgs = {
    [argName: string]: any;
    mutation?: Record<string, any>;
}

export type BlockFunction = (args: BlockArgs, util: BlockUtility) => any;

export interface CategoryPrototype {
    /**
     * Retrieve the block primitives implemented by this package.
     * @returns Mapping of opcode to Function.
     */
    getPrimitives(): Record<string, BlockFunction>;
    getHats?(): Record<string, HatMetadata>;
    getMonitored?(): Record<string, MonitorBlockInfo>;
    getOrders?(): Record<string, (string | {execute: string})[]>;
}

export type CategoryPrototypeConstructor = new (runtime: Runtime) => CategoryPrototype;
