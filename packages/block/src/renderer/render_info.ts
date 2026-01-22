/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import * as Constants from '../constants';
import {InlineStatementInput} from './measurables/inline_statement_input';
import {BowlerHat} from './measurables/bowler_hat';
import {isInvisibleIcon} from '../interfaces/i_invisible_icon';
import {isShadowTemplate} from '../interfaces/i_shadow_template';
import {isScratchExtensionBlock} from '../interfaces/i_scratch_extension';

/**
 * An object containing all sizing information needed to draw this block.
 * This measure pass does not propagate changes to the block (although fields
 * may choose to rerender when getSize() is called).  However, calling it
 * repeatedly may be expensive.
 */
export class RenderInfo extends Blockly.zelos.RenderInfo {
  /** Invisible icons that need block offset for rendering. */
  invisibleIcons: Blockly.blockRendering.Icon[] = [];

  /**
   * Create rows of Measurable objects representing all renderable parts of the
   * block.
   */
  protected override createRows_(): void {
    super.createRows_();

    // Remove comment icons.
    for (const row of this.rows) {
      for (let i = 0; i < row.elements.length; ++i) {
        const element = row.elements[i];
        if (
          Blockly.blockRendering.Types.isIcon(element) &&
          isInvisibleIcon(element.icon) && element.icon.invisible
        ) {
          row.elements.splice(i, 1);
          this.invisibleIcons.push(element);
        }
      }
    }
  }

  /**
   * Create all non-spacer elements that belong on the top row.
   */
  protected override populateTopRow_(): void {
    if (this.isBowlerHat()) {
      this.topRow.elements.push(new Blockly.blockRendering.SquareCorner(this.constants_));
      this.topRow.elements.push(new BowlerHat(this.constants_));
      return;
    }

    super.populateTopRow_();
  }

  /**
   * Create all non-spacer elements that belong on the bottom row.
   */
  override populateBottomRow_() {
    super.populateBottomRow_();
    if (this.isBowlerHat()) {
      this.bottomRow.minHeight = this.constants_.MEDIUM_PADDING;
    }
  }

