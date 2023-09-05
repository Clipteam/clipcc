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
 * @fileoverview Object representing a trash can icon.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Trashcan');

import * as browserEvents from './browser_events';
import * as constants from './constants';
import {Scrollbar} from './scrollbar';
import * as utils from './utils';

const dom = goog.require('goog.dom');
const Rect = goog.require('goog.math.Rect');


/**
 * Class for a trash can.
 * @param {!Blockly.Workspace} workspace The workspace to sit in.
 * @constructor
 */
export const Trashcan = function(workspace) {
  this.workspace_ = workspace;
};

/**
 * Width of both the trash can and lid images.
 * @type {number}
 * @private
 */
Trashcan.prototype.WIDTH_ = 47;

/**
 * Height of the trashcan image (minus lid).
 * @type {number}
 * @private
 */
Trashcan.prototype.BODY_HEIGHT_ = 44;

/**
 * Height of the lid image.
 * @type {number}
 * @private
 */
Trashcan.prototype.LID_HEIGHT_ = 16;

/**
 * Distance between trashcan and bottom edge of workspace.
 * @type {number}
 * @private
 */
Trashcan.prototype.MARGIN_BOTTOM_ = 20;

/**
 * Distance between trashcan and right edge of workspace.
 * @type {number}
 * @private
 */
Trashcan.prototype.MARGIN_SIDE_ = 20;

/**
 * Extent of hotspot on all sides beyond the size of the image.
 * @type {number}
 * @private
 */
Trashcan.prototype.MARGIN_HOTSPOT_ = 10;

/**
 * Location of trashcan in sprite image.
 * @type {number}
 * @private
 */
Trashcan.prototype.SPRITE_LEFT_ = 0;

/**
 * Location of trashcan in sprite image.
 * @type {number}
 * @private
 */
Trashcan.prototype.SPRITE_TOP_ = 32;

/**
 * Current open/close state of the lid.
 * @type {boolean}
 */
Trashcan.prototype.isOpen = false;

/**
 * The SVG group containing the trash can.
 * @type {Element}
 * @private
 */
Trashcan.prototype.svgGroup_ = null;

/**
 * The SVG image element of the trash can lid.
 * @type {Element}
 * @private
 */
Trashcan.prototype.svgLid_ = null;

/**
 * Task ID of opening/closing animation.
 * @type {number}
 * @private
 */
Trashcan.prototype.lidTask_ = 0;

/**
 * Current state of lid opening (0.0 = closed, 1.0 = open).
 * @type {number}
 * @private
 */
Trashcan.prototype.lidOpen_ = 0;

/**
 * Left coordinate of the trash can.
 * @type {number}
 * @private
 */
Trashcan.prototype.left_ = 0;

/**
 * Top coordinate of the trash can.
 * @type {number}
 * @private
 */
Trashcan.prototype.top_ = 0;

/**
 * Create the trash can elements.
 * @return {!Element} The trash can's SVG group.
 */
Trashcan.prototype.createDom = function() {
  /* Here's the markup that will be generated:
  <g class="blocklyTrash">
    <clippath id="blocklyTrashBodyClipPath837493">
      <rect width="47" height="45" y="15"></rect>
    </clippath>
    <image width="64" height="92" y="-32" xlink:href="media/sprites.png"
        clip-path="url(#blocklyTrashBodyClipPath837493)"></image>
    <clippath id="blocklyTrashLidClipPath837493">
      <rect width="47" height="15"></rect>
    </clippath>
    <image width="84" height="92" y="-32" xlink:href="media/sprites.png"
        clip-path="url(#blocklyTrashLidClipPath837493)"></image>
  </g>
  */
  this.svgGroup_ = utils.createSvgElement('g',
      {'class': 'blocklyTrash'}, null);
  let clip;
  const rnd = String(Math.random()).substring(2);
  clip = utils.createSvgElement('clipPath',
      {'id': 'blocklyTrashBodyClipPath' + rnd},
      this.svgGroup_);
  utils.createSvgElement('rect',
      {
        'width': this.WIDTH_,
        'height': this.BODY_HEIGHT_,
        'y': this.LID_HEIGHT_
      },
      clip);
  const body = utils.createSvgElement('image',
      {
        'width': constants.SPRITE.width,
        'x': -this.SPRITE_LEFT_,
        'height': constants.SPRITE.height,
        'y': -this.SPRITE_TOP_,
        'clip-path': 'url(#blocklyTrashBodyClipPath' + rnd + ')'
      },
      this.svgGroup_);
  body.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
      this.workspace_.options.pathToMedia + constants.SPRITE.url);

  clip = utils.createSvgElement('clipPath',
      {'id': 'blocklyTrashLidClipPath' + rnd},
      this.svgGroup_);
  utils.createSvgElement('rect',
      {'width': this.WIDTH_, 'height': this.LID_HEIGHT_}, clip);
  this.svgLid_ = utils.createSvgElement('image',
      {
        'width': constants.SPRITE.width,
        'x': -this.SPRITE_LEFT_,
        'height': constants.SPRITE.height,
        'y': -this.SPRITE_TOP_,
        'clip-path': 'url(#blocklyTrashLidClipPath' + rnd + ')'
      },
      this.svgGroup_);
  this.svgLid_.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
      this.workspace_.options.pathToMedia + constants.SPRITE.url);

  browserEvents.conditionalBind(this.svgGroup_, 'mouseup', this, this.click);
  this.animateLid_();
  return this.svgGroup_;
};

