/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2016 Google Inc.
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
 * @fileoverview A class that manages a surface for dragging blocks.  When a
 * block drag is started, we move the block (and children) to a separate DOM
 * element that we move around using translate3d. At the end of the drag, the
 * blocks are put back in into the SVG they came from. This helps performance by
 * avoiding repainting the entire SVG on every mouse move while dragging blocks.
 * @author picklesrus
 */

'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.BlockDragSurfaceSvg');

import {Colours} from './colours';
import * as constants from './constants';
import * as utils from './utils';

const asserts = goog.require('goog.asserts');
const Coordinate = goog.require('goog.math.Coordinate');


/**
 * Class for a drag surface for the currently dragged block. This is a separate
 * SVG that contains only the currently moving block, or nothing.
 * @param {!Element} container Containing element.
 * @constructor
 */
export const BlockDragSurfaceSvg = function(container) {
  /**
   * @type {!Element}
   * @private
   */
  this.container_ = container;
  this.createDom();
};

/**
 * The SVG drag surface. Set once by BlockDragSurfaceSvg.createDom.
 * @type {Element}
 * @private
 */
BlockDragSurfaceSvg.prototype.SVG_ = null;

/**
 * This is where blocks live while they are being dragged if the drag surface
 * is enabled.
 * @type {Element}
 * @private
 */
BlockDragSurfaceSvg.prototype.dragGroup_ = null;

/**
 * Containing HTML element; parent of the workspace and the drag surface.
 * @type {Element}
 * @private
 */
BlockDragSurfaceSvg.prototype.container_ = null;

/**
 * Cached value for the scale of the drag surface.
 * Used to set/get the correct translation during and after a drag.
 * @type {number}
 * @private
 */
BlockDragSurfaceSvg.prototype.scale_ = 1;

/**
 * Cached value for the translation of the drag surface.
 * This translation is in pixel units, because the scale is applied to the
 * drag group rather than the top-level SVG.
 * @type {Coordinate}
 * @private
 */
BlockDragSurfaceSvg.prototype.surfaceXY_ = null;

/**
 * ID for the drag shadow filter, set in createDom.
 * Belongs in Scratch Blocks but not Blockly.
 * @type {string}
 * @private
 */
BlockDragSurfaceSvg.prototype.dragShadowFilterId_ = '';

/**
 * Standard deviation for gaussian blur on drag shadow, in px.
 * Belongs in Scratch Blocks but not Blockly.
 * @type {number}
 * @const
 */
BlockDragSurfaceSvg.SHADOW_STD_DEVIATION = 6;

/**
 * Create the drag surface and inject it into the container.
 */
BlockDragSurfaceSvg.prototype.createDom = function() {
  if (this.SVG_) {
    return;  // Already created.
  }
  this.SVG_ = utils.createSvgElement('svg',
      {
        'xmlns': constants.SVG_NS,
        'xmlns:html': constants.HTML_NS,
        'xmlns:xlink': 'http://www.w3.org/1999/xlink',
        'version': '1.1',
        'class': 'blocklyBlockDragSurface'
      }, this.container_);
  this.dragGroup_ = utils.createSvgElement('g', {}, this.SVG_);
  // Belongs in Scratch Blocks, but not Blockly.
  const defs = utils.createSvgElement('defs', {}, this.SVG_);
  this.dragShadowFilterId_ = this.createDropShadowDom_(defs);
  this.dragGroup_.setAttribute(
      'filter', 'url(#' + this.dragShadowFilterId_ + ')');
};

/**
 * Scratch-specific: Create the SVG def for the drop shadow.
 * @param {Element} defs Defs element to insert the shadow filter definition
 * @return {string} ID for the filter element
 * @private
 */
BlockDragSurfaceSvg.prototype.createDropShadowDom_ = function(defs) {
  const rnd = String(Math.random()).substring(2);
  // Adjust these width/height, x/y properties to stop the shadow from clipping
  const dragShadowFilter = utils.createSvgElement('filter',
      {
        'id': 'blocklyDragShadowFilter' + rnd,
        'height': '140%',
        'width': '140%',
        'y': '-20%',
        'x': '-20%'
      },
      defs);
  utils.createSvgElement('feGaussianBlur',
      {
        'in': 'SourceAlpha',
        'stdDeviation': BlockDragSurfaceSvg.SHADOW_STD_DEVIATION
      },
      dragShadowFilter);
  const componentTransfer = utils.createSvgElement(
      'feComponentTransfer', {'result': 'offsetBlur'}, dragShadowFilter);
  // Shadow opacity is specified in the adjustable colour library,
  // since the darkness of the shadow largely depends on the workspace colour.
  utils.createSvgElement('feFuncA',
      {
        'type': 'linear',
        'slope': Colours.dragShadowOpacity
      },
      componentTransfer);
  utils.createSvgElement('feComposite',
      {
        'in': 'SourceGraphic',
        'in2': 'offsetBlur',
        'operator': 'over'
      },
      dragShadowFilter);
  return dragShadowFilter.id;
};

