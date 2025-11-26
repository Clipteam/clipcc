/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

type BlockState = Blockly.serialization.blocks.State;

/**
 * Check if a block type exists in the Blockly.Blocks registry.
 * @param type The block type to check.
 * @returns True if the block type exists.
 */
function blockExists(type: string): boolean {
  return Object.prototype.hasOwnProperty.call(Blockly.Blocks, type);
}

/**
 * Recursively convert unknown blocks in state back to their original types.
 * This restores the original block state from the extraState of unknown blocks.
 * @param blockState The block state to convert.
 * @returns The converted block state with unknown blocks restored.
 */
function convertUnknownToOriginal(blockState: BlockState): BlockState {
  if (blockState.type === 'unknown' && blockState.extraState) {
    // The extraState contains the original block state
    const originalState = blockState.extraState as BlockState;
    // Process the restored state recursively in case it has nested blocks
    return convertUnknownToOriginal(originalState);
  }

  // Process nested blocks in inputs
  if (blockState.inputs) {
    for (const inputName in blockState.inputs) {
      if (!Object.prototype.hasOwnProperty.call(blockState.inputs, inputName)) continue;
      const input = blockState.inputs[inputName];
      if (input.block) {
        input.block = convertUnknownToOriginal(input.block);
      }
      if (input.shadow) {
        input.shadow = convertUnknownToOriginal(input.shadow);
      }
    }
  }

  // Process next block
  if (blockState.next?.block) {
    blockState.next.block = convertUnknownToOriginal(blockState.next.block);
  }

  return blockState;
}

/**
 * Recursively convert non-existing blocks to unknown blocks.
 * This preserves the original block state in the extraState of unknown blocks.
 * @param blockState The block state to convert.
 * @returns The converted block state with non-existing blocks as unknown.
 */
function convertToUnknown(blockState: BlockState): BlockState {
  // Process nested blocks in inputs first (depth-first)
  if (blockState.inputs) {
    for (const inputName in blockState.inputs) {
      if (!Object.prototype.hasOwnProperty.call(blockState.inputs, inputName)) continue;
      const input = blockState.inputs[inputName];
      if (input.block) {
        input.block = convertToUnknown(input.block);
      }
      if (input.shadow) {
        input.shadow = convertToUnknown(input.shadow);
      }
    }
  }

  // Process next block
  if (blockState.next?.block) {
    blockState.next.block = convertToUnknown(blockState.next.block);
  }

  // Check if this block type exists
  if (!blockExists(blockState.type)) {
    // Store the original state (with already converted children) as extraState
    const originalState = {...blockState};
    return {
      type: 'unknown',
      id: blockState.id,
      x: blockState.x,
      y: blockState.y,
      extraState: originalState
    };
  }

  return blockState;
}

/**
 * Convert all non-existing blocks in workspace state to unknown blocks.
 * @param state The workspace state to process.
 * @returns The processed workspace state.
 */
function convertWorkspaceStateToUnknown(state: {[key: string]: unknown}): {[key: string]: unknown} {
  const result = {...state};
  if (result.blocks && typeof result.blocks === 'object') {
    const blocks = result.blocks as {blocks?: BlockState[]};
    if (blocks.blocks && Array.isArray(blocks.blocks)) {
      blocks.blocks = blocks.blocks.map(convertToUnknown);
    }
  }
  return result;
}

/**
 * Convert all unknown blocks in workspace state back to their original types.
 * @param state The workspace state to process.
 * @returns The processed workspace state.
 */
function convertWorkspaceStateFromUnknown(state: {[key: string]: unknown}): {[key: string]: unknown} {
  const result = {...state};
  if (result.blocks && typeof result.blocks === 'object') {
    const blocks = result.blocks as {blocks?: BlockState[]};
    if (blocks.blocks && Array.isArray(blocks.blocks)) {
      blocks.blocks = blocks.blocks.map(convertUnknownToOriginal);
    }
  }
  return result;
}

/**
 * Returns the state of the workspace as a plain JavaScript object.
 * Unknown blocks are converted back to their original block types.
 * @param workspace The workspace to serialize.
 * @returns The serialized state of the workspace.
 */
export function saveWorkspace(workspace: Blockly.Workspace) {
  const state = Blockly.serialization.workspaces.save(workspace);
  return convertWorkspaceStateFromUnknown(state);
}

/**
 * Loads the variable represented by the given state into the given workspace.
 * Non-existing block types are converted to unknown blocks to preserve their data.
 * @param state The state of the workspace to deserialize into the workspace.
 * @param workspace The workspace to add the new state to.
 * @param recordUndo If true, events triggered by this function will be
 *     undo-able by the user. False by default.
 */
export function loadWorkspace(
  state: { [key: string]: unknown },
  workspace: Blockly.Workspace,
  recordUndo?: boolean
) {
  const processedState = convertWorkspaceStateToUnknown(state);
  Blockly.serialization.workspaces.load(processedState, workspace, {recordUndo});
}
