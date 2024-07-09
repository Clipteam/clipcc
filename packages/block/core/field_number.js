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
 * @fileoverview Field for numbers. Includes validator and numpad on touch.
 * @author tmickel@mit.edu (Tim Mickel)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.FieldNumber');

import * as browserEvents from './browser_events';
import {Colours} from './colours';
import {DropDownDiv} from './dropdowndiv';
import {Field} from './field';
import {FieldTextInput} from './field_textinput';
import * as Touch from './touch';


/**
 * Class for an editable number field.
 * In scratch-blocks, the min/max/precision properties are only used
 * to construct a restrictor on typable characters, and to inform the pop-up
 * numpad on touch devices.
 * These properties are included here (i.e. instead of just accepting a
 * decimalAllowed, negativeAllowed) to maintain API compatibility with Blockly
 * and Blockly for Android.
 * @extends {FieldTextInput}
 */
export class FieldNumber extends FieldTextInput {
  /**
   * @param {(string|number)=} opt_value The initial content of the field. The value
   *     should cast to a number, and if it does not, '0' will be used.
   * @param {(string|number)=} opt_min Minimum value.
   * @param {(string|number)=} opt_max Maximum value.
   * @param {(string|number)=} opt_precision Precision for value.
   * @param {Function=} opt_validator An optional function that is called
   *     to validate any constraints on what the user entered.  Takes the new
   *     text as an argument and returns the accepted text or null to abort
   *     the change.
   */
  constructor(opt_value, opt_min, opt_max, opt_precision, opt_validator) {
    opt_value = (opt_value && !isNaN(opt_value)) ? String(opt_value) : '0';
    super(opt_value, opt_validator);
    const numRestrictor = this.getNumRestrictor(opt_min, opt_max, opt_precision);
    this.setRestrictor(numRestrictor);
    this.addArgType('number');
  }

  /**
   * Construct a FieldNumber from a JSON arg object.
   * @param {!Object} options A JSON object with options (value, min, max, and
   *                          precision).
   * @returns {!FieldNumber} The new field instance.
   * @package
   * @nocollapse
   */
  static fromJson(options) {
    return new FieldNumber(options['value'],
        options['min'], options['max'], options['precision']);
  }

  /**
   * Return an appropriate restrictor, depending on whether this FieldNumber
   * allows decimal or negative numbers.
   * @param {number|string|undefined} opt_min Minimum value.
   * @param {number|string|undefined} opt_max Maximum value.
   * @param {number|string|undefined} opt_precision Precision for value.
   * @return {!RegExp} Regular expression for this FieldNumber's restrictor.
   */
  getNumRestrictor(opt_min, opt_max, opt_precision) {
    this.setConstraints_(opt_min, opt_max, opt_precision);
    let pattern = "[\\d]"; // Always allow digits.
    if (this.decimalAllowed_) {
      pattern += "|[\\.]";
    }
    if (this.negativeAllowed_) {
      pattern += "|[-]";
    }
    if (this.exponentialAllowed_) {
      pattern += "|[eE]";
    }
    return new RegExp(pattern);
  }

  /**
   * Set the constraints for this field.
   * @param {number=} opt_min Minimum number allowed.
   * @param {number=} opt_max Maximum number allowed.
   * @param {number=} opt_precision Step allowed between numbers
   */
  setConstraints_(opt_min, opt_max, opt_precision) {
    this.decimalAllowed_ = (typeof opt_precision == 'undefined') ||
        isNaN(opt_precision) || (opt_precision == 0) ||
        (Math.floor(opt_precision) != opt_precision);
    this.negativeAllowed_ = (typeof opt_min == 'undefined') || isNaN(opt_min) ||
        opt_min < 0;
    this.exponentialAllowed_ = this.decimalAllowed_;
  }

  /**
   * Show the inline free-text editor on top of the text and the num-pad if
   * appropriate.
   * @private
   */
  showEditor_() {
    FieldNumber.activeField_ = this;
    // Do not focus on mobile devices so we can show the num-pad
    const showNumPad = this.useTouchInteraction_;
    super.showEditor_(false, showNumPad);

    // Show a numeric keypad in the drop-down on touch
    if (showNumPad) {
      this.showNumPad_();
    }
  }

