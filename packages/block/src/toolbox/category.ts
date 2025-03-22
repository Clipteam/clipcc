/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import styles from '../styles/category.css';

/**
 * Class for scratch category.
 */
export class ScratchCategory extends Blockly.ToolboxCategory {
  /** Default color for the category. */
  static readonly DEFAULT_COLOUR = '#575E75';

  /** Element of colour bar on the left of category. */
  protected colourBar: HTMLDivElement | null = null;

  /**
   * @param categoryDef The information needed to create a category in the
   *     toolbox.
   * @param parentToolbox The parent toolbox for the category.
   * @param parent The parent category or null if the category does not have
   *     a parent.
   */
  constructor(
    categoryDef: Blockly.utils.toolbox.CategoryInfo,
    parentToolbox: Blockly.IToolbox,
    parent?: Blockly.ICollapsibleToolboxItem
  ) {
    super(categoryDef, parentToolbox, parent);
  }

  /**
   * Creates an object holding the default classes for a category.
   * @returns The configuration object holding all the CSS classes for a
   *     category.
   */
  protected makeDefaultCssConfig_(): Blockly.ToolboxCategory.CssConfig {
    const cssConfig = super.makeDefaultCssConfig_();
    cssConfig.container = 'clipccToolboxCategoryContainer';
    cssConfig.row = 'clipccToolboxCategory';
    cssConfig.icon = 'clipccCategoryItemColorBar';
    cssConfig.label = 'clipccCategoryItemLabel';
    cssConfig.rowcontentcontainer = 'clipccCategoryItem';
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
  protected override createIconDom_(): Element {
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

/**
 * Register the toolbox item class and any dependencies.
 */
export function registerScratchCategory() {
  Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM,
    Blockly.ToolboxCategory.registrationName,
    ScratchCategory,
    true
  );
  Blockly.Css.register(styles);
}
