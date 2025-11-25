/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ScratchCategory} from './category';

export class CollapsibleToolboxCategory extends Blockly.CollapsibleToolboxCategory {
  /** Default color for the category. */
  static readonly DEFAULT_COLOUR = ScratchCategory.DEFAULT_COLOUR;

  /** Element of colour bar on the left of category. */
  protected colourBar: HTMLDivElement | null = null;

  override makeDefaultCssConfig_() {
    const cssConfig = super.makeDefaultCssConfig_();
    cssConfig.container = 'clipccToolboxCategoryContainer';
    cssConfig.row = 'clipccToolboxCategory';
    cssConfig.icon = 'clipccCategoryItemColorBar';
    cssConfig.label = 'clipccCategoryItemLabel';
    cssConfig.rowcontentcontainer = 'clipccCategoryItem';
    cssConfig.contents = 'clipccToolboxCategoryGroup';
    return cssConfig;
  }

  /**
   * Add the strip of colour to the toolbox category.
   * @param colour The category colour.
   */
  protected override addColourBorder_(colour: string) {
    if (colour) {
      this.colourBar!.style.backgroundColor = colour;
    } else {
      this.colourBar!.style.backgroundColor = ScratchCategory.DEFAULT_COLOUR;
    }
  }

  /**
   * Creates the span that holds the category icon. Override for creating
   * the color bar.
   * @returns The element that contains color bar.
   */
  override createIconDom_(): HTMLSpanElement {
    this.colourBar = document.createElement('div');
    this.colourBar.className = this.cssConfig_['icon']!;
    return this.colourBar;
  }

  /**
   * Sets the current category as selected.
   * @param isSelected True if this category is selected, false otherwise.
   */
  override setSelected(isSelected: boolean): void {
    if (!this.rowDiv_) {
      return;
    }
    const className = this.cssConfig_['selected'];
    if (isSelected) {
      if (className) {
        Blockly.utils.dom.addClass(this.rowDiv_, className);
      }
    } else {
      if (className) {
        Blockly.utils.dom.removeClass(this.rowDiv_, className);
      }
    }
    Blockly.utils.aria.setState(
      this.htmlDiv_ as Element,
      Blockly.utils.aria.State.SELECTED,
      isSelected
    );
  }
}

Blockly.registry.register(
  Blockly.registry.Type.TOOLBOX_ITEM,
  Blockly.CollapsibleToolboxCategory.registrationName,
  CollapsibleToolboxCategory,
  true
);
