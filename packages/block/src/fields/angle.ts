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
 * @fileoverview Angle input field.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.FieldAngle');

import * as browserEvents from './browser_events';
import * as common from './common';
import {DropDownDiv} from './dropdowndiv';
import {Field} from './field';
import {FieldTextInput} from './field_textinput';
import * as utils from './utils';

const math = goog.require('goog.math');


/**
 * Class for an editable angle field.
 * @param {(string|number)=} opt_value The initial content of the field. The
 *     value should cast to a number, and if it does not, '0' will be used.
 * @param {Function=} opt_validator An optional function that is called
 *     to validate any constraints on what the user entered.  Takes the new
 *     text as an argument and returns the accepted text or null to abort
 *     the change.
 * @extends {FieldTextInput}
 * @constructor
 */
export const FieldAngle = function(opt_value, opt_validator) {
  // Add degree symbol: '360°' (LTR) or '°360' (RTL)
  this.symbol_ = utils.createSvgElement('tspan', {}, null);
  this.symbol_.appendChild(document.createTextNode('\u00B0'));

  const numRestrictor = new RegExp("[\\d]|[\\.]|[-]|[eE]");

  opt_value = (opt_value && !isNaN(opt_value)) ? String(opt_value) : '0';
  FieldAngle.superClass_.constructor.call(
      this, opt_value, opt_validator, numRestrictor);
  this.addArgType('angle');
};
goog.inherits(FieldAngle, FieldTextInput);

/**
 * Construct a FieldAngle from a JSON arg object.
 * @param {!Object} options A JSON object with options (angle).
 * @returns {!FieldAngle} The new field instance.
 * @package
 * @nocollapse
 */
FieldAngle.fromJson = function(options) {
  return new FieldAngle(options['angle']);
};

/**
 * Round angles to the nearest 15 degrees when using mouse.
 * Set to 0 to disable rounding.
 */
FieldAngle.ROUND = 15;

/**
 * Half the width of protractor image.
 */
FieldAngle.HALF = 120 / 2;

/* The following two settings work together to set the behaviour of the angle
 * picker.  While many combinations are possible, two modes are typical:
 * Math mode.
 *   0 deg is right, 90 is up.  This is the style used by protractors.
 *   FieldAngle.CLOCKWISE = false;
 *   FieldAngle.OFFSET = 0;
 * Compass mode.
 *   0 deg is up, 90 is right.  This is the style used by maps.
 *   FieldAngle.CLOCKWISE = true;
 *   FieldAngle.OFFSET = 90;
 */

/**
 * Angle increases clockwise (true) or counterclockwise (false).
 */
FieldAngle.CLOCKWISE = true;

/**
 * Offset the location of 0 degrees (and all angles) by a constant.
 * Usually either 0 (0 = right) or 90 (0 = up).
 */
FieldAngle.OFFSET = 90;

/**
 * Maximum allowed angle before wrapping.
 * Usually either 360 (for 0 to 359.9) or 180 (for -179.9 to 180).
 */
FieldAngle.WRAP = 180;

/**
 * Radius of drag handle
 */
FieldAngle.HANDLE_RADIUS = 10;

/**
 * Width of drag handle arrow
 */
FieldAngle.ARROW_WIDTH = FieldAngle.HANDLE_RADIUS;

/**
 * Half the stroke-width used for the "glow" around the drag handle, rounded up to nearest whole pixel
 */

FieldAngle.HANDLE_GLOW_WIDTH = 3;

/**
 * Radius of protractor circle.  Slightly smaller than protractor size since
 * otherwise SVG crops off half the border at the edges.
 */
FieldAngle.RADIUS = FieldAngle.HALF
    - FieldAngle.HANDLE_RADIUS - FieldAngle.HANDLE_GLOW_WIDTH;

/**
 * Radius of central dot circle.
 */
FieldAngle.CENTER_RADIUS = 2;

/**
 * Path to the arrow svg icon.
 */
FieldAngle.ARROW_SVG_PATH = 'icons/arrow.svg';

/**
 * Clean up this FieldAngle, as well as the inherited FieldTextInput.
 * @return {!Function} Closure to call on destruction of the WidgetDiv.
 * @private
 */
FieldAngle.prototype.dispose_ = function() {
  const thisField = this;
  return function() {
    FieldAngle.superClass_.dispose_.call(thisField)();
    thisField.gauge_ = null;
    if (thisField.mouseDownWrapper_) {
      browserEvents.unbind(thisField.mouseDownWrapper_);
    }
    if (thisField.mouseUpWrapper_) {
      browserEvents.unbind(thisField.mouseUpWrapper_);
    }
    if (thisField.mouseMoveWrapper_) {
      browserEvents.unbind(thisField.mouseMoveWrapper_);
    }
  };
};

