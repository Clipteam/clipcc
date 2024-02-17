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

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.BlockSvg');

import {Block} from './block';
import * as BlockAnimations from './block_animations';
import * as browserEvents from './browser_events';
import * as common from './common';
import * as constants from './constants';
import {ContextMenu} from './contextmenu';
import * as eventUtils from './events/utils';
import {BlockMove} from './events/block_move';
import {Ui} from './events/ui';
import {Field} from './field';
import {FieldTextInput} from './field_textinput';
import {RenderedConnection} from './rendered_connection';
import {ScratchBlockComment} from './scratch_block_comment';
import {Tooltip} from './tooltip';
import * as utils from './utils';
import {Warning} from './warning';

const asserts = goog.require('goog.asserts');
const dom = goog.require('goog.dom');
const Coordinate = goog.require('goog.math.Coordinate');


/**
 * Class for a block's SVG representation.
 * Not normally called directly, workspace.newBlock() is preferred.
 * @param {!Blockly.Workspace} workspace The block's workspace.
 * @param {?string} prototypeName Name of the language object containing
 *     type-specific functions for this block.
 * @param {string=} opt_id Optional ID.  Use this ID if provided, otherwise
 *     create a new ID.  If the ID conflicts with an in-use ID, a new one will
 *     be generated.
 * @extends {Block}
 * @constructor
 */
export const BlockSvg = function(workspace, prototypeName, opt_id) {
  // Create core elements for the block.
  /**
   * @type {SVGElement}
   * @private
   */
  this.svgGroup_ = utils.createSvgElement('g', {}, null);
  /** @type {SVGElement} */
  this.svgPath_ = utils.createSvgElement('path',
      {'class': 'blocklyPath blocklyBlockBackground'},
      this.svgGroup_);
  this.svgPath_.tooltip = this;
  this.svgGroup_.block = this;

  /** @type {boolean} */
  this.rendered = false;

  /**
   * Whether to move the block to the drag surface when it is dragged.
   * True if it should move, false if it should be translated directly.
   * @type {boolean}
   * @private
   */
  this.useDragSurface_ = utils.is3dSupported() && !!workspace.blockDragSurface_;

  Tooltip.bindMouseEvents(this.svgPath_);
  BlockSvg.superClass_.constructor.call(this,
      workspace, prototypeName, opt_id);

  // Expose this block's ID on its top-level SVG group.
  if (this.svgGroup_.dataset) {
    this.svgGroup_.dataset.id = this.id;
  }
};
goog.inherits(BlockSvg, Block);

/**
 * Height of this block, not including any statement blocks above or below.
 * Height is in workspace units.
 */
BlockSvg.prototype.height = 0;

/**
 * Whether block is visible.
 * @type {boolean}
 */
BlockSvg.prototype.visible_ = true;

/**
 * Width of this block, including any connected value blocks.
 * Width is in workspace units.
 */
BlockSvg.prototype.width = 0;

/**
 * Minimum width of block if insertion marker; comes from inserting block.
 * @type {number}
 */
BlockSvg.prototype.insertionMarkerMinWidth_ = 0;

/**
 * Opacity of this block between 0 and 1.
 * @type {number}
 * @private
 */
BlockSvg.prototype.opacity_ = 1;

/**
 * Original location of block being dragged.
 * @type {Coordinate}
 * @private
 */
BlockSvg.prototype.dragStartXY_ = null;

/**
 * Whether the block glows as if running.
 * @type {boolean}
 * @private
 */
BlockSvg.prototype.isGlowingBlock_ = false;

/**
 * Whether the block's whole stack glows as if running.
 * @type {boolean}
 * @private
 */
BlockSvg.prototype.isGlowingStack_ = false;

/**
 * Constant for identifying rows that are to be rendered inline.
 * Don't collide with Blockly.constants.INPUT_VALUE and friends.
 * @const
 */
BlockSvg.INLINE = -1;

/**
 * Create and initialize the SVG representation of the block.
 * May be called more than once.
 */
BlockSvg.prototype.initSvg = function() {
  asserts.assert(this.workspace.rendered, 'Workspace is headless.');
  if (!this.isInsertionMarker()) { // Insertion markers not allowed to have inputs or icons
    // Input shapes are empty holes drawn when a value input is not connected.
    for (let i = 0, input; input = this.inputList[i]; i++) {
      input.init();
      input.initOutlinePath(this.svgGroup_);
    }
    const icons = this.getIcons();
    for (let i = 0; i < icons.length; i++) {
      icons[i].createIcon();
    }
  }
  this.updateColour();
  this.updateMovable();
  if (!this.workspace.options.readOnly && !this.eventsInit_) {
    browserEvents.conditionalBind(
        this.getSvgRoot(), 'mousedown', this, this.onMouseDown_);
  }
  this.eventsInit_ = true;

  if (!this.getSvgRoot().parentNode) {
    this.workspace.getCanvas().appendChild(this.getSvgRoot());
  }
};

/**
 * Select this block.  Highlight it visually.
 */
