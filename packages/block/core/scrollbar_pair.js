/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2011 Google Inc.
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
 * @fileoverview Library for creating scrollbars.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.ScrollbarPair');

import {Scrollbar} from './scrollbar';
import * as utils from './utils';

const dom = goog.require('goog.dom');


/**
 * A note on units: most of the numbers that are in CSS pixels are scaled if the
 * scrollbar is in a mutator.
 */

/**
 * Class for a pair of scrollbars.  Horizontal and vertical.
 */
export class ScrollbarPair {
  /**
   * @param {!Blockly.Workspace} workspace Workspace to bind the scrollbars to.
   */
  constructor(workspace) {
    /**
     * Previously recorded metrics from the workspace.
     * @type {Object}
     * @private
     */
    this.oldHostMetrics_ = null;

    this.workspace_ = workspace;
    this.hScroll = new Scrollbar(
        workspace, true, true, 'blocklyMainWorkspaceScrollbar');
    this.vScroll = new Scrollbar(
        workspace, false, true, 'blocklyMainWorkspaceScrollbar');
    this.corner_ = utils.createSvgElement(
        'rect',
        {
          'height': Scrollbar.scrollbarThickness,
          'width': Scrollbar.scrollbarThickness,
          'class': 'blocklyScrollbarBackground'
        },
        null);
    utils.insertAfter(this.corner_, workspace.getBubbleCanvas());
  }

  /**
   * Dispose of this pair of scrollbars.
   * Unlink from all DOM elements to prevent memory leaks.
   */
  dispose() {
    dom.removeNode(this.corner_);
    this.corner_ = null;
    this.workspace_ = null;
    this.oldHostMetrics_ = null;
    this.hScroll.dispose();
    this.hScroll = null;
    this.vScroll.dispose();
    this.vScroll = null;
  }

  /**
   * Recalculate both of the scrollbars' locations and lengths.
   * Also reposition the corner rectangle.
   */
  resize() {
    // Look up the host metrics once, and use for both scrollbars.
    const hostMetrics = this.workspace_.getMetrics();
    if (!hostMetrics) {
      // Host element is likely not visible.
      return;
    }

    // Only change the scrollbars if there has been a change in metrics.
    let resizeH = false;
    let resizeV = false;
    if (!this.oldHostMetrics_ ||
        this.oldHostMetrics_.viewWidth != hostMetrics.viewWidth ||
        this.oldHostMetrics_.viewHeight != hostMetrics.viewHeight ||
        this.oldHostMetrics_.absoluteTop != hostMetrics.absoluteTop ||
        this.oldHostMetrics_.absoluteLeft != hostMetrics.absoluteLeft) {
      // The window has been resized or repositioned.
      resizeH = true;
      resizeV = true;
    } else {
      // Has the content been resized or moved?
      if (!this.oldHostMetrics_ ||
          this.oldHostMetrics_.contentWidth != hostMetrics.contentWidth ||
          this.oldHostMetrics_.viewLeft != hostMetrics.viewLeft ||
          this.oldHostMetrics_.contentLeft != hostMetrics.contentLeft) {
        resizeH = true;
      }
      if (!this.oldHostMetrics_ ||
          this.oldHostMetrics_.contentHeight != hostMetrics.contentHeight ||
          this.oldHostMetrics_.viewTop != hostMetrics.viewTop ||
          this.oldHostMetrics_.contentTop != hostMetrics.contentTop) {
        resizeV = true;
      }
    }
    if (resizeH) {
      this.hScroll.resize(hostMetrics);
    }
    if (resizeV) {
      this.vScroll.resize(hostMetrics);
    }

    // Reposition the corner square.
    if (!this.oldHostMetrics_ ||
        this.oldHostMetrics_.viewWidth != hostMetrics.viewWidth ||
        this.oldHostMetrics_.absoluteLeft != hostMetrics.absoluteLeft) {
      this.corner_.setAttribute('x', this.vScroll.position_.x);
    }
    if (!this.oldHostMetrics_ ||
        this.oldHostMetrics_.viewHeight != hostMetrics.viewHeight ||
        this.oldHostMetrics_.absoluteTop != hostMetrics.absoluteTop) {
      this.corner_.setAttribute('y', this.hScroll.position_.y);
    }

    // Cache the current metrics to potentially short-cut the next resize event.
    this.oldHostMetrics_ = hostMetrics;
  }

  /**
   * Set the handles of both scrollbars to be at a certain position in CSS pixels
   * relative to their parents.
   * @param {number} x Horizontal scroll value.
   * @param {number} y Vertical scroll value.
   */
  set(x, y) {
    // This function is equivalent to:
    //   this.hScroll.set(x);
    //   this.vScroll.set(y);
    // However, that calls setMetrics twice which causes a chain of
    // getAttribute->setAttribute->getAttribute resulting in an extra layout pass.
    // Combining them speeds up rendering.
    const xyRatio = {};

    const hHandlePosition = x * this.hScroll.ratio_;
    const vHandlePosition = y * this.vScroll.ratio_;

    const hBarLength = this.hScroll.scrollViewSize_;
    const vBarLength = this.vScroll.scrollViewSize_;

    xyRatio.x = this.getRatio_(hHandlePosition, hBarLength);
    xyRatio.y = this.getRatio_(vHandlePosition, vBarLength);
    this.workspace_.setMetrics(xyRatio);

    this.hScroll.setHandlePosition(hHandlePosition);
    this.vScroll.setHandlePosition(vHandlePosition);
  }

  /**
   * Helper to calculate the ratio of handle position to scrollbar view size.
   * @param {number} handlePosition The value of the handle.
   * @param {number} viewSize The total size of the scrollbar's view.
   * @return {number} Ratio.
   * @private
   */
  getRatio_(handlePosition, viewSize) {
    const ratio = handlePosition / viewSize;
    if (isNaN(ratio)) {
      return 0;
    }
    return ratio;
  }

  /**
   * Set whether this scrollbar's container is visible.
   * @param {boolean} visible Whether the container is visible.
   */
  setContainerVisible(visible) {
    this.hScroll.setContainerVisible(visible);
    this.vScroll.setContainerVisible(visible);
  }
}
