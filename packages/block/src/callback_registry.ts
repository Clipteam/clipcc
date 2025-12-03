/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Constants from './constants';
import {ProcedureExtraState} from './serialization/procedures';

const callbackRegistry = {
  /**
   * Get the initial checkbox state for blocks in flyout. This should be override
   * by external editor with setGetCheckboxState.
   * @param workspaceId Workspace ID.
   * @param blockId Block ID.
   * @returns The state of checkbox.
   */
  getCheckboxState(workspaceId: string, blockId: string) {
    return false;
  },

  /**
   * Gets the extension state.
   * @param extensionId The ID of the extension in question.
   * @returns The state of the extension.
   */
  getExtensionState(extensionId: string) {
    return Constants.StatusButtonState.NOT_READY;
  },

  /**
   * Wrapper to a callback for status buttons.
   * @param id An identifier.
   */
  statusButtonCallback(id: string) {
    console.log(`Status button was pressed for ${id}`);
  },

  /**
   * Callback to create a new procedure custom command block.
   * @param state The state of prcedure block.
   * @param callback Callback function triggered after edit.
   * @param isCreate True if the procedure is newly created.
   */
  externalProcedureDefCallback(
    state: ProcedureExtraState,
    callback: (state?: ProcedureExtraState) => void,
    isCreate: boolean
  ) {
    alert('External procedure editor must override externalProcedureDefCallback');
  },

  /**
   * Callback to checkout current workspace for global procedures.
   * @param procCode Procedure proccode.
   */
  externalCheckoutWorkspaceCallback(procCode: string) {
    alert('External procedure editor must be override externalCheckoutWorkspaceCallback');
  }
};

/**
 * Registers the callback function.
 * @param type The name of callback to register.
 * @param callback The callback to register.
 */
export function register<T extends keyof typeof callbackRegistry>(
  type: T,
  callback: typeof callbackRegistry[T]
) {
  callbackRegistry[type] = callback;
}

/**
 * Get the callback function.
 * @param type The name of callback.
 * @returns The callback function.
 */
export function get<T extends keyof typeof callbackRegistry>(
  type: T
) {
  return callbackRegistry[type];
}
