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
 * @fileoverview Handles serializing blocks to plain JavaScript objects only
 *     containing state.
 */

'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.serialization.blocks');

import * as constants from '../constants';
import * as eventUtils from '../events/utils';
import * as Variables from '../variables';
import * as Xml from '../xml';
import { MissingBlockType } from './exceptions';

const asserts = goog.require('goog.asserts');

/**
 * Returns the state of the given block as a plain JavaScript object.
 * @param {!Blockly.Block} block The block to serialize.
 * @param {{addCoordinates: (boolean|undefined)}=} param1
 *     addCoordinates: If true the coordinates of the block are added to the
 *       serialized state. False by default.
 *     noId: Don't serialize id. False by default.
 *     doFullSerialization: If true, fields that normally just save a reference
 *       to some external state (eg variables) will instead serialize all of the
 *       info about that state. This supports deserializing the block into a
 *       workspace where that state doesn't yet exist. True by default.
 * @return {?State} The serialized state of the
 *     block, or null if the block could not be serialied (eg it was an
 *     insertion marker).
 */
export const save = function(block, {
  addCoordinates = false,
  noId = false,
  doFullSerialization = true
} = {}
) {
  const state = {
    'type': block.type,
  };

  if (!noId) {
    state['id'] = block.id;
  }

  saveExtraState(block, state);
  saveFields(block, state, doFullSerialization);

  saveComment(block, state);
  saveAttributes(block, state);

  saveInputBlocks(block, state, doFullSerialization);
  saveNextBlocks(block, state, doFullSerialization);

  if (addCoordinates) {
    saveCoords(block, state);
  }
  return state;
};

/**
 * Adds attributes to the given state object based on the state of the block.
 * Eg collapsed, inline, etc.
 * @param {!Blockly.Block} block The block to base the attributes on.
 * @param {!State} state The state object to append
 *     to.
 */
const saveAttributes = function(block, state) {
  if (block.inputsInlineDefault != block.inputsInline) {
    state['inline'] = block.inputsInline;
  }
  if (block.isCollapsed()) {
    state['collapsed'] = true;
  }
  if (block.disabled) {
    state['disabled'] = true;
  }
  if (!block.isDeletable() && !block.isShadow()) {
    state['deletable'] = false;
  }
  if (block.isShadow()) {
    state['shadow'] = true;
  }
  if (!block.isMovable() && !block.isShadow()) {
    state['movable'] = false;
  }
  if (!block.isEditable()) {
    state['editable'] = false;
  }

  // Data is a nullable string, so we don't need to worry about falsy values.
  if (block.data) {
    state['data'] = block.data;
  }
};

/**
 * Adds the coordinates of the given block to the given state object.
 * @param {!Blockly.Block} block The block to base the coordinates on
 * @param {!State} state The state object to append
 *     to
 */
const saveCoords = function(block, state) {
  const workspace = block.workspace;
  const xy = block.getRelativeToSurfaceXY();
  state['x'] = Math.round(workspace.RTL ? workspace.getWidth() - xy.x : xy.x);
  state['y'] = Math.round(xy.y);
};


/**
 * Adds any extra state the block may provide to the given state object.
 * @param {!Blockly.Block} block The block to serialize the extra state of.
 * @param {!State} state The state object to append to.
 */
const saveExtraState = function(block, state) {
  if (block.saveExtraState) {
    const extraState = block.saveExtraState();
    if (extraState !== null) {
      state['extraState'] = extraState;
    } else if (block.mutationToDom) {
      const extraState = block.mutationToDom();
      if (extraState !== null) {
        state['extraState'] = Xml.domToText(extraState);
      }
    }
  }
};

/**
 * Adds the state of all of the fields on the block to the given state object.
 * @param {!Blockly.Block} block The block to serialize the field state of.
 * @param {!State} state The state object to append to.
 * @param {boolean} doFullSerialization Whether or not to serialize the full
 *     state of the field (rather than possibly saving a reference to some
 *     state).
 */
