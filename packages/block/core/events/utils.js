/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2016 Google Inc.
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

/**
 * @fileoverview Events fired as a result of actions in Blockly's editor.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

/**
 * Helper methods for events that are fired as a result of
 * actions in Blockly's editor.
 * @namespace Blockly.Events.utils
 */
import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Events.utils');

import * as common from '../common';
import * as registry from '../registry';
import * as utils from '../utils';

const arrayUtils = goog.require('goog.array');


/**
 * Group ID for new events.  Grouped events are indivisible.
 * @type {string}
 * @private
 */
let group = '';

/**
 * Sets whether events should be added to the undo stack.
 * @type {boolean}
 * @private
 */
let recordUndo = true;

/**
 * Allow change events to be created and fired.
 * @type {number}
 * @private
 */
let disabled = 0;

/**
 * Name of event that creates a block. Will be deprecated for BLOCK_CREATE.
 * @const
 */
export const CREATE = 'create';

/**
 * Name of event that creates a block.
 * @const
 */
export const BLOCK_CREATE = CREATE;

/**
 * Name of event that deletes a block. Will be deprecated for BLOCK_DELETE.
 * @const
 */
export const DELETE = 'delete';

/**
 * Name of event that deletes a block.
 * @const
 */
export const BLOCK_DELETE = DELETE;

/**
 * Name of event that changes a block. Will be deprecated for BLOCK_CHANGE.
 * @const
 */
export const CHANGE = 'change';

/**
 * Name of event that changes a block.
 * @const
 */
export const BLOCK_CHANGE = CHANGE;

/**
 * Name of event that moves a block. Will be deprecated for BLOCK_MOVE.
 * @const
 */
export const MOVE = 'move';

/**
 * Name of event that drags a block outside of or into the blocks workspace
 * @const
 */
export const DRAG_OUTSIDE = 'dragOutside';

/**
 * Name of event that ends a block drag
 * @const
 */
export const END_DRAG = 'endDrag';

/**
 * Name of event that moves a block.
 * @const
 */
export const BLOCK_MOVE = MOVE;

/**
 * Name of event that creates a variable.
 * @const
 */
export const VAR_CREATE = 'var_create';

/**
 * Name of event that deletes a variable.
 * @const
 */
export const VAR_DELETE = 'var_delete';

/**
 * Name of event that renames a variable.
 * @const
 */
export const VAR_RENAME = 'var_rename';

/**
 * Name of event that creates a comment.
 * @const
 */
export const COMMENT_CREATE = 'comment_create';

/**
 * Name of event that moves a comment.
 * @const
 */
export const COMMENT_MOVE = 'comment_move';

/**
 * Name of event that changes a comment's property
 * (text content, size, or minimized state).
 * @const
 */
export const COMMENT_CHANGE = 'comment_change';

/**
 * Name of event that deletes a comment.
 * @const
 */
export const COMMENT_DELETE = 'comment_delete';

/**
 * Name of event that records a UI change.
 * @const
 */
export const UI = 'ui';

/**
 * List of events queued for firing.
 * @private
 */
const FIRE_QUEUE = [];

/**
 * Create a custom event and fire it.
 * @param {!Blockly.Events.Abstract} event Custom data for event.
 */
const fireInternal = function(event) {
  if (!isEnabled()) {
    return;
  }
  if (!FIRE_QUEUE.length) {
    // First event added; schedule a firing of the event queue.
    setTimeout(fireNow, 0);
  }
  FIRE_QUEUE.push(event);
};

/**
 * Fire all queued events.
 * @private
 */
const fireNow = function() {
  const queue = filter(FIRE_QUEUE, true);
  FIRE_QUEUE.length = 0;
  for (let i = 0, event; event = queue[i]; i++) {
    const workspace = common.getWorkspaceById(event.workspaceId);
    if (workspace) {
      workspace.fireChangeListener(event);
    }
  }
};

/**
 * Filter the queued events and merge duplicates.
 * @param {!Array.<!Blockly.Events.Abstract>} queueIn Array of events.
 * @param {boolean} forward True if forward (redo), false if backward (undo).
 * @return {!Array.<!Blockly.Events.Abstract>} Array of filtered events.
 */
export const filter = function(queueIn, forward) {
  let queue = arrayUtils.clone(queueIn);
  if (!forward) {
    // Undo is merged in reverse order.
    queue.reverse();
  }
  const mergedQueue = [];
  const hash = Object.create(null);
  // Merge duplicates.
  for (let i = 0, event; event = queue[i]; i++) {
    if (!event.isNull()) {
      const key = [event.type, event.blockId, event.workspaceId].join(' ');

      const lastEntry = hash[key];
      const lastEvent = lastEntry ? lastEntry.event : null;
      if (!lastEntry) {
        // Each item in the hash table has the event and the index of that event
        // in the input array.  This lets us make sure we only merge adjacent
        // move events.
        hash[key] = {event: event, index: i};
        mergedQueue.push(event);
      } else if (event.type == MOVE &&
          lastEntry.index == i - 1) {
        // Merge move events.
        lastEvent.newParentId = event.newParentId;
        lastEvent.newInputName = event.newInputName;
        lastEvent.newCoordinate = event.newCoordinate;
        lastEntry.index = i;
      } else if (event.type == CHANGE &&
          event.element == lastEvent.element &&
          event.name == lastEvent.name) {
        // Merge change events.
        lastEvent.newValue = event.newValue;
      } else if (event.type == UI &&
          event.element == 'click' &&
          (lastEvent.element == 'commentOpen' ||
           lastEvent.element == 'mutatorOpen' ||
           lastEvent.element == 'warningOpen')) {
        // Merge click events.
        lastEvent.newValue = event.newValue;
      } else {
        // Collision: newer events should merge into this event to maintain order
        hash[key] = {event: event, index: 1};
        mergedQueue.push(event);
      }
    }
  }
  // Filter out any events that have become null due to merging.
  queue = mergedQueue.filter(function(e) { return !e.isNull(); });
  if (!forward) {
    // Restore undo order.
    queue.reverse();
  }
  // Move mutation events to the top of the queue.
  // Intentionally skip first event.
  for (let i = 1, event; event = queue[i]; i++) {
    if (event.type == CHANGE &&
        event.element == 'mutation') {
      queue.unshift(queue.splice(i, 1)[0]);
    }
  }
  return queue;
};

