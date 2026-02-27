/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2017 Massachusetts Institute of Technology
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
 * @fileoverview Vertical separator field. Draws a vertical line.
 * @author ericr@media.mit.edu (Eric Rosenbaum)
 */

import * as Blockly from 'blockly/core';
import {isScratchExtensionBlock} from '../interfaces/i_scratch_extension';
import type {ConstantProvider} from '../renderer/constants';


/**
 * Class for a vertical separator line.
 */
export class FieldVerticalSeparator extends Blockly.Field {
  /** Editable fields are saved by the XML renderer, non-editable fields are not. */
  override EDITABLE = false;

  protected lineElement: SVGElement | null = null;

  constructor() {
    super(Blockly.Field.SKIP_SETUP);
    this.size_ = new Blockly.utils.Size(1, 0);
  }

  /**
   * Construct a FieldVerticalSeparator from a JSON arg object.
   * @param options A JSON object with options (unused, but passed in by Field.fromJson).
   * @returns The new field instance.
   */
  static override fromJson(options: Blockly.FieldConfig): Blockly.Field {
    return new FieldVerticalSeparator();
  }

  /**
   * Install this field on a block.
   */
  protected override initView(): void {
    this.updateSize_();
    this.lineElement = Blockly.utils.dom.createSvgElement('line', {
      stroke: (this.getSourceBlock() as Blockly.BlockSvg).getColourSecondary(),
      'stroke-linecap': 'round',
      x1: 0,
      y1: 0,
      x2: 0,
      y2: this.size_.height
    }, this.fieldGroup_);
  }

  /**
   * Get the value of this field. A no-op in this case.
   * @returns null.
   */
  override getValue() {
    return null;
  }

  /**
   * Set the value of this field. A no-op in this case.
   * @param newValue New value.
   * @param fireChangeEvent Whether to fire a change event.
   */
  override setValue(newValue: string, fireChangeEvent?: boolean): void {
    return;
  }

  /**
   * Separator lines are fixed width, no need to update.
   * @param margin margin to use when positioning the text element.
   */
  protected override updateSize_(margin?: number): void {
    const constants = this.getConstants() as ConstantProvider;

    // Default height is 10 grid units (40px).
    // Hat blocks have a shorter separator (36px).
    let height = 10 * constants.GRID_UNIT;

    const block = this.getSourceBlock() as Blockly.BlockSvg;
    if (
      isScratchExtensionBlock(block) &&
      block.isScratchExtension &&
      !block.previousConnection &&
      block.nextConnection
    ) {
      height -= constants.GRID_UNIT;
    }

    this.size_.height = height;
    if (this.lineElement) {
      this.lineElement.setAttribute('y2', `${this.size_.height}`);
    }
  }

  /**
   * Separator lines are fixed width, no need to render.
   */
  protected override render_(): void {
    return;
  }
}

/**
 * Register the field and any dependencies.
 */
export function registerFieldVerticalSeparator() {
  Blockly.fieldRegistry.register('field_vertical_separator', FieldVerticalSeparator);
}
