/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {FlyoutCheckboxGroupNavigationPolicy} from './flyout_checkbox_group';
import {Checkbox} from './checkbox';

/**
 * Flyout navigator that additionally knows how to navigate into the checkbox.
 */
export class FlyoutNavigator extends Blockly.FlyoutNavigator {
  constructor(protected override flyout: Blockly.IFlyout) {
    super(flyout);
    this.rules.push(new FlyoutCheckboxGroupNavigationPolicy());
  }

  /**
   * Returns whether the given node is navigable.
   * @param node The node to check.
   * @returns True if the node is navigable.
   */
  protected override isNavigable(node: Blockly.IFocusableNode): boolean {
    if (super.isNavigable(node)) return true;
    return node instanceof Checkbox;
  }

  /**
   * Returns the containing group when navigating out of a checkbox, so that
   * the checkbox behaves as a child of the group.
   * @param node The node to navigate out of, defaults to the currently
   *     focused node.
   * @param bypassAdjustments True to skip layout-based adjustments.
   * @returns The containing group, or the stock result otherwise.
   */
  override getOutNode(
    node: Blockly.IFocusableNode | null | undefined = Blockly.getFocusManager().getFocusedNode(),
    bypassAdjustments = false
  ): Blockly.IFocusableNode | null {
    if (node instanceof Checkbox) {
      return node.getGroup();
    }
    return super.getOutNode(node, bypassAdjustments);
  }
}
