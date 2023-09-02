/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Methods for graphically rendering a block as SVG.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.BlockSvg.render');

goog.require('Blockly.BlockSvg');
goog.require('Blockly.renderer.constants');
goog.require('Blockly.scratchBlocksUtils');
goog.require('Blockly.utils');


/**
 * Change the colour of a block.
 */
Blockly.BlockSvg.prototype.updateColour = function() {
  let strokeColour = this.getColourTertiary();
  const renderShadowed = this.isShadow() &&
      !Blockly.scratchBlocksUtils.isShadowArgumentReporter(this);

  if (renderShadowed && this.parentBlock_) {
    // Pull shadow block stroke colour from parent block's tertiary if possible.
    strokeColour = this.parentBlock_.getColourTertiary();
    // Special case: if we contain a colour field, set to a special stroke colour.
    if (this.inputList[0] &&
        this.inputList[0].fieldRow[0] &&
        (this.inputList[0].fieldRow[0] instanceof Blockly.FieldColour ||
        this.inputList[0].fieldRow[0] instanceof Blockly.FieldColourSlider)) {
      strokeColour = Blockly.Colours.colourPickerStroke;
    }
  }

  // Render block stroke
  this.svgPath_.setAttribute('stroke', strokeColour);

  // Render block fill
  let fillColour;
  if (this.isGlowingBlock_ || renderShadowed) {
    // Use the block's shadow colour if possible.
    if (this.getShadowColour()) {
      fillColour = this.getShadowColour();
    } else {
      fillColour = this.getColourSecondary();
    }
  } else {
    fillColour = this.getColour();
  }
  this.svgPath_.setAttribute('fill', fillColour);

  // Render opacity
  this.svgPath_.setAttribute('fill-opacity', this.getOpacity());

  // Update colours of input shapes.
  for (let i = 0, input; input = this.inputList[i]; i++) {
    if (input.outlinePath) {
      input.outlinePath.setAttribute('fill', this.getColourTertiary());
    }
  }

  // Render icon(s) if applicable
  const icons = this.getIcons();
  for (let i = 0; i < icons.length; i++) {
    icons[i].updateColour();
  }

  // Bump every dropdown to change its colour.
  for (let x = 0, input; input = this.inputList[x]; x++) {
    for (let y = 0, field; field = input.fieldRow[y]; y++) {
      field.setText(null);
    }
  }
};

/**
 * Visual effect to show that if the dragging block is dropped, this block will
 * be replaced.  If a shadow block it will disappear.  Otherwise it will bump.
 * @param {boolean} add True if highlighting should be added.
 */
Blockly.BlockSvg.prototype.highlightForReplacement = function(add) {
  if (add) {
    const replacementGlowFilterId = this.workspace.options.replacementGlowFilterId
      || 'blocklyReplacementGlowFilter';
    this.svgPath_.setAttribute('filter', 'url(#' + replacementGlowFilterId + ')');
    Blockly.utils.addClass(/** @type {!Element} */ (this.svgGroup_),
        'blocklyReplaceable');
  } else {
    this.svgPath_.removeAttribute('filter');
    Blockly.utils.removeClass(/** @type {!Element} */ (this.svgGroup_),
        'blocklyReplaceable');
  }
};

/**
 * Visual effect to show that if the dragging block is dropped it will connect
 * to this input.
 * @param {Blockly.Connection} conn The connection on the input to highlight.
 * @param {boolean} add True if highlighting should be added.
 */
Blockly.BlockSvg.prototype.highlightShapeForInput = function(conn, add) {
  const input = this.getInputWithConnection(conn);
  if (!input) {
    throw 'No input found for the connection';
  }
  if (!input.outlinePath) {
    return;
  }
  if (add) {
    const replacementGlowFilterId = this.workspace.options.replacementGlowFilterId
      || 'blocklyReplacementGlowFilter';
    input.outlinePath.setAttribute('filter',
        'url(#' + replacementGlowFilterId + ')');
    Blockly.utils.addClass(/** @type {!Element} */ (this.svgGroup_),
        'blocklyReplaceable');
  } else {
    input.outlinePath.removeAttribute('filter');
    Blockly.utils.removeClass(/** @type {!Element} */ (this.svgGroup_),
        'blocklyReplaceable');
  }
};

/**
 * Returns a bounding box describing the dimensions of this block
 * and any blocks stacked below it.
 * @return {!{height: number, width: number}} Object with height and width properties.
 */
Blockly.BlockSvg.prototype.getHeightWidth = function() {
  let height = this.height;
  let width = this.width;
  // Recursively add size of subsequent blocks.
  const nextBlock = this.getNextBlock();
  if (nextBlock) {
    const nextHeightWidth = nextBlock.getHeightWidth();
    height += nextHeightWidth.height;
    height -= Blockly.renderer.constants.NOTCH_HEIGHT; // Exclude height of connected notch.
    width = Math.max(width, nextHeightWidth.width);
  }
  return {height: height, width: width};
};

/**
 * Render the block.
 * Lays out and reflows a block based on its contents and settings.
 * @param {boolean=} opt_bubble If false, just render this block.
 *   If true, also render block's parent, grandparent, etc.  Defaults to true.
 */
Blockly.BlockSvg.prototype.render = function(opt_bubble) {
  Blockly.Field.startCache();
  this.rendered = true;

  let cursorX = Blockly.renderer.constants.SEP_SPACE_X;
  if (this.RTL) {
    cursorX = -cursorX;
  }
  // Move the icons into position.
  const icons = this.getIcons();
  let scratchCommentIcon = null;
  for (let i = 0; i < icons.length; i++) {
    if (icons[i] instanceof Blockly.ScratchBlockComment) {
      // Don't render scratch block comment icon until
      // after the inputs
      scratchCommentIcon = icons[i];
    } else {
      cursorX = icons[i].renderIcon(cursorX);
    }
  }
  cursorX += this.RTL ?
      Blockly.renderer.constants.SEP_SPACE_X : -Blockly.renderer.constants.SEP_SPACE_X;
  // If there are no icons, cursorX will be 0, otherwise it will be the
  // width that the first label needs to move over by.

  // If this is an extension reporter block, add a horizontal offset.
  if (this.isScratchExtension && this.outputConnection) {
    cursorX += this.RTL ?
      -Blockly.renderer.constants.GRID_UNIT : Blockly.renderer.constants.GRID_UNIT;
  }

  const inputRows = this.renderCompute_(cursorX);
  this.renderDraw_(cursorX, inputRows);
  this.renderMoveConnections_();

  this.renderClassify_();

  // Position the Scratch Block Comment Icon at the end of the block
  if (scratchCommentIcon) {
    const iconX = this.RTL ? -inputRows.rightEdge : inputRows.rightEdge;
    const inputMarginY = inputRows[0].height / 2;
    scratchCommentIcon.renderIcon(iconX, inputMarginY);
  }

  if (opt_bubble !== false) {
    // Render all blocks above this one (propagate a reflow).
    const parentBlock = this.getParent();
    if (parentBlock) {
      parentBlock.render(true);
    } else {
      // Top-most block.  Fire an event to allow scrollbars to resize.
      Blockly.common.resizeSvgContents(this.workspace);
    }
  }
  Blockly.Field.stopCache();
  this.updateObserve();
};

