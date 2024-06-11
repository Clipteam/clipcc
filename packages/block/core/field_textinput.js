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
 * @fileoverview Text input field.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.FieldTextInput');

import * as browserEvents from './browser_events';
import {Colours} from './colours';
import * as common from './common';
import * as constants from './constants';
import {DropDownDiv} from './dropdowndiv';
import * as eventUtils from './events/utils';
import {BlockChange} from './events/block_change';
import {Field} from './field';
import * as rendererConstants from './renderer/constants';
import * as scratchBlocksUtils from './scratch_blocks_utils';
import * as utils from './utils';
import {WidgetDiv} from './widgetdiv';

const asserts = goog.require('goog.asserts');
const dom = goog.require('goog.dom');
const TagName = goog.require('goog.dom.TagName');
const userAgent = goog.require('goog.userAgent');


/**
 * Class for an editable text field.
 * @param {string} text The initial content of the field.
 * @param {Function=} opt_validator An optional function that is called
 *     to validate any constraints on what the user entered.  Takes the new
 *     text as an argument and returns either the accepted text, a replacement
 *     text, or null to abort the change.
 * @param {RegExp=} opt_restrictor An optional regular expression to restrict
 *     typed text to. Text that doesn't match the restrictor will never show
 *     in the text field.
 * @extends {Field}
 * @constructor
 */
export const FieldTextInput = function(text, opt_validator, opt_restrictor) {
  FieldTextInput.superClass_.constructor.call(this, text,
      opt_validator);
  this.setRestrictor(opt_restrictor);
  this.addArgType('text');
};
goog.inherits(FieldTextInput, Field);

/**
 * Construct a FieldTextInput from a JSON arg object,
 * dereferencing any string table references.
 * @param {!Object} options A JSON object with options (text, class, and
 *                          spellcheck).
 * @returns {!FieldTextInput} The new field instance.
 * @package
 * @nocollapse
 */
FieldTextInput.fromJson = function(options) {
  const text = utils.replaceMessageReferences(options['text']);
  const field = new FieldTextInput(text, options['class']);
  if (typeof options['spellcheck'] === 'boolean') {
    field.setSpellcheck(options['spellcheck']);
  }
  return field;
};

/**
 * Length of animations in seconds.
 */
FieldTextInput.ANIMATION_TIME = 0.25;

/**
 * Padding to use for text measurement for the field during editing, in px.
 */
FieldTextInput.TEXT_MEASURE_PADDING_MAGIC = 45;

/**
 * The HTML input element for the user to type, or null if no FieldTextInput
 * editor is currently open.
 * @type {HTMLInputElement}
 * @private
 */
FieldTextInput.htmlInput_ = null;

/**
 * Mouse cursor style when over the hotspot that initiates the editor.
 */
FieldTextInput.prototype.CURSOR = 'text';

/**
 * Allow browser to spellcheck this field.
 * @private
 */
FieldTextInput.prototype.spellcheck_ = true;

/**
 * Install this text field on a block.
 */
FieldTextInput.prototype.init = function() {
  if (this.fieldGroup_) {
    // Field has already been initialized once.
    return;
  }

  const notInShadow = !this.sourceBlock_.isShadow();

  if (notInShadow) {
    this.className_ += ' blocklyEditableLabel';
  }

  FieldTextInput.superClass_.init.call(this);

  // If not in a shadow block, draw a box.
  if (notInShadow) {
    this.box_ = utils.createSvgElement('rect',
        {
          'x': 0,
          'y': 0,
          'width': this.size_.width,
          'height': this.size_.height,
          'fill': this.sourceBlock_.getColourTertiary()
        }
    );
    this.fieldGroup_.insertBefore(this.box_, this.textElement_);
  }
};

/**
 * Close the input widget if this input is being deleted.
 */
FieldTextInput.prototype.dispose = function() {
  WidgetDiv.hideIfOwner(this);
  FieldTextInput.superClass_.dispose.call(this);
};

/**
 * Set the value of this field.
 * @param {?string} newValue New value.
 * @override
 */
FieldTextInput.prototype.setValue = function(newValue) {
  if (newValue === null) {
    return;  // No change if null.
  }
  if (this.sourceBlock_) {
    const validated = this.callValidator(newValue);
    // If the new value is invalid, validation returns null.
    // In this case we still want to display the illegal result.
    if (validated !== null) {
      newValue = validated;
    }
  }
  Field.prototype.setValue.call(this, newValue);
};

