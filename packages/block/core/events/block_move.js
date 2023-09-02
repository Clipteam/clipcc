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

'use strict';

goog.provide('Blockly.Events.BlockMove');

goog.require('Blockly.constants');
goog.require('Blockly.Events');
goog.require('Blockly.Events.BlockBase');

goog.require('goog.math.Coordinate');


/**
 * Class for a block move event.  Created before the move.
 * @param {Blockly.Block} block The moved block.  Null for a blank event.
 * @extends {Blockly.Events.BlockBase}
 * @constructor
 */
Blockly.Events.BlockMove = function(block) {
  if (!block) {
    return;  // Blank event to be populated by fromJson.
  }
  Blockly.Events.BlockMove.superClass_.constructor.call(this, block);
  const location = this.currentLocation_();
  this.oldParentId = location.parentId;
  this.oldInputName = location.inputName;
  this.oldCoordinate = location.coordinate;
};
goog.inherits(Blockly.Events.BlockMove, Blockly.Events.BlockBase);

/**
 * Type of this event.
 * @type {string}
 */
Blockly.Events.BlockMove.prototype.type = Blockly.Events.MOVE;

/**
 * Encode the event as JSON.
 * @return {!Object} JSON representation.
 */
Blockly.Events.BlockMove.prototype.toJson = function() {
  const json = Blockly.Events.BlockMove.superClass_.toJson.call(this);
  if (this.newParentId) {
    json['newParentId'] = this.newParentId;
  }
  if (this.newInputName) {
    json['newInputName'] = this.newInputName;
  }
  if (this.newCoordinate) {
    json['newCoordinate'] = Math.round(this.newCoordinate.x) + ',' +
        Math.round(this.newCoordinate.y);
  }
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
Blockly.Events.BlockMove.prototype.fromJson = function(json) {
  Blockly.Events.BlockMove.superClass_.fromJson.call(this, json);
  this.newParentId = json['newParentId'];
  this.newInputName = json['newInputName'];
  if (json['newCoordinate']) {
    const xy = json['newCoordinate'].split(',');
    this.newCoordinate =
        new goog.math.Coordinate(parseFloat(xy[0]), parseFloat(xy[1]));
  }
};

/**
 * Record the block's new location.  Called after the move.
 */
Blockly.Events.BlockMove.prototype.recordNew = function() {
  const location = this.currentLocation_();
  this.newParentId = location.parentId;
  this.newInputName = location.inputName;
  this.newCoordinate = location.coordinate;
};

/**
 * Returns the parentId and input if the block is connected,
 *   or the XY location if disconnected.
 * @return {!Object} Collection of location info.
 * @private
 */
Blockly.Events.BlockMove.prototype.currentLocation_ = function() {
  const workspace = Blockly.common.getWorkspaceById(this.workspaceId);
  const block = workspace.getBlockById(this.blockId);
  const location = {};
  const parent = block.getParent();
  if (parent) {
    location.parentId = parent.id;
    const input = parent.getInputWithBlock(block);
    if (input) {
      location.inputName = input.name;
    }
  } else {
    const blockXY = block.getRelativeToSurfaceXY();
    // The X position in the block move event should be the language agnostic
    // position of the block. I.e. it should not be different in LTR vs. RTL.
    const rtlAwareX = workspace.RTL ? workspace.getWidth() - blockXY.x : blockXY.x;
    location.coordinate = new goog.math.Coordinate(rtlAwareX, blockXY.y);
  }
  return location;
};

/**
 * Does this event record any change of state?
 * @return {boolean} False if something changed.
 */
Blockly.Events.BlockMove.prototype.isNull = function() {
  return this.oldParentId == this.newParentId &&
      this.oldInputName == this.newInputName &&
      goog.math.Coordinate.equals(this.oldCoordinate, this.newCoordinate);
};

/**
 * Run a move event.
 * @param {boolean} forward True if run forward, false if run backward (undo).
 */
Blockly.Events.BlockMove.prototype.run = function(forward) {
  const workspace = this.getEventWorkspace_();
  const block = workspace.getBlockById(this.blockId);
  if (!block) {
    console.warn("Can't move non-existent block: " + this.blockId);
    return;
  }
  const parentId = forward ? this.newParentId : this.oldParentId;
  const inputName = forward ? this.newInputName : this.oldInputName;
  const coordinate = forward ? this.newCoordinate : this.oldCoordinate;
  let parentBlock = null;
  if (parentId) {
    parentBlock = workspace.getBlockById(parentId);
    if (!parentBlock) {
      console.warn("Can't connect to non-existent block: " + parentId);
      return;
    }
  }
  if (block.getParent()) {
    block.unplug();
  }
  if (coordinate) {
    const xy = block.getRelativeToSurfaceXY();
    const rtlAwareX = workspace.RTL ? workspace.getWidth() - coordinate.x : coordinate.x;
    block.moveBy(rtlAwareX - xy.x, coordinate.y - xy.y);
  } else {
    const blockConnection = block.outputConnection || block.previousConnection;
    let parentConnection;
    if (inputName) {
      const input = parentBlock.getInput(inputName);
      if (input) {
        parentConnection = input.connection;
      }
    } else if (blockConnection.type == Blockly.constants.PREVIOUS_STATEMENT) {
      parentConnection = parentBlock.nextConnection;
    }
    if (parentConnection) {
      blockConnection.connect(parentConnection);
    } else {
      console.warn("Can't connect to non-existent input: " + inputName);
    }
  }
};
