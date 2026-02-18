/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * Class for a button or label in the flyout.
 */
export class FlyoutButton extends Blockly.FlyoutButton {
  /** Label ID specified in json state. */
  protected labelId: string | null = null;

  /**
   * @param workspace The workspace in which to place this button.
   * @param targetWorkspace The flyout's target workspace.
   * @param json The JSON specifying the label/button.
   * @param isFlyoutLabel Whether this button should be styled as a label.
   */
  constructor(
    workspace: Blockly.WorkspaceSvg,
    targetWorkspace: Blockly.WorkspaceSvg,
    json: Blockly.utils.toolbox.ButtonOrLabelInfo,
    isFlyoutLabel: boolean
  ) {
    super(workspace, targetWorkspace, json, isFlyoutLabel);
    if (isFlyoutLabel) {
      this.labelId = (json as Blockly.utils.toolbox.LabelInfo).id ?? null;
    }
  }

  getLabelId(): string | null {
    return this.labelId;
  }

  override onNodeFocus(): void {
    // No-op, label focus in continuous toolbox leads desync of category selection.
  }
}