BlockSvg.prototype.select = function() {
  if (this.isShadow() && this.getParent()) {
    // Shadow blocks should not be selected.
    this.getParent().select();
    return;
  }
  if (common.getSelected() == this) {
    return;
  }
  let oldId = null;
  if (common.getSelected()) {
    oldId = common.getSelected().id;
    // Unselect any previously selected block.
    eventUtils.disable();
    try {
      common.getSelected().unselect();
    } finally {
      eventUtils.enable();
    }
  }
  const event = new Ui(null, 'selected', oldId, this.id);
  event.workspaceId = this.workspace.id;
  eventUtils.fire(event);
  common.setSelected(this);
  this.addSelect();
};

/**
 * Unselect this block.  Remove its highlighting.
 */
BlockSvg.prototype.unselect = function() {
  if (common.getSelected() != this) {
    return;
  }
  const event = new Ui(null, 'selected', this.id, null);
  event.workspaceId = this.workspace.id;
  eventUtils.fire(event);
  common.setSelected(null);
  this.removeSelect();
};

/**
 * Glow only this particular block, to highlight it visually as if it's running.
 * @param {boolean} isGlowingBlock Whether the block should glow.
 */
BlockSvg.prototype.setGlowBlock = function(isGlowingBlock) {
  this.isGlowingBlock_ = isGlowingBlock;
  this.updateColour();
};

/**
 * Glow the stack starting with this block, to highlight it visually as if it's running.
 * @param {boolean} isGlowingStack Whether the stack starting with this block should glow.
 */
BlockSvg.prototype.setGlowStack = function(isGlowingStack) {
  this.isGlowingStack_ = isGlowingStack;
  // Update the applied SVG filter if the property has changed
  const svg = this.getSvgRoot();
  if (this.isGlowingStack_ && !svg.hasAttribute('filter')) {
    const stackGlowFilterId = this.workspace.options.stackGlowFilterId || 'blocklyStackGlowFilter';
    svg.setAttribute('filter', 'url(#' + stackGlowFilterId + ')');
  } else if (!this.isGlowingStack_ && svg.hasAttribute('filter')) {
    svg.removeAttribute('filter');
  }
};

/**
 * Block's mutator icon (if any).
 * @type {Blockly.Mutator}
 */
BlockSvg.prototype.mutator = null;

/**
 * Block's comment icon (if any).
 * @type {Blockly.Comment}
 */
BlockSvg.prototype.comment = null;

/**
 * Block's warning icon (if any).
 * @type {Warning}
 */
BlockSvg.prototype.warning = null;

/**
 * Returns a list of mutator, comment, and warning icons.
 * @return {!Array} List of icons.
 */
BlockSvg.prototype.getIcons = function() {
  const icons = [];
  if (this.mutator) {
    icons.push(this.mutator);
  }
  if (this.comment) {
    icons.push(this.comment);
  }
  if (this.warning) {
    icons.push(this.warning);
  }
  return icons;
};

/**
 * Set parent of this block to be a new block or null.
 * @param {BlockSvg} newParent New parent block.
 */
BlockSvg.prototype.setParent = function(newParent) {
  const oldParent = this.parentBlock_;
  if (newParent == oldParent) {
    return;
  }
  utils.startTextWidthCache();
  BlockSvg.superClass_.setParent.call(this, newParent);
  utils.stopTextWidthCache();

  const svgRoot = this.getSvgRoot();

  // Bail early if workspace is clearing, or we aren't rendered.
  // We won't need to reattach ourselves anywhere.
  if (this.workspace.isClearing || !svgRoot) {
    return;
  }

  // This function can potentially change the position of the blocks
  // , so we need to update observe here
  this.updateObserve();
  
  const oldXY = this.getRelativeToSurfaceXY();
  if (newParent) {
    newParent.getSvgRoot().appendChild(svgRoot);
    const newXY = this.getRelativeToSurfaceXY();
    // Move the connections to match the child's new position.
    this.moveConnections_(newXY.x - oldXY.x, newXY.y - oldXY.y);
    // If we are a shadow block, inherit tertiary colour.
    if (this.isShadow()) {
      this.setColour(this.getColour(), this.getColourSecondary(),
          newParent.getColourTertiary(), this.getColourQuaternary());
    }
  }
  // If we are losing a parent, we want to move our DOM element to the
  // root of the workspace.
  else if (oldParent) {
    this.workspace.getCanvas().appendChild(svgRoot);
    this.translate(oldXY.x, oldXY.y);
  }

};

/**
 * Return the coordinates of the top-left corner of this block relative to the
 * drawing surface's origin (0,0), in workspace units.
 * If the block is on the workspace, (0, 0) is the origin of the workspace
 * coordinate system.
 * This does not change with workspace scale.
 * @return {!Coordinate} Object with .x and .y properties in
 *     workspace coordinates.
 */
BlockSvg.prototype.getRelativeToSurfaceXY = function() {
  // The drawing surface is relative to either the workspace canvas
  // or to the drag surface group.
  let x = 0;
  let y = 0;

  const dragSurfaceGroup = this.useDragSurface_ ?
      this.workspace.blockDragSurface_.getGroup() : null;

  let element = this.getSvgRoot();
  if (element) {
    do {
      // Loop through this block and every parent.
      const xy = utils.getRelativeXY(element);
      x += xy.x;
      y += xy.y;
      // If this element is the current element on the drag surface, include
      // the translation of the drag surface itself.
      if (this.useDragSurface_ &&
          this.workspace.blockDragSurface_.getCurrentBlock() == element) {
        const surfaceTranslation = this.workspace.blockDragSurface_.getSurfaceTranslation();
        x += surfaceTranslation.x;
        y += surfaceTranslation.y;
      }
      element = element.parentNode;
    } while (element && element != this.workspace.getCanvas() &&
        element != dragSurfaceGroup);
  }
  return new Coordinate(x, y);
};