  /**
   * Show the number pad.
   * @private
   */
  showNumPad_() {
    // If there is an existing drop-down someone else owns, hide it immediately
    // and clear it.
    DropDownDiv.hideWithoutAnimation();
    DropDownDiv.clearContent();

    const contentDiv = DropDownDiv.getContentDiv();

    // Accessibility properties
    contentDiv.setAttribute('role', 'menu');
    contentDiv.setAttribute('aria-haspopup', 'true');

    this.addButtons_(contentDiv);

    // Set colour and size of drop-down
    DropDownDiv.setColour(this.sourceBlock_.parentBlock_.getColour(),
        this.sourceBlock_.getColourTertiary());
    contentDiv.style.width = FieldNumber.DROPDOWN_WIDTH + 'px';

    this.position_();
  }

  /**
   * Figure out where to place the drop-down, and move it there.
   * @private
   */
  position_() {
    // Calculate positioning for the drop-down
    // sourceBlock_ is the rendered shadow field input box
    const scale = this.sourceBlock_.workspace.scale;
    const bBox = this.sourceBlock_.getHeightWidth();
    bBox.width *= scale;
    bBox.height *= scale;
    const position = this.getAbsoluteXY_();
    // If we can fit it, render below the shadow block
    const primaryX = position.x + bBox.width / 2;
    const primaryY = position.y + bBox.height;
    // If we can't fit it, render above the entire parent block
    const secondaryX = primaryX;
    const secondaryY = position.y;

    DropDownDiv.setBoundsElement(
        this.sourceBlock_.workspace.getParentSvg().parentNode);
    DropDownDiv.show(this, primaryX, primaryY, secondaryX, secondaryY,
        this.onHide_.bind(this));
  }

  /**
   * Add number, punctuation, and erase buttons to the numeric keypad's content
   * div.
   * @param {Element} contentDiv The div for the numeric keypad.
   * @private
   */
  addButtons_(contentDiv) {
    const buttonColour = this.sourceBlock_.parentBlock_.getColour();
    const buttonBorderColour = this.sourceBlock_.parentBlock_.getColourTertiary();

    // Add numeric keypad buttons
    const buttons = FieldNumber.NUMPAD_BUTTONS;
    for (let i = 0, buttonText; buttonText = buttons[i]; i++) {
      const button = document.createElement('button');
      button.setAttribute('role', 'menuitem');
      button.setAttribute('class', 'blocklyNumPadButton');
      button.setAttribute('style',
          'background:' + buttonColour + ';' +
          'border: 1px solid ' + buttonBorderColour + ';');
      button.title = buttonText;
      button.innerHTML = buttonText;
      browserEvents.bind(button, 'mousedown', button,
          FieldNumber.numPadButtonTouch);
      if (buttonText == '.' && !this.decimalAllowed_) {
        // Don't show the decimal point for inputs that must be round numbers
        button.setAttribute('style', 'visibility: hidden');
      } else if (buttonText == '-' && !this.negativeAllowed_) {
        continue;
      } else if (buttonText == ' ' && !this.negativeAllowed_) {
        continue;
      } else if (buttonText == ' ' && this.negativeAllowed_) {
        button.setAttribute('style', 'visibility: hidden');
      }
      contentDiv.appendChild(button);
    }
    // Add erase button to the end
    const eraseButton = document.createElement('button');
    eraseButton.setAttribute('role', 'menuitem');
    eraseButton.setAttribute('class', 'blocklyNumPadButton');
    eraseButton.setAttribute('style',
        'background:' + buttonColour + ';' +
        'border: 1px solid ' + buttonBorderColour + ';');
    eraseButton.title = 'Delete';

    const eraseImage = document.createElement('img');
    eraseImage.src = FieldNumber.NUMPAD_DELETE_ICON;
    eraseButton.appendChild(eraseImage);

    browserEvents.bind(eraseButton, 'mousedown', null,
        FieldNumber.numPadEraseButtonTouch);
    contentDiv.appendChild(eraseButton);
  }

  /**
   * Call for when a num-pad number or punctuation button is touched.
   * Determine what the user is inputting and update the text field appropriately.
   * @param {Event} e DOM event triggering the touch.
   */
  static numPadButtonTouch(e) {
    // String of the button (e.g., '7')
    const spliceValue = this.innerHTML;
    // Old value of the text field
    const oldValue = FieldTextInput.getHtmlInput().value;
    // Determine the selected portion of the text field
    const selectionStart = FieldTextInput.getHtmlInput().selectionStart;
    const selectionEnd = FieldTextInput.getHtmlInput().selectionEnd;

    // Splice in the new value
    const newValue = oldValue.slice(0, selectionStart) + spliceValue +
        oldValue.slice(selectionEnd);

    // Set new value and advance the cursor
    FieldNumber.updateDisplay_(newValue, selectionStart + spliceValue.length);

    // This is just a click.
    Touch.clearTouchIdentifier();

    // Prevent default to not lose input focus
    e.preventDefault();
  }

