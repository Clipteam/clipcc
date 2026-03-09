/**
 * @license
 * Copyright 2018 Massachusetts Institute of Technology
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * These constants are copied from scratch-blocks/core/constants.js
 * @TODO find a way to require() these straight from scratch-blocks... maybe make a scratch-blocks/dist/constants.js?
 */
enum ScratchBlocksConstants {
    /** ENUM for output shape: hexagonal (booleans/predicates). */
    OUTPUT_SHAPE_HEXAGONAL = 1,

    /** ENUM for output shape: rounded (numbers). */
    OUTPUT_SHAPE_ROUND = 2,

    /** ENUM for output shape: squared (any/all values; strings). */
    OUTPUT_SHAPE_SQUARE = 3
};

export default ScratchBlocksConstants;