/**
 * Modify pending undo events so that when they are fired they don't land
 * in the undo stack.  Called by Blockly.Workspace.clearUndo.
 */
export const clearPendingUndo = function() {
  for (let i = 0, event; event = FIRE_QUEUE[i]; i++) {
    event.recordUndo = false;
  }
};

/**
 * Stop sending events.  Every call to this function MUST also call enable.
 */
export const disable = function() {
  disabled++;
};

/**
 * Start sending events.  Unless events were already disabled when the
 * corresponding call to disable was made.
 */
export const enable = function() {
  disabled--;
};

/**
 * Returns whether events may be fired or not.
 * @return {boolean} True if enabled.
 */
export const isEnabled = function() {
  return disabled == 0;
};

/**
 * Current group.
 * @return {string} ID string.
 */
export const getGroup = function() {
  return group;
};

/**
 * Start or stop a group.
 * @param {boolean|string} state True to start new group, false to end group.
 *   String to set group explicitly.
 */
export const setGroupInternal = function(state) {
  if (typeof state == 'boolean') {
    group = state ? utils.genUid() : '';
  } else {
    group = state;
  }
};

/**
 * Compute a list of the IDs of the specified block and all its descendants.
 * @param {!Blockly.Block} block The root block.
 * @return {!Array.<string>} List of block IDs.
 */
export const getDescendantIds = function(block) {
  const ids = [];
  const descendants = block.getDescendants(false);
  for (let i = 0, descendant; descendant = descendants[i]; i++) {
    ids[i] = descendant.id;
  }
  return ids;
};

/**
 * Registers a event type. May also override an existing event type.
 * fromJson uses this registry to find the appropriate field.
 * @param {!string} type The event type name as used in the JSON definition.
 * @param {!{fromJson: Function}} eventClass The event class containing a
 *     fromJson function that can construct an instance of the event.
 * @throws {Error} if the type name is empty, or the eventClass is not an
 *     object containing a fromJson function.
 */
export const register = function(type, eventClass) {
  registry.register(registry.Type.EVENT, type, eventClass);
};

/**
 * Gets the class for a specific event type from the registry.
 * @param type The type of the event to get.
 * @return {!Blockly.Events.Abstract} The event class with the given type.
 */
export const get = function(type) {
  return registry.getClass(registry.Type.EVENT, type, true);
};

/**
 * Decode the JSON into an event.
 * @param {!Object} json JSON representation.
 * @param {!Blockly.Workspace} workspace Target workspace for event.
 * @return {!Blockly.Events.Abstract} The event represented by the JSON.
 */
export const fromJson = function(json, workspace) {
  const eventClass = get(json.type);
  if (eventClass) {
    const event = new eventClass(null);
    event.fromJson(json);
    event.workspaceId = workspace.id;
    return event;
  } else {
    throw 'Unknown event type.';
  }
};

/**
 * Enable/disable a block depending on whether it is properly connected.
 * Use this on applications where all blocks should be connected to a top block.
 * Recommend setting the 'disable' option to 'false' in the config so that
 * users don't try to reenable disabled orphan blocks.
 * @param {!Blockly.Events.Abstract} event Custom data for event.
 */
export const disableOrphans = function(event) {
  if (event.type == MOVE ||
      event.type == CREATE) {
    disable();
    const workspace = common.getWorkspaceById(event.workspaceId);
    let block = workspace.getBlockById(event.blockId);
    if (block) {
      if (block.getParent() && !block.getParent().disabled) {
        const children = block.getDescendants(false);
        for (let i = 0, child; child = children[i]; i++) {
          child.setDisabled(false);
        }
      } else if ((block.outputConnection || block.previousConnection) &&
                 !workspace.isDragging()) {
        do {
          block.setDisabled(true);
          block = block.getNextBlock();
        } while (block);
      }
    }
    enable();
  }
};

/**
 * Sets whether events should be added to the undo stack.
 * @param {boolean} newValue True if events should be added to the undo stack.
 */
export const setRecordUndo = function(newValue) {
  recordUndo = newValue;
};

/**
 * Returns whether or not events will be added to the undo stack.
 * @return {boolean} True if events will be added to the undo stack.
 */
export const getRecordUndo = function() {
  return recordUndo;
};

/**
 * Namespace object for internal implementations we want to be able to
 * stub in tests. Do not use externally.
 * @internal
 */
const internal = {
  fire: fireInternal,
  setGroup: setGroupInternal,
  fireNow,
  FIRE_QUEUE,
};

export const TEST_ONLY = internal;

/**
 * Create a custom event and fire it.
 * @param {!Blockly.Events.Abstract} event Custom data for event.
 */
export const fire = function(event) {
  internal.fire(event);
};

/**
 * Start or stop a group.
 * @param {boolean|string} state True to start new group, false to end group.
 *   String to set group explicitly.
 */
export const setGroup = function(state) {
  internal.setGroup(state);
};