/**
 * Move a block by a relative offset.
 * @param {number} dx Horizontal offset in workspace units.
 * @param {number} dy Vertical offset in workspace units.
 */
BlockSvg.prototype.moveBy = function(dx, dy) {
  asserts.assert(!this.parentBlock_, 'Block has parent.');
  const eventsEnabled = eventUtils.isEnabled();
  const event = eventsEnabled ? new BlockMove(this) : undefined;
  const xy = this.getRelativeToSurfaceXY();
  this.translate(xy.x + dx, xy.y + dy);
  this.moveConnections_(dx, dy);
  if (eventsEnabled) {
    event.recordNew();
    eventUtils.fire(event);
  }
  this.workspace.resizeContents();
};

/**
 * Transforms a block by setting the translation on the transform attribute
 * of the block's SVG.
 * @param {number} x The x coordinate of the translation in workspace units.
 * @param {number} y The y coordinate of the translation in workspace units.
 */
BlockSvg.prototype.translate = function(x, y) {
  this.getSvgRoot().setAttribute('transform',
      'translate(' + x + ',' + y + ')');
};

/**
 * Move this block to its workspace's drag surface, accounting for positioning.
 * Generally should be called at the same time as setDragging_(true).
 * Does nothing if useDragSurface_ is false.
 * @private
 */
BlockSvg.prototype.moveToDragSurface_ = function() {
  if (!this.useDragSurface_) {
    return;
  }
  // The translation for drag surface blocks,
  // is equal to the current relative-to-surface position,
  // to keep the position in sync as it move on/off the surface.
  // This is in workspace coordinates.
  const xy = this.getRelativeToSurfaceXY();
  this.clearTransformAttributes_();
  this.workspace.blockDragSurface_.translateSurface(xy.x, xy.y);
  // Execute the move on the top-level SVG component
  this.workspace.blockDragSurface_.setBlocksAndShow(this.getSvgRoot());
};

/**
 * Move this block back to the workspace block canvas.
 * Generally should be called at the same time as setDragging_(false).
 * Does nothing if useDragSurface_ is false.
 * @param {!Coordinate} newXY The position the block should take on
 *     on the workspace canvas, in workspace coordinates.
 * @private
 */
BlockSvg.prototype.moveOffDragSurface_ = function(newXY) {
  if (!this.useDragSurface_) {
    return;
  }
  // Translate to current position, turning off 3d.
  this.translate(newXY.x, newXY.y);
  this.workspace.blockDragSurface_.clearAndHide(this.workspace.getCanvas());
};

/**
 * Move this block during a drag, taking into account whether we are using a
 * drag surface to translate blocks.
 * This block must be a top-level block.
 * @param {!Coordinate} newLoc The location to translate to, in
 *     workspace coordinates.
 * @package
 */
BlockSvg.prototype.moveDuringDrag = function(newLoc) {
  if (this.useDragSurface_) {
    this.workspace.blockDragSurface_.translateSurface(newLoc.x, newLoc.y);
  } else {
    this.svgGroup_.translate_ = 'translate(' + newLoc.x + ',' + newLoc.y + ')';
    this.svgGroup_.setAttribute('transform',
        this.svgGroup_.translate_ + this.svgGroup_.skew_);
  }
};

/**
 * Clear the block of transform="..." attributes.
 * Used when the block is switching from 3d to 2d transform or vice versa.
 * @private
 */
BlockSvg.prototype.clearTransformAttributes_ = function() {
  utils.removeAttribute(this.getSvgRoot(), 'transform');
};

/**
 * Snap this block to the nearest grid point.
 */
BlockSvg.prototype.snapToGrid = function() {
  if (!this.workspace) {
    return;  // Deleted block.
  }
  if (this.workspace.isDragging()) {
    return;  // Don't bump blocks during a drag.
  }
  if (this.getParent()) {
    return;  // Only snap top-level blocks.
  }
  if (this.isInFlyout) {
    return;  // Don't move blocks around in a flyout.
  }
  const grid = this.workspace.getGrid();
  if (!grid || !grid.shouldSnap()) {
    return;  // Config says no snapping.
  }
  const spacing = grid.getSpacing();
  const half = spacing / 2;
  const xy = this.getRelativeToSurfaceXY();
  let dx = Math.round((xy.x - half) / spacing) * spacing + half - xy.x;
  let dy = Math.round((xy.y - half) / spacing) * spacing + half - xy.y;
  dx = Math.round(dx);
  dy = Math.round(dy);
  if (dx != 0 || dy != 0) {
    this.moveBy(dx, dy);
  }
};

/**
 * Returns the coordinates of a bounding box describing the dimensions of this
 * block and any blocks stacked below it.
 * Coordinate system: workspace coordinates.
 * @return {!{topLeft: Coordinate, bottomRight: Coordinate}}
 *    Object with top left and bottom right coordinates of the bounding box.
 */
