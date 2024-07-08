/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2013 Google Inc.
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
 * @fileoverview Object representing an icon on a block.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Icon');

import * as browserEvents from './browser_events';
import * as rendererConstants from './renderer/constants';
import * as utils from './utils';

const dom = goog.require('goog.dom');
const Coordinate = goog.require('goog.math.Coordinate');

/**
 * Class for an icon.
 */
export class Icon {
  /**
   * @param {Blockly.Block} block The block associated with this icon.
   */
  constructor(block) {
    /**
     * Does this icon get hidden when the block is collapsed.
     */
    this.collapseHidden = true;

    /**
     * Height and width of icons.
     */
    this.SIZE = 17;

    /**
     * Bubble UI (if visible).
     * @type {Blockly.Bubble}
     * @protected
     */
    this.bubble_ = null;

    /**
     * Absolute coordinate of icon's center.
     * @type {Coordinate}
     * @protected
     */
    this.iconXY_ = null;

    this.block_ = block;
  }
  /**
   * Create the icon on the block.
   */
  createIcon() {
    if (this.iconGroup_) {
      // Icon already exists.
      return;
    }
    /* Here's the markup that will be generated:
    <g class="blocklyIconGroup">
      ...
    </g>
    */
    this.iconGroup_ = utils.createSvgElement('g',
        { 'class': 'blocklyIconGroup' }, null);
    if (this.block_.isInFlyout) {
      utils.addClass(
          /** @type {!Element} */(this.iconGroup_), 'blocklyIconGroupReadonly');
    }
    this.drawIcon_(this.iconGroup_);

    this.block_.getSvgRoot().appendChild(this.iconGroup_);
    browserEvents.conditionalBind(
        this.iconGroup_, 'mouseup', this, this.iconClick_);
    this.updateEditable();
  }
  /**
   * Dispose of this icon.
   */
  dispose() {
    // Dispose of and unlink the icon.
    dom.removeNode(this.iconGroup_);
    this.iconGroup_ = null;
    // Dispose of and unlink the bubble.
    this.setVisible(false);
    this.block_ = null;
  }
  /**
   * Add or remove the UI indicating if this icon may be clicked or not.
   */
  updateEditable() {
  }
  /**
   * Is the associated bubble visible?
   * @return {boolean} True if the bubble is visible.
   */
  isVisible() {
    return !!this.bubble_;
  }
  /**
   * Clicking on the icon toggles if the bubble is visible.
   * @param {!Event} e Mouse click event.
   * @protected
   */
  iconClick_(e) {
    if (this.block_.workspace.isDragging()) {
      // Drag operation is concluding.  Don't open the editor.
      return;
    }
    if (!this.block_.isInFlyout && !utils.isRightButton(e)) {
      this.setVisible(!this.isVisible());
    }
  }
  /**
   * Change the colour of the associated bubble to match its block.
   */
  updateColour() {
    if (this.isVisible()) {
      this.bubble_.setColour(this.block_.getColour());
    }
  }
  /**
   * Render the icon.
   * @param {number} cursorX Horizontal offset at which to position the icon.
   * @return {number} Horizontal offset for next item to draw.
   */
  renderIcon(cursorX) {
    if (this.collapseHidden && this.block_.isCollapsed()) {
      this.iconGroup_.setAttribute('display', 'none');
      return cursorX;
    }
    this.iconGroup_.setAttribute('display', 'block');

    const TOP_MARGIN = 5;
    const width = this.SIZE;
    if (this.block_.RTL) {
      cursorX -= width;
    }
    this.iconGroup_.setAttribute('transform',
        'translate(' + cursorX + ',' + TOP_MARGIN + ')');
    this.computeIconLocation();
    if (this.block_.RTL) {
      cursorX -= rendererConstants.SEP_SPACE_X;
    } else {
      cursorX += width + rendererConstants.SEP_SPACE_X;
    }
    return cursorX;
  }
  /**
   * Notification that the icon has moved.  Update the arrow accordingly.
   * @param {!Coordinate} xy Absolute location in workspace coordinates.
   */
  setIconLocation(xy) {
    this.iconXY_ = xy;
    if (this.isVisible()) {
      this.bubble_.setAnchorLocation(xy);
    }
  }
  /**
   * Notification that the icon has moved, but we don't really know where.
   * Recompute the icon's location from scratch.
   */
  computeIconLocation() {
    // Find coordinates for the centre of the icon and update the arrow.
    const blockXY = this.block_.getRelativeToSurfaceXY();
    const iconXY = utils.getRelativeXY(this.iconGroup_);
    const newXY = new Coordinate(
        blockXY.x + iconXY.x + this.SIZE / 2,
        blockXY.y + iconXY.y + this.SIZE / 2);
    if (!Coordinate.equals(this.getIconLocation(), newXY)) {
      this.setIconLocation(newXY);
    }
  }
  /**
   * Returns the center of the block's icon relative to the surface.
   * @return {!Coordinate} Object with x and y properties in workspace
   *     coordinates.
   */
  getIconLocation() {
    return this.iconXY_;
  }
}