/**
 * Set the text in this field and fire a change event.
 * @param {*} newText New text.
 */
FieldTextInput.prototype.setText = function(newText) {
  if (newText === null) {
    // No change if null.
    return;
  }
  newText = String(newText);
  if (newText === this.text_) {
    // No change.
    return;
  }
  if (this.sourceBlock_ && eventUtils.isEnabled()) {
    eventUtils.fire(new BlockChange(
        this.sourceBlock_, 'field', this.name, this.text_, newText));
  }
  Field.prototype.setText.call(this, newText);
};

/**
 * Set whether this field is spellchecked by the browser.
 * @param {boolean} check True if checked.
 */
FieldTextInput.prototype.setSpellcheck = function(check) {
  this.spellcheck_ = check;
};

/**
 * Set the restrictor regex for this text input.
 * Text that doesn't match the restrictor will never show in the text field.
 * @param {?RegExp} restrictor Regular expression to restrict text.
 */
FieldTextInput.prototype.setRestrictor = function(restrictor) {
  this.restrictor_ = restrictor;
};

/**
 * Show the inline free-text editor on top of the text.
 * @param {boolean=} opt_quietInput True if editor should be created without
 *     focus.  Defaults to false.
 * @param {boolean=} opt_readOnly True if editor should be created with HTML
 *     input set to read-only, to prevent virtual keyboards.
 * @param {boolean=} opt_withArrow True to show drop-down arrow in text editor.
 * @param {Function=} opt_arrowCallback Callback for when drop-down arrow clicked.
 * @private
 */
FieldTextInput.prototype.showEditor_ = function(
    opt_quietInput, opt_readOnly, opt_withArrow, opt_arrowCallback) {
  this.workspace_ = this.sourceBlock_.workspace;
  const quietInput = opt_quietInput || false;
  const readOnly = opt_readOnly || false;
  WidgetDiv.show(this, this.sourceBlock_.RTL,
      this.widgetDispose_(), this.widgetDisposeAnimationFinished_(),
      FieldTextInput.ANIMATION_TIME);
  const div = WidgetDiv.DIV;
  // Apply text-input-specific fixed CSS
  div.className += ' fieldTextInput';
  // Create the input.
  const htmlInput =
      dom.createDom(TagName.INPUT, 'blocklyHtmlInput');
  htmlInput.setAttribute('spellcheck', this.spellcheck_);
  if (readOnly) {
    htmlInput.setAttribute('readonly', 'true');
  }
  /** @type {!HTMLInputElement} */
  FieldTextInput.htmlInput_ = htmlInput;
  div.appendChild(htmlInput);

  if (opt_withArrow) {
    // Move text in input to account for displayed drop-down arrow.
    if (this.sourceBlock_.RTL) {
      htmlInput.style.paddingLeft = (this.arrowSize_ + rendererConstants.DROPDOWN_ARROW_PADDING) + 'px';
    } else {
      htmlInput.style.paddingRight = (this.arrowSize_ + rendererConstants.DROPDOWN_ARROW_PADDING) + 'px';
    }
    // Create the arrow.
    const dropDownArrow =
        dom.createDom(TagName.IMG, 'blocklyTextDropDownArrow');
    dropDownArrow.setAttribute('src',
        common.getMainWorkspace().options.pathToMedia + 'dropdown-arrow-dark.svg');
    dropDownArrow.style.width = this.arrowSize_ + 'px';
    dropDownArrow.style.height = this.arrowSize_ + 'px';
    dropDownArrow.style.top = this.arrowY_ + 'px';
    dropDownArrow.style.cursor = 'pointer';
    // Magic number for positioning the drop-down arrow on top of the text editor.
    const dropdownArrowMagic = '11px';
    if (this.sourceBlock_.RTL) {
      dropDownArrow.style.left = dropdownArrowMagic;
    } else {
      dropDownArrow.style.right = dropdownArrowMagic;
    }
    if (opt_arrowCallback) {
      htmlInput.dropDownArrowMouseWrapper_ = browserEvents.bind(dropDownArrow,
          'mousedown', this, opt_arrowCallback);
    }
    div.appendChild(dropDownArrow);
  }

  htmlInput.value = htmlInput.defaultValue = this.text_;
  htmlInput.oldValue_ = null;
  this.validate_();
  this.resizeEditor_();
  if (!quietInput) {
    htmlInput.focus();
    htmlInput.select();
    // For iOS only
    htmlInput.setSelectionRange(0, 99999);
  }

  this.bindEvents_(htmlInput, quietInput || readOnly);

  // Add animation transition properties
  const transitionProperties = 'box-shadow ' + FieldTextInput.ANIMATION_TIME + 's';
  if (rendererConstants.FIELD_TEXTINPUT_ANIMATE_POSITIONING) {
    div.style.transition += ',padding ' + FieldTextInput.ANIMATION_TIME + 's,' +
      'width ' + FieldTextInput.ANIMATION_TIME + 's,' +
      'height ' + FieldTextInput.ANIMATION_TIME + 's,' +
      'margin-left ' + FieldTextInput.ANIMATION_TIME + 's';
  }
  div.style.transition = transitionProperties;
  htmlInput.style.transition = 'font-size ' + FieldTextInput.ANIMATION_TIME + 's';
  // The animated properties themselves
  htmlInput.style.fontSize = rendererConstants.FIELD_TEXTINPUT_FONTSIZE_FINAL + 'pt';
  div.style.boxShadow = '0px 0px 0px 4px ' + Colours.fieldShadow;
};

