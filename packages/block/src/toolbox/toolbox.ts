/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {VerticalFlyout} from './flyout';
import {ToolboxCategory} from './category';
import {CollapsibleToolboxCategory} from './collapsible_category';
import styles from '../styles/toolbox.css';

/**
 * Class for customized toolbox.
 */
export class Toolbox extends Blockly.Toolbox {
  /**
   * Timeout ID used to prevent refreshing the flyout during extensive block
   * changes.
   */
  protected refreshDebouncer?: ReturnType<typeof setTimeout>;

  /** Gap between categories. */
  static readonly CATEGORY_GAP = 36;
  protected renderResolvers: Array<() => void> = [];
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

    const flyout = this.getFlyout() as VerticalFlyout;
    flyout.show(this.getFlyoutContents());
    flyout.setAutoClose(false);

    this.selectItemByPosition(0);
  }

  /**
   * Get contents to be shown in the flyout, including all categories and its label.
   * @returns The contents of flyout.
   */
  private getFlyoutContents(): Blockly.utils.toolbox.FlyoutItemInfo[] {
    let contents: Blockly.utils.toolbox.FlyoutItemInfo[] = [];
    const toolboxItems = this.getToolboxItems();
    for (const toolboxItem of toolboxItems) {
      if (toolboxItem instanceof Blockly.ToolboxCategory) {
        // Add gap between categories.
        if (contents.length !== 0) {
          contents.push({kind: 'sep', gap: Toolbox.CATEGORY_GAP});
        }

        // The label of category.
        if ((toolboxItem as ToolboxCategory).shouldShowStatusButton()) {
          contents.push({kind: 'status_indicator_label', text: toolboxItem.getName(), id: toolboxItem.getId()});
        } else {
          contents.push({kind: 'label', text: toolboxItem.getName(), id: toolboxItem.getId()});
        }

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
   * Select the category with given ID.
   * @param id Category unique ID.
   * @returns Category item.
   */
  getToolboxCategoryById(id: string): Blockly.ToolboxCategory | null {
    const item = this.contents.get(id);
    if (item instanceof Blockly.ToolboxCategory && item.isSelectable()) {
      return item;
    }
    return null;
  }

  /**
   * Update the selected category without calling updateFlyout_. Should be called
   * when the flyout is being scrolled.
   * @param id Category unique ID.
   */
  updateSelectedCategoryById(id: string): void {
    const oldItem = this.selectedItem_;
    if (!oldItem || !this.getFlyout()?.isVisible()) {
      // Don't change if no item is selected or toolbox is hidden.
      return;
    }
    const newItem = this.getToolboxCategoryById(id);
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
   * Decides whether the old item should be deselected.
   * @param oldItem The previously selected toolbox item.
   * @param newItem The newly selected toolbox item.
   * @returns True if the old item should be deselected, false otherwise.
   */
  protected override shouldDeselectItem_(
    oldItem: Blockly.ISelectableToolboxItem | null,
    newItem: Blockly.ISelectableToolboxItem | null
  ): boolean {
    return oldItem !== null;
  }

  /**
   * Selects the given item, marks it selected, and updates aria state.
   * The related parent items should be collapsed or expanded here.
   * @param oldItem The previously selected toolbox item.
   * @param newItem The newly selected toolbox item.
   */
  protected override selectItem_(
    oldItem: Blockly.ISelectableToolboxItem | null,
    newItem: Blockly.ISelectableToolboxItem
  ): void {
    const previousItem = oldItem ?? this.previouslySelectedItem_;
    super.selectItem_(oldItem, newItem);
    this.updateCollapsibleCategories(previousItem, newItem);
  }

  /**
   * Get all parents of given item, including itself. The result is ordered from
   * given item to the root.
   * @param item The toolbox item.
   * @returns Array storing all parents ant itself.
   */
  private getParents(item: Blockly.IToolboxItem | null): Blockly.IToolboxItem[] {
    const parents = [];
    while (item) {
      parents.push(item);
      item = item.getParent();
    }
    return parents;
  }

  /**
   * Collapse or expand all related parent categories.
   * @param oldItem The previously selected toolbox item.
   * @param newItem The newly selected toolbox item.
   */
  private updateCollapsibleCategories(
    oldItem: Blockly.ISelectableToolboxItem | null,
    newItem: Blockly.ISelectableToolboxItem | null
  ): void {
    // Get LCA (Lowest Common Ancestor) of two parents chains.
    const oldParents = this.getParents(oldItem);
    const newParents = this.getParents(newItem);
    let lca: Blockly.IToolboxItem | null = null;
    for (let i = oldParents.length, j = newParents.length; i >= 0 && j >= 0; --i, --j) {
      if (oldParents[i] == newParents[j]) {
        lca = oldParents[i];
      } else {
        break;
      }
    }

    // Collapse all items from old item to LCA.
    for (const item of oldParents) {
      if (item === lca) break;
      if (item.isCollapsible() && (item as CollapsibleToolboxCategory).isExpanded()) {
        (item as CollapsibleToolboxCategory).setExpanded(false);
      }
    }

    // Expand all items from new item to LCA.
    for (const item of newParents) {
      if (item === lca) break;
      if (item.isCollapsible() && !(item as CollapsibleToolboxCategory).isExpanded()) {
        (item as CollapsibleToolboxCategory).setExpanded(true);
      }
    }
  }

  /**
   * Updates the flyout's content without closing it. Should be used in
   * response to a change in one of the dynamic categories, such as variables or
   * procedures.
   */
  override refreshSelection(): void {
    this.forceRerender();
  }

  /**
   * Force re-rendering the flyout.
   * @returns A promise that resolves when the re-render is complete.
   */
  forceRerender(): Promise<void> {
    const renderPromise = new Promise<void>((resolve) => {
      this.renderResolvers.push(resolve);
    });
    if (this.getFlyout()!.isVisible()) {
      if (this.refreshDebouncer) {
        clearTimeout(this.refreshDebouncer);
      }
      this.refreshDebouncer = setTimeout(() => {
        this.getFlyout()!.show(this.getFlyoutContents());
        this.renderResolvers.forEach((resolver) => resolver());
        this.renderResolvers.length = 0;
      }, 10);
    }
    return renderPromise;
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
    const flyout = this.getFlyout() as VerticalFlyout;
    if (!this.selectedItem_) {
      flyout.setVisible(false);
    } else {
      const animation = flyout.isVisible();
      flyout.setVisible(true);
      flyout.scrollToCategoryById(newItem.getId(), animation);
    }
  }

  /**
   * Called when a node of this tree has received active focus.
   * We shouldn't do anything when getting focused.
   *
   * See IFocusableTree.onTreeFocus.
   * @param node The node receiving active focus.
   * @param previousTree The previous tree that held active focus, or null if none.
   */
  override onTreeFocus(node: Blockly.IFocusableNode, previousTree: Blockly.IFocusableTree | null): void {}
}

Blockly.registry.register(
  Blockly.registry.Type.TOOLBOX,
  Blockly.registry.DEFAULT,
  Toolbox,
  true
);

Blockly.Css.register(styles);
