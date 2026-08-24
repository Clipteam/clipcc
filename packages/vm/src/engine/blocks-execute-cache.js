/**
 * @fileoverview
 * Helpers shared between blocks.js and execute.js for caching execute
 * information.
 */

/**
 * @typedef {import('./blocks')} Blocks
 * @typedef {new (blocks: Blocks, cached: object) => object} CacheType
 */

/**
 * A private method shared with execute to build an object containing the block
 * information execute needs and that is reset when other cached Blocks info is
 * reset.
 * @param {Blocks} blocks Blocks containing the expected blockId
 * @param {string} blockId blockId for the desired execute cache
 * @param {CacheType} [CacheType] constructor for cached block information
 * @returns {?object} execute cache object
 */
const getCached = function (blocks, blockId, CacheType) {
    const executeCache = blocks._cache._executeCached;

    let cached = executeCache[blockId];
    if (typeof cached !== 'undefined') {
        return cached;
    }

    const block = blocks.getBlock(blockId);
    if (typeof block === 'undefined') {
        return null;
    }

    const cachedBlockData = {
        id: blockId,
        opcode: blocks.getOpcode(block),
        fields: blocks.getFields(block),
        inputs: blocks.getInputs(block),
        mutation: blocks.getMutation(block)
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