/**
 * Bind handlers for user input on this field and size changes on the workspace.
 * @param {!HTMLInputElement} htmlInput The htmlInput created in showEditor, to
 *     which event handlers will be bound.
 * @param {boolean} bindGlobalKeypress Whether to bind a keypress listener to enable
 *     keyboard editing without focusing the field.
 * @private
 */
FieldTextInput.prototype.bindEvents_ = function(
    htmlInput, bindGlobalKeypress) {
  // Bind to keydown -- trap Enter without IME and Esc to hide.
  htmlInput.onKeyDownWrapper_ =
      browserEvents.conditionalBind(htmlInput, 'keydown', this,
          this.onHtmlInputKeyDown_);
  // Bind to keyup -- trap Enter; resize after every keystroke.
  htmlInput.onKeyUpWrapper_ =
      browserEvents.conditionalBind(htmlInput, 'keyup', this,
          this.onHtmlInputChange_);
  // Bind to keyPress -- repeatedly resize when holding down a key.
  htmlInput.onKeyPressWrapper_ =
      browserEvents.conditionalBind(htmlInput, 'keypress', this,
          this.onHtmlInputChange_);
  // For modern browsers (IE 9+, Chrome, Firefox, etc.) that support the
  // DOM input event, also trigger onHtmlInputChange_ then. The input event
  // is triggered on keypress but after the value of the text input
  // has updated, allowing us to resize the block at that time.
  htmlInput.onInputWrapper_ =
      browserEvents.bind(htmlInput, 'input', this, this.onHtmlInputChange_);
  htmlInput.onWorkspaceChangeWrapper_ = this.resizeEditor_.bind(this);
  this.workspace_.addChangeListener(htmlInput.onWorkspaceChangeWrapper_);

  if (bindGlobalKeypress) {
    htmlInput.onDocumentKeyDownWrapper_ =
      browserEvents.conditionalBind(document, 'keydown', this,
          this.onDocumentKeyDown_);
  }
};

/**
 * Unbind handlers for user input and workspace size changes.
 * @param {!HTMLInputElement} htmlInput The html for this text input.
 * @private
 */
FieldTextInput.prototype.unbindEvents_ = function(htmlInput) {
  browserEvents.unbind(htmlInput.onKeyDownWrapper_);
  browserEvents.unbind(htmlInput.onKeyUpWrapper_);
  browserEvents.unbind(htmlInput.onKeyPressWrapper_);
  browserEvents.unbind(htmlInput.onInputWrapper_);
  this.workspace_.removeChangeListener(
      htmlInput.onWorkspaceChangeWrapper_);

  // Remove document handler only if it was added (e.g. in quiet mode)
  if (htmlInput.onDocumentKeyDownWrapper_) {
    browserEvents.unbind(htmlInput.onDocumentKeyDownWrapper_);
  }
};