/**
 * Render a list of fields starting at the specified location.
 * @param {!Array.<!Blockly.Field>} fieldList List of fields.
 * @param {number} cursorX X-coordinate to start the fields.
 * @param {number} cursorY Y-coordinate around which fields are centered.
 * @return {number} X-coordinate of the end of the field row (plus a gap).
 * @private
 */
Blockly.BlockSvg.prototype.renderFields_ = function(fieldList, cursorX,
    cursorY) {
  if (this.RTL) {
    cursorX = -cursorX;
  }
  for (let t = 0, field; field = fieldList[t]; t++) {
    const root = field.getSvgRoot();
    if (!root) {
      continue;
    }
    // In blocks with a notch, fields should be bumped to a min X,
    // to avoid overlapping with the notch. Label and image fields are
    // excluded.
    if (this.previousConnection && !(field instanceof Blockly.FieldLabel) &&
        !(field instanceof Blockly.FieldImage)) {
      cursorX = this.RTL ?
        Math.min(cursorX, -Blockly.renderer.constants.INPUT_AND_FIELD_MIN_X) :
        Math.max(cursorX, Blockly.renderer.constants.INPUT_AND_FIELD_MIN_X);
    }
    // Offset the field upward by half its height.
    // This vertically centers the fields around cursorY.
    let yOffset = -field.getSize().height / 2;

    // If this is an extension block, and this field is the first field, and
    // it is an image field, and this block has a previous connection, bump
    // the image down by one grid unit to align it vertically.
    if (this.isScratchExtension && (field === this.inputList[0].fieldRow[0])
        && (field instanceof Blockly.FieldImage) && this.previousConnection) {
      yOffset += Blockly.renderer.constants.GRID_UNIT;
    }

    // If this is an extension hat block, adjust the height of the vertical
    // separator without adjusting the field height. The effect is to move
    // the bottom end of the line up one grid unit.
    if (this.isScratchExtension &&
        !this.previousConnection && this.nextConnection &&
        field instanceof Blockly.FieldVerticalSeparator) {
      field.setLineHeight(Blockly.renderer.constants.ICON_SEPARATOR_HEIGHT -
          Blockly.renderer.constants.GRID_UNIT);
    }

    let translateX, translateY;
    let scale = '';
    if (this.RTL) {
      cursorX -= field.renderSep + field.renderWidth;
      translateX = cursorX;
      translateY = cursorY + yOffset;
      if (field.renderWidth) {
        cursorX -= Blockly.renderer.constants.SEP_SPACE_X;
      }
    } else {
      translateX = cursorX + field.renderSep;
      translateY = cursorY + yOffset;
      if (field.renderWidth) {
        cursorX += field.renderSep + field.renderWidth +
            Blockly.renderer.constants.SEP_SPACE_X;
      }
    }
    if (this.RTL &&
        field instanceof Blockly.FieldImage &&
        field.getFlipRTL()) {
      scale = 'scale(-1 1)';
      translateX += field.renderWidth;
    }
    root.setAttribute('transform',
        'translate(' + translateX + ', ' + translateY + ') ' + scale);

    // Fields are invisible on insertion marker.
    if (this.isInsertionMarker()) {
      root.setAttribute('display', 'none');
    }
  }
  return this.RTL ? -cursorX : cursorX;
};

/**
 * Computes the height and widths for each row and field.
 * @param {number} iconWidth Offset of first row due to icons.
 * @return {!Array.<!Array.<!Object>>} 2D array of objects, each containing
 *     position information.
 * @private
 */
