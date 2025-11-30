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

import * as Blockly from 'blockly/core';

import styles from '../styles/number.css';
import {Colours} from '../colours';

/**
 * Class for an editable number field.
 * In scratch-blocks, the min/max/precision properties are only used
 * to construct a restrictor on typable characters, and to inform the pop-up
 * numpad on touch devices.
 * These properties are included here (i.e. instead of just accepting a
 * decimalAllowed, negativeAllowed) to maintain API compatibility with Blockly
 * and Blockly for Android.
 */
export class FieldNumber extends Blockly.FieldTextInput {
  /** The minimum value this number field can contain. */
  protected min_ = -Infinity;

  /** The maximum value this number field can contain. */
  protected max_ = Infinity;

  /** The multiple to which this fields value is rounded. */
  protected precision_ = 0;

  /**
   * Buttons for the num-pad, in order from the top left.
   * Values are strings of the number or symbol will be added to the field text
   * when the button is pressed.
   */
  // Calculator order
  private static readonly NUMPAD_BUTTONS =
    ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '-', ' '] as const;

  /**
   * Fixed width of the num-pad drop-down, in px.
   */
  private static readonly DROPDOWN_WIDTH = 168;

  /**
   * Src for the delete icon to be shown on the num-pad.
   */
  private static readonly NUMPAD_DELETE_ICON = 'data:image/svg+xml;utf8,' +
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
   */
  static activeField: FieldNumber | null = null;

  protected decimalAllowed = true;
  protected negativeAllowed = true;
  protected exponentialAllowed = true;

  /** Don't spellcheck numbers.  Our validator does a better job. */
  protected override spellcheck_ = false;

  /**
   * Touch event wrappers for the num-pad buttons.
   */
  private buttonTouchCallbacks: Blockly.browserEvents.Data[] = [];

  /**
   * @param value The initial value of the field. Should cast to a number.
   *     Defaults to 0. Also accepts Field.SKIP_SETUP if you wish to skip setup
   *     (only used by subclasses that want to handle configuration and setting
   *     the field value after their own constructors have run).
   * @param min Minimum value. Will only be used if config is not
   *     provided.
   * @param max Maximum value. Will only be used if config is not
   *     provided.
   * @param precision Precision for value. Will only be used if config
   *     is not provided.
   * @param validator A function that is called to validate changes to the
   *     field's value. Takes in a number & returns a validated number, or null
   *     to abort the change.
   * @param config A map of options used to configure the field.
   *     See the [field creation documentation]{@link
   * https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/number#creation}
   * for a list of properties this parameter supports.
   */
  constructor(
    value?: string | number | typeof Blockly.Field.SKIP_SETUP,
    min?: string | number | null,
    max?: string | number | null,
    precision?: string | number | null,
    validator?: Blockly.FieldTextInputValidator | null,
    config?: Blockly.FieldNumberConfig
  ) {
    // Pass SENTINEL so that we can define properties before value validation.
    super(Blockly.Field.SKIP_SETUP);

    if (value === Blockly.Field.SKIP_SETUP) return;
    if (config) {
      this.configure_(config);
    } else {
      this.setConstraints(min, max, precision);
    }
    this.setValue(value);
    if (validator) {
      this.setValidator(validator);
    }
  }

  /**
   * Configure the field based on the given map of options.
   * @param config A map of options to configure the field based on.
   */
  protected override configure_(config: Blockly.FieldNumberConfig) {
    super.configure_(config);
    this.setMinInternal(config.min);
    this.setMaxInternal(config.max);
    this.setPrecisionInternal(config.precision);
  }

  /**
   * Set the maximum, minimum and precision constraints on this field.
   * Any of these properties may be undefined or NaN to be disabled.
   * Setting precision (usually a power of 10) enforces a minimum step between
   * values. That is, the user's value will rounded to the closest multiple of
   * precision. The least significant digit place is inferred from the
   * precision. Integers values can be enforces by choosing an integer
   * precision.
   * @param min Minimum value.
   * @param max Maximum value.
   * @param precision Precision for value.
   */
  setConstraints(
    min: number | string | undefined | null,
    max: number | string | undefined | null,
    precision: number | string | undefined | null
  ) {
    this.setMinInternal(min);
    this.setMaxInternal(max);
    this.setPrecisionInternal(precision);
    this.setValue(this.getValue());
  }

  /**
   * Sets the minimum value this field can contain. Updates the value to
   * reflect.
   * @param min Minimum value.
   */
  setMin(min: number | string | undefined | null) {
    this.setMinInternal(min);
    this.setValue(this.getValue());
  }

  /**
   * Sets the minimum value this field can contain. Called internally to avoid
   * value updates.
   * @param min Minimum value.
   */
  private setMinInternal(min: number | string | undefined | null) {
    if (min === null) {
      this.min_ = -Infinity;
    } else {
      min = Number(min);
      if (!isNaN(min)) {
        this.min_ = min;
      }
    }

    this.negativeAllowed = (typeof min === 'undefined') || isNaN(min as number) ||
      (min as number) < 0;
  }

  /**
   * Returns the current minimum value this field can contain. Default is
   * -Infinity.
   * @returns The current minimum value this field can contain.
   */
  getMin(): number {
    return this.min_;
  }

  /**
   * Sets the maximum value this field can contain. Updates the value to
   * reflect.
   * @param max Maximum value.
   */
  setMax(max: number | string | undefined | null) {
    this.setMaxInternal(max);
    this.setValue(this.getValue());
  }

  /**
   * Sets the maximum value this field can contain. Called internally to avoid
   * value updates.
   * @param max Maximum value.
   */
  private setMaxInternal(max: number | string | undefined | null) {
    if (max === null) {
      this.max_ = Infinity;
    } else {
      max = Number(max);
      if (!isNaN(max)) {
        this.max_ = max;
      }
    }
  }

  /**
   * Returns the current maximum value this field can contain. Default is
   * Infinity.
   * @returns The current maximum value this field can contain.
   */
  getMax(): number {
    return this.max_;
  }

  /**
   * Sets the precision of this field's value, i.e. the number to which the
   * value is rounded. Updates the field to reflect.
   * @param precision The number to which the field's value is rounded.
   */
  setPrecision(precision: number | string | undefined | null) {
    this.setPrecisionInternal(precision);
    this.setValue(this.getValue());
  }

  /**
   * Sets the precision of this field's value. Called internally to avoid
   * value updates.
   * @param precision The number to which the field's value is rounded.
   */
  private setPrecisionInternal(precision: number | string | undefined | null) {
    this.precision_ = Number(precision) || 0;
    let precisionString = String(this.precision_);
    if (precisionString.includes('e')) {
      // String() is fast.  But it turns .0000001 into '1e-7'.
      // Use the much slower toLocaleString to access all the digits.
      precisionString = this.precision_.toLocaleString('en-US', {
        maximumFractionDigits: 20
      });
    }

    this.decimalAllowed = (typeof precision === 'undefined') ||
      isNaN(precision as number) || (precision === 0) ||
      (Math.floor(precision as number) !== precision);
    this.exponentialAllowed = this.decimalAllowed;
  }

  /**
   * Return an appropriate restrictor, depending on whether this FieldNumber
   * allows decimal or negative numbers.
   * @returns Regular expression for this FieldNumber's restrictor.
   */
  protected getNumRestrictor() {
    let pattern = '[\\d]'; // Always allow digits.
    if (this.decimalAllowed) {
      pattern += '|[\\.]';
    }
    if (this.negativeAllowed) {
      pattern += '|[-]';
    }
    if (this.exponentialAllowed) {
      pattern += '|[eE]';
    }
    return new RegExp(pattern);
  }

  /**
   * Handle key down event to enforce number restrictions.
   * @param e Keyboard event.
   */
  override onHtmlInputKeyDown_(e: KeyboardEvent) {
    super.onHtmlInputKeyDown_(e);
    // key can be things like "Backspace", so only validate when it represents a single
    // character so as to allow non-textual input to work as normal.
    if (e.key.length === 1) {
      const validator = this.getNumRestrictor();
      if (!e.key.match(validator)) {
        e.preventDefault();
      }
    }
  }

  /**
   * Returns the current precision of this field. The precision being the
   * number to which the field's value is rounded. A precision of 0 means that
   * the value is not rounded.
   * @returns The number to which this field's value is rounded.
   */
  getPrecision(): number {
    return this.precision_;
  }

  /**
   * Create the number input editor widget.
   * @returns The newly created number input editor.
   */
  protected override widgetCreate_(): HTMLInputElement {
    const htmlInput = super.widgetCreate_() as HTMLInputElement;

    // Set the accessibility state
    if (this.min_ > -Infinity) {
      htmlInput.min = `${this.min_}`;
      Blockly.utils.aria.setState(htmlInput, Blockly.utils.aria.State.VALUEMIN, this.min_);
    }
    if (this.max_ < Infinity) {
      htmlInput.max = `${this.max_}`;
      Blockly.utils.aria.setState(htmlInput, Blockly.utils.aria.State.VALUEMAX, this.max_);
    }
    return htmlInput;
  }

  private shouldUseNumPad(event?: Event): boolean {
    if (!Blockly.Touch.TOUCH_ENABLED) {
      return false;
    }
    if (event && event instanceof PointerEvent) {
      return event.pointerType !== 'mouse';
    }
    return true;
  }

  /**
   * Show the drop-down menu for editing this field.
   * @param event Optional mouse event that triggered the field to open, or
   *     undefined if triggered programmatically.
   * @param quietInput True if editor should be created without focus.
   *     Defaults to false.
   */
  protected override showEditor_(event?: Event, quietInput?: boolean): void {
    FieldNumber.activeField = this;
    const showNumPad = this.shouldUseNumPad(event);
    super.showEditor_(event, showNumPad, false);
    if (showNumPad) {
      ;
      this.showNumPad();
    }
  }

  protected showNumPad() {
    // If there is an existing drop-down someone else owns, hide it immediately and clear it.
    Blockly.DropDownDiv.hideWithoutAnimation();
    Blockly.DropDownDiv.clearContent();
    const contentDiv = Blockly.DropDownDiv.getContentDiv();

    // Accessibility properties
    contentDiv.setAttribute('role', 'menu');
    contentDiv.setAttribute('aria-haspopup', 'true');

    this.addButtons(contentDiv);
    this.htmlInput_!.select();

    // Set colour and size of drop-down
    const sourceBlock = this.getSourceBlock() as Blockly.BlockSvg;
    const sourceBlockParent = sourceBlock.getParent() as Blockly.BlockSvg;
    Blockly.DropDownDiv.setColour(sourceBlockParent.getColour(),
      sourceBlockParent.getColourTertiary());
    contentDiv.style.width = FieldNumber.DROPDOWN_WIDTH + 'px';
    Blockly.DropDownDiv.showPositionedByBlock<string>(this, sourceBlock, this.disposeEditor.bind(this));
  }

  protected disposeEditor() {
    FieldNumber.activeField = null;
    // Unbind all button touch event wrappers
    for (const data of this.buttonTouchCallbacks) {
      Blockly.browserEvents.unbind(data);
    }
    this.buttonTouchCallbacks = [];
  }

  /**
   * Update the displayed value and resize/scroll the text field as needed.
   * @param newValue The new text to display.
   * @param newSelection The new index to put the cursor
   */
  protected updateDisplay(newValue: string, newSelection: number) {
    const oldValue = this.htmlInput_!.value;
    this.setEditorValue_(newValue, false);
    // Resize and scroll the text field appropriately
    const htmlInput = this.htmlInput_;
    if (!htmlInput) {
      return;
    }
    htmlInput.setSelectionRange(newSelection, newSelection);
    htmlInput.scrollLeft = htmlInput.scrollWidth;

    if (
      this.sourceBlock_ &&
          Blockly.Events.isEnabled() &&
          this.value_ !== oldValue
    ) {
      // Fire a special event indicating that the value changed but the change
      // isn't complete yet and normal field change listeners can wait.
      Blockly.Events.fire(
        new (Blockly.Events.get(Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE))(
          this.sourceBlock_,
          this.name || null,
          oldValue,
          this.value_
        )
      );
    }
  }

  /**
   * Add number, punctuation, and erase buttons to the numeric keypad's content
   * div.
   * @param contentDiv The div for the numeric keypad.
   */
  private addButtons(contentDiv: Element) {
    const sourceBlock = this.getSourceBlock() as Blockly.BlockSvg;
    const sourceBlockParent = sourceBlock.getParent() as Blockly.BlockSvg;

    const buttonColour = sourceBlockParent.getColour();
    const buttonBorderColour = sourceBlockParent.getColourTertiary();

    // Add numeric keypad buttons
    const buttons = FieldNumber.NUMPAD_BUTTONS;
    for (const buttonText of buttons) {
      const button = document.createElement('button');
      button.setAttribute('role', 'menuitem');
      button.setAttribute('class', 'blocklyNumPadButton');
      button.setAttribute('style',
        'background:' + buttonColour + ';' +
          'border: 1px solid ' + buttonBorderColour + ';');
      button.title = buttonText;
      button.innerHTML = buttonText;
      const touchCallback = this.numPadButtonTouchFactory(buttonText);
      const data = Blockly.browserEvents.bind(button, 'mousedown', button, touchCallback);
      this.buttonTouchCallbacks.push(data);
      if (buttonText === '.' && !this.decimalAllowed) {
        // Don't show the decimal point for inputs that must be round numbers
        button.setAttribute('style', 'visibility: hidden');
      } else if (buttonText === '-' && !this.negativeAllowed) {
        continue;
      } else if (buttonText === ' ' && !this.negativeAllowed) {
        continue;
      } else if (buttonText === ' ' && this.negativeAllowed) {
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

    Blockly.browserEvents.bind(eraseButton, 'mousedown', null,
      FieldNumber.numPadEraseButtonTouch);
    contentDiv.appendChild(eraseButton);
  };

  /**
   * Make a callback for when a num-pad number or punctuation button is touched.
   * Determine what the user is inputting and update the text field appropriately.
   * @param buttonText The text of the button that was touched.
   * @returns The callback function.
   */
  protected numPadButtonTouchFactory(buttonText: string) {
    const callback = function(this: FieldNumber, e: PointerEvent) {
      // Old value of the text field
      const oldValue = this.htmlInput_!.value;
      // Determine the selected portion of the text field
      const selectionStart = this.htmlInput_!.selectionStart!;
      const selectionEnd = this.htmlInput_!.selectionEnd!;

      // Splice in the new value
      const newValue = oldValue.slice(0, selectionStart) + buttonText + oldValue.slice(selectionEnd);

      // Set new value and advance the cursor
      this.updateDisplay(newValue, selectionStart + buttonText.length);

      // This is just a click.
      Blockly.Touch.clearTouchIdentifier();

      // Prevent default to not lose input focus
      e.preventDefault();
    };
    return callback.bind(this);
  }

  /**
   * Call for when the num-pad erase button is touched.
   * Determine what the user is asking to erase, and erase it.
   * @param e DOM event triggering the touch.
   */
  static numPadEraseButtonTouch(e: PointerEvent) {
    if (!FieldNumber.activeField) {
      return;
    }
    const field = FieldNumber.activeField;
    // Old value of the text field
    const oldValue = field.htmlInput_!.value;
    // Determine what is selected to erase (if anything)
    let selectionStart = field.htmlInput_!.selectionStart!;
    const selectionEnd = field.htmlInput_!.selectionEnd!;

    // If selection is zero-length, shift start to the left 1 character
    if (selectionStart === selectionEnd) {
      selectionStart = Math.max(0, selectionStart - 1);
    }

    // Cut out selected range
    const newValue = oldValue.slice(0, selectionStart) +
      oldValue.slice(selectionEnd);

    field.updateDisplay(newValue, selectionStart);

    // This is just a click.
    Blockly.Touch.clearTouchIdentifier();

    // Prevent default to not lose input focus which resets cursors in Chrome
    e.preventDefault();
  }

  /**
   * Initialize the field's DOM.
   * @override
   */

  public override initView() {
    super.initView();
    if (this.fieldGroup_) {
      Blockly.utils.dom.addClass(this.fieldGroup_, 'blocklyNumberField');
    }
  }

  /**
   * Construct a FieldNumber from a JSON arg object.
   * @param options A JSON object with options (value, min, max, and precision).
   * @returns The new field instance.
   */
  static override fromJson(options: Blockly.FieldNumberFromJsonConfig): FieldNumber {
    return new FieldNumber(
      options.value,
      options.min,
      options.max,
      options.precision,
      undefined,
      options
    );
  }
}

FieldNumber.prototype.DEFAULT_VALUE = '0';

/** Register the field so block JSON can reference it. */
export function registerFieldNumber() {
  // Override Blockly's field number
  Blockly.fieldRegistry.register('field_number', FieldNumber);
  Blockly.Css.register(styles);
}
