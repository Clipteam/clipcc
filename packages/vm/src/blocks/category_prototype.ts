import type Runtime from '../engine/runtime';
import type BlockUtility from '../engine/block-utility';
import type {HatMetadata, MonitorBlockInfo} from '../engine/runtime';

export type BlockFunction = (args: {
    [argName: string]: any;
    mutation?: Record<string, any>;
}, util: BlockUtility) => any;

export interface CategoryPrototype {
    new(runtime: Runtime): void;
    /**
     * Retrieve the block primitives implemented by this package.
     * @returns {Record<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives(): Record<string, BlockFunction>;
    getHats?(): Record<string, HatMetadata>;
    getMonitored?(): Record<string, MonitorBlockInfo>;
    getOrders?(): Record<string, (string | {execute: string})[]>;
}
