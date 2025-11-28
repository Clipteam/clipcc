/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {isCheckboxInFlyout} from '../../interfaces/i_checkbox_in_flyout';
import {FlyoutCheckbox} from '../flyout_checkbox';
import {getCheckboxState} from '../../utils';

export class BlockFlyoutInflater extends Blockly.BlockFlyoutInflater {
  static readonly TYPE = 'block';

  /**
   * Inflates a flyout block from the given state and adds it to the flyout.
   * Create a checkbox for block if checkboxInFlyout is defined.
   * @param state A JSON representation of a flyout block.
   * @param flyout The flyout to create the block on.
   * @returns A newly created block.
   */
  override load(state: object, flyout: Blockly.IFlyout): Blockly.FlyoutItem {
    const flyoutItem = super.load(state, flyout);

    // Add checkbox if checkboxInFlyout is true in block.
    const block = flyoutItem.getElement() as Blockly.BlockSvg;
    if (isCheckboxInFlyout(block) && block.checkboxInFlyout) {
      const state = getCheckboxState(block.workspace.id, block.id);
      return new Blockly.FlyoutItem(
        new FlyoutCheckbox(
          flyoutItem,
          flyout.getWorkspace(),
          flyout.targetWorkspace!,
          state,
          this.onCheckboxChange.bind(this)
        ),
        BlockFlyoutInflater.TYPE
      );
    }

    return flyoutItem;
  }

  /**
   * Dispose the flyout item.
   * @param item The flyout item to dispose of.
   */
  override disposeItem(item: Blockly.FlyoutItem): void {
    const element = item.getElement();
    if (element instanceof FlyoutCheckbox) {
      const childItem = element.getChildItem();
      if (childItem) {
        super.disposeItem(childItem);
      }
      element.dispose();
    } else {
      super.disposeItem(item);
    }
  }

  /**
   * Event handler triggered when the checkbox state is changed.
   * @param newChecked The new checkbox state.
   * @param checkbox The checkbox instance.
   */
  protected onCheckboxChange(newChecked: boolean, checkbox: FlyoutCheckbox) {
    // Fire a block change event when checkbox state changes.
    if (Blockly.Events.isEnabled()) {
      const block = checkbox.getChildItem()!.getElement();
      Blockly.Events.fire(
        new (Blockly.Events.get(Blockly.Events.BLOCK_CHANGE))(
          block,
          'checkbox',
          null,
          !newChecked,
          newChecked
        )
      );
    }
  }
}

Blockly.registry.register(
  Blockly.registry.Type.FLYOUT_INFLATER,
  BlockFlyoutInflater.TYPE,
  BlockFlyoutInflater,
  true
);