/**
 * Set the SVG blocks on the drag surface's group and show the surface.
 * Only one block group should be on the drag surface at a time.
 * @param {!Element} blocks Block or group of blocks to place on the drag
 * surface.
 */
BlockDragSurfaceSvg.prototype.setBlocksAndShow = function(blocks) {
  asserts.assert(
      this.dragGroup_.childNodes.length == 0, 'Already dragging a block.');
  // appendChild removes the blocks from the previous parent
  this.dragGroup_.appendChild(blocks);
  this.SVG_.style.display = 'block';
  this.surfaceXY_ = new Coordinate(0, 0);
  // This allows blocks to be dragged outside of the blockly svg space.
  // This should be reset to hidden at the end of the block drag.
  // Note that this behavior is different from blockly where block disappear
  // "under" the blockly area.
  const injectionDiv = document.getElementsByClassName('injectionDiv')[0];
  injectionDiv.style.overflow = 'visible';
};

/**
 * Translate and scale the entire drag surface group to the given position, to
 * keep in sync with the workspace.
 * @param {number} x X translation in workspace coordinates.
 * @param {number} y Y translation in workspace coordinates.
 * @param {number} scale Scale of the group.
 */
BlockDragSurfaceSvg.prototype.translateAndScaleGroup = function(x, y, scale) {
  this.scale_ = scale;
  // This is a work-around to prevent a the blocks from rendering
  // fuzzy while they are being dragged on the drag surface.
  const fixedX = x.toFixed(0);
  const fixedY = y.toFixed(0);
  this.dragGroup_.setAttribute('transform',
      'translate(' + fixedX + ',' + fixedY + ') scale(' + scale + ')');
};

/**
 * Translate the drag surface's SVG based on its internal state.
 * @private
 */
BlockDragSurfaceSvg.prototype.translateSurfaceInternal_ = function() {
  let x = this.surfaceXY_.x;
  let y = this.surfaceXY_.y;
  // This is a work-around to prevent a the blocks from rendering
  // fuzzy while they are being dragged on the drag surface.
  x = x.toFixed(0);
  y = y.toFixed(0);
  this.SVG_.style.display = 'block';

  utils.setCssTransform(this.SVG_,
      'translate3d(' + x + 'px, ' + y + 'px, 0px)');
};

/**
 * Translate the entire drag surface during a drag.
 * We translate the drag surface instead of the blocks inside the surface
 * so that the browser avoids repainting the SVG.
 * Because of this, the drag coordinates must be adjusted by scale.
 * @param {number} x X translation for the entire surface.
 * @param {number} y Y translation for the entire surface.
 */
BlockDragSurfaceSvg.prototype.translateSurface = function(x, y) {
  this.surfaceXY_ = new Coordinate(x * this.scale_, y * this.scale_);
  this.translateSurfaceInternal_();
};

/**
 * Reports the surface translation in scaled workspace coordinates.
 * Use this when finishing a drag to return blocks to the correct position.
 * @return {!Coordinate} Current translation of the surface.
 */
BlockDragSurfaceSvg.prototype.getSurfaceTranslation = function() {
  const xy = utils.getRelativeXY(this.SVG_);
  return new Coordinate(xy.x / this.scale_, xy.y / this.scale_);
};

/**
 * Provide a reference to the drag group (primarily for
 * BlockSvg.getRelativeToSurfaceXY).
 * @return {Element} Drag surface group element.
 */
BlockDragSurfaceSvg.prototype.getGroup = function() {
  return this.dragGroup_;
};

/**
 * Get the current blocks on the drag surface, if any (primarily
 * for BlockSvg.getRelativeToSurfaceXY).
 * @return {!Element|undefined} Drag surface block DOM element, or undefined
 * if no blocks exist.
 */
BlockDragSurfaceSvg.prototype.getCurrentBlock = function() {
  return this.dragGroup_.firstChild;
};

/**
 * Clear the group and hide the surface; move the blocks off onto the provided
 * element.
 * If the block is being deleted it doesn't need to go back to the original
 * surface, since it would be removed immediately during dispose.
 * @param {Element=} opt_newSurface Surface the dragging blocks should be moved
 *     to, or null if the blocks should be removed from this surface without
 *     being moved to a different surface.
 */
BlockDragSurfaceSvg.prototype.clearAndHide = function(opt_newSurface) {
  if (opt_newSurface) {
    // appendChild removes the node from this.dragGroup_
    opt_newSurface.appendChild(this.getCurrentBlock());
  } else {
    this.dragGroup_.removeChild(this.getCurrentBlock());
  }
  this.SVG_.style.display = 'none';
  asserts.assert(
      this.dragGroup_.childNodes.length == 0, 'Drag group was not cleared.');
  this.surfaceXY_ = null;

  // Reset the overflow property back to hidden so that nothing appears outside
  // of the blockly area.
  // Note that this behavior is different from blockly. See note in
  // setBlocksAndShow.
  const injectionDiv = document.getElementsByClassName('injectionDiv')[0];
  injectionDiv.style.overflow = 'hidden';
};