Blockly.BlockSvg.prototype.renderCompute_ = function(iconWidth) {
  const inputList = this.inputList;
  const inputRows = [];
  // Block will be drawn from 0 (left edge) to rightEdge, in px.
  inputRows.rightEdge = 0;
  // Drawn from 0 to bottomEdge vertically.
  inputRows.bottomEdge = 0;
  let fieldValueWidth = 0;  // Width of longest external value field.
  let fieldStatementWidth = 0;  // Width of longest statement field.
  let hasValue = false;
  let hasStatement = false;
  let hasDummy = false;
  let lastType = undefined;

  // Previously created row, for special-casing row heights on C- and E- shaped blocks.
  let previousRow;
  for (let i = 0, input; input = inputList[i]; i++) {
    if (!input.isVisible()) {
      continue;
    }
    const isSecondInputOnProcedure = this.type == 'procedures_definition' &&
        lastType && lastType == Blockly.constants.NEXT_STATEMENT;
    let row;
    // Don't create a new row for the second dummy input on a procedure block.
    // See github.com/LLK/scratch-blocks/issues/1658
    // In all other cases, statement and value inputs catch all preceding dummy
    // inputs, and cause a line break before following inputs.
    if (!isSecondInputOnProcedure &&
        (!lastType || lastType == Blockly.constants.NEXT_STATEMENT ||
        input.type == Blockly.constants.NEXT_STATEMENT)) {
      lastType = input.type;
      row = this.createRowForInput_(input);
      inputRows.push(row);
    } else {
      row = inputRows[inputRows.length - 1];
    }
    row.push(input);

    // Compute minimum dimensions for this input.
    input.renderHeight = this.computeInputHeight_(input, row, previousRow);
    input.renderWidth = this.computeInputWidth_(input);

    // If the input is a statement input, determine if a notch
    // should be drawn at the inner bottom of the C.
    row.statementNotchAtBottom = true;
    if (input.connection && input.connection.type === Blockly.constants.NEXT_STATEMENT) {
      const linkedBlock = input.connection.targetBlock();
      if (linkedBlock && !linkedBlock.lastConnectionInStack()) {
        row.statementNotchAtBottom = false;
      }
    }

    // Expand input size.
    if (input.connection) {
      const linkedBlock = input.connection.targetBlock();
      let paddedHeight = 0;
      let paddedWidth = 0;
      if (linkedBlock) {
        // A block is connected to the input - use its size.
        const bBox = linkedBlock.getHeightWidth();
        paddedHeight = bBox.height;
        paddedWidth = bBox.width;
      } else {
        // No block connected - use the size of the rendered empty input shape.
        paddedHeight = Blockly.renderer.constants.INPUT_SHAPE_HEIGHT;
      }
      if (input.connection.type === Blockly.constants.INPUT_VALUE) {
        paddedHeight += 2 * Blockly.renderer.constants.INLINE_PADDING_Y;
      }
      if (input.connection.type === Blockly.constants.NEXT_STATEMENT) {
        // Subtract height of notch, only if the last block in the stack has a next connection.
        if (row.statementNotchAtBottom) {
          paddedHeight -= Blockly.renderer.constants.NOTCH_HEIGHT;
        }
      }
      input.renderHeight = Math.max(input.renderHeight, paddedHeight);
      input.renderWidth = Math.max(input.renderWidth, paddedWidth);
    }
    row.height = Math.max(row.height, input.renderHeight);
    input.fieldWidth = 0;
    if (inputRows.length == 1) {
      // The first row gets shifted to accommodate any icons.
      input.fieldWidth += this.RTL ? -iconWidth : iconWidth;
    }
    let previousFieldEditable = false;
    for (let j = 0, field; field = input.fieldRow[j]; j++) {
      if (j != 0) {
        input.fieldWidth += Blockly.renderer.constants.SEP_SPACE_X;
      }
      // Get the dimensions of the field.
      const fieldSize = field.getSize();
      field.renderWidth = fieldSize.width;
      field.renderSep = (previousFieldEditable && field.EDITABLE) ?
          Blockly.renderer.constants.SEP_SPACE_X : 0;
      // See github.com/LLK/scratch-blocks/issues/1658
      if (!isSecondInputOnProcedure) {
        input.fieldWidth += field.renderWidth + field.renderSep;
      }
      row.height = Math.max(row.height, fieldSize.height);
      previousFieldEditable = field.EDITABLE;
    }

    if (row.type != Blockly.BlockSvg.INLINE) {
      if (row.type == Blockly.constants.NEXT_STATEMENT) {
        hasStatement = true;
        fieldStatementWidth = Math.max(fieldStatementWidth, input.fieldWidth);
      } else {
        if (row.type == Blockly.constants.INPUT_VALUE) {
          hasValue = true;
        } else if (row.type == Blockly.constants.DUMMY_INPUT) {
          hasDummy = true;
        }
        fieldValueWidth = Math.max(fieldValueWidth, input.fieldWidth);
      }
    }
    previousRow = row;
  }
  // Compute padding for output blocks.
  // Data is attached to the row.
  this.computeOutputPadding_(inputRows);
  // Compute the statement edge.
  // This is the width of a block where statements are nested.
  inputRows.statementEdge = Blockly.renderer.constants.STATEMENT_INPUT_EDGE_WIDTH +
      fieldStatementWidth;

  // Compute the preferred right edge.
  inputRows.rightEdge = this.computeRightEdge_(inputRows.rightEdge,
      hasStatement);

  // Bottom edge is sum of row heights
  for (let i = 0; i < inputRows.length; i++) {
    inputRows.bottomEdge += inputRows[i].height;
  }

  inputRows.hasValue = hasValue;
  inputRows.hasStatement = hasStatement;
  inputRows.hasDummy = hasDummy;
  return inputRows;
};

/**
 * Compute the minimum width of this input based on the connection type and
 * outputs.
 * @param {!Blockly.Input} input The input to measure.
 * @return {number} the computed width of this input.
 * @private
 */
Blockly.BlockSvg.prototype.computeInputWidth_ = function(input) {
  // Empty input shape widths.
  if (input.type == Blockly.constants.INPUT_VALUE &&
      (!input.connection || !input.connection.isConnected())) {
    switch (input.connection.getOutputShape()) {
      case Blockly.constants.OUTPUT_SHAPE_SQUARE:
        return Blockly.renderer.constants.INPUT_SHAPE_SQUARE_WIDTH;
      case Blockly.constants.OUTPUT_SHAPE_ROUND:
        return Blockly.renderer.constants.INPUT_SHAPE_ROUND_WIDTH;
      case Blockly.constants.OUTPUT_SHAPE_HEXAGONAL:
        return Blockly.renderer.constants.INPUT_SHAPE_HEXAGONAL_WIDTH;
      default:
        return 0;
    }
  } else {
    return 0;
  }
};

/**
 * Compute the minimum height of this input.
 * @param {!Blockly.Input} input The input to measure.
 * @param {!Object} row The row of the block that is currently being measured.
 * @param {!Object} previousRow The previous row of the block, which was just
 *     measured.
 * @return {number} the computed height of this input.
 * @private
 */
Blockly.BlockSvg.prototype.computeInputHeight_ = function(input, row,
    previousRow) {
  if (this.inputList.length === 1 && this.outputConnection &&
      (this.isShadow() &&
      !Blockly.scratchBlocksUtils.isShadowArgumentReporter(this))) {
    // "Lone" field blocks are smaller.
    return Blockly.renderer.constants.MIN_BLOCK_Y_SINGLE_FIELD_OUTPUT;
  } else if (this.outputConnection) {
    // If this is an extension reporter block, make it taller.
    if (this.isScratchExtension) {
      return Blockly.renderer.constants.MIN_BLOCK_Y_REPORTER + 2 * Blockly.renderer.constants.GRID_UNIT;
    }
    // All other reporters.
    return Blockly.renderer.constants.MIN_BLOCK_Y_REPORTER;
  } else if (row.type == Blockly.constants.NEXT_STATEMENT) {
    // Statement input.
    return Blockly.renderer.constants.MIN_STATEMENT_INPUT_HEIGHT;
  } else if (previousRow && previousRow.type == Blockly.constants.NEXT_STATEMENT) {
    // Extra row for below statement input.
    return Blockly.renderer.constants.EXTRA_STATEMENT_ROW_Y;
  } else {
    // If this is an extension block, and it has a previous connection,
    // make it taller.
    if (this.isScratchExtension && this.previousConnection) {
      return Blockly.renderer.constants.MIN_BLOCK_Y + 2 * Blockly.renderer.constants.GRID_UNIT;
    }
    // All other blocks.
    return Blockly.renderer.constants.MIN_BLOCK_Y;
  }
};