const saveFields = function(block, state, doFullSerialization) {
  let hasFieldState = false;
  const fields = Object.create(null);
  for (let i = 0; i < block.inputList.length; i++) {
    const input = block.inputList[i];
    for (let j = 0; j < input.fieldRow.length; j++) {
      const field = input.fieldRow[j];
      if (field.name && field.SERIALIZABLE) {
        hasFieldState = true;
        if (field.referencesVariables()) {
          const variableState = saveVariableState(field);
          fields[field.name] = variableState;
        } else {
          fields[field.name] = field.saveState(doFullSerialization);
        }
      }
    }
  }
  if (hasFieldState) {
    state['fields'] = fields;
  }
};

/**
 * Adds the state of all of the comments on the block to the given state object.
 * @param {!Blockly.Block} block The block to serialize the comment state of.
 * @param {!State} state The state object to append to.
 */
const saveComment = function(block, state) {
  const commentText = block.getCommentText();
  if (commentText) {
    const commentState = { text: commentText };
    if (typeof block.comment == 'object') {
      const hw = block.comment.getHeightWidth();
      const xy = block.comment.getXY();
      Object.assign(commentState, {
        id: block.comment.id,
        pinned: block.comment.isVisible(),
        h: hw.height,
        w: hw.width,
        x: Math.round(block.workspace.RTL ? block.workspace.getWidth() - xy.x - hw.width :
          xy.x),
        y: xy.y,
        minimized: block.comment.isMinimized()

      });
    }
    state['comment'] = commentState;
  }
};

/**
 * Encode a variable field as JSON.
 * @param {!Blockly.FieldVariable} field The field to encode.
 * @return {?Object} JSON, or null if the field did not need to be
 *     serialized.
 * @private
 */
const saveVariableState = function(field) {
  let id = field.getValue();
  // The field had not been initialized fully before being serialized.
  // This can happen if a block is created directly through a call to
  // workspace.newBlock instead of from XML.
  // The new block will be serialized for the first time when firing a block
  // creation event.
  if (id == null) {
    field.initModel();
    id = field.getValue();
  }
  // Get the variable directly from the field, instead of doing a lookup.  This
  // will work even if the variable has already been deleted.  This can happen
  // because the flyout defers deleting blocks until the next time the flyout is
  // opened.
  const variable = field.getVariable();

  if (!variable) {
    throw Error('Tried to serialize a variable field with no variable.');
  }
  return {
    name: variable.name,
    id: variable.getId(),
    variableType: variable.type
  };
};

/**
 * Adds the state of all of the child blocks of the given block (which are
 * connected to inputs) to the given state object.
 * @param {!Block} block The block to serialize the input blocks of.
 * @param {!State} state The state object to append to.
 * @param {boolean} doFullSerialization Whether or not to serialize the full
 *     state of the field (rather than possibly saving a reference to some
 *     state).
 */
const saveInputBlocks = function(block, state, doFullSerialization) {
  const inputs = Object.create(null);

  for (let i = 0, input; input = block.inputList[i]; i++) {
    const inputState = {};
    if (input.type == constants.DUMMY_INPUT) {
      continue;
    } else {
      const childBlock = input.connection.targetBlock();
      const shadow = input.connection.getShadowState();
      // Don't save shadow if it's a statement input
      if (shadow && (!childBlock || !childBlock.isShadow())) {
        const shadowClone = cloneShadow(shadow);
        inputState.shadow = shadowClone;
      }
      if (childBlock) {
        inputState.block = save(childBlock, {doFullSerialization});
      }
    }
    if (Object.keys(inputState).length) {
      inputs[input.name] = inputState;
    }
  }

  if (Object.keys(inputs).length) {
    state['inputs'] = inputs;
  }
};

/**
 * Adds the state of all of the next blocks of the given block to the given
 * state object.
 * @param {!Block} block The block to serialize the next blocks of.
 * @param {!State} state The state object to append to.
 * @param {boolean} doFullSerialization Whether or not to serialize the full
 *     state of the field (rather than possibly saving a reference to some
 *     state).
 */
