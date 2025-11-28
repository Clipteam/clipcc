/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2018 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Blockly from 'blockly/core';

/**
 * @fileoverview Utility methods for Scratch Blocks but not Blockly.
 * @author fenichel@google.com (Rachel Fenichel)
 */

/**
 * Compare strings with natural number sorting.
 * @param str1 First input.
 * @param str2 Second input.
 * @returns -1, 0, or 1 to signify greater than, equality, or less than.
 */
export function compareStrings(str1: string, str2: string): number {
  return str1.localeCompare(str2, [], {
    sensitivity: 'base',
    numeric: true
  });
}

/**
 * Get current workspace options.
 * Blockly.getMainWorkspace doesn't work when initView is called on toolbox init.
 * @param field The current field.
 * @returns Workspace options.
 */
export function getWorkspaceOptions(field: Blockly.Field): Blockly.Options {
  const workspace = Blockly.getMainWorkspace() ?? field.getSourceBlock()?.workspace;
  if (workspace.isFlyout) {
    return workspace.options.parentWorkspace!.options;
  } else {
    return workspace.options;
  }
}

/**
 * Get current workspace options from block.
 * Blockly.getMainWorkspace doesn't work when initView is called on toolbox init.
 * @param block The current block.
 * @returns Workspace options.
 */
export function getWorkspaceOptionsFromBlock(block: Blockly.Block): Blockly.Options {
  const workspace = Blockly.getMainWorkspace() ?? block.workspace;
  if (workspace.isFlyout) {
    return workspace.options.parentWorkspace!.options;
  } else {
    return workspace.options;
  }
}

/**
 * Get the initial checkbox state for blocks in flyout. This should be override
 * by external editor with setGetCheckboxState.
 * @param workspaceId Workspace ID.
 * @param blockId Block ID.
 * @returns The state of checkbox.
 */
export let getCheckboxState = function(workspaceId: string, blockId: string) {
  return false;
};

/**
 * Set getCheckboxState.
 * @param func The function to set to.
 */
export function setGetCheckboxState(func: typeof getCheckboxState) {
  getCheckboxState = func;
}
