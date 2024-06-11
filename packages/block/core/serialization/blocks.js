/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Handles serializing blocks to plain JavaScript objects only
 *     containing state.
 */

'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
import * as constants from '../constants';
import * as eventUtils from '../events/utils';
import { MissingBlockType, MissingConnection, BadConnectionCheck } from './exceptions';
import { BlockCreate } from '../events/block_create';
import * as Xml from '../xml';
goog.declareModuleId('Blockly.serialization.blocks');

/**
 * Returns the state of the given block as a plain JavaScript object.
 * @param {!Blockly.Block} block The block to serialize.
 * @param {{addCoordinates: (boolean|undefined)}=} param1
 *     addCoordinates: If true the coordinates of the block are added to the
 *       serialized state. False by default.
 * @return {?State} The serialized state of the
 *     block, or null if the block could not be serialied (eg it was an
 *     insertion marker).
 */
export const save = function(block,
    {
      addCoordinates = false,
      addInputBlocks = true,
      addNextBlocks = true
    } = {}
) {
  if (block.isInsertionMarker()) {
    return null;
  }

  const state = {
    'type': block.type,
    'id': block.id
  };

  if (addCoordinates) {
    saveCoords(block, state);
  }
  saveAttributes(block, state);
  saveExtraState(block, state);
  saveFields(block, state);

  if (addInputBlocks) {
    saveInputBlocks(block, state);
  }
  if (addNextBlocks) {
    saveNextBlocks(block, state);
  }

  return state;
};

/**
 * Adds attributes to the given state object based on the state of the block.
 * Eg collapsed, disabled, editable, etc.
 * @param {!Blockly.Block} block The block to base the attributes on.
 * @param {!State} state The state object to append
 *     to.
 */
const saveAttributes = function(block, state) {
  if (block.isCollapsed()) {
    state['collapsed'] = true;
  }
  if (!block.isEditable()) {
    state['editable'] = false;
  }
  if (!block.isDeletable() && !block.isShadow()) {
    state['deletable'] = false;
  }
  if (!block.isMovable() && !block.isShadow()) {
    state['movable'] = false;
  }

  if (block.inputsInline !== undefined &&
      block.inputsInline !== block.inputsInlineDefault) {
    state['inline'] = block.inputsInline;
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
    }
  }
};

/**
 * Adds the state of all of the fields on the block to the given state object.
 * @param {!Blockly.Block} block The block to serialize the field state of.
 * @param {!State} state The state object to append to.
 */
const saveFields = function(block, state) {
  let hasFieldState = false;
  const fields = Object.create(null);
  for (let i = 0; i < block.inputList.length; i++) {
    const input = block.inputList[i];
    for (let j = 0; j < input.fieldRow.length; j++) {
      const field = input.fieldRow[j];
      if (field.name && field.SERIALIZABLE) {
        hasFieldState = true;
        fields[field.name] = field.saveState();
      }
    }
  }
  if (hasFieldState) {
    state['fields'] = fields;
  }
};


/**
 * Adds the state of all of the child blocks of the given block (which are
 * connected to inputs) to the given state object.
 * @param {!Block} block The block to serialize the input blocks of.
 * @param {!State} state The state object to append to.
 */
