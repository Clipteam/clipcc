/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2025 Clip Team
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

/**
 * Class for a button field.
 */
export class FieldButton extends Blockly.Field<string> {
  /**
   * Width of the rect of FieldButton.
   */
  static readonly RECT_WIDTH = 20;

  /**
   * Editable fields usually show some sort of UI indicating they are
   * editable. They will also be saved by the serializer.
   */
  override EDITABLE = false;

  /**
   * Serializable fields are saved by the XML renderer, non-serializable fields
   * are not.
   */
  override SERIALIZABLE = false;

  /**
   * SVGElement for button rect.
   */
  private button: SVGElement | null = null;

  /**
   * Function to be called when button clicked.
   */
  private onClickHandler: ((field: FieldButton) => void) | null = null;

  /**
   * Mouse enter event wrapper.
   */
  private onMouseEnterWrapper: Blockly.browserEvents.Data | null = null;

  /**
   * Mouse leave event wrapper.
   */
  private onMouseLeaveWrapper: Blockly.browserEvents.Data | null = null;

  /**
   * @param value Path to the image.
   * @param onClick Function to be called when button clicked.
   */
  constructor(value: string | typeof Blockly.Field.SKIP_SETUP, onClick?: (field: FieldButton) => void) {
    super(Blockly.Field.SKIP_SETUP);

    if (value === Blockly.Field.SKIP_SETUP) return;

    if (typeof onClick === 'function') {
      this.onClickHandler = onClick;
    }
    this.size_ = new Blockly.utils.Size(FieldButton.RECT_WIDTH, FieldButton.RECT_WIDTH);
    this.setValue(value);
  }

  /**
   * Construct a FieldButton from a JSON arg object.
   * @param options A JSON object with options.
   * @returns The new field instance.
   */
  static override fromJson(options: FieldButtonFromJsonConfig): FieldButton {
    return new FieldButton(options.src);
  }

  /**
   * Dispose of all DOM objects belonging to this field.
   */
  override dispose(): void {
    super.dispose();
    this.button = null;
    if (this.onMouseEnterWrapper) {
      Blockly.browserEvents.unbind(this.onMouseEnterWrapper);
    }
    if (this.onMouseLeaveWrapper) {
      Blockly.browserEvents.unbind(this.onMouseLeaveWrapper);
    }
  }

  /**
   * Create the block UI for this field.
   */
  override initView(): void {
    const GRID_UNIT = this.getConstants()!.FIELD_BORDER_RECT_RADIUS;
    const sourceBlock = this.getSourceBlock() as Blockly.BlockSvg;
    this.button = Blockly.utils.dom.createSvgElement('rect', {
      width: FieldButton.RECT_WIDTH,
      height: FieldButton.RECT_WIDTH,
      x: 0,
      y: 0,
      rx: GRID_UNIT,
      ry: GRID_UNIT,
      stroke: sourceBlock.getColourTertiary(),
      fill: sourceBlock.getColour()
    }, this.fieldGroup_);
    const image = Blockly.utils.dom.createSvgElement('image', {
      width: FieldButton.RECT_WIDTH,
      height: FieldButton.RECT_WIDTH
    }, this.fieldGroup_);
    image.setAttributeNS(
      'http://www.w3.org/1999/xlink',
      'xlink:href',
      this.getValue() ?? ''
    );
    this.fieldGroup_!.style.cursor = 'default';

    this.onMouseEnterWrapper = Blockly.browserEvents.bind(
      this.fieldGroup_!, 'mouseenter', this, this.onMouseEnter
    );
    this.onMouseLeaveWrapper = Blockly.browserEvents.bind(
      this.fieldGroup_!, 'mouseleave', this, this.onMouseLeave
    );
  }

  /**
   * Process click event.
   */
  protected override showEditor_(): void {
    if (this.onClickHandler) {
      this.onClickHandler(this);
    }
  }

  /**
   * Updates the size of the field based on the text.
   * Leave for NOP to prevent size changing.
   * @param margin margin to use when positioning the text element.
   */
  protected override updateSize_(margin?: number): void {}

  /**
   * Handle "mouseenter" event.
   */
  private onMouseEnter() {
    this.button?.setAttribute(
      'fill',
      (this.getSourceBlock() as Blockly.BlockSvg).getColourSecondary()
    );
  }

  /**
   * Handle "mouseleave" event.
   */
  private onMouseLeave() {
    this.button?.setAttribute(
      'fill',
      (this.getSourceBlock() as Blockly.BlockSvg).getColour()
    );
  }
}

export interface FieldButtonFromJsonConfig extends Blockly.FieldConfig {
  src: string;
}

/**
 * Register the field and any dependencies.
 */
export function registerFieldButton() {
  Blockly.fieldRegistry.register('field_button', FieldButton);
}
