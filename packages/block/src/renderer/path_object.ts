/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import * as Constants from '../constants';
/**
 * An object that handles creating and setting each of the SVG elements
 * used by the renderer.
 */
export class PathObject extends Blockly.zelos.PathObject {
  /**
   * Apply the stored colours to the block's path, taking into account whether
   * the paths belong to a shadow block.
   * @param block The source block.
   */
  override applyColour(block: Blockly.BlockSvg): void {
    super.applyColour(block);

    // The prototype is regular for interaction purposes but still renders
    // like a shadow block.
    if (block.type === Constants.PROCEDURES_PROTOTYPE_BLOCK_TYPE) {
      this.svgPath.setAttribute('fill', this.style.colourSecondary);
    }
  }
}