/**
 * Show the inline free-text editor on top of the text.
 * @private
 */
FieldAngle.prototype.showEditor_ = function() {
  // Mobile browsers have issues with in-line textareas (focus & keyboards).
  FieldAngle.superClass_.showEditor_.call(this, this.useTouchInteraction_);
  // If there is an existing drop-down someone else owns, hide it immediately and clear it.
  DropDownDiv.hideWithoutAnimation();
  DropDownDiv.clearContent();
  const div = DropDownDiv.getContentDiv();
  // Build the SVG DOM.
  const svg = utils.createSvgElement('svg', {
    'xmlns': 'http://www.w3.org/2000/svg',
    'xmlns:html': 'http://www.w3.org/1999/xhtml',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    'version': '1.1',
    'height': (FieldAngle.HALF * 2) + 'px',
    'width': (FieldAngle.HALF * 2) + 'px'
  }, div);
  utils.createSvgElement('circle', {
    'cx': FieldAngle.HALF, 'cy': FieldAngle.HALF,
    'r': FieldAngle.RADIUS,
    'class': 'blocklyAngleCircle'
  }, svg);
  this.gauge_ = utils.createSvgElement('path',
      {'class': 'blocklyAngleGauge'}, svg);
  // The moving line, x2 and y2 are set in updateGraph_
  this.line_ = utils.createSvgElement('line',{
    'x1': FieldAngle.HALF,
    'y1': FieldAngle.HALF,
    'class': 'blocklyAngleLine'
  }, svg);
  // The fixed vertical line at the offset
  const offsetRadians = Math.PI * FieldAngle.OFFSET / 180;
  utils.createSvgElement('line', {
    'x1': FieldAngle.HALF,
    'y1': FieldAngle.HALF,
    'x2': FieldAngle.HALF + FieldAngle.RADIUS * Math.cos(offsetRadians),
    'y2': FieldAngle.HALF - FieldAngle.RADIUS * Math.sin(offsetRadians),
    'class': 'blocklyAngleLine'
  }, svg);
  // Draw markers around the edge.
  for (let angle = 0; angle < 360; angle += 15) {
    utils.createSvgElement('line', {
      'x1': FieldAngle.HALF + FieldAngle.RADIUS - 13,
      'y1': FieldAngle.HALF,
      'x2': FieldAngle.HALF + FieldAngle.RADIUS - 7,
      'y2': FieldAngle.HALF,
      'class': 'blocklyAngleMarks',
      'transform': 'rotate(' + angle + ',' +
          FieldAngle.HALF + ',' + FieldAngle.HALF + ')'
    }, svg);
  }
  // Center point
  utils.createSvgElement('circle', {
    'cx': FieldAngle.HALF, 'cy': FieldAngle.HALF,
    'r': FieldAngle.CENTER_RADIUS,
    'class': 'blocklyAngleCenterPoint'
  }, svg);
  // Handle group: a circle and the arrow image
  this.handle_ = utils.createSvgElement('g', {}, svg);
  utils.createSvgElement('circle', {
    'cx': 0,
    'cy': 0,
    'r': FieldAngle.HANDLE_RADIUS,
    'class': 'blocklyAngleDragHandle'
  }, this.handle_);
  this.arrowSvg_ = utils.createSvgElement('image',
      {
        'width': FieldAngle.ARROW_WIDTH,
        'height': FieldAngle.ARROW_WIDTH,
        'x': -FieldAngle.ARROW_WIDTH / 2,
        'y': -FieldAngle.ARROW_WIDTH / 2,
        'class': 'blocklyAngleDragArrow'
      },
      this.handle_);
  this.arrowSvg_.setAttributeNS(
      'http://www.w3.org/1999/xlink',
      'xlink:href',
      common.getMainWorkspace().options.pathToMedia + FieldAngle.ARROW_SVG_PATH
  );

  DropDownDiv.setColour(this.sourceBlock_.parentBlock_.getColour(),
      this.sourceBlock_.getColourTertiary());
  DropDownDiv.setCategory(this.sourceBlock_.parentBlock_.getCategory());
  DropDownDiv.showPositionedByBlock(this, this.sourceBlock_);

  this.mouseDownWrapper_ =
      browserEvents.bind(this.handle_, 'mousedown', this, this.onMouseDown);

  this.updateGraph_();
};
/**
 * Set the angle to match the mouse's position.
 * @param {!Event} e Mouse move event.
 */
FieldAngle.prototype.onMouseDown = function() {
  this.mouseMoveWrapper_ = browserEvents.bind(document.body, 'mousemove', this, this.onMouseMove);
  this.mouseUpWrapper_ = browserEvents.bind(document.body, 'mouseup', this, this.onMouseUp);
};

