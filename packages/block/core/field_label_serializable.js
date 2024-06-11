/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2017 Google Inc.
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
 * @fileoverview Serialized label field.  Behaves like a normal label but is
 *     always serialized to XML.  It may only be edited programmatically.
 * @author fenichel@google.com (Rachel Fenichel)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.FieldLabelSerializable');

import {Field} from './field';
import {FieldLabel} from './field_label';
import * as rendererConstants from './renderer/constants';
import * as utils from './utils';

const dom = goog.require('goog.dom');


/**
 * Class for a variable getter field.
 * @param {string} text The initial content of the field.
 * @param {string} opt_class Optional CSS class for the field's text.
 * @extends {FieldLabel}
 * @constructor
 *
 */
export const FieldLabelSerializable = function(text, opt_class) {
  FieldLabelSerializable.superClass_.constructor.call(this, text,
      opt_class);
  // Used in base field rendering, but we don't need it.
  this.arrowWidth_ = 0;
};
goog.inherits(FieldLabelSerializable, FieldLabel);

/**
 * Construct a FieldLabelSerializable from a JSON arg object,
 * dereferencing any string table references.
 * @param {!Object} options A JSON object with options (text, and class).
 * @returns {!FieldLabelSerializable} The new field instance.
 * @package
 * @nocollapse
 */
FieldLabelSerializable.fromJson = function(options) {
  const text = utils.replaceMessageReferences(options['text']);
  return new FieldLabelSerializable(text, options['class']);
};

/**
 * Editable fields usually show some sort of UI for the user to change them.
 * This field should be serialized, but only edited programmatically.
 * @type {boolean}
 * @public
 */
FieldLabelSerializable.prototype.EDITABLE = false;

/**
 * Serializable fields are saved by the XML renderer, non-serializable fields
 * are not.  This field should be serialized, but only edited programmatically.
 * @type {boolean}
 * @public
 */
FieldLabelSerializable.prototype.SERIALIZABLE = true;

/**
 * Updates the width of the field. This calls getCachedWidth which won't cache
 * the approximated width on IE/Edge when `getComputedTextLength` fails. Once
 * it eventually does succeed, the result will be cached.
 **/
FieldLabelSerializable.prototype.updateWidth = function() {
  // Set width of the field.
  // Unlike the base Field class, this doesn't add space to editable fields.
  this.size_.width = utils.getTextWidth(this.textElement_);
};

/**
 * Saves this field's value.
 * @return {string} The text value held by this field.
 * @override
 * @package
 */
FieldLabelSerializable.prototype.saveState = function () {
  return /** @type {string} */ (this.getValue());
};

/**
 * Sets the field's value based on the given state.
 * @param {*} state The state to apply to the label field.
 * @override
 * @package
 */
FieldLabelSerializable.prototype.loadState = function (state) {
  this.setValue(state);
};

/**
 * Draws the border with the correct width.
 * Saves the computed width in a property.
 * @private
 */
FieldLabelSerializable.prototype.render_ = function() {
  if (this.visible_ && this.textElement_) {
    // Replace the text.
    dom.removeChildren(/** @type {!Element} */ (this.textElement_));
    const textNode = document.createTextNode(this.getDisplayText_());
    this.textElement_.appendChild(textNode);
    this.updateWidth();

    // Update text centering, based on newly calculated width.
    let centerTextX = this.size_.width / 2;

    // If half the text length is not at least center of
    // visible field (FIELD_WIDTH), center it there instead.
    const minOffset = rendererConstants.FIELD_WIDTH / 2;
    if (this.sourceBlock_.RTL) {
      // X position starts at the left edge of the block, in both RTL and LTR.
      // First offset by the width of the block to move to the right edge,
      // and then subtract to move to the same position as LTR.
      const minCenter = this.size_.width - minOffset;
      centerTextX = Math.min(minCenter, centerTextX);
    } else {
      // (width / 2) should exceed rendererConstants.FIELD_WIDTH / 2
      // if the text is longer.
      centerTextX = Math.max(minOffset, centerTextX);
    }
    // Apply new text element x position.
    this.textElement_.setAttribute('x', centerTextX);
  }
};

Field.register(
    'field_label_serializable', FieldLabelSerializable);