/**
 * Create a row for an input and associated fields.
 * @param {!Blockly.Input} input The input that the row is based on.
 * @return {!Object} The new row, with the correct type and default sizing info.
 */
Blockly.BlockSvg.prototype.createRowForInput_ = function(input) {
  // Create new row.
  const row = [];
  if (input.type != Blockly.constants.NEXT_STATEMENT) {
    row.type = Blockly.BlockSvg.INLINE;
  } else {
    row.type = input.type;
  }
  row.height = 0;
  // Default padding for a block: same as separators between fields/inputs.
  row.paddingStart = Blockly.renderer.constants.SEP_SPACE_X;
  row.paddingEnd = Blockly.renderer.constants.SEP_SPACE_X;
  return row;
};

/**
 * Compute the preferred right edge of the block.
 * @param {number} curEdge The previously calculated right edge.
 * @param {boolean} hasStatement Whether this block has a statement input.
 * @return {number} The preferred right edge of the block.
 */
Blockly.BlockSvg.prototype.computeRightEdge_ = function(curEdge, hasStatement) {
  let edge = curEdge;
  if (this.previousConnection || this.nextConnection) {
    // Blocks with notches
    edge = Math.max(edge, Blockly.renderer.constants.MIN_BLOCK_X);
  } else if (this.outputConnection) {
    if (this.isShadow() &&
        !Blockly.scratchBlocksUtils.isShadowArgumentReporter(this)) {
      // Single-fields
      edge = Math.max(edge, Blockly.renderer.constants.MIN_BLOCK_X_SHADOW_OUTPUT);
    } else {
      // Reporters
      edge = Math.max(edge, Blockly.renderer.constants.MIN_BLOCK_X_OUTPUT);
    }
  }
  if (hasStatement) {
    // Statement blocks (C- or E- shaped) have a longer minimum width.
    edge = Math.max(edge, Blockly.renderer.constants.MIN_BLOCK_X_WITH_STATEMENT);
  }

  // Ensure insertion markers are at least insertionMarkerMinWidth_ wide.
  if (this.insertionMarkerMinWidth_ > 0) {
    edge = Math.max(edge, this.insertionMarkerMinWidth_);
  }
  return edge;
};

/**
 * For a block with output,
 * determine start and end padding, based on connected inputs.
 * Padding will depend on the shape of the output, the shape of the input,
 * and possibly the size of the input.
 * @param {!Array.<!Array.<!Object>>} inputRows Partially calculated rows.
 */
Blockly.BlockSvg.prototype.computeOutputPadding_ = function(inputRows) {
  // Only apply to blocks with outputs and not single fields (shadows).
  if (!this.getOutputShape() || !this.outputConnection ||
      (this.isShadow() &&
      !Blockly.scratchBlocksUtils.isShadowArgumentReporter(this))) {
    return;
  }
  // Blocks with outputs must have single row to be padded.
  if (inputRows.length > 1) {
    return;
  }
  const row = inputRows[0];
  const shape = this.getOutputShape();
  // Reset any padding: it's about to be set.
  row.paddingStart = 0;
  row.paddingEnd = 0;
  // Start row padding: based on first input or first field.
  const firstInput = row[0];
  const firstField = firstInput.fieldRow[0];
  let otherShape;
  // In checking the left/start side, a field takes precedence over any input.
  // That's because a field will be rendered before any value input.
  if (firstField) {
    otherShape = 0; // Field comes first in the row.
  } else {
    // Value input comes first in the row.
    const inputConnection = firstInput.connection;
    if (!inputConnection.targetConnection) {
      // Not connected: use the drawn shape.
      otherShape = inputConnection.getOutputShape();
    } else {
      // Connected: use the connected block's output shape.
      otherShape = inputConnection.targetConnection.getSourceBlock().getOutputShape();
    }
    // Special case for hexagonal output: if the connection is larger height
    // than a standard reporter, add some start padding.
    // https://github.com/LLK/scratch-blocks/issues/376
    if (shape == Blockly.constants.OUTPUT_SHAPE_HEXAGONAL &&
        otherShape != Blockly.constants.OUTPUT_SHAPE_HEXAGONAL) {
      const deltaHeight = firstInput.renderHeight - Blockly.renderer.constants.MIN_BLOCK_Y_REPORTER;
      // One grid unit per level of nesting.
      row.paddingStart += deltaHeight / 2;
    }
  }
  row.paddingStart += Blockly.renderer.constants.SHAPE_IN_SHAPE_PADDING[shape][otherShape];
  // End row padding: based on last input or last field.
  const lastInput = row[row.length - 1];
  // In checking the right/end side, any value input takes precedence over any field.
  // That's because fields are rendered before inputs...the last item
  // in the row will be an input, if one exists.
  if (lastInput.connection) {
    // Value input last in the row.
    const inputConnection = lastInput.connection;
    if (!inputConnection.targetConnection) {
      // Not connected: use the drawn shape.
      otherShape = inputConnection.getOutputShape();
    } else {
      // Connected: use the connected block's output shape.
      otherShape = inputConnection.targetConnection.getSourceBlock().getOutputShape();
    }
    // Special case for hexagonal output: if the connection is larger height
    // than a standard reporter, add some end padding.
    // https://github.com/LLK/scratch-blocks/issues/376
    if (shape == Blockly.constants.OUTPUT_SHAPE_HEXAGONAL &&
        otherShape != Blockly.constants.OUTPUT_SHAPE_HEXAGONAL) {
      const deltaHeight = lastInput.renderHeight - Blockly.renderer.constants.MIN_BLOCK_Y_REPORTER;
      // One grid unit per level of nesting.
      row.paddingEnd += deltaHeight / 2;
    }
  } else {
    // No input in this row - mark as field.
    otherShape = 0;
  }
  row.paddingEnd += Blockly.renderer.constants.SHAPE_IN_SHAPE_PADDING[shape][otherShape];
};

/**
 * Draw the path of the block.
 * Move the fields to the correct locations.
 * @param {number} iconWidth Offset of first row due to icons.
 * @param {!Array.<!Array.<!Object>>} inputRows 2D array of objects, each
 *     containing position information.
 * @private
 */