const saveNextBlocks = function(block, state, doFullSerialization) {
  const nextBlock = block.getNextBlock();
  const nextState = {};
  if (nextBlock) {
    nextState.block = save(nextBlock, {doFullSerialization});
  }
  const shadow = block.nextConnection && block.nextConnection.getShadowState();
  if (shadow && (!nextBlock || !nextBlock.isShadow())) {
    nextState.shadow = cloneShadow(shadow);
  }

  if (Object.keys(nextState).length) {
    state['next'] = nextState;
  }
};

/**
 * Deeply clone the shadow's state so that changes don't back-wash to the block.
 * @param {!Object} shadow The shadow state.
 * @return {!Object} The cloned shadow state.
 * @private
 */
const cloneShadow = function(shadow) {
  return Object.assign({}, shadow);
};

/**
 * Loads the block represented by the given state into the given workspace.
 * @param {!State} state The state of a block to deserialize into the workspace.
 * @param {!Workspace} workspace The workspace to add the block to.
 * @return {!Block} The block that was just loaded.
 */
export const load = function(state, workspace) {
  return loadInternal(state, workspace);
};

/**
 * Loads the block represented by the given state into the given workspace.
 * This is defined internally so that the extra parameters don't clutter our
 * external API.
 * But it is exported so that other places within Blockly can call it directly
 * with the extra paramters.
 * @param {!State} state The state of a block to deserialize into the workspace.
 * @param {!Workspace} workspace The workspace to add the block to.
 * @param {{parentConnection: (!Connection|undefined), isShadow:
 *     (boolean|undefined)}=} param1
 *     parentConnection: If provided, the system will attempt to connect the
 *       block to this connection after it is created. Undefined by default.
 *     isShadow: The block will be set to a shadow block after it is created.
 *       False by default.
 *     recordUndo: If true, events triggered by this function will be undo-able
 *       by the user. False by default.
 * @return {!Block} The block that was just loaded.
 */
export const loadInternal = function(
    state,
    workspace
) {
  // Create top-level block.
  eventUtils.disable();
  const variablesBeforeCreation = workspace.getAllVariables();
  let topBlock;
  try {
    topBlock = loadPrivate(state, workspace);
    // Generate list of all blocks.
    const blocks = topBlock.getDescendants(false);
    if (workspace.rendered) {
      // Hide connections to speed up assembly.
      topBlock.setConnectionsHidden(true);
      // Render each block.
      for (let i = blocks.length - 1; i >= 0; i--) {
        blocks[i].initSvg();
      }
      for (let i = blocks.length - 1; i >= 0; i--) {
        blocks[i].render(false);
      }
      // Populating the connection database may be deferred until after the
      // blocks have rendered.
      if (!workspace.isFlyout) {
        setTimeout(function() {
          if (topBlock.workspace) {  // Check that the block hasn't been deleted.
            topBlock.setConnectionsHidden(false);
          }
        }, 1);
      }
      topBlock.updateDisabled();
      // Allow the scrollbars to resize and move based on the new contents.
      // TODO(@picklesrus): #387. Remove when domToBlock avoids resizing.
      workspace.resizeContents();
    } else {
      for (let i = blocks.length - 1; i >= 0; i--) {
        blocks[i].initModel();
      }
    }
  } finally {
    eventUtils.enable();
  }

  if (eventUtils.isEnabled()) {
    const newVariables = Variables.getAddedVariables(workspace,
        variablesBeforeCreation);
    // Fire a VarCreate event for each (if any) new variable created.
    for (let i = 0; i < newVariables.length; i++) {
      const thisVariable = newVariables[i];
      eventUtils.fire(new (eventUtils.get(eventUtils.VAR_CREATE))(thisVariable));
    }
    // Block events come after var events, in case they refer to newly created
    // variables.
    eventUtils.fire(new (eventUtils.get(eventUtils.BLOCK_CREATE))(topBlock));
  }
  return topBlock;
};

