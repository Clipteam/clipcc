/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Contains top-level functions for serializing workspaces to
 *     plain JavaScript objects.
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
import * as blocks from './blocks.js';
import { FinishedLoading } from '../events/workspace_events.js';
import * as eventUtils from '../events/utils';
import * as utils from '../utils';
import * as variables from './variables.js';

goog.declareModuleId('Blockly.serialization.workspaces');

/**
 * Returns the state of the workspace as a plain JavaScript object.
 * @param {!Blockly.Workspace} workspace The workspace to serialize.
 * @return {!Object<string, *>} The serialized state of the workspace.
 */
export const save = function(workspace) {
  const state = Object.create(null);

  // TODO: Switch this to use plugin serialization system (once it is built).
  const variableStates = [];
  const vars = workspace.getAllVariables();
  for (let i = 0; i < vars.length; i++) {
    variableStates.push(variables.save(vars[i]));
  }
  if (variableStates.length) {
    state['variables'] = variableStates;
  }

  const blockStates = [];
  for (const block of workspace.getTopBlocks(false)) {
    const blockState =
      blocks.save(block, {addCoordinates: true});
    if (blockState) {
      blockStates.push(blockState);
    }
  }
  if (blockStates.length) {
    // This is an object to support adding language version later.
    state['blocks'] = {
      'blocks': blockStates
    };
  }

  return state;
};

/**
 * Loads the variable represented by the given state into the given workspace.
 * @param {!Object<string, *>} state The state of the workspace to deserialize
 *     into the workspace.
 * @param {!Blockly.Workspace} workspace The workspace to add the new state to.
 * @param {{recordUndo: (boolean|undefined)}=} param1
 *     recordUndo: If true, events triggered by this function will be undo-able
 *       by the user. False by default.
 */
export const load = function(state, workspace, {recordUndo = false} = {}) {
  // TODO: Switch this to use plugin serialization system (once it is built).
  // TODO: Add something for clearing the state before deserializing.

  const prevRecordUndo = eventUtils.getRecordUndo();
  eventUtils.setRecordUndo(recordUndo);
  const existingGroup = eventUtils.getGroup();
  if (!existingGroup) {
    eventUtils.setGroup(true);
  }

  utils.startTextWidthCache();
  if (workspace.setResizesEnabled) {
    workspace.setResizesEnabled(false);
  }

  if (state['variables']) {
    const variableStates = state['variables'];
    for (let i = 0; i < variableStates.length; i++) {
      variables.load(variableStates[i], workspace, {recordUndo});
    }
  }

  if (state['blocks']) {
    const blockStates = state['blocks']['blocks'];
    for (let i = 0; i < blockStates.length; i++) {
      blocks.load(blockStates[i], workspace, {recordUndo});
    }
  }

  if (workspace.setResizesEnabled) {
    workspace.setResizesEnabled(true);
  }
  utils.stopTextWidthCache();

  eventUtils.fire(new FinishedLoading(workspace));

  eventUtils.setGroup(existingGroup);
  eventUtils.setRecordUndo(prevRecordUndo);
};