/**
 * Handle key down to the editor.
 * @param {!Event} e Keyboard event.
 * @private
 */
FieldTextInput.prototype.onHtmlInputKeyDown_ = function(e) {
  const htmlInput = FieldTextInput.htmlInput_;
  const tabKey = 9, enterKey = 13, escKey = 27;
  if (e.keyCode == enterKey) {
    WidgetDiv.hide();
    DropDownDiv.hideWithoutAnimation();
  } else if (e.keyCode == escKey) {
    htmlInput.value = htmlInput.defaultValue;
    WidgetDiv.hide();
    DropDownDiv.hideWithoutAnimation();
  } else if (e.keyCode == tabKey) {
    WidgetDiv.hide();
    DropDownDiv.hideWithoutAnimation();
    this.sourceBlock_.tab(this, !e.shiftKey);
    e.preventDefault();
  }
};

FieldTextInput.prototype.onDocumentKeyDown_ = function(e) {
  const htmlInput = FieldTextInput.htmlInput_;
  const targetMatches = e.target === htmlInput;
  const targetIsInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
  if (targetMatches || !targetIsInput) { // Ignore keys into other inputs
    htmlInput.removeAttribute('readonly');
    htmlInput.value = ''; // Reset the input, new value is picked up by input keypress
    htmlInput.focus();
    browserEvents.unbind(htmlInput.onDocumentKeyDownWrapper_);
    htmlInput.onDocumentKeyDownWrapper_ = null;
  }
};

/**
 * Key codes that are whitelisted from the restrictor.
 * These are only needed and used on Gecko (Firefox).
 * See: https://github.com/LLK/scratch-blocks/issues/503.
 */
FieldTextInput.GECKO_KEYCODE_WHITELIST = [
  97, // Select all, META-A.
  99, // Copy, META-C.
  118, // Paste, META-V.
  120 // Cut, META-X.
];

/**
 * Handle a change to the editor.
 * @param {!Event} e Keyboard event.
 * @private
 */
FieldTextInput.prototype.onHtmlInputChange_ = function(e) {
  // Check if the key matches the restrictor.
  if (e.type === 'keypress' && this.restrictor_) {
    let keyCode;
    let isWhitelisted = false;
    if (userAgent.GECKO) {
      // e.keyCode is not available in Gecko.
      keyCode = e.charCode;
      // Gecko reports control characters (e.g., left, right, copy, paste)
      // in the key event - whitelist these from being restricted.
      // < 32 and 127 (delete) are control characters.
      // See: http://www.theasciicode.com.ar/ascii-control-characters/delete-ascii-code-127.html
      if (keyCode < 32 || keyCode == 127) {
        isWhitelisted = true;
      } else if (e.metaKey || e.ctrlKey) {
        // For combos (ctrl-v, ctrl-c, etc.), Gecko reports the ASCII letter
        // and the metaKey/ctrlKey flags.
        isWhitelisted = FieldTextInput.GECKO_KEYCODE_WHITELIST.indexOf(keyCode) > -1;
      }
    } else {
      keyCode = e.keyCode;
    }
    const char = String.fromCharCode(keyCode);
    if (!isWhitelisted && !this.restrictor_.test(char) && e.preventDefault) {
      // Failed to pass restrictor.
      e.preventDefault();
      return;
    }
  }
  const htmlInput = FieldTextInput.htmlInput_;
  // Update source block.
  const text = htmlInput.value;
  if (text !== htmlInput.oldValue_) {
    htmlInput.oldValue_ = text;
    this.setText(text);
    this.validate_();
  } else if (userAgent.WEBKIT) {
    // Cursor key.  Render the source block to show the caret moving.
    // Chrome only (version 26, OS X).
    this.sourceBlock_.render();
  }
  this.resizeEditor_();
};

/**
 * Check to see if the contents of the editor validates.
 * Style the editor accordingly.
 * @private
 */
FieldTextInput.prototype.validate_ = function() {
  let valid = true;
  asserts.assertObject(FieldTextInput.htmlInput_);
  const htmlInput = FieldTextInput.htmlInput_;
  if (this.sourceBlock_) {
    valid = this.callValidator(htmlInput.value);
  }
  if (valid === null) {
    utils.addClass(htmlInput, 'blocklyInvalidInput');
  } else {
    utils.removeClass(htmlInput, 'blocklyInvalidInput');
  }
};

