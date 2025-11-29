/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * An object that provides constants for rendering blocks in Scratch mode.
 */
export class ConstantProvider extends Blockly.zelos.ConstantProvider {
  /** Height of the top hat. */
  BOWLER_HAT_HEIGHT = 20;

  /**
   * Get an object with connection shape and sizing information based on the
   * type of the connection.
   * @param connection The connection to find a shape object for
   * @returns The shape object for the connection.
   */
  override shapeFor(connection: Blockly.RenderedConnection) {
    let checks = connection.getCheck();
    if (!checks && connection.targetConnection) {
      checks = connection.targetConnection.getCheck();
    }
    switch (connection.type) {
      case Blockly.ConnectionType.INPUT_VALUE:
      case Blockly.ConnectionType.OUTPUT_VALUE:
        if (checks && checks.includes('Boolean')) {
          return this.HEXAGONAL!;
        }
        if (checks && checks.includes('Number')) {
          return this.ROUNDED!;
        }
        if (checks && checks.includes('String')) {
          return this.ROUNDED!;
        }
        return this.ROUNDED!;
      case Blockly.ConnectionType.PREVIOUS_STATEMENT:
      case Blockly.ConnectionType.NEXT_STATEMENT:
        return this.NOTCH!;
      default:
        throw Error('Unknown type');
    }
  }

  override getCSS_(selector: string): string[] {
    const css = super.getCSS_(selector);
    const flyoutButtonStyle: string[] = [
      `${selector} .blocklyFlyoutButton {`,
      `fill: none;`,
      `pointer-events: all;`,
      `}`,
      ``,
      `${selector} .blocklyFlyoutButtonBackground {`,
      `stroke: #c6c6c6;`,
      `}`,
      ``,
      `${selector} .blocklyFlyoutButtonShadow {`,
      `fill: transparent;`,
      `}`,
      ``,
      `${selector} .blocklyFlyoutButton:hover {`,
      `fill: white;`,
      `cursor: pointer;`,
      `}`,
      ``,
      `${selector} .blocklyFlyoutButton .blocklyText {`,
      `fill: #575E75;`,
      `font-weight: 500;`,
      `}`,
      ``,
      `${selector} .blocklyCommentText.blocklyText {`,
      `font-weight: 400;`,
      `color: #575e75;`, // @TODO: Use CSS variable. (same as --clipcc-text-primary)
      `}`
    ];
    return css.concat(flyoutButtonStyle);
  }

  override setFontConstants_(theme: Blockly.Theme) {
    super.setFontConstants_(theme);
    this.FIELD_DROPDOWN_BORDER_RECT_HEIGHT = 8 * this.GRID_UNIT;
  }
}
