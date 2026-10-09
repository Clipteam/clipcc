/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {BowlerHat} from './measurables/bowler_hat';
import {InlineStatementInput} from './measurables/inline_statement_input';
import type {RenderInfo} from './render_info';

/**
 * An object that draws a block based on the given rendering information.
 */
export class Drawer extends Blockly.zelos.Drawer {
  override drawInlineInput_(input: Blockly.blockRendering.InlineInput): void {
    if (input instanceof InlineStatementInput) {
      this.drawInlineStatementInput_(input);
      return;
    }

    super.drawInlineInput_(input);
  }

  /**
   * Draw an inline statement input without using Zelos' dynamic value shape
   * path. Statement connections retain their notch shape for highlighting.
   * @param input The inline statement input to draw.
   */
  protected drawInlineStatementInput_(input: InlineStatementInput): void {
    this.positionInlineInputConnection_(input);

    if (input.connectedBlock || this.info_.isInsertionMarker) {
      return;
    }

    const yPos = input.centerline - input.height / 2;
    const connectionRight = input.xPos + input.connectionWidth;
    const width = Math.max(0, input.width - input.connectionWidth * 2);
    const path =
      Blockly.utils.svgPaths.moveTo(connectionRight, yPos) +
      Blockly.utils.svgPaths.lineOnAxis('h', width) +
      Blockly.utils.svgPaths.lineOnAxis('v', input.height) +
      Blockly.utils.svgPaths.lineOnAxis('h', -width) +
      'z';

    (this.block_.pathObject as Blockly.zelos.PathObject).setOutlinePath(input.input.name, path);
  }

  protected override drawInternals_(): void {
    super.drawInternals_();

    // Set block offset for hidden icons.
    // All icons are placed in the first row after top row.
    //   <TopRow> (<SpacerRow> <InputRow>) ... <SpacerRow> <BottomRow>
    const row = this.info_.rows[2];
    const xPos = this.info_.RTL ? row.xPos : row.xPos;
    const yPos = row.yPos + row.height / 2;
    for (const element of (this.info_ as RenderInfo).invisibleIcons) {
      element.icon.setOffsetInBlock(new Blockly.utils.Coordinate(xPos, yPos));
      if (this.info_.isInsertionMarker) {
        element.icon.hideForInsertionMarker();
      }
    }
  }

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