const saveInputBlocks = function(block, state) {
  const inputs = Object.create(null);
  for (let i = 0; i < block.inputList.length; i++) {
    const input = block.inputList[i];
    if (input.type === constants.DUMMY_INPUT) {
      continue;
    }
    const connectionState =
        saveConnection(/** @type {!Connection} */ (input.connection));
    if (connectionState) {
      inputs[input.name] = connectionState;
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
 */
const saveNextBlocks = function(block, state) {
  if (!block.nextConnection) {
    return;
  }
  const connectionState = saveConnection(block.nextConnection);
  if (connectionState) {
    state['next'] = connectionState;
  }
};

/**
 * Returns the state of the given connection (ie the state of any connected
 * shadow or real blocks).
 * @param {!Blockly.Connection} connection The connection to serialize the connected
 *     blocks of.
 * @return {?ConnectionState} An object containing the state of any connected
 *     shadow block, or any connected real block.
 */
const saveConnection = function(connection) {
  const shadow = connection.getShadowDom();
  const child = connection.targetBlock();
  if (!shadow && !child) {
    return null;
  }
  const state = Object.create(null);
  if (shadow) {
    state['shadow'] = Xml.domToText(shadow);
  }
  if (child && !child.isShadow()) {
    state['block'] = save(child);
  }
  return state;
};


/**
 * Loads the block represented by the given state into the given workspace.
 * @param {!State} state The state of a block to deserialize into the workspace.
 * @param {!Workspace} workspace The workspace to add the block to.
 * @param {{recordUndo: (boolean|undefined)}=} param1
 *     recordUndo: If true, events triggered by this function will be undo-able
 *       by the user. False by default.
 * @return {!Block} The block that was just loaded.
 */
// eslint-disable-next-line no-unused-vars
const load = function(state, workspace, {recordUndo = false} = {}) {
  const prevRecordUndo = eventUtils.getRecordUndo();
  eventUtils.setRecordUndo(recordUndo);
  const existingGroup = eventUtils.getGroup();
  if (!existingGroup) {
    eventUtils.setGroup(true);
  }

  // We only want to fire an event for the top block.
  eventUtils.disable();

  const block = loadInternal(state, workspace);

  eventUtils.enable();
  eventUtils.fire(new BlockCreate(block));

  eventUtils.setGroup(existingGroup);
  eventUtils.setRecordUndo(prevRecordUndo);

  // Adding connections to the connection db is expensive. This defers that
  // operation to decrease load time.
  if (workspace.rendered) {
    setTimeout(() => {
      if (!block.disposed) {
        block.setConnectionTracking(true);
      }
    }, 1);
  }

  return block;
};

/**
 * Loads the block represented by the given state into the given workspace.
 * This is defined internally so that the extra optional parameter doesn't
 * clutter our external API.
 * @param {!State} state The state of a block to deserialize into the workspace.
 * @param {!Workspace} workspace The workspace to add the block to.
 * @param {!Connection=} parentConnection The optional parent connection to
 *     attach the block to.
 * @return {!Blockly.Block} The block that was just loaded.
 */
const loadInternal = function(state, workspace, parentConnection = undefined) {
  if (!state['type']) {
    throw new MissingBlockType(state);
  }

  const block = workspace.newBlock(state['type'], state['id']);
  loadCoords(block, state);
  loadAttributes(block, state);
  loadExtraState(block, state);
  tryToConnectParent(parentConnection, block, state);
  // loadIcons(block, state);
  loadFields(block, state);
  loadInputBlocks(block, state);
  loadNextBlocks(block, state);
  initBlock(block, workspace.rendered);
  return block;
};

/**
 * Attempts to connect the block to the parent connection, if it exists.
 * @param {(!Connection|undefined)} parentConnection The parent connnection to
 *     try to connect the block to.
 * @param {!Block} child The block to try to conecnt to the parent.
 * @param {!State} state The state which defines the given block
 */
const tryToConnectParent = function(parentConnection, child, state) {
  if (!parentConnection) {
    return;
  }

  let connected = false;
  let childConnection;
  if (parentConnection.type == inputTypes.VALUE) {
    childConnection = child.outputConnection;
    if (!childConnection) {
      throw new MissingConnection('output', child, state);
    }
    connected = parentConnection.connect(childConnection);
  } else { // Statement type.
    childConnection = child.previousConnection;
    if (!childConnection) {
      throw new MissingConnection('previous', child, state);
    }
    connected = parentConnection.connect(childConnection);
  }

  if (!connected) {
    throw new BadConnectionCheck(
        'bad connection',
        parentConnection.type == constants.INPUT_VALUE ?
            'output connection' : 'previous connection',
        child,
        state);
  }
};

/**
 * Applies any coordinate information available on the state object to the
 * block.
 * @param {!Block} block The block to set the position of.
 * @param {!State} state The state object to reference.
 */
const loadCoords = function(block, state) {
  const x = state['x'] === undefined ? 10 : state['x'];
  const y = state['y'] === undefined ? 10 : state['y'];
  block.moveBy(x, y);
};

/**
 * Applies any attribute information available on the state object to the block.
 * @param {!Block} block The block to set the attributes of.
 * @param {!State} state The state object to reference.
 */
const loadAttributes = function(block, state) {
  if (state['collapsed']) {
    block.setCollapsed(true);
  }
  if (state['editable'] === false) {
    block.setEditable(false);
  }
  if (state['deletable'] === false) {
    block.setDeletable(false);
  }
  if (state['movable'] === false) {
    block.setMovable(false);
  }
  if (state['inline'] !== undefined) {
    block.setInputsInline(state['inline']);
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
  block.loadExtraState(state['extraState']);
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
    const field = block.getField(fieldName);
    if (!field) {
      console.warn(
          `Ignoring non-existant field ${fieldName} in block ${block.type}`);
      continue;
    }
    field.loadState(fieldState);
  }
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
    const inputName = keys[i];
    const input = block.getInput(inputName);
    if (!input || !input.connection) {
      throw new MissingConnection(inputName, block, state);
    }
    loadConnection(input.connection, state['inputs'][inputName]);
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

  if (!block.nextConnection) {
    throw new MissingConnection('next', block, state);
  }

  loadConnection(block.nextConnection, state['next']);
};

/**
 * Applies the state defined by connectionState to the given connection, ie
 * assigns shadows and attaches child blocks.
 * @param {!Connection} connection The connection to serialize the
 *     connected blocks of.
 * @param {!ConnectionState} connectionState The object containing the state of
 *     any connected shadow block, or any connected real block.
 */
const loadConnection = function(connection, connectionState) {
  if (connectionState['shadow']) {
    connection.setShadowDom(Xml.textToDom(connectionState['shadow']));
  }
  if (connectionState['block']) {
    loadInternal(
        connectionState['block'],
        connection.getSourceBlock().workspace,
        connection);
  }
};

// TODO(#5146): Remove this from the serialization system.
/**
 * Initializes the give block, eg init the model, inits the svg, renders, etc.
 * @param {!Blockly.Block} block The block to initialize.
 * @param {boolean} rendered Whether the block is a rendered or headless block.
 */
const initBlock = function (block, rendered) {
  if (rendered) {
    // Adding connections to the connection db is expensive. This defers that
    // operation to decrease load time.
    block.setConnectionTracking(false);

    block.initSvg();
    block.render(false);
  } else {
    block.initModel();
  }
};
