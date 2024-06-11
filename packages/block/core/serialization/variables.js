/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Handles serializing variables to plain JavaScript objects, only
 *     containing state.
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
import * as eventUtils from '../events/utils';

goog.declareModuleId('Blockly.serialization.variables');


/**
 * Returns the state of the variable as a plain JavaScript object.
 * @param {!Blockly.VariableModel} variableModel The variable to serialize.
 * @return {!State} The serialized state of the variable.
 */
export const save = function(variableModel) {
  const state = {
    'name': variableModel.name,
    'id': variableModel.getId()
  };
  if (variableModel.type) {
    state['type'] = variableModel.type;
  }
  if (variableModel.isLocal) {
    state['isLocal'] = variableModel.isLocal;
  }
  if (variableModel.isCloud) {
    state['isCloud'] = variableModel.isCloud;
  }
  return state;
};

/**
 * Loads the variable represented by the given state into the given workspace.
 * Do not call this directly, use workspace.createVariable instead.
 * @param {!State} state The state of a variable to deserialize into the
 *     workspace.
 * @param {!Blockly.Workspace} workspace The workspace to add the variable to.
 * @param {{recordUndo: (boolean|undefined)}=} param1
 *     recordUndo: If true, events triggered by this function will be undo-able
 *       by the user. False by default.
 */
export const load = function(state, workspace, {recordUndo = false} = {}) {
  const prevRecordUndo = eventUtils.getRecordUndo();
  eventUtils.setRecordUndo(recordUndo);
  const existingGroup = eventUtils.getGroup();
  if (!existingGroup) {
    eventUtils.setGroup(true);
  }

  workspace.createVariable(state['name'], state['type'], state['id']);

  eventUtils.setGroup(existingGroup);
  eventUtils.setRecordUndo(prevRecordUndo);
};