BlockSvg.prototype.getBoundingRectangle = function() {
  const blockXY = this.getRelativeToSurfaceXY(this);
  const blockBounds = this.getHeightWidth();
  let topLeft;
  let bottomRight;
  if (this.RTL) {
    topLeft = new Coordinate(blockXY.x - blockBounds.width,
        blockXY.y);
    bottomRight = new Coordinate(blockXY.x,
        blockXY.y + blockBounds.height);
  } else {
    topLeft = new Coordinate(blockXY.x, blockXY.y);
    bottomRight = new Coordinate(blockXY.x + blockBounds.width,
        blockXY.y + blockBounds.height);
  }

  return {topLeft: topLeft, bottomRight: bottomRight};
};

/**
 * Set block opacity for SVG rendering.
 * @param {number} opacity Intended opacity, betweeen 0 and 1
 */
BlockSvg.prototype.setOpacity = function(opacity) {
  this.opacity_ = opacity;
  if (this.rendered) {
    this.updateColour();
  }
};

/**
 * Get block opacity for SVG rendering.
 * @return {number} Intended opacity, betweeen 0 and 1
 */
BlockSvg.prototype.getOpacity = function() {
  return this.opacity_;
};

/**
 * Set whether the block is collapsed or not.
 * @param {boolean} collapsed True if collapsed.
 */
BlockSvg.prototype.setCollapsed = function(collapsed) {
  if (this.collapsed_ == collapsed) {
    return;
  }
  const renderList = [];
  // Show/hide the inputs.
  for (let i = 0, input; input = this.inputList[i]; i++) {
    renderList.push.apply(renderList, input.setVisible(!collapsed));
  }

  const COLLAPSED_INPUT_NAME = '_TEMP_COLLAPSED_INPUT';
  if (collapsed) {
    const icons = this.getIcons();
    for (let i = 0; i < icons.length; i++) {
      icons[i].setVisible(false);
    }
    const text = this.toString(constants.COLLAPSE_CHARS);
    this.appendDummyInput(COLLAPSED_INPUT_NAME).appendField(text).init();
  } else {
    this.removeInput(COLLAPSED_INPUT_NAME);
    // Clear any warnings inherited from enclosed blocks.
    this.setWarningText(null);
  }
  BlockSvg.superClass_.setCollapsed.call(this, collapsed);

  if (!renderList.length) {
    // No child blocks, just render this block.
    renderList[0] = this;
  }
  if (this.rendered) {
    for (let i = 0, block; block = renderList[i]; i++) {
      block.render();
    }
    // Don't bump neighbours.
    // Although bumping neighbours would make sense, users often collapse
    // all their functions and store them next to each other.  Expanding and
    // bumping causes all their definitions to go out of alignment.
  }
};

/**
 * Open the next (or previous) FieldTextInput.
 * @param {Field|Block} start Current location.
 * @param {boolean} forward If true go forward, otherwise backward.
 */
BlockSvg.prototype.tab = function(start, forward) {
  const list = this.createTabList_();
  let i = list.indexOf(start);
  if (i == -1) {
    // No start location, start at the beginning or end.
    i = forward ? -1 : list.length;
  }
  const target = list[forward ? i + 1 : i - 1];
  if (!target) {
    // Ran off of list.
    // If there is an output, tab up to that block.
    const outputBlock = this.outputConnection && this.outputConnection.targetBlock();
    if (outputBlock) {
      outputBlock.tab(this, forward);
    } else { // Otherwise, go to next / previous block, depending on value of `forward`
      const block = forward ? this.getNextBlock() : this.getPreviousBlock();
      if (block) {
        block.tab(this, forward);
      }
    }
  } else if (target instanceof Field) {
    target.showEditor_();
  } else {
    target.tab(null, forward);
  }
};

/**
 * Create an ordered list of all text fields and connected inputs.
 * @return {!Array.<!FieldTextInput|!Blockly.Input>} The ordered list.
 * @private
 */
BlockSvg.prototype.createTabList_ = function() {
  // This function need not be efficient since it runs once on a keypress.
  const list = [];
  for (let i = 0, input; input = this.inputList[i]; i++) {
    for (let j = 0, field; field = input.fieldRow[j]; j++) {
      if (field instanceof FieldTextInput) {
        // TODO(# 1276): Also support dropdown fields.
        list.push(field);
      }
    }
    if (input.connection) {
      const block = input.connection.targetBlock();
      if (block) {
        list.push(block);
      }
    }
  }
  return list;
};

/**
 * Handle a mouse-down on an SVG block.
 * @param {!Event} e Mouse down event or touch start event.
 * @private
 */
BlockSvg.prototype.onMouseDown_ = function(e) {
  const gesture = this.workspace && this.workspace.getGesture(e);
  if (gesture) {
    gesture.handleBlockStart(e, this);
  }
};

/**
 * Load the block's help page in a new window.
 * @private
 */
BlockSvg.prototype.showHelp_ = function() {
  const url = typeof this.helpUrl === 'function' ? this.helpUrl() : this.helpUrl;
  if (url) {
    // @todo rewrite
    alert(url);
  }
};


/**
 * Show the context menu for this block.
 * @param {!Event} e Mouse event.
 * @private
 */