Blockly.BlockSvg.prototype.renderDraw_ = function(iconWidth, inputRows) {
  this.startHat_ = false;
  // Should the top left corners be rounded or square?
  // Currently, it is squared only if it's a hat.
  this.squareTopLeftCorner_ = false;
  if (!this.outputConnection && !this.previousConnection) {
    // No output or previous connection.
    this.squareTopLeftCorner_ = true;
    this.startHat_ = true;
    inputRows.rightEdge = Math.max(inputRows.rightEdge, 100);
  }

  // Amount of space to skip drawing the top and bottom,
  // to make room for the left and right to draw shapes (curves or angles).
  this.edgeShapeWidth_ = 0;
  this.edgeShape_ = null;
  if (this.outputConnection) {
    // Width of the curve/pointy-curve
    const shape = this.getOutputShape();
    if (shape === Blockly.constants.OUTPUT_SHAPE_HEXAGONAL || shape === Blockly.constants.OUTPUT_SHAPE_ROUND) {
      this.edgeShapeWidth_ = inputRows.bottomEdge / 2;
      this.edgeShape_ = shape;
      this.squareTopLeftCorner_ = true;
    }
  }

  // Assemble the block's path.
  const steps = [];

  this.renderDrawTop_(steps, inputRows.rightEdge);
  const cursorY = this.renderDrawRight_(steps, inputRows, iconWidth);
  this.renderDrawBottom_(steps, cursorY);
  this.renderDrawLeft_(steps);

  const pathString = steps.join(' ');
  this.svgPath_.setAttribute('d', pathString);

  if (this.RTL) {
    // Mirror the block's path.
    // This is awesome.
    this.svgPath_.setAttribute('transform', 'scale(-1 1)');
  }
};

/**
 * Give the block an attribute 'data-shapes' that lists its shape[s], and an
 *     attribute 'data-category' with its category.
 * @private
 */
Blockly.BlockSvg.prototype.renderClassify_ = function() {
  const shapes = [];

  if (this.outputConnection) {
    if (this.isShadow_) {
      shapes.push('argument');
    } else {
      shapes.push('reporter');
    }
    if (this.edgeShape_ === Blockly.constants.OUTPUT_SHAPE_HEXAGONAL) {
      shapes.push('boolean');
    } else if (this.edgeShape_ === Blockly.constants.OUTPUT_SHAPE_ROUND) {
      shapes.push('round');
    }
  } else {
    // count the number of statement inputs
    const inputList = this.inputList;
    let statementCount = 0;
    for (let i = 0, input; input = inputList[i]; i++) {
      if (input.connection && input.connection.type === Blockly.constants.NEXT_STATEMENT) {
        statementCount++;
      }
    }

    if (statementCount) {
      shapes.push('c-block');
      shapes.push('c-' + statementCount);
    }
    if (this.startHat_) {
      shapes.push('hat'); // c-block+hats are possible (e.x. reprter procedures)
    } else if (!statementCount) {
      shapes.push('stack'); //only call it "stack" if it's not a c-block
    }
    if (!this.nextConnection) {
      shapes.push('end');
    }
  }

  this.svgGroup_.setAttribute('data-shapes', shapes.join(' '));

  if (this.getCategory()) {
    this.svgGroup_.setAttribute('data-category', this.getCategory());
  }
};

/**
 * Render the top edge of the block.
 * @param {!Array.<string>} steps Path of block outline.
 * @param {number} rightEdge Minimum width of block.
 * @private
 */
Blockly.BlockSvg.prototype.renderDrawTop_ = function(steps, rightEdge) {
  if (this.type == Blockly.constants.PROCEDURES_DEFINITION_BLOCK_TYPE) {
    steps.push('m 0, 0');
    steps.push(Blockly.renderer.constants.TOP_LEFT_CORNER_DEFINE_HAT);
  } else {
    // Position the cursor at the top-left starting point.
    if (this.squareTopLeftCorner_) {
      steps.push('m 0,0');
      if (this.startHat_) {
        steps.push(Blockly.renderer.constants.START_HAT_PATH);
      }
      // Skip space for the output shape
      if (this.edgeShapeWidth_) {
        steps.push('m ' + this.edgeShapeWidth_ + ',0');
      }
    } else {
      steps.push(Blockly.renderer.constants.TOP_LEFT_CORNER_START);
      // Top-left rounded corner.
      steps.push(Blockly.renderer.constants.TOP_LEFT_CORNER);
    }

    // Top edge.
    if (this.previousConnection) {
      // Space before the notch
      steps.push('H', Blockly.renderer.constants.NOTCH_START_PADDING);
      steps.push(Blockly.renderer.constants.NOTCH_PATH_LEFT);
      // Create previous block connection.
      const connectionX = (this.RTL ?
          -Blockly.renderer.constants.NOTCH_WIDTH : Blockly.renderer.constants.NOTCH_WIDTH);
      this.previousConnection.setOffsetInBlock(connectionX, 0);
    }
  }
  this.width = rightEdge;
};

/**
 * Render the right edge of the block.
 * @param {!Array.<string>} steps Path of block outline.
 * @param {!Array.<!Array.<!Object>>} inputRows 2D array of objects, each
 *     containing position information.
 * @param {number} iconWidth Offset of first row due to icons.
 * @return {number} Height of block.
 * @private
 */