/**
 * Loads the block represented by the given state into the given workspace.
 * This is defined privately so that it can be called recursively without firing
 * eroneous events. Events (and other things we only want to occur on the top
 * block) are handled by loadInternal.
 * @param {!State} state The state of a block to deserialize into the workspace.
 * @param {!Workspace} workspace The workspace to add the block to.
 * @return {!Block} The block that was just loaded.
 */
const loadPrivate = function(
    state,
    workspace
) {
  if (!state['type']) {
    throw new MissingBlockType(state);
  }

  const topBlock = workspace.newBlock(state['type'], state['id']);

  if (workspace.rendered) {
    // Hide connections to speed up assembly.
    topBlock.setConnectionsHidden(true);
  }

  loadExtraState(topBlock, state);
  loadFields(topBlock, state);

  loadInputBlocks(topBlock, state);
  loadNextBlocks(topBlock, state);

  loadAttributes(topBlock, state);
  loadComment(topBlock, state);
  loadCoords(topBlock, state);

  return topBlock;
};

/**
 * Applies any coordinate information available on the state object to the
 * block.
 * @param {!Block} block The block to set the position of.
 * @param {!State} state The state object to reference.
 */
const loadCoords = function(block, state) {
  let x = state['x'] === undefined ? 0 : parseInt(state['x'], 10);
  const y = state['y'] === undefined ? 0 : parseInt(state['y'], 10);

  if (block.workspace.RTL) {
    x = block.workspace.getWidth() - x;
  }
  block.moveBy(x, y);
};

/**
 * Applies any attribute information available on the state object to the block.
 * @param {!Block} block The block to set the attributes of.
 * @param {!State} state The state object to reference.
 */
const loadAttributes = function(block, state) {
  if (state['inline']) {
    block.setInputsInline(true);
  }
  if (state['disabled']) {
    block.setDisabled(true);
  }
  if (state['deleteable']) {
    block.setDeleteable(true);
  }
  if (state['movable']) {
    block.setMovable(true);
  }
  if (state['editable']) {
    block.setEditable(true);
  }
  if (state['collapsed']) {
    block.setCollapsed(true);
  }
  if (state['shadow']) {
    // Ensure all children are also shadows.
    const children = block.getChildren(false);
    for (let i = 0, child; child = children[i]; i++) {
      asserts.assert(
          child.isShadow(), 'Shadow block not allowed non-shadow child.');
    }
    block.setShadow(true);
  }
  if (state['data'] !== undefined) {
    block.data = state['data'];
  }
};

/**
 * Applies any extra state information available on the state object to the
 * block.
 * @param {!Block} block The block to set the extra state of.
 * @param {!State} state The state object to reference.
 */
const loadExtraState = function(block, state) {
  if (!state['extraState']) {
    return;
  }
  if (block.loadExtraState) {
    block.loadExtraState(state['extraState']);
  } else {
    block.domToMutation(Xml.textToDom(state['extraState']));
  }
  if (block.initSvg) {
    // Mutation may have added some elements that need initializing.
    block.initSvg();
  }
};

/**
 * Applies any field information available on the state object to the block.
 * @param {!Block} block The block to set the field state of.
 * @param {!State} state The state object to reference.
 */
const loadFields = function(block, state) {
  if (!state['fields']) {
    return;
  }
  const keys = Object.keys(state['fields']);
  for (let i = 0; i < keys.length; i++) {
    const fieldName = keys[i];
    const fieldState = state['fields'][fieldName];
    const field = block.getField(fieldName) || block.getField(fieldState.name);
    if (!field) {
      console.warn(
          `Ignoring non-existant field ${fieldName} in block ${block.type}`);
      continue;
    }
    if (field.referencesVariables()) {
      loadFieldVariable(block.workspace, fieldState, field);
    } else {
      field.loadState(fieldState);
    }
  }
};

/**
 * Create block's comment from state.
 * @param {!Block} block The block that comment belongs to.
 * @param {!State} blockState The state object to reference.
 */
