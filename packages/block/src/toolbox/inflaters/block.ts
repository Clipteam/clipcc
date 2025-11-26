/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {isCheckboxInFlyout} from '../../interfaces/i_checkbox_in_flyout';
import {FlyoutCheckbox} from '../flyout_checkbox';

export class BlockFlyoutInflater extends Blockly.BlockFlyoutInflater {
  static readonly TYPE = 'block';

  /**
   * Inflates a flyout block from the given state and adds it to the flyout.
   * Create a checkbox for block if checkboxInFlyout is defined.
   * @param state A JSON representation of a flyout block.
   * @param flyout The flyout to create the block on.
   * @returns A newly created block.
   */
  load(state: object, flyout: Blockly.IFlyout): Blockly.FlyoutItem {
    const flyoutItem = super.load(state, flyout);

    // Add checkbox if checkboxInFlyout is true in block.
    const block = flyoutItem.getElement() as Blockly.BlockSvg;
    if (isCheckboxInFlyout(block) && block.checkboxInFlyout) {
      return new Blockly.FlyoutItem(
        new FlyoutCheckbox(block, flyout.getWorkspace(), (newChecked: boolean) => {
          // Fire a block change event when checkbox state changes.
          if (Blockly.Events.isEnabled()) {
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
        }),
        BlockFlyoutInflater.TYPE
      );
    }

    return flyoutItem;
  }
}

Blockly.registry.register(
  Blockly.registry.Type.FLYOUT_INFLATER,
  BlockFlyoutInflater.TYPE,
  BlockFlyoutInflater,
  true
);