Blockly.BlockSvg.prototype.renderDrawRight_ = function(steps,
    inputRows, iconWidth) {
  let cursorX = 0;
  let cursorY = 0;
  let connectionX, connectionY;
  for (let y = 0, row; row = inputRows[y]; y++) {
    cursorX = row.paddingStart;
    if (y == 0) {
      cursorX += this.RTL ? -iconWidth : iconWidth;
    }

    if (row.type == Blockly.BlockSvg.INLINE) {
      // Inline inputs.
      for (let x = 0, input; input = row[x]; x++) {
        // Align fields vertically within the row.
        // Moves the field to half of the row's height.
        // In renderFields_, the field is further centered
        // by its own rendered height.
        const fieldY = cursorY + row.height / 2;

        const fieldX = Blockly.BlockSvg.getAlignedCursor_(cursorX, input,
            inputRows.rightEdge);

        cursorX = this.renderFields_(input.fieldRow, fieldX, fieldY);
        if (input.type == Blockly.constants.INPUT_VALUE) {
          // Create inline input connection.
          // In blocks with a notch, inputs should be bumped to a min X,
          // to avoid overlapping with the notch.
          if (this.previousConnection) {
            cursorX = Math.max(cursorX, Blockly.renderer.constants.INPUT_AND_FIELD_MIN_X);
          }
          connectionX = this.RTL ? -cursorX : cursorX;
          // Attempt to center the connection vertically.
          const connectionYOffset = row.height / 2;
          connectionY = cursorY + connectionYOffset;
          input.connection.setOffsetInBlock(connectionX, connectionY);
          this.renderInputShape_(input, cursorX, cursorY + connectionYOffset);
          cursorX += input.renderWidth + Blockly.renderer.constants.SEP_SPACE_X;
        }
      }
      // Remove final separator and replace it with right-padding.
      cursorX -= Blockly.renderer.constants.SEP_SPACE_X;
      cursorX += row.paddingEnd;
      // Update right edge for all inputs, such that all rows
      // stretch to be at least the size of all previous rows.
      inputRows.rightEdge = Math.max(cursorX, inputRows.rightEdge);
      // Move to the right edge
      cursorX = Math.max(cursorX, inputRows.rightEdge);
      this.width = Math.max(this.width, cursorX);
      if (!this.edgeShape_) {
        // Include corner radius in drawing the horizontal line.
        steps.push('H', cursorX - Blockly.renderer.constants.CORNER_RADIUS - this.edgeShapeWidth_);
        steps.push(Blockly.renderer.constants.TOP_RIGHT_CORNER);
      } else {
        // Don't include corner radius - no corner (edge shape drawn).
        steps.push('H', cursorX - this.edgeShapeWidth_);
      }
      // Subtract CORNER_RADIUS * 2 to account for the top right corner
      // and also the bottom right corner. Only move vertically the non-corner length.
      if (!this.edgeShape_) {
        steps.push('v', row.height - Blockly.renderer.constants.CORNER_RADIUS * 2);
      }
    } else if (row.type == Blockly.constants.NEXT_STATEMENT) {
      // Nested statement.
      const input = row[0];
      const fieldX = cursorX;
      // Align fields vertically within the row.
      // In renderFields_, the field is further centered by its own height.
      const fieldY = cursorY + Blockly.renderer.constants.MIN_STATEMENT_INPUT_HEIGHT;
      this.renderFields_(input.fieldRow, fieldX, fieldY);
      // Move to the start of the notch.
      cursorX = inputRows.statementEdge + Blockly.renderer.constants.NOTCH_WIDTH;

      if (this.type == Blockly.constants.PROCEDURES_DEFINITION_BLOCK_TYPE) {
        this.renderDefineBlock_(steps, inputRows, input, row, cursorY);
      } else {
        Blockly.BlockSvg.drawStatementInputFromTopRight_(steps, cursorX,
            inputRows.rightEdge, row);
      }

      // Create statement connection.
      connectionX = this.RTL ? -cursorX : cursorX;
      input.connection.setOffsetInBlock(connectionX, cursorY);
      if (input.connection.isConnected()) {
        this.width = Math.max(this.width, inputRows.statementEdge +
          input.connection.targetBlock().getHeightWidth().width);
      }
      if (this.type != Blockly.constants.PROCEDURES_DEFINITION_BLOCK_TYPE &&
        (y == inputRows.length - 1 ||
          inputRows[y + 1].type == Blockly.constants.NEXT_STATEMENT)) {
        // If the final input is a statement stack, add a small row underneath.
        // Consecutive statement stacks are also separated by a small divider.
        steps.push(Blockly.renderer.constants.TOP_RIGHT_CORNER);
        steps.push('v', Blockly.renderer.constants.EXTRA_STATEMENT_ROW_Y - 2 * Blockly.renderer.constants.CORNER_RADIUS);
        cursorY += Blockly.renderer.constants.EXTRA_STATEMENT_ROW_Y;
      }
    }
    cursorY += row.height;
  }
  this.drawEdgeShapeRight_(steps);
  if (!inputRows.length) {
    cursorY = Blockly.renderer.constants.MIN_BLOCK_Y;
    steps.push('V', cursorY);
  }
  return cursorY;
};

/**
 * Render the input shapes.
 * If there's a connected block, hide the input shape.
 * Otherwise, draw and set the position of the input shape.
 * @param {!Blockly.Input} input Input to be rendered.
 * @param {Number} x X offset of input.
 * @param {Number} y Y offset of input.
 */
Blockly.BlockSvg.prototype.renderInputShape_ = function(input, x, y) {
  const inputShape = input.outlinePath;
  if (!inputShape) {
    // No input shape for this input - e.g., the block is an insertion marker.
    return;
  }
  // Input shapes are only visibly rendered on non-connected slots.
  if (input.connection.targetConnection) {
    inputShape.setAttribute('style', 'visibility: hidden');
  } else {
    let inputShapeX = 0, inputShapeY = 0;
    const inputShapeInfo =
        Blockly.BlockSvg.getInputShapeInfo_(input.connection.getOutputShape());
    if (this.RTL) {
      inputShapeX = -x - inputShapeInfo.width;
    } else {
      inputShapeX = x;
    }
    inputShapeY = y - (Blockly.renderer.constants.INPUT_SHAPE_HEIGHT / 2);
    inputShape.setAttribute('d', inputShapeInfo.path);
    inputShape.setAttribute('transform',
        'translate(' + inputShapeX + ',' + inputShapeY + ')');
    inputShape.setAttribute('data-argument-type', inputShapeInfo.argType);
    inputShape.setAttribute('style', 'visibility: visible');
  }
};

/**
 * Render the bottom edge of the block.
 * @param {!Array.<string>} steps Path of block outline.
 * @param {number} cursorY Height of block.
 * @private
 */
Blockly.BlockSvg.prototype.renderDrawBottom_ = function(steps, cursorY) {
  this.height = cursorY;
  if (!this.edgeShape_) {
    steps.push(Blockly.renderer.constants.BOTTOM_RIGHT_CORNER);
  }
  if (this.nextConnection) {
    // Move to the right-side of the notch.
    const notchStart = (
      Blockly.renderer.constants.NOTCH_WIDTH +
      Blockly.renderer.constants.NOTCH_START_PADDING +
      Blockly.renderer.constants.CORNER_RADIUS
    );
    steps.push('H', notchStart, ' ');
    steps.push(Blockly.renderer.constants.NOTCH_PATH_RIGHT);
    // Create next block connection.
    const connectionX = this.RTL ? -Blockly.renderer.constants.NOTCH_WIDTH :
        Blockly.renderer.constants.NOTCH_WIDTH;
    this.nextConnection.setOffsetInBlock(connectionX, cursorY);
    // Include height of notch in block height.
    this.height += Blockly.renderer.constants.NOTCH_HEIGHT;
  }
  // Bottom horizontal line
  if (!this.edgeShape_) {
    steps.push('H', Blockly.renderer.constants.CORNER_RADIUS);
    // Bottom left corner
    steps.push(Blockly.renderer.constants.BOTTOM_LEFT_CORNER);
  } else {
    steps.push('H', this.edgeShapeWidth_);
  }
};

