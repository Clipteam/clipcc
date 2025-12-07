/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {LabelFlyoutInflater} from './label';
import {FlyoutStatusIndicatorLabel} from '../flyout_status_indicator_label';

export class StatusIndicatorLabelFlyoutInflater extends LabelFlyoutInflater {
  static readonly TYPE: string = 'status_indicator_label';

  /**
   * Inflates a flyout label with a status indicator from the given state and
   * adds it to the flyout.
   * @param state A JSON representation of a flyout label.
   * @param flyout The flyout to create the label on.
   * @returns A FlyoutButton configured as a label.
   */
  override load(state: object, flyout: Blockly.IFlyout): Blockly.FlyoutItem {
    const label = new FlyoutStatusIndicatorLabel(
      flyout.getWorkspace(),
      flyout.targetWorkspace!,
      state as Blockly.utils.toolbox.LabelInfo
    );
    label.show();

    return new Blockly.FlyoutItem(label, StatusIndicatorLabelFlyoutInflater.TYPE);
  }
}

Blockly.registry.register(
  Blockly.registry.Type.FLYOUT_INFLATER,
  StatusIndicatorLabelFlyoutInflater.TYPE,
  StatusIndicatorLabelFlyoutInflater
);
