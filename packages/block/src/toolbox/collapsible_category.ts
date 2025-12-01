/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ToolboxCategory} from './category';

export class CollapsibleToolboxCategory extends Blockly.CollapsibleToolboxCategory {
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
      this.colourBar!.style.backgroundColor = ToolboxCategory.DEFAULT_COLOUR;
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
   * Get whether this category is selectable.
   * @returns True if this category is not disabled.
   */
  override isSelectable(): boolean {
    return !this.isDisabled_;
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

  /**
   * Opens or closes the current category and the associated flyout.
   * @param isExpanded True to expand the category, false to close.
   */
  override setExpanded(isExpanded: boolean): void {
    if (this.expanded_ === isExpanded) return;

    this.expanded_ = isExpanded;
    if (isExpanded) {
      this.subcategoriesDiv_!.style.display = '';
      this.openIcon_(this.iconDom_);
    } else {
      this.subcategoriesDiv_!.style.display = 'none';
      this.closeIcon_(this.iconDom_);
    }
    Blockly.utils.aria.setState(
      this.htmlDiv_ as HTMLDivElement,
      Blockly.utils.aria.State.EXPANDED,
      isExpanded
    );
  }

  /**
   * Handles when the toolbox item is clicked.
   * @param e Click event to handle.
   */
  override onClick(e: Event): void {
    // Shouldn't do anything since the behaviour is handled by toolbox.
    // See Toolbox.updateCollapsibleCategories
  }
}

Blockly.registry.register(
  Blockly.registry.Type.TOOLBOX_ITEM,
  Blockly.CollapsibleToolboxCategory.registrationName,
  CollapsibleToolboxCategory,
  true
);
