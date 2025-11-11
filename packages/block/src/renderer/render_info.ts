/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import * as Constants from '../constants';
import {InlineStatementInput} from './measurables/inline_statement_input';
import {BowlerHat} from './measurables/bowler_hat';

/**
 * An object containing all sizing information needed to draw this block.
 * This measure pass does not propagate changes to the block (although fields
 * may choose to rerender when getSize() is called).  However, calling it
 * repeatedly may be expensive.
 */
export class RenderInfo extends Blockly.zelos.RenderInfo {
  /**
   * Create all non-spacer elements that belong on the top row.
   */
  protected override populateTopRow_(): void {
    if (this.block_.hat === Constants.SHAPE_BOWLER_HAT) {
      this.topRow.elements.push(new Blockly.blockRendering.SquareCorner(this.constants_));
      this.topRow.elements.push(new BowlerHat(this.constants_));
      return;
    }

    super.populateTopRow_();
  }

  /**
   * Figure out where the right edge of the block and right edge of statement
   * inputs should be placed.
   */
  protected override computeBounds_(): void {
    super.computeBounds_();

    if (this.block_.hat === Constants.SHAPE_BOWLER_HAT) {
      // Update the width of bowler hat.
      for (const element of this.topRow.elements) {
        if (Blockly.blockRendering.Types.isHat(element)) {
          element.width = this.width;
          this.topRow.measure();
          break;
        }
      }
    }
  }

  /**
   * Add an input element to the active row, if needed, and record the type of
   * the input on the row.
   * @param input The input to record information about.
   * @param activeRow The row that is currently being populated.
   */
  override addInput_(input: Blockly.Input, activeRow: Blockly.blockRendering.Row): void {
    // Render shadow statement inputs as inline.
    if (
      input instanceof Blockly.inputs.StatementInput &&
      input.connection && input.getShadowDom() !== null
    ) {
      activeRow.elements.push(new InlineStatementInput(this.constants_, input));
      return;
    }

    super.addInput_(input, activeRow);
  }

  /**
   * Calculate the width of a spacer element in a row based on the previous and
   * next elements in that row.  For instance, extra padding is added between
   * two editable fields.
   * @param prev The element before the spacer.
   * @param next The element after the spacer.
   * @returns The size of the spacing between the two elements.
   */
  override getInRowSpacing_(
    prev: Blockly.blockRendering.Measurable | null,
    next: Blockly.blockRendering.Measurable | null
  ): number {
    if (!prev && next &&
        Blockly.blockRendering.Types.isIcon(next) &&
        next.icon.getType() === Blockly.icons.IconType.COMMENT
    ) {
      return this.constants_.NO_PADDING;
    }

    // Add more space before and after inline statement.
    if (prev && next && (next.type & InlineStatementInput.TYPE)) {
      return this.constants_.LARGE_PADDING;
    }
    if (prev && (prev.type & InlineStatementInput.TYPE) && !next) {
      return this.constants_.LARGE_PADDING;
    }
    return super.getInRowSpacing_(prev, next);
  }

  /**
   * Omits the block comment icon from rendering process.
   * @returns An object containing the target row, comment icon, and its index.
   * @internal
   */
  private omitCommentIcon() {
    let targetRow: Blockly.blockRendering.Row | null = null;
    let commentIcon: Blockly.blockRendering.Icon | null = null;
    let commentIconIndex = -1;
    for (const row of this.rows) {
      let findFlag = false;
      for (const elem of row.elements) {
        // Remove block comment icons from alignment, then we restore it.
        if (
          Blockly.blockRendering.Types.isIcon(elem) &&
          elem.icon?.getType() === Blockly.icons.IconType.COMMENT
        ) {
          targetRow = row;
          commentIcon = elem;
          commentIconIndex = row.elements.indexOf(elem);
          row.elements.splice(commentIconIndex, 1);
          findFlag = true;
          break;
        }
      }
      if (findFlag) break;
    }

    return {targetRow, commentIcon, commentIconIndex};
  }

  /**
   * Add horizontal spacing between and around elements within each row.
   * @internal
   */
  protected override addElemSpacing_() {
    const {targetRow, commentIcon, commentIconIndex} = this.omitCommentIcon();
    super.addElemSpacing_();
    if (commentIcon) {
      targetRow!.elements.splice(commentIconIndex, 0, commentIcon);
    }
  }

  /**
   * Finalize horizontal alignment of elements on the block.
   *
   * In particular, reduce the implicit spacing created by the left and
   * right output connection shapes by adding setting negative spacing onto the
   * leftmost and rightmost spacers.
   * @internal
   */
  protected override finalizeHorizontalAlignment_() {
    const {targetRow, commentIcon, commentIconIndex} = this.omitCommentIcon();
    super.finalizeHorizontalAlignment_();
    if (commentIcon) {
      targetRow!.elements.splice(commentIconIndex, 0, commentIcon);
    }
  }
}
