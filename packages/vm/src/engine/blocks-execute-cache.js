/**
 * @fileoverview
 * Helpers shared between blocks.js and execute.js for caching execute
 * information.
 */

/**
 * @typedef {import('./blocks')} Blocks
 */

/**
 * Build an object containing the block information execute needs.
 * @param {Blocks} blocks Blocks containing the expected blockId
 * @param {string} blockId blockId for the desired execute cache
 * @returns {?object} Default cached block information
 * @private
 */
const createCachedBlockData = function (blocks, blockId) {
    const block = blocks.getBlock(blockId);
    if (typeof block === 'undefined') {
        return null;
    }

    return {
        id: blockId,
        opcode: blocks.getOpcode(block),
        fields: blocks.getFields(block),
        inputs: blocks.getInputs(block),
        mutation: blocks.getMutation(block)
    };
};

/**
 * A private method shared with execute to build an object containing the block
 * information execute needs and that is reset when other cached Blocks info is
 * reset.
 * @param {Blocks} blocks Blocks containing the expected blockId
 * @param {string} blockId blockId for the desired execute cache
 * @param {Function} [CacheType] constructor for cached block information
 * @returns {?object} execute cache object
 */
const getCached = function (blocks, blockId, CacheType) {
    const executeCache = blocks._cache.execute;

    let cached = executeCache.blocksById[blockId];
    if (typeof cached !== 'undefined') {
        return cached;
    }

    const cachedBlockData = createCachedBlockData(blocks, blockId);
    if (cachedBlockData === null) {
        return null;
    }

    cached = typeof CacheType === 'undefined' ?
        cachedBlockData :
        new CacheType(blocks, cachedBlockData);

    executeCache.blocksById[blockId] = cached;
    return cached;
};

module.exports = {
    getCached
};
