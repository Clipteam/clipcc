/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {BowlerHat} from './measurables/bowler_hat';

/**
 * An object that draws a block based on the given rendering information.
 */
export class Drawer extends Blockly.zelos.Drawer {
  /**
   * Add steps for the top corner of the block, taking into account
   * details such as hats and rounded corners.
   */
  protected override drawTop_(): void {
    const topRow = this.info_.topRow;
    const elements = topRow.elements;

    this.positionPreviousConnection_();
    this.outlinePath_ += Blockly.utils.svgPaths.moveBy(topRow.xPos, this.info_.startY);
    for (let i = 0, elem; (elem = elements[i]); i++) {
      if (Blockly.blockRendering.Types.isLeftRoundedCorner(elem)) {
        this.outlinePath_ += this.constants_.OUTSIDE_CORNERS.topLeft;
      } else if (Blockly.blockRendering.Types.isRightRoundedCorner(elem)) {
        this.outlinePath_ += this.constants_.OUTSIDE_CORNERS.topRight;
      } else if (Blockly.blockRendering.Types.isPreviousConnection(elem)) {
        this.outlinePath_ += (elem.shape as Blockly.blockRendering.Notch).pathLeft;
      } else if (Blockly.blockRendering.Types.isHat(elem)) {
        if (elem instanceof BowlerHat) {
          this.outlinePath_ += `a20,20 0 0,1 20,-20 l ${this.info_.width - 40} 0 a20,20 0 0,1 20,20`;
        } else {
          this.outlinePath_ += this.constants_.START_HAT.path;
        }
      } else if (Blockly.blockRendering.Types.isSpacer(elem)) {
        this.outlinePath_ += Blockly.utils.svgPaths.lineOnAxis('h', elem.width);
      }
      // No branch for a square corner, because it's a no-op.
    }
    this.outlinePath_ += Blockly.utils.svgPaths.lineOnAxis(
      'v',
      topRow.height - topRow.ascenderHeight
    );
  }
}
