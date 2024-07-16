/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2024 Clip Team
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @fileoverview Contains top-level functions for serializing workspaces to
 *     plain JavaScript objects.
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
import * as blockSerializer from './blocks';
import { WorkspaceFinishedLoading } from '../events/workspace_finished_loading';
import * as eventUtils from '../events/utils';
import * as utils from '../utils';
import * as variableSerializer from './variables';
import * as commentSerializer from './comments';
import * as procedureSerializer from './procedures';

goog.declareModuleId('Blockly.serialization.workspaces');

/**
 * Returns the state of the workspace as a plain JavaScript object.
 * @param {!Blockly.Workspace} workspace The workspace to serialize.
 * @return {!Object<string, *>} The serialized state of the workspace.
 */
export const save = function(workspace) {
  const state = Object.create(null);

  const variableStates = [];
  const vars = workspace.getAllVariables();
  for (let i = 0; i < vars.length; i++) {
    variableStates.push(variableSerializer.save(vars[i]));
  }

  if (variableStates.length) {
    state['variables'] = variableStates;
  }

  
  const commentStates = commentSerializer.save(workspace);
  if (commentStates.length) {
    state['comments'] = commentStates;
  }

  const blockStates = [];
  const blocks = workspace.getTopBlocks(true);
  for (const block of blocks) {
    const blockState =
      blockSerializer.save(block, { addCoordinates: true });
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
 *     clear: If true, It will clear current workspace first. False by default.
 */
export const load = function(state, workspace, {recordUndo = false, clear = false} = {}) {
  if (clear) {
    workspace.setResizesEnabled(false);
    workspace.setToolboxRefreshEnabled(false);
    workspace.clear();
  }

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

  let width;  // Not used in LTR.
  if (workspace.RTL) {
    width = workspace.getWidth();
  }

  if (state['variables']) {
    const variableStates = state['variables'];
    for (const variableState of variableStates) {
      variableSerializer.load(variableState, workspace, {recordUndo});
    }
  }

  if (state['blocks']) {
    const blockStates = state['blocks']['blocks'];
    for (const blockState of blockStates) {
      blockSerializer.load(blockState, workspace, {recordUndo});
    }
  }

  if (state['comments']) {
    const commentStates = state['comments'];
    commentSerializer.load(commentStates, workspace, width);
  }

  if (state['procedures']) {
    const procedureStates = state['procedures'];
    procedureSerializer.load(procedureStates, workspace);
  }

  if (workspace.setResizesEnabled) {
    workspace.setResizesEnabled(true);
  }

  eventUtils.fire(new WorkspaceFinishedLoading(workspace));

  if (!existingGroup) {
    eventUtils.setGroup(false);
  }
  utils.stopTextWidthCache();
  eventUtils.setRecordUndo(prevRecordUndo);

  if (clear) {
    workspace.setResizesEnabled(true);
    workspace.setToolboxRefreshEnabled(true);
  }
};