  /**
   * Figure out where the right edge of the block and right edge of statement
   * inputs should be placed.
   */
  protected override computeBounds_(): void {
    super.computeBounds_();

    if (this.isBowlerHat()) {
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

    // Modify minimal height of inputs that should be rendered like non-shadow blocks, including
    // shadow templates and inline shadow statement.
    if (input instanceof Blockly.inputs.DummyInput || input instanceof Blockly.inputs.EndRowInput) {
      const sourceBlock = input.getSourceBlock();
      if (
        (isShadowTemplate(sourceBlock) && sourceBlock.shadowTemplate) ||
        (sourceBlock.isShadow() && sourceBlock.previousConnection)
      ) {
        // Dummy and end-row inputs have no visual representation, but the
        // information is still important.
        activeRow.minHeight = Math.max(
          activeRow.minHeight,
          this.constants_.DUMMY_INPUT_MIN_HEIGHT
        );
      }

      if (isScratchExtensionBlock(sourceBlock) && sourceBlock.isScratchExtension) {
        if (sourceBlock.outputConnection) {
          // If this is an extension reporter block, make it taller.
          activeRow.minHeight = Math.max(
            activeRow.minHeight,
            this.constants_.DUMMY_INPUT_MIN_HEIGHT
          );
        } else if (sourceBlock.previousConnection) {
          // If this is an extension block, and it has a previous connection,
          // make it taller.
          activeRow.minHeight = Math.max(
            activeRow.minHeight,
            this.constants_.DUMMY_INPUT_MIN_HEIGHT + this.constants_.GRID_UNIT * 2
          );
        }
      }
    }
  }

  /**
   * Calculate the height of a spacer row.
   * @param prev The row before the spacer.
   * @param next The row after the spacer.
   * @returns The desired height of the spacer row between these two rows.
   */
  override getSpacerRowHeight_(
    prev: Blockly.blockRendering.Row,
    next: Blockly.blockRendering.Row
  ): number {
    // Bowler hats do not need extra padding at the top.
    if (this.isBowlerHat() && prev === this.topRow) {
      return 0;
    }

    return super.getSpacerRowHeight_(prev, next);
  }

  /**
   * Finalize vertical alignment of rows on a block.  In particular, reduce the
   * implicit spacing when a non-shadow block is connected to any of an input
   * row's inline inputs.
   * This function is overridden to prevent applying tight-nesting to shadow
   * templates.
   */
  protected override finalizeVerticalAlignment_(): void {
    if (this.outputConnection) {
      return;
    }
    // Run through every input row on the block and only apply tight nesting
    // logic to input rows that have a prev and next notch.
    for (let i = 2; i < this.rows.length - 1; i += 2) {
      const prevSpacer = this.rows[i - 1] as Blockly.blockRendering.SpacerRow;
      const row = this.rows[i];
      const nextSpacer = this.rows[i + 1] as Blockly.blockRendering.SpacerRow;

      const firstRow = i === 2;
      const hasPrevNotch = firstRow ?
        !!this.topRow.hasPreviousConnection :
        !!prevSpacer.followsStatement;
      const hasNextNotch = i + 2 >= this.rows.length - 1 ?
        !!this.bottomRow.hasNextConnection :
        !!nextSpacer.precedesStatement;

      if (hasPrevNotch) {
        const elem = row.elements[1];
        const hasSingleTextOrImageField = (
          row.elements.length === 3 &&
          elem instanceof Blockly.blockRendering.Field &&
          (elem.field instanceof Blockly.FieldLabel || elem.field instanceof Blockly.FieldImage)
        );
        if (!firstRow && hasSingleTextOrImageField) {
          // Remove some padding if we have a single image or text field.
          prevSpacer.height -= this.constants_.SMALL_PADDING;
          nextSpacer.height -= this.constants_.SMALL_PADDING;
          row.height -= this.constants_.MEDIUM_PADDING;
        } else if (!firstRow && !hasNextNotch) {
          // Add a small padding so the notch doesn't clash with inputs/fields.
          prevSpacer.height += this.constants_.SMALL_PADDING;
        } else if (hasNextNotch) {
          // Determine if the input row has non-shadow connected blocks or shadow templates.
          let shouldTightNesting = false;
          const minVerticalTightNestingHeight = 40;
          for (let j = 0; j < row.elements.length; j++) {
            const elem = row.elements[j];
            if (
              Blockly.blockRendering.Types.isInlineInput(elem) &&
              elem.connectedBlock &&
              this.shouldTightNesting(elem.connectedBlock) &&
              elem.connectedBlock.getHeightWidth().height >= minVerticalTightNestingHeight
            ) {
              shouldTightNesting = true;
              break;
            }
          }
          // Apply tight-nesting.
          if (shouldTightNesting) {
            prevSpacer.height -= this.constants_.SMALL_PADDING;
            nextSpacer.height -= this.constants_.SMALL_PADDING;
          }
        }
      }
    }
  }

  /**
   * Calculate the centerline of an element in a row.
   * @param row The row that the element is in.
   * @param elem The element to calculate the centerline of.
   * @returns The centerline of the element.
   */
  override getElemCenterline_(
    row: Blockly.blockRendering.Row,
    elem: Blockly.blockRendering.Measurable
  ): number {
    let centerline = super.getElemCenterline_(row, elem);
    if (
      isScratchExtensionBlock(this.block_) &&
      this.block_.isScratchExtension &&
      this.block_.previousConnection
    ) {
      if (
        Blockly.blockRendering.Types.isField(elem) &&
        elem instanceof Blockly.blockRendering.Field &&
        elem.field instanceof Blockly.FieldImage
      ) {
        const firstInput = this.block_.inputList[0];
        if (
          firstInput &&
          firstInput.fieldRow.length > 0 &&
          firstInput.fieldRow[0] === elem.field
        ) {
          centerline += this.constants_.GRID_UNIT;
        }
      }
    }
    return centerline;
  }

  protected isBowlerHat(): boolean {
    return this.block_?.hat === Constants.SHAPE_BOWLER_HAT;
  }

  /**
   * Check whether tight-nesting should be applied to parent block. It should be
   * applied when the block has non-shadow connected blocks or shadow templates.
   * @param connectedBlock The connected block to check.
   * @returns True if parent block should apply tight-nesting.
   */
  protected shouldTightNesting(connectedBlock: Blockly.BlockSvg) {
    return !connectedBlock.isShadow() || (isShadowTemplate(connectedBlock) && connectedBlock.shadowTemplate);
  }
}