/**
 * Initialize the trash can.
 * @param {number} bottom Distance from workspace bottom to bottom of trashcan.
 * @return {number} Distance from workspace bottom to the top of trashcan.
 */
Trashcan.prototype.init = function(bottom) {
  this.bottom_ = this.MARGIN_BOTTOM_ + bottom;
  this.setOpen_(false);
  return this.bottom_ + this.BODY_HEIGHT_ + this.LID_HEIGHT_;
};

/**
 * Dispose of this trash can.
 * Unlink from all DOM elements to prevent memory leaks.
 */
Trashcan.prototype.dispose = function() {
  if (this.svgGroup_) {
    dom.removeNode(this.svgGroup_);
    this.svgGroup_ = null;
  }
  this.svgLid_ = null;
  this.workspace_ = null;
  clearTimeout(this.lidTask_);
};

/**
 * Move the trash can to the bottom-right corner.
 */
Trashcan.prototype.position = function() {
  const metrics = this.workspace_.getMetrics();
  if (!metrics) {
    // There are no metrics available (workspace is probably not visible).
    return;
  }
  if (this.workspace_.RTL) {
    this.left_ = this.MARGIN_SIDE_ + Scrollbar.scrollbarThickness;
    if (metrics.toolboxPosition == constants.TOOLBOX_AT_LEFT) {
      this.left_ += metrics.flyoutWidth;
      if (this.workspace_.toolbox_) {
        this.left_ += metrics.absoluteLeft;
      }
    }
  } else {
    this.left_ = metrics.viewWidth + metrics.absoluteLeft -
        this.WIDTH_ - this.MARGIN_SIDE_ - Scrollbar.scrollbarThickness;

    if (metrics.toolboxPosition == constants.TOOLBOX_AT_RIGHT) {
      this.left_ -= metrics.flyoutWidth;
    }
  }
  this.top_ = metrics.viewHeight + metrics.absoluteTop -
      (this.BODY_HEIGHT_ + this.LID_HEIGHT_) - this.bottom_;

  if (metrics.toolboxPosition == constants.TOOLBOX_AT_BOTTOM) {
    this.top_ -= metrics.flyoutHeight;
  }
  this.svgGroup_.setAttribute('transform',
      'translate(' + this.left_ + ',' + this.top_ + ')');
};

/**
 * Return the deletion rectangle for this trash can.
 * @return {Rect} Rectangle in which to delete.
 */
Trashcan.prototype.getClientRect = function() {
  if (!this.svgGroup_) {
    return null;
  }

  const trashRect = this.svgGroup_.getBoundingClientRect();
  const left = trashRect.left + this.SPRITE_LEFT_ - this.MARGIN_HOTSPOT_;
  const top = trashRect.top + this.SPRITE_TOP_ - this.MARGIN_HOTSPOT_;
  const width = this.WIDTH_ + 2 * this.MARGIN_HOTSPOT_;
  const height = this.LID_HEIGHT_ + this.BODY_HEIGHT_ + 2 * this.MARGIN_HOTSPOT_;
  return new Rect(left, top, width, height);

};

/**
 * Flip the lid open or shut.
 * @param {boolean} state True if open.
 * @private
 */
Trashcan.prototype.setOpen_ = function(state) {
  if (this.isOpen == state) {
    return;
  }
  clearTimeout(this.lidTask_);
  this.isOpen = state;
  this.animateLid_();
};

/**
 * Rotate the lid open or closed by one step.  Then wait and recurse.
 * @private
 */
Trashcan.prototype.animateLid_ = function() {
  this.lidOpen_ += this.isOpen ? 0.2 : -0.2;
  this.lidOpen_ = Math.min(Math.max(this.lidOpen_, 0), 1);
  const lidAngle = this.lidOpen_ * 45;
  this.svgLid_.setAttribute('transform', 'rotate(' +
      (this.workspace_.RTL ? -lidAngle : lidAngle) + ',' +
      (this.workspace_.RTL ? 4 : this.WIDTH_ - 4) + ',' +
      (this.LID_HEIGHT_ - 2) + ')');
  // Linear interpolation between 0.4 and 0.8.
  const opacity = 0.4 + this.lidOpen_ * (0.8 - 0.4);
  this.svgGroup_.style.opacity = opacity;
  if (this.lidOpen_ > 0 && this.lidOpen_ < 1) {
    this.lidTask_ = setTimeout(this.animateLid_.bind(this), 20);
  }
};

/**
 * Flip the lid shut.
 * Called externally after a drag.
 */
Trashcan.prototype.close = function() {
  this.setOpen_(false);
};

/**
 * Inspect the contents of the trash.
 */
Trashcan.prototype.click = function() {
  const dx = this.workspace_.startScrollX - this.workspace_.scrollX;
  const dy = this.workspace_.startScrollY - this.workspace_.scrollY;
  if (Math.sqrt(dx * dx + dy * dy) > constants.DRAG_RADIUS) {
    return;
  }
  console.log('TODO: Inspect trash.');
};