BlockSvg.prototype.showContextMenu_ = function(e) {
  if (this.workspace.options.readOnly || !this.contextMenu) {
    return;
  }
  // Save the current block in a variable for use in closures.
  const block = this;
  const menuOptions = [];
  if (this.isDeletable() && this.isMovable() && !block.isInFlyout) {
    menuOptions.push(ContextMenu.blockDuplicateOption(block, e));
    if (this.isEditable() && this.workspace.options.comments) {
      menuOptions.push(ContextMenu.blockCommentOption(block));
    }
    menuOptions.push(ContextMenu.blockDeleteOption(block));
    if (this.workspace.options.clipboard) {
      menuOptions.push(ContextMenu.blockCopyOption(block));
    }
  } else if (this.parentBlock_ && this.isShadow_) {
    this.parentBlock_.showContextMenu_(e);
    return;
  }

  // Allow the block to add or modify menuOptions.
  if (this.customContextMenu) {
    this.customContextMenu(menuOptions);
  }
  ContextMenu.show(e, menuOptions, this.RTL);
  ContextMenu.currentBlock = this;
};

/**
 * Move the connections for this block and all blocks attached under it.
 * Also update any attached bubbles.
 * @param {number} dx Horizontal offset from current location, in workspace
 *     units.
 * @param {number} dy Vertical offset from current location, in workspace
 *     units.
 * @private
 */
BlockSvg.prototype.moveConnections_ = function(dx, dy) {
  if (!this.rendered) {
    // Rendering is required to lay out the blocks.
    // This is probably an invisible block attached to a collapsed block.
    return;
  }
  const myConnections = this.getConnections_(false);
  for (let i = 0; i < myConnections.length; i++) {
    myConnections[i].moveBy(dx, dy);
  }
  const icons = this.getIcons();
  for (let i = 0; i < icons.length; i++) {
    icons[i].computeIconLocation();
  }

  // Recurse through all blocks attached under this one.
  for (let i = 0; i < this.childBlocks_.length; i++) {
    this.childBlocks_[i].moveConnections_(dx, dy);
  }
};

/**
 * Recursively adds or removes the dragging class to this node and its children.
 * @param {boolean} adding True if adding, false if removing.
 * @package
 */
BlockSvg.prototype.setDragging = function(adding) {
  if (adding) {
    const group = this.getSvgRoot();
    group.translate_ = '';
    group.skew_ = '';
    common.draggingConnections.push(...this.getConnections_(true));
    utils.addClass(
        /** @type {!Element} */ (this.svgGroup_), 'blocklyDragging');
  } else {
    common.draggingConnections.length = 0;
    utils.removeClass(
        /** @type {!Element} */ (this.svgGroup_), 'blocklyDragging');
  }
  // Recurse through all blocks attached under this one.
  for (let i = 0; i < this.childBlocks_.length; i++) {
    this.childBlocks_[i].setDragging(adding);
  }
};

/**
 * Add or remove the UI indicating if this block is movable or not.
 */
BlockSvg.prototype.updateMovable = function() {
  if (this.isMovable()) {
    utils.addClass(
        /** @type {!Element} */ (this.svgGroup_), 'blocklyDraggable');
  } else {
    utils.removeClass(
        /** @type {!Element} */ (this.svgGroup_), 'blocklyDraggable');
  }
};

/**
 * Set whether this block is movable or not.
 * @param {boolean} movable True if movable.
 */
BlockSvg.prototype.setMovable = function(movable) {
  BlockSvg.superClass_.setMovable.call(this, movable);
  this.updateMovable();
};

/**
 * Set whether this block is editable or not.
 * @param {boolean} editable True if editable.
 */
BlockSvg.prototype.setEditable = function(editable) {
  BlockSvg.superClass_.setEditable.call(this, editable);
  const icons = this.getIcons();
  for (let i = 0; i < icons.length; i++) {
    icons[i].updateEditable();
  }
};

/**
 * Set whether this block is a shadow block or not.
 * @param {boolean} shadow True if a shadow.
 */
BlockSvg.prototype.setShadow = function(shadow) {
  BlockSvg.superClass_.setShadow.call(this, shadow);
  this.updateColour();
};

/**
 * Set whether this block is an insertion marker block or not.
 * @param {boolean} insertionMarker True if an insertion marker.
 * @param {Number=} opt_minWidth Optional minimum width of the marker.
 */
BlockSvg.prototype.setInsertionMarker = function(insertionMarker, opt_minWidth) {
  BlockSvg.superClass_.setInsertionMarker.call(this, insertionMarker);
  this.insertionMarkerMinWidth_ = opt_minWidth;
  this.updateColour();
};

/**
 * Return the root node of the SVG or null if none exists.
 * @return {Element} The root SVG node (probably a group).
 */
BlockSvg.prototype.getSvgRoot = function() {
  return this.svgGroup_;
};

/**
 * Dispose of this block.
 * @param {boolean} healStack If true, then try to heal any gap by connecting
 *     the next statement with the previous statement.  Otherwise, dispose of
 *     all children of this block.
 * @param {boolean} animate If true, show a disposal animation and sound.
 */
