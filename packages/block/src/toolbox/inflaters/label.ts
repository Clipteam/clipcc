/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {FlyoutButton} from '../flyout_button';

/**
 * Class responsible for creating labels for flyouts.
 */
export class LabelFlyoutInflater extends Blockly.LabelFlyoutInflater {
  static readonly TYPE = 'label';

  /**
   * Inflates a flyout label from the given state and adds it to the flyout.
   * @param state A JSON representation of a flyout label.
   * @param flyout The flyout to create the label on.
   * @returns A FlyoutButton configured as a label.
   */
  override load(state: object, flyout: Blockly.IFlyout): Blockly.FlyoutItem {
    const label = new FlyoutButton(
      flyout.getWorkspace(),
      flyout.targetWorkspace!,
      state as Blockly.utils.toolbox.ButtonOrLabelInfo,
      true
    );
    label.show();

    return new Blockly.FlyoutItem(label, LabelFlyoutInflater.TYPE);
  }
}

Blockly.registry.register(
  Blockly.registry.Type.FLYOUT_INFLATER,
  LabelFlyoutInflater.TYPE,
  LabelFlyoutInflater,
  true
);