/**
 * Set the angle to match the mouse's position.
 * @param {!Event} e Mouse move event.
 */
FieldAngle.prototype.onMouseUp = function() {
  browserEvents.unbind(this.mouseMoveWrapper_);
  browserEvents.unbind(this.mouseUpWrapper_);
};

/**
 * Set the angle to match the mouse's position.
 * @param {!Event} e Mouse move event.
 */
FieldAngle.prototype.onMouseMove = function(e) {
  e.preventDefault();
  const bBox = this.gauge_.ownerSVGElement.getBoundingClientRect();
  const dx = e.clientX - bBox.left - FieldAngle.HALF;
  const dy = e.clientY - bBox.top - FieldAngle.HALF;
  let angle = Math.atan(-dy / dx);
  if (isNaN(angle)) {
    // This shouldn't happen, but let's not let this error propagate further.
    return;
  }
  angle = math.toDegrees(angle);
  // 0: East, 90: North, 180: West, 270: South.
  if (dx < 0) {
    angle += 180;
  } else if (dy > 0) {
    angle += 360;
  }
  if (FieldAngle.CLOCKWISE) {
    angle = FieldAngle.OFFSET + 360 - angle;
  } else {
    angle -= FieldAngle.OFFSET;
  }
  if (FieldAngle.ROUND) {
    angle = Math.round(angle / FieldAngle.ROUND) *
        FieldAngle.ROUND;
  }
  angle = this.callValidator(angle);
  FieldTextInput.getHtmlInput().value = angle;
  this.setValue(angle);
  this.validate_();
  this.resizeEditor_();
};

/**
 * Insert a degree symbol.
 * @param {?string} text New text.
 */
FieldAngle.prototype.setText = function(text) {
  FieldAngle.superClass_.setText.call(this, text);
  if (!this.textElement_) {
    // Not rendered yet.
    return;
  }
  this.updateGraph_();
  // Cached width is obsolete.  Clear it.
  this.size_.width = 0;
};

/**
 * Redraw the graph with the current angle.
 * @private
 */
FieldAngle.prototype.updateGraph_ = function() {
  if (!this.gauge_) {
    return;
  }
  const angleDegrees = Number(this.getText()) % 360 + FieldAngle.OFFSET;
  let angleRadians = math.toRadians(angleDegrees);
  const path = ['M ', FieldAngle.HALF, ',', FieldAngle.HALF];
  let x2 = FieldAngle.HALF;
  let y2 = FieldAngle.HALF;
  if (!isNaN(angleRadians)) {
    const angle1 = math.toRadians(FieldAngle.OFFSET);
    const x1 = Math.cos(angle1) * FieldAngle.RADIUS;
    const y1 = Math.sin(angle1) * -FieldAngle.RADIUS;
    if (FieldAngle.CLOCKWISE) {
      angleRadians = 2 * angle1 - angleRadians;
    }
    x2 += Math.cos(angleRadians) * FieldAngle.RADIUS;
    y2 -= Math.sin(angleRadians) * FieldAngle.RADIUS;
    // Use large arc only if input value is greater than wrap
    const largeFlag = Math.abs(angleDegrees - FieldAngle.OFFSET) > 180 ? 1 : 0;
    let sweepFlag = Number(FieldAngle.CLOCKWISE);
    if (angleDegrees < FieldAngle.OFFSET) {
      sweepFlag = 1 - sweepFlag; // Sweep opposite direction if less than the offset
    }
    path.push(' l ', x1, ',', y1,
        ' A ', FieldAngle.RADIUS, ',', FieldAngle.RADIUS,
        ' 0 ', largeFlag, ' ', sweepFlag, ' ', x2, ',', y2, ' z');

    // Image rotation needs to be set in degrees
    const imageRotation = FieldAngle.CLOCKWISE ? angleDegrees + 2 * FieldAngle.OFFSET : -angleDegrees;
    this.arrowSvg_.setAttribute('transform', 'rotate(' + (imageRotation) + ')');
  }
  this.gauge_.setAttribute('d', path.join(''));
  this.line_.setAttribute('x2', x2);
  this.line_.setAttribute('y2', y2);
  this.handle_.setAttribute('transform', 'translate(' + x2 + ',' + y2 + ')');
};

/**
 * Ensure that only an angle may be entered.
 * @param {string} text The user's text.
 * @return {?string} A string representing a valid angle, or null if invalid.
 */
FieldAngle.prototype.classValidator = function(text) {
  if (text === null) {
    return null;
  }
  let n = parseFloat(text || 0);
  if (isNaN(n)) {
    return null;
  }
  n = n % 360;
  if (n < 0) {
    n += 360;
  }
  if (n > FieldAngle.WRAP) {
    n -= 360;
  }
  return String(n);
};

Field.register('field_angle', FieldAngle);
