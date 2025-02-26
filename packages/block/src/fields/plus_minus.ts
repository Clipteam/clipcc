/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2023 Clip Team
 * All rights reserved.
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
 * @fileoverview Field for plus and minus button.
 * @author cuizhihui030925@outlook.com (Alex Cui)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('FieldPlusMinus');

import {Field} from './field';
import * as Touch from './touch';
import * as common from './common';
import * as utils from './utils';
import * as browserEvents from './browser_events';
import * as rendererConstants from './renderer/constants';


const dom = goog.require('goog.dom');
const math = goog.require('goog.math');

/**
 * Class for a plus/minus field.
 * @param {Function} handlePlus The function that is executed when plus button is pressed.
 * @param {Function} handleMinus The function that is executed when minus button is pressed.
 * @param {bool=} opt_enablePlus Whether plus button is enabled, defaults to true.
 * @param {bool=} opt_enableMinus Whether minus button is enabled, defaults to true.
 * @extends {Blockly.Field}
 * @constructor
 */
export const FieldPlusMinus = function(handlePlus, handleMinus, opt_enablePlus, opt_enableMinus) {
  this.sourceBlock_ = null;
  this.size_ = new math.Size(45, 20);
  this.handlePlus_ = handlePlus;
  this.handleMinus_ = handleMinus;
  this.wrappers_ = [];
  /** @type {SVGElement} */
  this.btnPlus_ = null;
  /** @type {SVGElement} */
  this.btnMinus_ = null;
  /** @type {SVGElement} */
  this.rectPlus_ = null;
  /** @type {SVGElement} */
  this.rectMinus_ = null;
  /** @type {SVGElement} */
  this.imgPlus_ = null;
  /** @type {SVGElement} */
  this.imgMinus_ = null;
  this.enablePlus_ = opt_enablePlus === undefined ? true : opt_enablePlus;
  this.enableMinus_ =  opt_enableMinus === undefined ? true : opt_enableMinus;
};
goog.inherits(FieldPlusMinus, Field);

/**
 * Mouse cursor style when over the hotspot that initiates the editor.
 * @type {string}
 * @public
 */
FieldPlusMinus.prototype.CURSOR = 'default';

/**
 * Editable fields usually show some sort of UI for the user to change them.
 * @type {boolean}
 * @public
 */
FieldPlusMinus.prototype.EDITABLE = true;

/**
 * Serializable fields are saved by the XML renderer, non-serializable fields
 * are not.
 * @type {boolean}
 * @public
 */
FieldPlusMinus.prototype.SERIALIZABLE = false;

/**
 * Install this button on a block.
 */
FieldPlusMinus.prototype.init = function() {
  if (this.fieldGroup_) {
    return;
  }
  /** @type {SVGElement} */
  this.fieldGroup_ = utils.createSvgElement('g', {}, null);
  this.btnPlus_ = utils.createSvgElement('g',
      {
        'class': 'blocklyPlusMinus',
        'display': this.enablePlus_ ? '' : 'none'
      },
      this.fieldGroup_
  );
  this.btnMinus_ = utils.createSvgElement('g',
      {
        'class': 'blocklyPlusMinus',
        'transform': this.enablePlus_ ? 'translate(25)' : 'translate(0)',
        'display': this.enableMinus_ ? '' : 'none'
      },
      this.fieldGroup_
  );
  this.rectPlus_ = utils.createSvgElement('rect',
      {
        'class': 'blocklyBlockBackground blocklyPlusMinusRect',
        'width': 20,
        'height': 20,
        'x': 0,
        'y': 0,
        'rx': rendererConstants.CORNER_RADIUS,
        'ry': rendererConstants.CORNER_RADIUS,
        'stroke': this.sourceBlock_.getColourTertiary(),
        'fill': this.sourceBlock_.getColour(),
        'fill-opacity': 1
      },
      this.btnPlus_
  );
  this.rectMinus_ = utils.createSvgElement('rect',
      {
        'class': 'blocklyBlockBackground blocklyPlusMinusRect',
        'width': 20,
        'height': 20,
        'rx': rendererConstants.CORNER_RADIUS,
        'ry': rendererConstants.CORNER_RADIUS,
        'stroke': this.sourceBlock_.getColourTertiary(),
        'fill': this.sourceBlock_.getColour(),
        'fill-opacity': 1
      },
      this.btnMinus_
  );
  this.imgPlus_ = utils.createSvgElement('image',
      {
        'width': 20,
        'height': 20
      },
      this.btnPlus_
  );
  this.imgMinus_ = utils.createSvgElement('image',
      {
        'width': 20,
        'height': 20
      },
      this.btnMinus_
  );
  this.imgPlus_.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
      common.getMainWorkspace().options.pathToMedia + 'plus.svg');
  this.imgMinus_.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
      common.getMainWorkspace().options.pathToMedia + 'minus.svg');
  this.sourceBlock_.getSvgRoot().appendChild(this.fieldGroup_);

  this.calcSize_();

  this.wrappers_ = [
    browserEvents.bind(this.btnPlus_, 'mousedown', this, this.onMouseDown_.bind(this, true)),
    browserEvents.bind(this.btnMinus_, 'mousedown', this, this.onMouseDown_.bind(this, false)),
    browserEvents.bind(this.btnPlus_, 'mouseenter', this, this.handleHover_.bind(this, true, this.rectPlus_)),
    browserEvents.bind(this.btnMinus_, 'mouseenter', this, this.handleHover_.bind(this, true, this.rectMinus_)),
    browserEvents.bind(this.btnPlus_, 'mouseleave', this, this.handleHover_.bind(this, false, this.rectPlus_)),
    browserEvents.bind(this.btnMinus_, 'mouseleave', this, this.handleHover_.bind(this, false, this.rectMinus_))
  ];

  this.render_();
};