BlockSvg.prototype.dispose = function(healStack, animate) {
  if (!this.workspace) {
    // The block has already been deleted.
    return;
  }
  Tooltip.hide();
  utils.startTextWidthCache();
  // Save the block's workspace temporarily so we can resize the
  // contents once the block is disposed.
  const blockWorkspace = this.workspace;
  // If this block is being dragged, unlink the mouse events.
  if (common.getSelected() == this) {
    this.unselect();
    this.workspace.cancelCurrentGesture();
  }
  // If this block has a context menu open, close it.
  if (ContextMenu.currentBlock == this) {
    ContextMenu.hide();
  }

  if (animate && this.rendered) {
    this.unplug(healStack);
    BlockAnimations.disposeUiEffect(this);
  }
  // Stop rerendering.
  this.rendered = false;

  eventUtils.disable();
  try {
    const icons = this.getIcons();
    for (let i = 0; i < icons.length; i++) {
      icons[i].dispose();
    }
  } finally {
    eventUtils.enable();
  }
  BlockSvg.superClass_.dispose.call(this, healStack);
  
  blockWorkspace.virtualizedManager.unobserve(this);

  dom.removeNode(this.svgGroup_);
  blockWorkspace.resizeContents();
  // Sever JavaScript to DOM connections.
  this.svgGroup_ = null;
  this.svgPath_ = null;
  utils.stopTextWidthCache();
};

/**
 * Enable or disable a block.
 */
BlockSvg.prototype.updateDisabled = function() {
  // not supported
};

/**
 * Returns the comment on this block (or '' if none).
 * @return {string} Block's comment.
 */
BlockSvg.prototype.getCommentText = function() {
  if (this.comment) {
    const comment = this.comment.getText();
    // Trim off trailing whitespace.
    return comment.replace(/\s+$/, '').replace(/ +\n/g, '\n');
  }
  return '';
};

/**
 * Set this block's comment text.
 * @param {?string} text The text, or null to delete.
 * @param {string=} commentId Id of the comment, or a new one will be generated if not provided.
 * @param {number=} commentX Optional x position for scratch comment in workspace coordinates
 * @param {number=} commentY Optional y position for scratch comment in workspace coordinates
 * @param {boolean=} minimized Optional minimized state for scratch comment, defaults to false
 */
BlockSvg.prototype.setCommentText = function(text, commentId,
    commentX, commentY, minimized) {
  let changedState = false;
  if (typeof text === 'string') {
    if (!this.comment) {
      this.comment = new ScratchBlockComment(this, text, commentId,
          commentX, commentY, minimized);
      changedState = true;
    } else {
      this.comment.setText(/** @type {string} */ (text));
    }
  } else {
    if (this.comment) {
      this.comment.dispose();
      changedState = true;
    }
  }
  if (changedState && this.rendered) {
    this.render();
    if (typeof text === 'string') {
      this.comment.setVisible(true);
    }
    // Adding or removing a comment icon will cause the block to change shape.
    this.bumpNeighbours_();
  }
};

/**
 * Set this block's warning text.
 * @param {?string} text The text, or null to delete.
 * @param {string=} opt_id An optional ID for the warning text to be able to
 *     maintain multiple warnings.
 */
BlockSvg.prototype.setWarningText = function(text, opt_id) {
  if (!this.setWarningText.pid_) {
    // Create a database of warning PIDs.
    // Only runs once per block (and only those with warnings).
    this.setWarningText.pid_ = Object.create(null);
  }
  const id = opt_id || '';
  if (!id) {
    // Kill all previous pending processes, this edit supersedes them all.
    for (const n in this.setWarningText.pid_) {
      clearTimeout(this.setWarningText.pid_[n]);
      delete this.setWarningText.pid_[n];
    }
  } else if (this.setWarningText.pid_[id]) {
    // Only queue up the latest change.  Kill any earlier pending process.
    clearTimeout(this.setWarningText.pid_[id]);
    delete this.setWarningText.pid_[id];
  }
  if (this.workspace.isDragging()) {
    // Don't change the warning text during a drag.
    // Wait until the drag finishes.
    const thisBlock = this;
    this.setWarningText.pid_[id] = setTimeout(function() {
      if (thisBlock.workspace) {  // Check block wasn't deleted.
        delete thisBlock.setWarningText.pid_[id];
        thisBlock.setWarningText(text, id);
      }
    }, 100);
    return;
  }
  if (this.isInFlyout) {
    text = null;
  }

  let changedState = false;
  if (typeof text === 'string') {
    if (!this.warning) {
      this.warning = new Warning(this);
      changedState = true;
    }
    this.warning.setText(/** @type {string} */ (text), id);
  } else {
    // Dispose all warnings if no ID is given.
    if (this.warning && !id) {
      this.warning.dispose();
      changedState = true;
    } else if (this.warning) {
      const oldText = this.warning.getText();
      this.warning.setText('', id);
      const newText = this.warning.getText();
      if (!newText) {
        this.warning.dispose();
      }
      changedState = oldText != newText;
    }
  }
  if (changedState && this.rendered) {
    this.render();
    // Adding or removing a warning icon will cause the block to change shape.
    this.bumpNeighbours_();
  }
};

/**
 * Give this block a mutator dialog.
 * @param {Blockly.Mutator} mutator A mutator dialog instance or null to remove.
 */
BlockSvg.prototype.setMutator = function(mutator) {
  if (this.mutator && this.mutator !== mutator) {
    this.mutator.dispose();
  }
  if (mutator) {
    mutator.block_ = this;
    this.mutator = mutator;
    mutator.createIcon();
  }
};

/**
 * Select this block.  Highlight it visually.
 */
