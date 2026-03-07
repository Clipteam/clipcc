/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {isShadowTemplate} from './interfaces/i_shadow_template';

export class Gesture extends Blockly.Gesture {
  /**
   * Handle a pointerdown event on a workspace.
   * @param e A pointerdown event.
   * @param ws The workspace the event hit.
   */
  override handleWsStart(e: PointerEvent, ws: Blockly.WorkspaceSvg) {
    // @ts-expect-error Accessing private member of Blockly.Gesture.
    if (this.gestureHasStarted) {
      throw Error(
        'Tried to call gesture.handleWsStart, ' +
        'but the gesture had already been started.'
      );
    }
    // @ts-expect-error Accessing private member of Blockly.Gesture.
    this.setStartWorkspace(ws);
    // @ts-expect-error Accessing private member of Blockly.Gesture.
    this.mostRecentEvent = e;

    if (// @ts-expect-error Accessing private member of Blockly.Gesture.
      !this.targetBlock && // @ts-expect-error Accessing private member of Blockly.Gesture.
      !this.startBubble && // @ts-expect-error Accessing private member of Blockly.Gesture.
      !this.startComment && // @ts-expect-error Accessing private member of Blockly.Gesture.
      !this.startIcon
    ) {
      // Ensure the workspace is selected if nothing else should be. Note that
      // this is focusNode() instead of focusTree() because if any active node
      // is focused in the workspace it should be defocused.
      Blockly.getFocusManager().focusNode(ws);
      // @ts-expect-error Accessing private member of Blockly.Gesture.
    } else if (this.startBlock?.isShadow() && isShadowTemplate(this.startBlock) && this.startBlock.shadowTemplate) {
      // Allow to select shadow template blocks so that we can dragging them to duplicate.
      // @ts-expect-error Accessing private member of Blockly.Gesture.
      Blockly.getFocusManager().focusNode(this.startBlock);
    }

    this.doStart(e);
  }
};
