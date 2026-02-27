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
  /** Height of the flyout button. Keep consistent with old Blockly. */
  static readonly PINNED_HEIGHT: number = 40;

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
      // New blockly have different height for flyout labels. but in old scratch blocks, label and button share same
      // height. So we adjust the height here to make it visually consistent.
      if (this.height < FlyoutButton.PINNED_HEIGHT) {
        const heightDelta = FlyoutButton.PINNED_HEIGHT - this.height;
        this.height = FlyoutButton.PINNED_HEIGHT;

        const root = this.getSvgRoot();
        const text = root.querySelector('text');
        if (text) {
          const currentY = Number(text.getAttribute('y'));
          text.setAttribute('y', `${currentY + heightDelta / 2}`);
        }

        const rect = root.querySelector('rect');
        if (rect) {
          rect.setAttribute('height', `${this.height}`);
        }
      }
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
