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
 * Additional config supported by the number field.
 */
export interface FieldNumberConfig extends Blockly.FieldTextInputConfig {
  min?: number | string | null;
  max?: number | string | null;
  precision?: number | string | null;
}

export interface FieldNumberFromJsonConfig extends FieldNumberConfig {
  value?: string | number | null;
}

/**
 * Scratch flavoured number field that supports nullable values and touch numpads.
 * Extends FieldTextInput (and thus Field<string>) to allow blank input states.
 */
export class FieldNumber extends Blockly.FieldTextInput {
  /** Fixed width of the num-pad drop-down, in px. */
  private static readonly DROPDOWN_WIDTH = 168;

  /** Buttons for the num-pad, calculator order. */
  private static readonly NUMPAD_BUTTONS =
    ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '-', ' '];

  /** Src for the delete icon shown on the num-pad. */
  private static readonly NUMPAD_DELETE_ICON =
    'data:image/svg+xml;utf8,' +
    '<svg ' +
    'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
    '<path d="M28.89,11.45H16.79a2.86,2.86,0,0,0-2,.84L9.09,18a2.85,2.85,' +
    '0,0,0,0,4l5.69,5.69a2.86,2.86,0,0,0,2,.84h12.1a2.86,2.86,0,0,0,2.86-' +
    '2.86V14.31A2.86,2.86,0,0,0,28.89,11.45ZM27.15,22.73a1,1,0,0,1,0,1.41,' +
    '1,1,0,0,1-.71.3,1,1,0,0,1-.71-0.3L23,21.41l-2.73,2.73a1,1,0,0,1-1.41,' +
    '0,1,1,0,0,1,0-1.41L21.59,20l-2.73-2.73a1,1,0,0,1,0-1.41,1,1,0,0,1,' +
    '1.41,0L23,18.59l2.73-2.73a1,1,0,1,1,1.42,1.41L24.42,20Z" fill="' +
    String(Colours.numPadText) + '"/></svg>';

  /** Currently active field while the numpad is displayed. */
  private static activeField_: FieldNumber | null = null;

  /** The minimum value this number field can contain. */
  private min_ = -Infinity;

  /** The maximum value this number field can contain. */
  private max_ = Infinity;

  /** The multiple to which this fields value is rounded. */
  private precision_ = 0;

  /**
   * The number of decimal places to allow, or null to allow any number of
   * decimal digits.
   */
  private decimalPlaces: number | null = null;

  private decimalAllowed_ = true;
  private negativeAllowed_ = true;

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
    value?: string | number | null | typeof Blockly.Field.SKIP_SETUP,
    min?: string | number | null,
    max?: string | number | null,
    precision?: string | number | null,
    validator?: Blockly.FieldTextInputValidator | Blockly.FieldNumberValidator | null,
    config?: FieldNumberConfig
  ) {
    super(Blockly.Field.SKIP_SETUP);

    if (config) {
      this.configure_(config);
    }
    if (!config || min !== undefined || max !== undefined || precision !== undefined) {
      this.setConstraints(min, max, precision);
    }

    if (value !== Blockly.Field.SKIP_SETUP) {
      const initial = value === undefined ? '0' : value;
      this.setValue(initial);
    }

    if (validator) {
      this.setValidator(validator as Blockly.FieldTextInputValidator);
    }
  }

  /**
   * Configure the field based on the given map of options.
   * @param config A map of options to configure the field based on.
   */
  protected override configure_(config: FieldNumberConfig): void {
    super.configure_(config);
    if (config.min !== undefined || config.max !== undefined || config.precision !== undefined) {
      this.setConstraints(config.min, config.max, config.precision);
    }
  }

  override setValue(newValue: string | number | null, fireChangeEvent = true): void {
    //  Allow null values.
    if (newValue === null || newValue === undefined) {
      const oldValue = this.value_;
      if (oldValue === null) {
        return;
      }
      this.value_ = null;
      this.isDirty_ = true;
      if (fireChangeEvent && this.sourceBlock_ && Blockly.Events.isEnabled()) {
        Blockly.Events.fire(
          new Blockly.Events.BlockChange(
            this.sourceBlock_,
            'field',
            this.name || null,
            oldValue,
            null
          )
        );
      }
      this.forceRerender();
      return;
    }

    const normalized = typeof newValue === 'number' ? this.formatNumber(newValue) : `${newValue}`;
    super.setValue(normalized, fireChangeEvent);
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
  ): void {
    this.setMinInternal(min);
    this.setMaxInternal(max);
    this.setPrecisionInternal(precision);
    this.updateRestrictionFlags();

    const currentValue = this.value_;
    if (currentValue !== null && currentValue !== '') {
      super.setValue(currentValue, false);
    }
  }

  /**
   * Sets the minimum value this field can contain. Updates the value to
   * reflect.
   * @param min Minimum value.
   */
  setMin(min: number | string | undefined | null): void {
    this.setMinInternal(min);
    this.updateRestrictionFlags();
  }

  /**
   * Sets the maximum value this field can contain. Updates the value to
   * reflect.
   * @param max Maximum value.
   */
  setMax(max: number | string | undefined | null): void {
    this.setMaxInternal(max);
    this.updateRestrictionFlags();
  }

  /**
   * Sets the precision of this field's value, i.e. the number to which the
   * value is rounded. Updates the field to reflect.
   * @param precision The number to which the field's value is rounded.
   */
  setPrecision(precision: number | string | undefined | null): void {
    this.setPrecisionInternal(precision);
    this.updateRestrictionFlags();
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
   * Returns the current maximum value this field can contain. Default is
   * Infinity.
   * @returns The current maximum value this field can contain.
   */
  getMax(): number {
    return this.max_;
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
   * Ensure that the input value is a valid number (must fulfill the
   * constraints placed on the field).
   * @param newValue The input value.
   * @returns A valid number, or null if invalid.
   */
  protected override doClassValidation_(newValue?: string | null): string | null {
    if (newValue === null || newValue === undefined) {
      return null;
    }

    const rawText = `${newValue}`;
    if (rawText === '') {
      return '';
    }

    if (this.isBeingEdited_ && this.isPartialInput(rawText)) {
      return rawText;
    }

    let normalized = rawText.replace(/O/gi, '0');
    normalized = normalized.replace(/,/g, '');
    normalized = normalized.replace(/infinity/i, 'Infinity');

    let numeric = Number(normalized || 0);
    if (Number.isNaN(numeric)) {
      return null;
    }
    numeric = Math.min(Math.max(numeric, this.min_), this.max_);
    if (this.precision_ && Number.isFinite(numeric)) {
      numeric = Math.round(numeric / this.precision_) * this.precision_;
    }
    if (this.decimalPlaces !== null) {
      numeric = Number(numeric.toFixed(this.decimalPlaces));
    }

    return this.formatNumber(numeric);
  }

  protected override getText_(): string | null {
    if (!this.isBeingEdited_ && (this.value_ === null || this.value_ === undefined)) {
      return '';
    }
    return super.getText_();
  }

  protected override getEditorText_(value: string | null): string {
    if (value === null || value === undefined) {
      return '';
    }
    return super.getEditorText_(value);
  }

  protected override getValueFromEditorText_(text: string): string {
    return text;
  }

  /**
   * Show the inline free-text editor on top of the text and the num-pad if
   * appropriate.
   * @param event The event that triggered the editor to open.
   * @param quietInput Whether to suppress the on-screen keyboard on touch devices.
   */
  protected override showEditor_(event?: Event, quietInput?: boolean): void {
    const showNumPad = this.shouldUseNumPad(event);
    super.showEditor_(event, showNumPad ? true : quietInput, false);
    if (!showNumPad) {
      FieldNumber.activeField_ = null;
      return;
    }
    FieldNumber.activeField_ = this;
    this.moveCursorToEnd();
    this.showNumPad();
  }

  protected override widgetDispose_(): void {
    super.widgetDispose_();
    if (FieldNumber.activeField_ === this) {
      FieldNumber.activeField_ = null;
    }
  }

  private shouldUseNumPad(event?: Event): boolean {
    if (!Blockly.Touch.TOUCH_ENABLED) {
      return false;
    }
    if (event && 'pointerType' in event && event instanceof PointerEvent) {
      return event.pointerType !== 'mouse';
    }
    return true;
  }

  /**
   * Sets the minimum value this field can contain. Called internally to avoid
   * value updates.
   * @param min Minimum value.
   */
  private setMinInternal(min: number | string | undefined | null): void {
    if (min == null) {
      this.min_ = -Infinity;
      return;
    }
    const numeric = Number(min);
    if (!Number.isNaN(numeric)) {
      this.min_ = numeric;
    }
  }

  /**
   * Sets the maximum value this field can contain. Called internally to avoid
   * value updates.
   * @param max Maximum value.
   */
  private setMaxInternal(max: number | string | undefined | null): void {
    if (max == null) {
      this.max_ = Infinity;
      return;
    }
    const numeric = Number(max);
    if (!Number.isNaN(numeric)) {
      this.max_ = numeric;
    }
  }

  /**
   * Sets the precision of this field's value. Called internally to avoid
   * value updates.
   * @param precision The number to which the field's value is rounded.
   */
  private setPrecisionInternal(precision: number | string | undefined | null): void {
    this.precision_ = Number(precision) || 0;
    let precisionString = String(this.precision_);
    if (precisionString.includes('e')) {
      precisionString = this.precision_.toLocaleString('en-US', {maximumFractionDigits: 20});
    }
    const decimalIndex = precisionString.indexOf('.');
    if (decimalIndex === -1) {
      this.decimalPlaces = this.precision_ ? 0 : null;
    } else {
      this.decimalPlaces = precisionString.length - decimalIndex - 1;
    }
  }

  private formatNumber(value: number): string {
    if (Object.is(value, -0)) {
      return '0';
    }
    return String(value);
  }

  private isPartialInput(value: string): boolean {
    return value === '-' || value === '.' || value === '-.' || value === '+.' || value === '+';
  }

  private updateRestrictionFlags(): void {
    this.decimalAllowed_ = this.precision_ === 0 || !Number.isInteger(this.precision_);
    this.negativeAllowed_ = this.min_ < 0 || !Number.isFinite(this.min_);
  }

  /**
   * Show the number pad.
   */
  private showNumPad(): void {
    Blockly.DropDownDiv.hideWithoutAnimation();
    Blockly.DropDownDiv.clearContent();
    const contentDiv = Blockly.DropDownDiv.getContentDiv();
    contentDiv.setAttribute('role', 'menu');
    contentDiv.setAttribute('aria-haspopup', 'true');
    contentDiv.style.width = `${FieldNumber.DROPDOWN_WIDTH}px`;
    this.addButtons(contentDiv);

    const sourceBlock = this.getSourceBlock() as Blockly.BlockSvg | null;
    if (!sourceBlock) {
      return;
    }
    const colourSource = (sourceBlock.getParent() as Blockly.BlockSvg | null) ?? sourceBlock;
    Blockly.DropDownDiv.setColour(
      colourSource.getColour(),
      colourSource.getColourTertiary()
    );

    Blockly.DropDownDiv.showPositionedByBlock(
      this as Blockly.Field<string | null | undefined>,
      sourceBlock,
      this.onHide.bind(this)
    );
  }

  /**
   * Add number, punctuation, and erase buttons to the numeric keypad's content
   * div.
   * @param contentDiv The div for the numeric keypad.
   */
  private addButtons(contentDiv: Element): void {
    const sourceBlock = this.getSourceBlock() as Blockly.BlockSvg | null;
    const colourSource = (sourceBlock?.getParent() as Blockly.BlockSvg | null) || sourceBlock;
    const buttonColour = colourSource?.getColour() || String(Colours.numPadBackground);
    const buttonBorderColour = colourSource?.getColourTertiary() || String(Colours.numPadBorder);

    for (const buttonText of FieldNumber.NUMPAD_BUTTONS) {
      if (buttonText === '-' && !this.negativeAllowed_) {
        continue;
      }
      if (buttonText === ' ' && !this.negativeAllowed_) {
        continue;
      }
      const button = document.createElement('button');
      button.setAttribute('role', 'menuitem');
      button.className = 'blocklyNumPadButton';
      button.style.background = buttonColour;
      button.style.border = `1px solid ${buttonBorderColour}`;
      button.title = buttonText.trim() || 'placeholder';
      button.textContent = buttonText;
      button.dataset.value = buttonText;
      if (buttonText === '.' && !this.decimalAllowed_) {
        button.style.visibility = 'hidden';
      } else if (buttonText === ' ' && this.negativeAllowed_) {
        button.style.visibility = 'hidden';
      }
      Blockly.browserEvents.bind(button, 'pointerdown', this, FieldNumber.handleNumPadButton);
      contentDiv.appendChild(button);
    }

    const eraseButton = document.createElement('button');
    eraseButton.setAttribute('role', 'menuitem');
    eraseButton.className = 'blocklyNumPadButton';
    eraseButton.style.background = buttonColour;
    eraseButton.style.border = `1px solid ${buttonBorderColour}`;
    eraseButton.title = 'Delete';
    const eraseImage = document.createElement('img');
    eraseImage.src = FieldNumber.NUMPAD_DELETE_ICON;
    eraseButton.appendChild(eraseImage);
    Blockly.browserEvents.bind(eraseButton, 'pointerdown', null, FieldNumber.handleNumPadErase);
    contentDiv.appendChild(eraseButton);
  }

  /**
   * Call for when a num-pad number or punctuation button is touched.
   * Determine what the user is inputting and update the text field appropriately.
   * @param e DOM event triggering the touch.
   */
  private static handleNumPadButton(e: PointerEvent): void {
    e.preventDefault();
    const field = FieldNumber.activeField_;
    if (!field || !field.htmlInput_) {
      return;
    }
    const button = e.currentTarget as HTMLButtonElement | null;
    const spliceValue = button?.dataset.value ?? '';
    field.insertTextAtCursor(spliceValue);
    Blockly.Touch.clearTouchIdentifier();
  }

  /**
   * Call for when the num-pad erase button is touched.
   * Determine what the user is asking to erase, and erase it.
   * @param e DOM event triggering the touch.
   */
  private static handleNumPadErase(e: PointerEvent): void {
    e.preventDefault();
    const field = FieldNumber.activeField_;
    if (!field || !field.htmlInput_) {
      return;
    }
    field.eraseFromInput();
    Blockly.Touch.clearTouchIdentifier();
  }

  private insertTextAtCursor(text: string): void {
    const input = this.htmlInput_;
    if (!input) {
      return;
    }
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const newValue = input.value.slice(0, start) + text + input.value.slice(end);
    this.updateDisplay(newValue, start + text.length);
  }

  private eraseFromInput(): void {
    const input = this.htmlInput_;
    if (!input) {
      return;
    }
    let start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    if (start === end) {
      start = Math.max(0, start - 1);
    }
    const newValue = input.value.slice(0, start) + input.value.slice(end);
    this.updateDisplay(newValue, start);
  }

  /**
   * Update the displayed value and resize/scroll the text field as needed.
   * @param newValue The new text to display.
   * @param newSelection The new index to put the cursor
   */
  private updateDisplay(newValue: string, newSelection: number): void {
    const input = this.htmlInput_;
    if (!input) {
      return;
    }
    this.setEditorValue_(newValue, false);
    this.resizeEditor_();
    input.setSelectionRange(newSelection, newSelection);
    input.scrollLeft = input.scrollWidth;
  }

  private moveCursorToEnd(): void {
    const input = this.htmlInput_;
    if (!input) {
      return;
    }
    const length = input.value.length;
    input.setSelectionRange(length, length);
  }

  /**
   * Callback for when the drop-down is hidden.
   */
  private onHide(): void {
    const contentDiv = Blockly.DropDownDiv.getContentDiv();
    contentDiv.removeAttribute('role');
    contentDiv.removeAttribute('aria-haspopup');
    if (FieldNumber.activeField_ === this) {
      FieldNumber.activeField_ = null;
    }
  }

  /**
   * Construct a FieldNumber from a JSON arg object.
   * @param options A JSON object with options (value, min, max, and precision).
   * @returns The new field instance.
   */
  static override fromJson(options: FieldNumberFromJsonConfig): FieldNumber {
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
