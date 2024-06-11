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
 * @fileoverview Colour input field.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.FieldColour');

import * as eventUtils from './events/utils';
import {BlockChange} from './events/block_change';
import {Field} from './field';
import * as rendererConstants from './renderer/constants';
import * as utils from './utils';
import {WidgetDiv} from './widgetdiv';

const events = goog.require('goog.events');
const Size = goog.require('goog.math.Size');
const style = goog.require('goog.style');
const ColorPicker = goog.require('goog.ui.ColorPicker');


/**
 * Class for a colour input field.
 * @param {string} colour The initial colour in '#rrggbb' format.
 * @param {Function=} opt_validator A function that is executed when a new
 *     colour is selected.  Its sole argument is the new colour value.  Its
 *     return value becomes the selected colour, unless it is undefined, in
 *     which case the new colour stands, or it is null, in which case the change
 *     is aborted.
 * @extends {Field}
 * @constructor
 */
export const FieldColour = function(colour, opt_validator) {
  FieldColour.superClass_.constructor.call(this, colour, opt_validator);
  this.addArgType('colour');
};
goog.inherits(FieldColour, Field);

/**
 * Construct a FieldColour from a JSON arg object.
 * @param {!Object} options A JSON object with options (colour).
 * @returns {!FieldColour} The new field instance.
 * @package
 * @nocollapse
 */
FieldColour.fromJson = function(options) {
  return new FieldColour(options['colour']);
};

/**
 * By default use the global constants for colours.
 * @type {Array.<string>}
 * @private
 */
FieldColour.prototype.colours_ = null;

/**
 * By default use the global constants for columns.
 * @type {number}
 * @private
 */
FieldColour.prototype.columns_ = 0;

/**
 * Install this field on a block.
 * @param {!Blockly.Block} block The block containing this field.
 */
FieldColour.prototype.init = function(block) {
  if (this.fieldGroup_) {
    // Colour field has already been initialized once.
    return;
  }
  FieldColour.superClass_.init.call(this, block);
  this.setValue(this.getValue());
};

/**
 * Mouse cursor style when over the hotspot that initiates the editor.
 */
FieldColour.prototype.CURSOR = 'default';

/**
 * Close the colour picker if this input is being deleted.
 */
FieldColour.prototype.dispose = function() {
  WidgetDiv.hideIfOwner(this);
  FieldColour.superClass_.dispose.call(this);
};

/**
 * Return the current colour.
 * @return {string} Current colour in '#rrggbb' format.
 */
FieldColour.prototype.getValue = function() {
  return this.colour_;
};

/**
 * Set the colour.
 * @param {string} colour The new colour in '#rrggbb' format.
 */
FieldColour.prototype.setValue = function(colour) {
  if (this.sourceBlock_ && eventUtils.isEnabled() &&
      this.colour_ != colour) {
    eventUtils.fire(new BlockChange(
        this.sourceBlock_, 'field', this.name, this.colour_, colour));
  }
  this.colour_ = colour;
  if (this.sourceBlock_) {
    // Set the primary, secondary, tertiary, and quaternary colour to this value.
    // The renderer expects to be able to use the secondary color as the fill for a shadow.
    this.sourceBlock_.setColour(colour, colour, colour, colour);
  }
};

/**
 * Get the text from this field.  Used when the block is collapsed.
 * @return {string} Current text.
 */
FieldColour.prototype.getText = function() {
  let colour = this.colour_;
  // Try to use #rgb format if possible, rather than #rrggbb.
  const m = colour.match(/^#(.)\1(.)\2(.)\3$/);
  if (m) {
    colour = '#' + m[1] + m[2] + m[3];
  }
  return colour;
};

/**
 * Returns the fixed height and width.
 * @return {!Size} Height and width.
 */
FieldColour.prototype.getSize = function() {
  return new Size(rendererConstants.FIELD_WIDTH, rendererConstants.FIELD_HEIGHT);
};

/**
 * An array of colour strings for the palette.
 * See bottom of this page for the default:
 * http://docs.closure-library.googlecode.com/git/closure_goog_ui_colorpicker.js.source.html
 * @type {!Array.<string>}
 */
FieldColour.COLOURS = ColorPicker.SIMPLE_GRID_COLORS;

/**
 * Number of columns in the palette.
 */
FieldColour.COLUMNS = 7;

/**
 * Set a custom colour grid for this field.
 * @param {Array.<string>} colours Array of colours for this block,
 *     or null to use default (FieldColour.COLOURS).
 * @return {!FieldColour} Returns itself (for method chaining).
 */
FieldColour.prototype.setColours = function(colours) {
  this.colours_ = colours;
  return this;
};

/**
 * Set a custom grid size for this field.
 * @param {number} columns Number of columns for this block,
 *     or 0 to use default (FieldColour.COLUMNS).
 * @return {!FieldColour} Returns itself (for method chaining).
 */
FieldColour.prototype.setColumns = function(columns) {
  this.columns_ = columns;
  return this;
};

/**
 * Saves this field's value.
 * @return {string} The colour value held by this field.
 * @override
 * @package
 */
FieldColour.prototype.saveState = function () {
  return /** @type {string} */ (this.getValue());
};

/**
 * Sets the field's value based on the given state.
 * @param {*} state The state to apply to the colour field.
 * @override
 * @package
 */
FieldColour.prototype.loadState = function (state) {
  this.setValue(state);
};

/**
 * Create a palette under the colour field.
 * @private
 */
FieldColour.prototype.showEditor_ = function() {
  WidgetDiv.show(this, this.sourceBlock_.RTL,
      FieldColour.widgetDispose_);

  // Record viewport dimensions before adding the widget.
  const viewportBBox = utils.getViewportBBox();
  const anchorBBox = this.getScaledBBox_();

  // Create and add the colour picker, then record the size.
  const picker = this.createWidget_();
  const paletteSize = style.getSize(picker.getElement());

  // Position the picker to line up with the field.
  WidgetDiv.positionWithAnchor(viewportBBox, anchorBBox, paletteSize,
      this.sourceBlock_.RTL);

  // Configure event handler.
  const thisField = this;
  FieldColour.changeEventKey_ = events.listen(picker,
      ColorPicker.EventType.CHANGE,
      function(event) {
        let colour = event.target.getSelectedColor() || '#000000';
        WidgetDiv.hide();
        if (thisField.sourceBlock_) {
          // Call any validation function, and allow it to override.
          colour = thisField.callValidator(colour);
        }
        if (colour !== null) {
          thisField.setValue(colour);
        }
      });
};

/**
 * Create a color picker widget and render it inside the widget div.
 * @return {!ColorPicker} The newly created color picker.
 * @private
 */
FieldColour.prototype.createWidget_ = function() {
  // Create the palette using Closure.
  const picker = new ColorPicker();
  picker.setSize(this.columns_ || FieldColour.COLUMNS);
  picker.setColors(this.colours_ || FieldColour.COLOURS);
  const div = WidgetDiv.DIV;
  picker.render(div);
  picker.setSelectedColor(this.getValue());
  return picker;
};

/**
 * Hide the colour palette.
 * @private
 */
FieldColour.widgetDispose_ = function() {
  if (FieldColour.changeEventKey_) {
    events.unlistenByKey(FieldColour.changeEventKey_);
  }
  eventUtils.setGroup(false);
};

Field.register('field_colour', FieldColour);