/**
 * Render the left edge of the block.
 * @param {!Array.<string>} steps Path of block outline.
 * @param {number} cursorY Height of block.
 * @private
 */
Blockly.BlockSvg.prototype.renderDrawLeft_ = function(steps) {
  if (this.outputConnection) {
    // Scratch-style reporters have output connection y at half block height.
    this.outputConnection.setOffsetInBlock(0, this.height / 2);
  }
  if (this.edgeShape_) {
    // Draw the left-side edge shape.
    if (this.edgeShape_ === Blockly.constants.OUTPUT_SHAPE_ROUND) {
      // Draw a rounded arc.
      steps.push('a ' + this.edgeShapeWidth_ + ' ' + this.edgeShapeWidth_ + ' 0 0 1 0 -' + this.edgeShapeWidth_ * 2);
    } else if (this.edgeShape_ === Blockly.constants.OUTPUT_SHAPE_HEXAGONAL) {
      // Draw a half-hexagon.
      steps.push('l ' + -this.edgeShapeWidth_ + ' ' + -this.edgeShapeWidth_ +
        ' l ' + this.edgeShapeWidth_ + ' ' + -this.edgeShapeWidth_);
    }
  }
  steps.push('z');
};

/**
 * Draw the edge shape (rounded or hexagonal) on the right side of a block with
 * an output.
 * @param {!Array.<string>} steps Path of block outline.
 * @private
 */
Blockly.BlockSvg.prototype.drawEdgeShapeRight_ = function(steps) {
  if (this.edgeShape_) {
    // Draw the right-side edge shape.
    if (this.edgeShape_ === Blockly.constants.OUTPUT_SHAPE_ROUND) {
      // Draw a rounded arc.
      steps.push('a ' + this.edgeShapeWidth_ + ' ' + this.edgeShapeWidth_ +
          ' 0 0 1 0 ' + this.edgeShapeWidth_ * 2);
    } else if (this.edgeShape_ === Blockly.constants.OUTPUT_SHAPE_HEXAGONAL) {
      // Draw an half-hexagon.
      steps.push('l ' + this.edgeShapeWidth_ + ' ' + this.edgeShapeWidth_ +
          ' l ' + -this.edgeShapeWidth_ + ' ' + this.edgeShapeWidth_);
    }
  }
};

/**
 * Position an new block correctly, so that it doesn't move the existing block
 * when connected to it.
 * @param {!Blockly.Block} newBlock The block to position - either the first
 *     block in a dragged stack or an insertion marker.
 * @param {!Blockly.Connection} newConnection The connection on the new block's
 *     stack - either a connection on newBlock, or the last NEXT_STATEMENT
 *     connection on the stack if the stack's being dropped before another
 *     block.
 * @param {!Blockly.Connection} existingConnection The connection on the
 *     existing block, which newBlock should line up with.
 */
Blockly.BlockSvg.prototype.positionNewBlock = function(newBlock, newConnection,
    existingConnection) {
  // We only need to position the new block if it's before the existing one,
  // otherwise its position is set by the previous block.
  if (newConnection.type == Blockly.constants.NEXT_STATEMENT) {
    const dx = existingConnection.x_ - newConnection.x_;
    const dy = existingConnection.y_ - newConnection.y_;

    newBlock.moveBy(dx, dy);
  }
};

/**
 * Draw the outline of a statement input, starting at the top right corner.
 * @param {!Array.<string>} steps Path of block outline.
 * @param {number} cursorX The x position of the start of the notch at the top
 *     of the input.
 * @param {number} rightEdge The far right edge of the block, which determines
 *     how wide the statement input is.
 * @param {!Array.<!Object>} row An object containing information about the
 *     current row, including its height and whether it should have a notch at
 *     the bottom.
 * @private
 */
Blockly.BlockSvg.drawStatementInputFromTopRight_ = function(steps, cursorX,
    rightEdge, row) {
  Blockly.BlockSvg.drawStatementInputTop_(steps, cursorX);
  steps.push('v', row.height - 2 * Blockly.renderer.constants.CORNER_RADIUS);
  Blockly.BlockSvg.drawStatementInputBottom_(steps, rightEdge, row);
};

/**
 * Draw the top of the outline of a statement input, starting at the top right
 * corner.
 * @param {!Array.<string>} steps Path of block outline.
 * @param {number} cursorX The x position of the start of the notch at the top
 *     of the input.
 * @private
 */
Blockly.BlockSvg.drawStatementInputTop_ = function(steps, cursorX) {
  steps.push(Blockly.renderer.constants.BOTTOM_RIGHT_CORNER);
  steps.push('H', cursorX + Blockly.renderer.constants.STATEMENT_INPUT_INNER_SPACE +
    2 * Blockly.renderer.constants.CORNER_RADIUS);
  steps.push(Blockly.renderer.constants.NOTCH_PATH_RIGHT);
  steps.push('h', '-' + Blockly.renderer.constants.STATEMENT_INPUT_INNER_SPACE);
  steps.push(Blockly.renderer.constants.INNER_TOP_LEFT_CORNER);
};

/**
 * Draw the bottom of the outline of a statement input, starting at the inner
 * left corner.
 * @param {!Array.<string>} steps Path of block outline.
 * @param {number} rightEdge The far right edge of the block, which determines
 *     how wide the statement input is.
 * @param {!Array.<!Object>} row An object containing information about the
 *     current row, including its height and whether it should have a notch at
 *     the bottom.
 * @private
 */
Blockly.BlockSvg.drawStatementInputBottom_ = function(steps, rightEdge, row) {
  steps.push(Blockly.renderer.constants.INNER_BOTTOM_LEFT_CORNER);
  if (row.statementNotchAtBottom) {
    steps.push('h ', Blockly.renderer.constants.STATEMENT_INPUT_INNER_SPACE);
    steps.push(Blockly.renderer.constants.NOTCH_PATH_LEFT);
  }
  steps.push('H', rightEdge - Blockly.renderer.constants.CORNER_RADIUS);
};

