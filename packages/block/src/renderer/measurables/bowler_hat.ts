/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ConstantProvider} from '../constants';

/**
 * An object containing information about the space a hat takes up during
 * rendering.
 */
export class BowlerHat extends Blockly.blockRendering.Hat {
  /**
   * @param constants The rendering constants provider.
   */
  constructor(constants: Blockly.blockRendering.ConstantProvider) {
    super(constants);

    this.width = 0; // updated by RenderInfo.computeBounds_
    this.height = (constants as ConstantProvider).BOWLER_HAT_HEIGHT;
    this.ascenderHeight = this.height;
  }
}
