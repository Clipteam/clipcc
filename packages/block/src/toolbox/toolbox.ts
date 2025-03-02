/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { ContinuousVerticalFlyout } from './flyout';

/**
 * Class for continuous toolbox.
 */
export class ContinuousToolBox extends Blockly.Toolbox {
  /** The list of items in the toolbox. */
  protected contentsList: Blockly.IToolboxItem[] = [];

  /**
   * @param workspace The workspace in which to create new blocks.
   */
  constructor(workspace: Blockly.WorkspaceSvg) {
    super(workspace);
  }

  /**
   * Initializes the toolbox.
   */
  override init(): void {
    super.init();

    const flyout = this.getFlyout() as ContinuousVerticalFlyout;
    flyout.show(this.getFlyoutContents());
    flyout.recordScrollPositions();
    flyout.setAutoClose(false);

    this.selectItemByPosition(0);
  }

  /**
   * Adds an item to the toolbox.
   * @param toolboxItem The item in the toolbox.
   */
  protected override addToolboxItem_(toolboxItem: Blockly.IToolboxItem): void {
    this.contentsList.push(toolboxItem);
    super.addToolboxItem_(toolboxItem);
  }

  /**
   * Fills the toolbox with new toolbox items and removes any old contents.
   * Clear the contentsList before calling super.render.
   * @param toolboxDef Object holding information for creating a toolbox.
   */
  override render(toolboxDef: Blockly.utils.toolbox.ToolboxInfo): void {
    this.contentsList = [];
    super.render(toolboxDef);
  }

  /**
   * Get contents to be shown in the flyout, including all categories and its label.
   * @returns The contents of flyout.
   */
  private getFlyoutContents(): Blockly.utils.toolbox.FlyoutItemInfo[] {
    let contents: Blockly.utils.toolbox.FlyoutItemInfo[] = [];
    for (const toolboxItem of this.contentsList) {
      if (toolboxItem instanceof Blockly.ToolboxCategory) {
        // The label of category.
        contents.push({kind: 'label', text: toolboxItem.getName()});

        let itemContents = toolboxItem.getContents();
        if (typeof itemContents === 'string') {
          // Deal with string to create a dynamic category.
          // @see Blockly.Flyout.show
          itemContents = [{kind: 'category', custom: itemContents}];
        }
        contents = contents.concat(itemContents);
      }
    }
    return contents;
  }

  /**
   * Select the category with given name.
   * @param name Category name.
   */
  getToolboxCategoryByName(name: string): Blockly.ToolboxCategory | null {
    for (const item of this.contents.values()) {
      if (
        item instanceof Blockly.ToolboxCategory &&
        item.isSelectable() && item.getName() === name
      ) {
        return item;
      }
    }
    return null;
  }

  /**
   * Update the selected category without calling updateFlyout_. Should be called
   * when the flyout is being scrolled.
   * @param name Category name.
   */
  updateSelectedCategory(name: string): void {
    const oldItem = this.selectedItem_;
    if (!oldItem || !this.getFlyout()?.isVisible()) {
      // Don't change if no item is selected or toolbox is hidden.
      return;
    }
    const newItem = this.getToolboxCategoryByName(name);
    if (!newItem || oldItem === newItem) {
      return;
    }

    if (this.shouldDeselectItem_(oldItem, newItem)) {
      this.deselectItem_(oldItem);
    }

    if (this.shouldSelectItem_(oldItem, newItem)) {
      this.selectItem_(oldItem, newItem);
    }
  }

  /**
   * Updates the flyout's content without closing it. Should be used in
   * response to a change in one of the dynamic categories, such as variables or
   * procedures.
   */
  override refreshSelection(): void {
    this.getFlyout()!.show(this.getFlyoutContents());
  }

  /**
   * Decides whether to hide or show the flyout depending on the selected item.
   * @param oldItem The previously selected toolbox item.
   * @param newItem The newly selected toolbox item.
   */
  protected override updateFlyout_(
    oldItem: Blockly.ISelectableToolboxItem | null,
    newItem: Blockly.ISelectableToolboxItem | null
  ): void {
    if (!newItem) {
      return;
    }
    const flyout = this.getFlyout() as ContinuousVerticalFlyout;
    if (!this.selectedItem_) {
      flyout.setVisible(false);
    } else {
      const animation = flyout.isVisible();
      flyout.setVisible(true);
      flyout.scrollToCategory(newItem.getName(), animation);
    }
  }
}
