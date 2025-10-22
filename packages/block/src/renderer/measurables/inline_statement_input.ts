/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * An object containing information about the space an inline statement input
 * takes up during rendering.
 */
export class InlineStatementInput extends Blockly.blockRendering.InlineInput {
  static readonly TYPE = Blockly.blockRendering.Types.getType('InlineStatementInput');

  /**
   * @param constants The rendering constants provider.
   * @param input The statement input to measure and store information for.
   */
  constructor(constants: Blockly.blockRendering.ConstantProvider, input: Blockly.Input) {
    super(constants, input);

    this.type |= InlineStatementInput.TYPE;

    if (this.connectedBlock) {
      this.height = this.connectedBlockHeight;
      this.width = this.connectedBlockWidth;

      // Render as a statement, the connectionWidth to be used should be notchOffset.
      this.connectionWidth = this.notchOffset;

      this.centerline = 0;
    }
  }
}