const loadComment = function(block, blockState) {
  const state = blockState['comment'];
  if (!state) {
    return;
  }

  const commentId = state.id;
  const bubbleX = parseInt(state.x, 10);
  const bubbleY = parseInt(state.y, 10);
  const minimized = state.minimized || false;

  // Note bubbleX and bubbleY can be NaN, but the ScratchBlockComment
  // constructor will handle that.
  block.setCommentText(state.text, commentId, bubbleX, bubbleY,
      minimized == 'true');

  const visible = state.pinned;
  if (visible && !block.isInFlyout) {
    // Give the renderer a millisecond to render and position the block
    // before positioning the comment bubble.
    setTimeout(function() {
      if (block.comment && block.comment.setVisible) {
        block.comment.setVisible(visible);
      }
    }, 1);
  }
  const bubbleW = parseInt(state.w, 10);
  const bubbleH = parseInt(state.h, 10);
  if (!isNaN(bubbleW) && !isNaN(bubbleH) &&
    block.comment && block.comment.setVisible) {
    block.comment.setSize(bubbleW, bubbleH);
  }
};

/**
 * Decode an variable field state and set the value of that field.
 * @param {!Blockly.Workspace} workspace The workspace that is currently being
 *     deserialized.
 * @param {!Object} state The state to decode.
 * @param {!Blockly.FieldVariable} field The field on which the value will be
 *     set.
 * @private
 */
const loadFieldVariable = function(workspace, state, field) {
  let variable;
  // todo: completely firgure out why and remove it
  if (typeof state === 'string') {
    state = {
      name: state,
      variableType: field.defaultType_ ?? ''
    };
  }
  // This check ensures that there is not both a potential variable and a real
  // variable with the same name and type.
  if (!workspace.getPotentialVariableMap() && !workspace.isFlyout &&
    workspace.getFlyout()) {
    const flyoutWs = workspace.getFlyout().getWorkspace();
    variable = Variables.realizePotentialVar(state.name, state.variableType, flyoutWs, true);
  }
  if (!variable) {
    variable = Variables.getOrCreateVariablePackage(workspace, state.id,
        state.name, state.variableType);
  }

  field.setValue(variable.getId());
};

/**
 * Creates any child blocks (attached to inputs) defined by the given state
 * and attaches them to the given block.
 * @param {!Block} block The block to attach input blocks to.
 * @param {!State} state The state object to reference.
 */
const loadInputBlocks = function(block, state) {
  if (!state['inputs']) {
    return;
  }
  const keys = Object.keys(state['inputs']);
  for (let i = 0; i < keys.length; i++) {
    const name = keys[i];
    const input = block.getInput(name);
    if (!input) {
      console.warn('Ignoring non-existent input ' + name + ' in block ' +
        block.type);
      return;
    }

    const inputState = state['inputs'][name];
    if (inputState.shadow) {
      input.connection.setShadowState(inputState.shadow);
    }

    // Use the shadow block if there is no child block.
    if (!inputState.block) {
      inputState.block = inputState.shadow;
    }

    const inputBlock = loadPrivate(inputState.block, block.workspace);
    if (inputBlock.outputConnection) {
      input.connection.connect(inputBlock.outputConnection);
    } else if (inputBlock.previousConnection) {
      input.connection.connect(inputBlock.previousConnection);
    } else {
      asserts.fail(
          'Child block does not have output or previous statement.');
    }
  }
};

/**
 * Creates any next blocks defined by the given state and attaches them to the
 * given block.
 * @param {!Block} block The block to attach next blocks to.
 * @param {!State} state The state object to reference.
 */
const loadNextBlocks = function(block, state) {
  if (!state['next']) {
    return;
  }

  if (state.next.shadow) {
    block.nextConnection.setShadowState(state.next.shadow);
  }
  if (state.next.block) {
    asserts.assert(block.nextConnection,
        'Next statement does not exist.');
    // If there is more than one XML 'next' tag.
    asserts.assert(!block.nextConnection.isConnected(),
        'Next statement is already connected.');

    const nextBlock = loadPrivate(state.next.block, block.workspace);
    asserts.assert(nextBlock.previousConnection,
        'Next block does not have previous statement.');
    block.nextConnection.connect(nextBlock.previousConnection);
  }
};
