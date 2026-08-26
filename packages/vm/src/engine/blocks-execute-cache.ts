/**
 * @fileoverview
 * Helpers shared between blocks.js and execute.js for caching execute
 * information.
 */

import type Blocks from './blocks';
import type {VMInput, VMField, VMMutation} from '../serialization/schema';

interface CachedBlockData {
    id: string;
    opcode: string;
    fields: Record<string, VMField>;
    inputs: Record<string, VMInput>;
    mutation?: VMMutation;
}

type CacheType = new (blocks: Blocks, cached: CachedBlockData) => object;

/**
 * A private method shared with execute to build an object containing the block
 * information execute needs and that is reset when other cached Blocks info is
 * reset.
 * @param blocks Blocks containing the expected blockId
 * @param blockId blockId for the desired execute cache
 * @param CacheType constructor for cached block information
 * @returns execute cache object
 */
const getCached = function (blocks: Blocks, blockId: string, CacheType?: CacheType): object | null {
    const executeCache = blocks._cache._executeCached as Record<string, object>;

    let cached = executeCache[blockId];
    if (typeof cached !== 'undefined') {
        return cached;
    }

    const block = blocks.getBlock(blockId);
    if (typeof block === 'undefined') {
        return null;
    }

    const cachedBlockData: CachedBlockData = {
        id: blockId,
        opcode: blocks.getOpcode(block)!,
        fields: blocks.getFields(block)!,
        inputs: blocks.getInputs(block),
        mutation: blocks.getMutation(block)!
    };

    cached = typeof CacheType === 'undefined' ?
        cachedBlockData :
        new CacheType(blocks, cachedBlockData);

    executeCache[blockId] = cached;
    return cached;
};

export {
    getCached
};
