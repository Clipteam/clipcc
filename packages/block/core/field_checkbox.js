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
 * @fileoverview Checkbox field.  Checked or not checked.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.FieldCheckbox');

import * as eventUtils from './events/utils';
import {BlockChange} from './events/block_change';
import {Field} from './field';
import * as utils from './utils';


/**
 * Class for a checkbox field.
 * @param {string} state The initial state of the field ('TRUE' or 'FALSE').
 * @param {Function=} opt_validator A function that is executed when a new
 *     option is selected.  Its sole argument is the new checkbox state.  If
 *     it returns a value, this becomes the new checkbox state, unless the
 *     value is null, in which case the change is aborted.
 * @extends {Field}
 * @constructor
 */
export const FieldCheckbox = function(state, opt_validator) {
  FieldCheckbox.superClass_.constructor.call(this, '', opt_validator);
  // Set the initial state.
  this.setValue(state);
  this.addArgType('checkbox');
};
goog.inherits(FieldCheckbox, Field);

/**
 * Construct a FieldCheckbox from a JSON arg object.
 * @param {!Object} options A JSON object with options (checked).
 * @returns {!FieldCheckbox} The new field instance.
 * @package
 * @nocollapse
 */
FieldCheckbox.fromJson = function(options) {
  return new FieldCheckbox(options['checked'] ? 'TRUE' : 'FALSE');
};

/**
 * Character for the checkmark.
 */
FieldCheckbox.CHECK_CHAR = '\u2713';

/**
 * Mouse cursor style when over the hotspot that initiates editability.
 */
FieldCheckbox.prototype.CURSOR = 'default';

/**
 * Install this checkbox on a block.
 */
FieldCheckbox.prototype.init = function() {
  if (this.fieldGroup_) {
    // Checkbox has already been initialized once.
    return;
  }
  FieldCheckbox.superClass_.init.call(this);
  // The checkbox doesn't use the inherited text element.
  // Instead it uses a custom checkmark element that is either visible or not.
  this.checkElement_ = utils.createSvgElement('text',
      {'class': 'blocklyText blocklyCheckbox', 'x': -3, 'y': 14},
      this.fieldGroup_);
  const textNode = document.createTextNode(FieldCheckbox.CHECK_CHAR);
  this.checkElement_.appendChild(textNode);
  this.checkElement_.style.display = this.state_ ? 'block' : 'none';
};

/**
 * Return 'TRUE' if the checkbox is checked, 'FALSE' otherwise.
 * @return {string} Current state.
 */
FieldCheckbox.prototype.getValue = function() {
  return String(this.state_).toUpperCase();
};

/**
 * Set the checkbox to be checked if newBool is 'TRUE' or true,
 * unchecks otherwise.
 * @param {string|boolean} newBool New state.
 */
FieldCheckbox.prototype.setValue = function(newBool) {
  const newState = (typeof newBool == 'string') ?
      (newBool.toUpperCase() == 'TRUE') : !!newBool;
  if (this.state_ !== newState) {
    if (this.sourceBlock_ && eventUtils.isEnabled()) {
      eventUtils.fire(new BlockChange(
          this.sourceBlock_, 'field', this.name, this.state_, newState));
    }
    this.state_ = newState;
    if (this.checkElement_) {
      this.checkElement_.style.display = newState ? 'block' : 'none';
    }
  }
};

/**
 * Saves this field's value.
 * @return {*} The boolean value held by this field.
 * @override
 * @package
 */
FieldCheckbox.prototype.saveState = function() {
  const legacyState = this.saveLegacyState(FieldCheckbox);
  if (legacyState !== null) {
    return legacyState;
  }
  return this.getValueBoolean();
};

/**
 * Toggle the state of the checkbox.
 * @private
 */
FieldCheckbox.prototype.showEditor_ = function() {
  let newState = !this.state_;
  if (this.sourceBlock_) {
    // Call any validation function, and allow it to override.
    newState = this.callValidator(newState);
  }
  if (newState !== null) {
    this.setValue(String(newState).toUpperCase());
  }
};

Field.register('field_checkbox', FieldCheckbox);