/**
 * Resize the editor and the underlying block to fit the text.
 * @private
 */
FieldTextInput.prototype.resizeEditor_ = function() {
  const scale = this.sourceBlock_.workspace.scale;
  const div = WidgetDiv.DIV;

  let initialWidth;
  if (this.sourceBlock_.isShadow()) {
    initialWidth = this.sourceBlock_.getHeightWidth().width * scale;
  } else {
    initialWidth = this.size_.width * scale;
  }

  let width;
  if (rendererConstants.FIELD_TEXTINPUT_EXPAND_PAST_TRUNCATION) {
    // Resize the box based on the measured width of the text, pre-truncation
    let textWidth = scratchBlocksUtils.measureText(
        FieldTextInput.htmlInput_.style.fontSize,
        FieldTextInput.htmlInput_.style.fontFamily,
        FieldTextInput.htmlInput_.style.fontWeight,
        FieldTextInput.htmlInput_.value
    );
    // Size drawn in the canvas needs padding and scaling
    textWidth += FieldTextInput.TEXT_MEASURE_PADDING_MAGIC;
    textWidth *= scale;
    width = textWidth;
  } else {
    // Set width to (truncated) block size.
    width = initialWidth;
  }
  // The width must be at least FIELD_WIDTH and at most FIELD_WIDTH_MAX_EDIT
  width = Math.max(width, rendererConstants.FIELD_WIDTH_MIN_EDIT * scale);
  width = Math.min(width, rendererConstants.FIELD_WIDTH_MAX_EDIT * scale);
  // Add 1px to width and height to account for border (pre-scale)
  div.style.width = (width / scale + 1) + 'px';
  div.style.height = (rendererConstants.FIELD_HEIGHT_MAX_EDIT + 1) + 'px';
  div.style.transform = 'scale(' + scale + ')';

  // Use margin-left to animate repositioning of the box (value is unscaled).
  // This is the difference between the default position and the positioning
  // after growing the box.
  div.style.marginLeft = -0.5 * (width - initialWidth) + 'px';

  // Add 0.5px to account for slight difference between SVG and CSS border
  const borderRadius = this.getBorderRadius() + 0.5;
  div.style.borderRadius = borderRadius + 'px';
  FieldTextInput.htmlInput_.style.borderRadius = borderRadius + 'px';
  // Pull stroke colour from the existing shadow block
  const strokeColour = this.sourceBlock_.getColourTertiary();
  div.style.borderColor = strokeColour;

  const xy = this.getAbsoluteXY_();
  // Account for border width, post-scale
  xy.x -= scale / 2;
  xy.y -= scale / 2;
  // In RTL mode block fields and LTR input fields the left edge moves,
  // whereas the right edge is fixed.  Reposition the editor.
  if (this.sourceBlock_.RTL) {
    xy.x += width;
    xy.x -= div.offsetWidth * scale;
    xy.x += 1 * scale;
  }
  // Shift by a few pixels to line up exactly.
  xy.y += 1 * scale;
  if (userAgent.GECKO && WidgetDiv.DIV.style.top) {
    // Firefox mis-reports the location of the border by a pixel
    // once the WidgetDiv is moved into position.
    xy.x += 2 * scale;
    xy.y += 1 * scale;
  }
  if (userAgent.WEBKIT) {
    xy.y -= 1 * scale;
  }
  // Finally, set the actual style
  div.style.left = xy.x + 'px';
  div.style.top = xy.y + 'px';
};

/**
 * Saves this field's value.
 * @return {*} The text value held by this field.
 * @override
 * @package
 */
FieldTextInput.prototype.saveState = function () {
  return this.getValue();
};

/**
 * Sets the field's value based on the given state.
 * @param {*} state The state to apply to the text input field.
 * @override
 * @package
 */
FieldTextInput.prototype.loadState = function (state) {
  this.setValue(state);
};

/**
 * Border radius for drawing this field, called when rendering the owning shadow block.
 * @return {Number} Border radius in px.
*/
FieldTextInput.prototype.getBorderRadius = function() {
  if (this.sourceBlock_.getOutputShape() == constants.OUTPUT_SHAPE_ROUND) {
    return rendererConstants.NUMBER_FIELD_CORNER_RADIUS;
  }
  return rendererConstants.TEXT_FIELD_CORNER_RADIUS;
};