/**
 * Construct a FieldPlusMinus from a JSON arg object.
 * @param {!Object} _options A JSON object with options.
 * @returns {!FieldPlusMinus} The new field instance.
 * @package
 * @nocollapse
 */
FieldPlusMinus.fromJson = function(_options) {
  return new FieldPlusMinus();
};

/**
 * Dispose of all DOM objects belonging to this field.
 */
FieldPlusMinus.prototype.dispose = function() {
  for (const wrapper of this.wrappers_) {
    browserEvents.unbind(wrapper);
  }
  this.wrappers_ = [];
  dom.removeNode(this.fieldGroup_);
  this.fieldGroup_ = null;
  this.svgElement_ = null;
  this.isPlusPressed_ = false;
};

/**
 * Calculate the size of this field.
 * @private
 */
FieldPlusMinus.prototype.calcSize_ = function() {
  if (this.enablePlus_ && this.enableMinus_) {
    this.size_.width = 45;
  } else if (!this.enablePlus_ && !this.enableMinus_) {
    this.size_.width = 0;
  } else {
    this.size_.width = 20;
  }
};

/**
 * Returns the height and width of the field.
 * @return {!goog.math.Size} Height and width.
 */
FieldPlusMinus.prototype.getSize = function() {
  this.calcSize_();
  return FieldPlusMinus.superClass_.getSize.call(this);
};

/**
 * Handle a mouse down event on plus button.
 * @param {boolean} isPlus true if plus button clicked.
 * @param {!MouseEvent} e Mouse down event.
 * @private
 */
FieldPlusMinus.prototype.onMouseDown_ = function(isPlus, e) {
  if (!this.sourceBlock_ || !this.sourceBlock_.workspace) {
    return;
  }
  this.isPlusPressed_ = isPlus;
  const gesture = this.sourceBlock_.workspace.getGesture(e);
  if (gesture) {
    gesture.setStartField(this);
  }
  this.useTouchInteraction_ = Touch.getTouchIdentifierFromEvent(event) !== 'mouse';
};

/**
 * Process click event.
 * @private
 */
FieldPlusMinus.prototype.showEditor_ = function() {
  if (this.isPlusPressed_) {
    this.handlePlus_();
  } else {
    this.handleMinus_();
  }
};

/**
 * Handle hover.
 * @param {boolean} isEnter true if mouse enter, otherwise mouse leave
 * @param {SVGElement} obj rect svg element
 * @private
 */
FieldPlusMinus.prototype.handleHover_ = function(isEnter, obj) {
  obj.setAttribute('fill', isEnter
      ? this.sourceBlock_.getColourTertiary() : this.sourceBlock_.getColour());
  this.render_();
};

/**
 * Enable or disable the plus button. (need to call parent block's render)
 * @param {boolean} enable true if enable.
 */
FieldPlusMinus.prototype.setEnablePlus = function(enable) {
  if (this.enablePlus_ === enable) return;
  this.enablePlus_ = enable;
  if (!this.fieldGroup_) return;
  if (this.enablePlus_) {
    this.btnPlus_.setAttribute('display', '');
    this.btnMinus_.setAttribute('transform', 'translate(25)');
  } else {
    this.btnPlus_.setAttribute('display', 'none');
    this.btnMinus_.setAttribute('transform', 'translate(0)');
  }
  this.render_();
};

/**
 * Enable or disable the minus button. (need to call parent block's render)
 * @param {boolean} enable true if enable.
 */
FieldPlusMinus.prototype.setEnableMinus = function(enable) {
  if (this.enableMinus_ === enable) return;
  this.enableMinus_ = enable;
  if (!this.fieldGroup_) return;
  if (this.enableMinus_) {
    this.btnMinus_.setAttribute('display', '');
  } else {
    this.btnMinus_.setAttribute('display', 'none');
  }
  this.render_();
};

Field.register('field_plus_minus', FieldPlusMinus);
