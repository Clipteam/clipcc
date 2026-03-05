/**
 * @license
 * Copyright 2018 Massachusetts Institute of Technology
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Default types of Target supported by the VM.
 */
enum TargetType {
    /**
     * Rendered target which can move, change costumes, etc.
     */
    SPRITE = 'sprite',

    /**
     * Rendered target which cannot move but can change backdrops.
     */
    STAGE = 'stage'
}

export default TargetType;