/**
 * Close the editor, save the results, and start animating the disposal of elements.
 * @return {!Function} Closure to call on destruction of the WidgetDiv.
 * @private
 */
FieldTextInput.prototype.widgetDispose_ = function() {
  const thisField = this;
  return function() {
    const div = WidgetDiv.DIV;
    const htmlInput = FieldTextInput.htmlInput_;
    // Save the edit (if it validates).
    thisField.maybeSaveEdit_();

    thisField.unbindEvents_(htmlInput);
    if (htmlInput.dropDownArrowMouseWrapper_) {
      browserEvents.unbind(htmlInput.dropDownArrowMouseWrapper_);
    }
    eventUtils.setGroup(false);

    // Animation of disposal
    htmlInput.style.fontSize = rendererConstants.FIELD_TEXTINPUT_FONTSIZE_INITIAL + 'pt';
    div.style.boxShadow = '';
    // Resize to actual size of final source block.
    if (thisField.sourceBlock_) {
      if (thisField.sourceBlock_.isShadow()) {
        const size = thisField.sourceBlock_.getHeightWidth();
        div.style.width = (size.width + 1) + 'px';
        div.style.height = (size.height + 1) + 'px';
      } else {
        div.style.width = (thisField.size_.width + 1) + 'px';
        div.style.height = (rendererConstants.FIELD_HEIGHT_MAX_EDIT + 1) + 'px';
      }
    }
    div.style.marginLeft = 0;
  };
};

/**
 * Final disposal of the text field's elements and properties.
 * @return {!Function} Closure to call on finish animation of the WidgetDiv.
 * @private
 */
FieldTextInput.prototype.widgetDisposeAnimationFinished_ = function() {
  return function() {
    // Delete style properties.
    const style = WidgetDiv.DIV.style;
    style.width = 'auto';
    style.height = 'auto';
    style.fontSize = '';
    // Reset class
    WidgetDiv.DIV.className = 'blocklyWidgetDiv';
    // Remove all styles
    WidgetDiv.DIV.removeAttribute('style');
    FieldTextInput.htmlInput_.style.transition = '';
    FieldTextInput.htmlInput_ = null;
  };
};

FieldTextInput.prototype.maybeSaveEdit_ = function() {
  const htmlInput = FieldTextInput.htmlInput_;
  // Save the edit (if it validates).
  let text = htmlInput.value;
  if (this.sourceBlock_) {
    const text1 = this.callValidator(text);
    if (text1 === null) {
      // Invalid edit.
      text = htmlInput.defaultValue;
    } else {
      // Validation function has changed the text.
      text = text1;
      if (this.onFinishEditing_) {
        this.onFinishEditing_(text);
      }
    }
  }
  this.setText(text);
  this.sourceBlock_.rendered && this.sourceBlock_.render();
};

/**
 * Ensure that only a number may be entered.
 * @param {string} text The user's text.
 * @return {?string} A string representing a valid number, or null if invalid.
 */
FieldTextInput.numberValidator = function(text) {
  console.warn('Blockly.FieldTextInput.numberValidator is deprecated. ' +
               'Use FieldNumber instead.');
  if (text === null) {
    return null;
  }
  text = String(text);
  // TODO: Handle cases like 'ten', '1.203,14', etc.
  // 'O' is sometimes mistaken for '0' by inexperienced users.
  text = text.replace(/O/ig, '0');
  // Strip out thousands separators.
  text = text.replace(/,/g, '');
  const n = parseFloat(text || 0);
  return isNaN(n) ? null : String(n);
};

/**
 * Ensure that only a nonnegative integer may be entered.
 * @param {string} text The user's text.
 * @return {?string} A string representing a valid int, or null if invalid.
 */
FieldTextInput.nonnegativeIntegerValidator = function(text) {
  let n = FieldTextInput.numberValidator(text);
  if (n) {
    n = String(Math.max(0, Math.floor(n)));
  }
  return n;
};

/**
 * Get FieldTextInput.htmlInput_
 * @return {!HTMLInputElement} HTML input.
 */
FieldTextInput.getHtmlInput = function() {
  return FieldTextInput.htmlInput_;
};

Field.register('field_input', FieldTextInput);
