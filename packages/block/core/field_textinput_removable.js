/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2016 Massachusetts Institute of Technology
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
 * @fileoverview Text input field with floating "remove" button.
 * @author pkaplan@media.mit.edu (Paul Kaplan)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.FieldTextInputRemovable');

import * as browserEvents from './browser_events';
import * as common from './common';
import {Field} from './field';
import {FieldTextInput} from './field_textinput';
import * as utils from './utils';
import {WidgetDiv} from './widgetdiv';

const dom = goog.require('goog.dom');
const TagName = goog.require('goog.dom.TagName');


/**
 * Class for an editable text field displaying a deletion icon when selected.
 * @param {string} text The initial content of the field.
 * @param {Function=} opt_validator An optional function that is called
 *     to validate any constraints on what the user entered.  Takes the new
 *     text as an argument and returns either the accepted text, a replacement
 *     text, or null to abort the change.
 * @param {RegExp=} opt_restrictor An optional regular expression to restrict
 *     typed text to. Text that doesn't match the restrictor will never show
 *     in the text field.
 * @extends {FieldTextInput}
 * @constructor
 */
export const FieldTextInputRemovable = function(text, opt_validator, opt_restrictor) {
  FieldTextInputRemovable.superClass_.constructor.call(this, text,
      opt_validator, opt_restrictor);
};
goog.inherits(FieldTextInputRemovable, FieldTextInput);

/**
 * Show the inline free-text editor on top of the text with the remove button.
 * @private
 */
FieldTextInputRemovable.prototype.showEditor_ = function() {
  FieldTextInputRemovable.superClass_.showEditor_.call(this);

  const div = WidgetDiv.DIV;
  div.className += ' removableTextInput';
  const removeButton =
      dom.createDom(TagName.IMG, 'blocklyTextRemoveIcon');
  removeButton.setAttribute('src',
      common.getMainWorkspace().options.pathToMedia + 'icons/remove.svg');
  this.removeButtonMouseWrapper_ = browserEvents.bind(removeButton,
      'mousedown', this, this.removeCallback_);
  div.appendChild(removeButton);
};

/**
 * Function to call when remove button is called. Checks for removeFieldCallback
 * on sourceBlock and calls it if possible.
 * @private
 */
FieldTextInputRemovable.prototype.removeCallback_ = function() {
  if (this.sourceBlock_ && this.sourceBlock_.removeFieldCallback) {
    this.sourceBlock_.removeFieldCallback(this);
  } else {
    console.warn('Expected a source block with removeFieldCallback');
  }
};

/**
 * Helper function to construct a FieldTextInputRemovable from a JSON arg object,
 * dereferencing any string table references.
 * @param {!Object} options A JSON object with options (text, class, and
 *                          spellcheck).
 * @returns {!FieldTextInputRemovable} The new text input.
 * @public
 */
FieldTextInputRemovable.fromJson = function(options) {
  const text = utils.replaceMessageReferences(options['text']);
  const field = new FieldTextInputRemovable(text, options['class']);
  if (typeof options['spellcheck'] == 'boolean') {
    field.setSpellcheck(options['spellcheck']);
  }
  return field;
};

Field.register(
    'field_input_removable', FieldTextInputRemovable);