/**
 * Render part of the hat and the right side of the define block to fully wrap
 * the connected statement block.
 * Scratch-specific.
 * @param {!Array.<string>} steps Path of block outline.
 * @param {!Array.<!Array.<!Object>>} inputRows 2D array of objects, each
 *     containing position information.
 * @param {!Blockly.Input} input The input that is currently being rendered.
 * @param {!Array.<!Object>} row An object containing information about the
 *     current row, including its height and whether it should have a notch at
 *     the bottom.
 * @param {number} cursorY The y position of the start of this row.  Used to
 *     position the following dummy input's fields.
 * @private
 */
Blockly.BlockSvg.prototype.renderDefineBlock_ = function(steps, inputRows,
    input, row, cursorY) {
  // Following text shows up as a dummy input after the statement input, which
  // we are forcing to stay inline with the statement input instead of letting
  // it drop to a new line.
  const hasFollowingText = row.length == 2;

  // Figure out where the right side of the block is.
  let rightSide = inputRows.rightEdge;
  if (input.connection && input.connection.targetBlock()) {
    rightSide = inputRows.statementEdge +
        input.connection.targetBlock().getHeightWidth().width +
        Blockly.renderer.constants.DEFINE_BLOCK_PADDING_RIGHT;
  } else {
    // Handles the case where block is being rendered as an insertion marker
    rightSide = Math.max(Blockly.renderer.constants.MIN_BLOCK_X_WITH_STATEMENT, rightSide)
    + Blockly.renderer.constants.DEFINE_BLOCK_PADDING_RIGHT;
  }
  rightSide -= Blockly.renderer.constants.DEFINE_HAT_CORNER_RADIUS;

  if (hasFollowingText) {
    const followingTextInput = row[1];
    const fieldStart = rightSide + 3 * Blockly.renderer.constants.SEP_SPACE_X;
    rightSide += followingTextInput.fieldRow[0].getSize().width;
    rightSide += 2 * Blockly.renderer.constants.SEP_SPACE_X;

    // Align fields vertically within the row.
    // In renderFields_, the field is further centered by its own height.
    // The dummy input's fields did not get laid out normally because we're
    // forcing them to stay inline with a statement input.
    let fieldY = cursorY;
    fieldY += Blockly.renderer.constants.MIN_STATEMENT_INPUT_HEIGHT;
    this.renderFields_(followingTextInput.fieldRow, fieldStart, fieldY);
  }
  // Draw the top and the right corner of the hat.
  steps.push('H', rightSide);
  steps.push(Blockly.renderer.constants.TOP_RIGHT_CORNER_DEFINE_HAT);
  row.height += 3 * Blockly.renderer.constants.GRID_UNIT;
  // Draw the right side of the block around the statement input.
  steps.push('v', row.height);
  // row.height will be used to update the cursor in the calling function.
  row.height += Blockly.renderer.constants.GRID_UNIT;

};

/**
 * Get some information about the input shape to draw, based on the type of the
 * connection.
 * @param {number} shape An enum representing the shape of the connection we're
 *     drawing around.
 * @return {!Object} An object containing an SVG path, a string representation
 *     of the argument type, and a width.
 * @private
 */
Blockly.BlockSvg.getInputShapeInfo_ = function(shape) {
  let inputShapePath = null;
  let inputShapeArgType = null;
  let inputShapeWidth = 0;

  switch (shape) {
    case Blockly.constants.OUTPUT_SHAPE_HEXAGONAL:
      inputShapePath = Blockly.renderer.constants.INPUT_SHAPE_HEXAGONAL;
      inputShapeWidth = Blockly.renderer.constants.INPUT_SHAPE_HEXAGONAL_WIDTH;
      inputShapeArgType = 'boolean';
      break;
    case Blockly.constants.OUTPUT_SHAPE_ROUND:
      inputShapePath = Blockly.renderer.constants.INPUT_SHAPE_ROUND;
      inputShapeWidth = Blockly.renderer.constants.INPUT_SHAPE_ROUND_WIDTH;
      inputShapeArgType = 'round';
      break;
    case Blockly.constants.OUTPUT_SHAPE_SQUARE:
    default:  // If the input connection is not connected, draw a hole shape.
      inputShapePath = Blockly.renderer.constants.INPUT_SHAPE_SQUARE;
      inputShapeWidth = Blockly.renderer.constants.INPUT_SHAPE_SQUARE_WIDTH;
      inputShapeArgType = 'square';
      break;
  }
  return {
    path: inputShapePath,
    argType: inputShapeArgType,
    width: inputShapeWidth
  };
};

/**
 * Get the correct cursor position for the given input, based on alignment,
 * the total size of the block, and the size of the input.
 * @param {number} cursorX The minimum x value of the cursor.
 * @param {!Blockly.Input} input The input to align the fields for.
 * @param {number} rightEdge The maximum width of the block.  Right-aligned
 *     fields are positioned based on this number.
 * @return {number} The new cursor position.
 * @private
 */
Blockly.BlockSvg.getAlignedCursor_ = function(cursorX, input, rightEdge) {
  // Align inline field rows (left/right/centre).
  if (input.align === Blockly.constants.ALIGN_RIGHT) {
    cursorX += rightEdge - input.fieldWidth -
      (2 * Blockly.renderer.constants.SEP_SPACE_X);
  } else if (input.align === Blockly.constants.ALIGN_CENTRE) {
    cursorX = Math.max(cursorX, rightEdge / 2 - input.fieldWidth / 2);
  }
  return cursorX;
};

/**
 * Update all of the connections on this block with the new locaitons calculated
 * in renderCompute, and move all of the connected blocks based on the new
 * connection locations.
 * @private
 */
Blockly.BlockSvg.prototype.renderMoveConnections_ = function() {
  const blockTL = this.getRelativeToSurfaceXY();
  // Don't tighten previous or output connections because they are inferior.
  if (this.previousConnection) {
    this.previousConnection.moveToOffset(blockTL);
  }
  if (this.outputConnection) {
    this.outputConnection.moveToOffset(blockTL);
  }

  for (let i = 0; i < this.inputList.length; i++) {
    const conn = this.inputList[i].connection;
    if (conn) {
      conn.moveToOffset(blockTL);
      if (conn.isConnected()) {
        conn.tighten_();
      }
    }
  }

  if (this.nextConnection) {
    this.nextConnection.moveToOffset(blockTL);
    if (this.nextConnection.isConnected()) {
      this.nextConnection.tighten_();
    }
  }
};