BlockSvg.prototype.addSelect = function() {
  utils.addClass(
      /** @type {!Element} */ (this.svgGroup_), 'blocklySelected');
};

/**
 * Unselect this block.  Remove its highlighting.
 */
BlockSvg.prototype.removeSelect = function() {
  utils.removeClass(
      /** @type {!Element} */ (this.svgGroup_),  'blocklySelected');
};

/**
 * Update the cursor over this block by adding or removing a class.
 * @param {boolean} letMouseThrough True if the blocks should ignore pointer
 *     events, false otherwise.
 * @package
 */
BlockSvg.prototype.setMouseThroughStyle = function(letMouseThrough) {
  if (letMouseThrough) {
    utils.addClass(/** @type {!Element} */ (this.svgGroup_),
        'blocklyDraggingMouseThrough');
  } else {
    utils.removeClass(/** @type {!Element} */ (this.svgGroup_),
        'blocklyDraggingMouseThrough');
  }
};

/**
 * Update the cursor over this block by adding or removing a class.
 * @param {boolean} enable True if the delete cursor should be shown, false
 *     otherwise.
 * @package
 */
BlockSvg.prototype.setDeleteStyle = function(enable) {
  if (enable) {
    utils.addClass(/** @type {!Element} */ (this.svgGroup_),
        'blocklyDraggingDelete');
  } else {
    utils.removeClass(/** @type {!Element} */ (this.svgGroup_),
        'blocklyDraggingDelete');
  }
};

// Overrides of functions on Block that take into account whether the
// block has been rendered.

/**
 * Change the visibility of a block.
 * @param {boolean} visible Whether block is visible
 */
BlockSvg.prototype.setVisible = function(visible) {
  if (visible === this.visible_) {
    return;
  }
  this.visible_ = visible;
  const svgRoot = this.getSvgRoot();
  if (!svgRoot) {
    return;
  }
  if (visible) svgRoot.style.display = '';
  else svgRoot.style.display = 'none';
};

/**
 * Change the colour of a block.
 * @param {number|string} colour HSV hue value, or #RRGGBB string.
 * @param {number|string} colourSecondary Secondary HSV hue value, or #RRGGBB
 *    string.
 * @param {number|string} colourTertiary Tertiary HSV hue value, or #RRGGBB
 *    string.
 * @param {number|string} colourQuaternary Quaternary HSV hue value, or #RRGGBB
 *    string.
 */
BlockSvg.prototype.setColour = function(colour, colourSecondary,
    colourTertiary, colourQuaternary) {
  BlockSvg.superClass_.setColour.call(this, colour, colourSecondary,
      colourTertiary, colourQuaternary);

  if (this.rendered) {
    this.updateColour();
  }
};

/**
 * Move this block to the front of the visible workspace.
 * <g> tags do not respect z-index so SVG renders them in the
 * order that they are in the DOM.  By placing this block first within the
 * block group's <g>, it will render on top of any other blocks.
 * @package
 */
BlockSvg.prototype.bringToFront = function() {
  let block = this;
  do {
    const root = block.getSvgRoot();
    root.parentNode.appendChild(root);
    block = block.getParent();
  } while (block);
};

/**
 * Set whether this block can chain onto the bottom of another block.
 * @param {boolean} newBoolean True if there can be a previous statement.
 * @param {(string|Array.<string>|null)=} opt_check Statement type or
 *     list of statement types.  Null/undefined if any type could be connected.
 */
BlockSvg.prototype.setPreviousStatement = function(newBoolean,
    opt_check) {
  BlockSvg.superClass_.setPreviousStatement.call(this, newBoolean,
      opt_check);

  if (this.rendered) {
    this.render();
    this.bumpNeighbours_();
  }
};

/**
 * Set whether another block can chain onto the bottom of this block.
 * @param {boolean} newBoolean True if there can be a next statement.
 * @param {(string|Array.<string>|null)=} opt_check Statement type or
 *     list of statement types.  Null/undefined if any type could be connected.
 */
BlockSvg.prototype.setNextStatement = function(newBoolean, opt_check) {
  BlockSvg.superClass_.setNextStatement.call(this, newBoolean,
      opt_check);

  if (this.rendered) {
    this.render();
    this.bumpNeighbours_();
  }
};

/**
 * Set whether this block returns a value.
 * @param {boolean} newBoolean True if there is an output.
 * @param {(string|Array.<string>|null)=} opt_check Returned type or list
 *     of returned types.  Null or undefined if any type could be returned
 *     (e.g. variable get).
 */
BlockSvg.prototype.setOutput = function(newBoolean, opt_check) {
  BlockSvg.superClass_.setOutput.call(this, newBoolean, opt_check);

  if (this.rendered) {
    this.render();
    this.bumpNeighbours_();
  }
};

/**
 * Set whether value inputs are arranged horizontally or vertically.
 * @param {boolean} newBoolean True if inputs are horizontal.
 */
BlockSvg.prototype.setInputsInline = function(newBoolean) {
  BlockSvg.superClass_.setInputsInline.call(this, newBoolean);

  if (this.rendered) {
    this.render();
    this.bumpNeighbours_();
  }
};

/**
 * Remove an input from this block.
 * @param {string} name The name of the input.
 * @param {boolean=} opt_quiet True to prevent error if input is not present.
 * @throws {asserts.AssertionError} if the input is not present and
 *     opt_quiet is not true.
 */
