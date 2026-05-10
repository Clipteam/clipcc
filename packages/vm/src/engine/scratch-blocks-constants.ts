/**
 * These constants are copied from scratch-blocks/core/constants.js
 * @readonly
 * @enum {int}
 */
const ScratchBlocksConstants = {
    /**
     * ENUM for output shape: hexagonal (booleans/predicates).
     * @constant
     */
    OUTPUT_SHAPE_HEXAGONAL: 1,

    /**
     * ENUM for output shape: rounded (numbers).
     * @constant
     */
    OUTPUT_SHAPE_ROUND: 2,

    /**
     * ENUM for output shape: squared (any/all values; strings).
     * @constant
     */
    OUTPUT_SHAPE_SQUARE: 3
} as const;

export default ScratchBlocksConstants;

export const {
    OUTPUT_SHAPE_HEXAGONAL,
    OUTPUT_SHAPE_ROUND,
    OUTPUT_SHAPE_SQUARE
} = ScratchBlocksConstants;
