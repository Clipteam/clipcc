/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {InlineStatementInput} from './measurables/inline_statement_input';

/**
 * An object containing all sizing information needed to draw this block.
 * This measure pass does not propagate changes to the block (although fields
 * may choose to rerender when getSize() is called).  However, calling it
 * repeatedly may be expensive.
 */
export class RenderInfo extends Blockly.zelos.RenderInfo {
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
    // Add more space before and after inline statement.
    if (prev && next && (next.type & InlineStatementInput.TYPE)) {
      return this.constants_.LARGE_PADDING;
    }
    if (prev && (prev.type & InlineStatementInput.TYPE) && !next) {
      return this.constants_.LARGE_PADDING;
    }
    return super.getInRowSpacing_(prev, next);
  }
}