BlockSvg.prototype.removeInput = function(name, opt_quiet) {
  BlockSvg.superClass_.removeInput.call(this, name, opt_quiet);

  if (this.rendered) {
    this.render();
    // Removing an input will cause the block to change shape.
    this.bumpNeighbours_();
  }
};

/**
 * Move a numbered input to a different location on this block.
 * @param {number} inputIndex Index of the input to move.
 * @param {number} refIndex Index of input that should be after the moved input.
 */
BlockSvg.prototype.moveNumberedInputBefore = function(
    inputIndex, refIndex) {
  BlockSvg.superClass_.moveNumberedInputBefore.call(this, inputIndex,
      refIndex);

  if (this.rendered) {
    this.render();
    // Moving an input will cause the block to change shape.
    this.bumpNeighbours_();
  }
};

/**
 * Add a value input, statement input or local variable to this block.
 * @param {number} type Either Blockly.constants.INPUT_VALUE or Blockly.constants.NEXT_STATEMENT or
 *     Blockly.constants.DUMMY_INPUT.
 * @param {string} name Language-neutral identifier which may used to find this
 *     input again.  Should be unique to this block.
 * @return {!Blockly.Input} The input object created.
 * @private
 */
BlockSvg.prototype.appendInput_ = function(type, name) {
  const input = BlockSvg.superClass_.appendInput_.call(this, type, name);

  if (this.rendered) {
    this.render();
    // Adding an input will cause the block to change shape.
    this.bumpNeighbours_();
  }
  return input;
};

/**
 * Returns connections originating from this block.
 * @param {boolean} all If true, return all connections even hidden ones.
 *     Otherwise, for a non-rendered block return an empty list, and for a
 *     collapsed block don't return inputs connections.
 * @return {!Array.<!Blockly.Connection>} Array of connections.
 * @package
 */
BlockSvg.prototype.getConnections_ = function(all) {
  const myConnections = [];
  if (all || this.rendered) {
    if (this.outputConnection) {
      myConnections.push(this.outputConnection);
    }
    if (this.previousConnection) {
      myConnections.push(this.previousConnection);
    }
    if (this.nextConnection) {
      myConnections.push(this.nextConnection);
    }
    if (all || !this.collapsed_) {
      for (let i = 0, input; input = this.inputList[i]; i++) {
        if (input.connection) {
          myConnections.push(input.connection);
        }
      }
    }
  }
  return myConnections;
};

/**
 * Create a connection of the specified type.
 * @param {number} type The type of the connection to create.
 * @return {!RenderedConnection} A new connection of the specified type.
 * @private
 */
BlockSvg.prototype.makeConnection_ = function(type) {
  return new RenderedConnection(this, type);
};

/**
 * Bump unconnected blocks out of alignment.  Two blocks which aren't actually
 * connected should not coincidentally line up on screen.
 * @private
 */
BlockSvg.prototype.bumpNeighbours_ = function() {
  if (!this.workspace) {
    return;  // Deleted block.
  }
  if (this.workspace.isDragging()) {
    return;  // Don't bump blocks during a drag.
  }
  const rootBlock = this.getRootBlock();
  if (rootBlock.isInFlyout) {
    return;  // Don't move blocks around in a flyout.
  }
  // Loop through every connection on this block.
  const myConnections = this.getConnections_(false);
  for (let i = 0, connection; connection = myConnections[i]; i++) {

    // Spider down from this block bumping all sub-blocks.
    if (connection.isConnected() && connection.isSuperior()) {
      connection.targetBlock().bumpNeighbours_();
    }

    const neighbours = connection.neighbours_(constants.SNAP_RADIUS);
    for (let j = 0, otherConnection; otherConnection = neighbours[j]; j++) {

      // If both connections are connected, that's probably fine.  But if
      // either one of them is unconnected, then there could be confusion.
      if (!connection.isConnected() || !otherConnection.isConnected()) {
        // Only bump blocks if they are from different tree structures.
        if (otherConnection.getSourceBlock().getRootBlock() != rootBlock) {

          // Always bump the inferior block.
          if (connection.isSuperior()) {
            otherConnection.bumpAwayFrom_(connection);
          } else {
            connection.bumpAwayFrom_(otherConnection);
          }
        }
      }
    }
  }
};

/**
 * Schedule snapping to grid and bumping neighbours to occur after a brief
 * delay.
 * @package
 */
BlockSvg.prototype.scheduleSnapAndBump = function() {
  const block = this;
  // Ensure that any snap and bump are part of this move's event group.
  const group = eventUtils.getGroup();

  setTimeout(function() {
    eventUtils.setGroup(group);
    block.snapToGrid();
    eventUtils.setGroup(false);
  }, constants.BUMP_DELAY / 2);

  setTimeout(function() {
    eventUtils.setGroup(group);
    block.bumpNeighbours_();
    eventUtils.setGroup(false);
  }, constants.BUMP_DELAY);
};

/**
 * Update block observe status.
 * @package
 */
BlockSvg.prototype.updateObserve = function() {
  if (!this.workspace.virtualizedManager) return;
  if (this.getParent()) {
    this.workspace.virtualizedManager.unobserve(this);
    if (!this.visible_) {
      this.setVisible(true);
    }
  } else {
    this.workspace.virtualizedManager.observe(this);
  }
};