  /**
   * Call for when the num-pad erase button is touched.
   * Determine what the user is asking to erase, and erase it.
   * @param {Event} e DOM event triggering the touch.
   */
  static numPadEraseButtonTouch(e) {
    // Old value of the text field
    const oldValue = FieldTextInput.getHtmlInput().value;
    // Determine what is selected to erase (if anything)
    let selectionStart = FieldTextInput.getHtmlInput().selectionStart;
    const selectionEnd = FieldTextInput.getHtmlInput().selectionEnd;

    // If selection is zero-length, shift start to the left 1 character
    if (selectionStart == selectionEnd) {
      selectionStart = Math.max(0, selectionStart - 1);
    }

    // Cut out selected range
    const newValue = oldValue.slice(0, selectionStart) +
        oldValue.slice(selectionEnd);

    FieldNumber.updateDisplay_(newValue, selectionStart);

    // This is just a click.
    Touch.clearTouchIdentifier();

    // Prevent default to not lose input focus which resets cursors in Chrome
    e.preventDefault();
  }

  /**
   * Update the displayed value and resize/scroll the text field as needed.
   * @param {string} newValue The new text to display.
   * @param {string} newSelection The new index to put the cursor
   * @private.
   */
  static updateDisplay_(newValue, newSelection) {
    const htmlInput = FieldTextInput.getHtmlInput();
    // Updates the display. The actual setValue occurs when editing ends.
    htmlInput.value = newValue;
    // Resize and scroll the text field appropriately
    FieldTextInput.prototype.resizeEditor_.call(
        FieldNumber.activeField_);
    htmlInput.setSelectionRange(newSelection, newSelection);
    htmlInput.scrollLeft = htmlInput.scrollWidth;
    FieldNumber.activeField_.validate_();
  }

  /**
   * Callback for when the drop-down is hidden.
   */
  onHide_() {
    // Clear accessibility properties
    DropDownDiv.content_.removeAttribute('role');
    DropDownDiv.content_.removeAttribute('aria-haspopup');
  }
}

/**
 * Fixed width of the num-pad drop-down, in px.
 * @type {number}
 * @const
 */
FieldNumber.DROPDOWN_WIDTH = 168;

/**
 * Buttons for the num-pad, in order from the top left.
 * Values are strings of the number or symbol will be added to the field text
 * when the button is pressed.
 * @type {Array.<string>}
 * @const
 */
// Calculator order
FieldNumber.NUMPAD_BUTTONS =
    ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '-', ' '];

/**
 * Src for the delete icon to be shown on the num-pad.
 * @type {string}
 * @const
 */
FieldNumber.NUMPAD_DELETE_ICON = 'data:image/svg+xml;utf8,' +
  '<svg ' +
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
  '<path d="M28.89,11.45H16.79a2.86,2.86,0,0,0-2,.84L9.09,1' +
  '8a2.85,2.85,0,0,0,0,4l5.69,5.69a2.86,2.86,0,0,0,2,.84h12' +
  '.1a2.86,2.86,0,0,0,2.86-2.86V14.31A2.86,2.86,0,0,0,28.89' +
  ',11.45ZM27.15,22.73a1,1,0,0,1,0,1.41,1,1,0,0,1-.71.3,1,1' +
  ',0,0,1-.71-0.3L23,21.41l-2.73,2.73a1,1,0,0,1-1.41,0,1,1,' +
  '0,0,1,0-1.41L21.59,20l-2.73-2.73a1,1,0,0,1,0-1.41,1,1,0,' +
  '0,1,1.41,0L23,18.59l2.73-2.73a1,1,0,1,1,1.42,1.41L24.42,20Z" fill="' +
  Colours.numPadText + '"/></svg>';

/**
 * Currently active field during an edit.
 * Used to give a reference to the num-pad button callbacks.
 * @type {?FieldNumber}
 * @private
 */
FieldNumber.activeField_ = null;

Field.register('field_number', FieldNumber);
