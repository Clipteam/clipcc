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
 * @fileoverview Combination text + drop-down field
 * @author tmickel@mit.edu (Tim Mickel)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.FieldTextDropdown');

import * as browserEvents from './browser_events';
import * as common from './common';
import {Field} from './field';
import {FieldDropdown} from './field_dropdown';
import {FieldTextInput} from './field_textinput';
import * as Touch from './touch';
import * as utils from './utils';
import {WidgetDiv} from './widgetdiv';


/**
 * Class for a combination text + drop-down field.
 * @extends {FieldTextInput}
 */
export class FieldTextDropdown extends FieldTextInput {
  /**
   * @param {string} text The initial content of the text field.
   * @param {(!Array.<!Array.<string>>|!Function)} menuGenerator An array of
   *     options for a dropdown list, or a function which generates these options.
   * @param {Function=} opt_validator An optional function that is called
   *     to validate any constraints on what the user entered.  Takes the new
   *     text as an argument and returns the accepted text or null to abort
   *     the change.
   * @param {RegExp=} opt_restrictor An optional regular expression to restrict
   *     typed text to. Text that doesn't match the restrictor will never show
   *     in the text field.
   */
  constructor(text, menuGenerator, opt_validator, opt_restrictor) {
    super(text, opt_validator, opt_restrictor);
    this.menuGenerator_ = menuGenerator;
    FieldDropdown.prototype.trimOptions_.call(this);
    this.addArgType('textdropdown');
  }

  /**
  * Construct a FieldTextDropdown from a JSON arg object,
  * dereferencing any string table references.
  * @param {!Object} element A JSON object with options.
  * @returns {!FieldTextDropdown} The new field instance.
  * @package
  * @nocollapse
  */
  static fromJson(element) {
    const field =
       new FieldTextDropdown(element['text'], element['options']);
    if (typeof element['spellcheck'] == 'boolean') {
      field.setSpellcheck(element['spellcheck']);
    }
    return field;
  }

  /**
  * Install this text drop-down field on a block.
  */
  init() {
    if (this.fieldGroup_) {
      // Text input + dropdown has already been initialized once.
      return;
    }
    super.init();
    // Add dropdown arrow: "option ▾" (LTR) or "▾ אופציה" (RTL)
    // Positioned on render, after text size is calculated.
    if (!this.arrow_) {
      /** @type {Number} */
      this.arrowSize_ = 12;
      /** @type {Number} */
      this.arrowX_ = 0;
      /** @type {Number} */
      this.arrowY_ = 11;
      this.arrow_ = utils.createSvgElement('image',
          {
            'height': this.arrowSize_ + 'px',
            'width': this.arrowSize_ + 'px'
          });
      this.arrow_.setAttributeNS('http://www.w3.org/1999/xlink',
          'xlink:href', common.getMainWorkspace().options.pathToMedia + 'dropdown-arrow-dark.svg');
      this.arrow_.style.cursor = 'pointer';
      this.fieldGroup_.appendChild(this.arrow_);
      this.mouseUpWrapper_ =
         browserEvents.bind(this.arrow_, 'mouseup', this, this.showDropdown_);
    }
    // Prevent the drop-down handler from changing the field colour on open.
    this.disableColourChange_ = true;
  }

  /**
  * Close the input widget if this input is being deleted.
  */
  dispose() {
    if (this.mouseUpWrapper_) {
      browserEvents.unbind(this.mouseUpWrapper_);
      this.mouseUpWrapper_ = null;
      Touch.clearTouchIdentifier();
    }
    super.dispose();
  }

  /**
  * If the drop-down isn't open, show the text editor.
  */
  showEditor_() {
    if (!this.dropDownOpen_) {
      super.showEditor_(null, null,
          true, function() {
            // When the drop-down arrow is clicked, hide text editor and show drop-down.
            WidgetDiv.hide();
            this.showDropdown_();
            Touch.clearTouchIdentifier();
          });
    }
  }
}



/**
 * Return a list of the options for this dropdown.
 * See: Blockly.FieldDropDown.prototype.getOptions_.
 * @return {!Array.<!Array.<string>>} Array of option tuples:
 *     (human-readable text, language-neutral name).
 * @private
 */
FieldTextDropdown.prototype.getOptions_ = FieldDropdown.prototype.getOptions_;

/**
 * Position a drop-down arrow at the appropriate location at render-time.
 * See: Blockly.FieldDropDown.prototype.positionArrow.
 * @param {number} x X position the arrow is being rendered at, in px.
 * @return {number} Amount of space the arrow is taking up, in px.
 */
FieldTextDropdown.prototype.positionArrow = FieldDropdown.prototype.positionArrow;

/**
 * Create the dropdown menu.
 * @private
 */
FieldTextDropdown.prototype.showDropdown_ = FieldDropdown.prototype.showEditor_;

/**
 * Callback when the drop-down menu is hidden.
 */
FieldTextDropdown.prototype.onHide = FieldDropdown.prototype.onHide;

Field.register('field_textdropdown', FieldTextDropdown);
