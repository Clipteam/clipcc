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

/**
 * @fileoverview Classes for all types of block events.
 * @author fenichel@google.com (Rachel Fenichel)
 */
'use strict';

goog.provide('Blockly.Events.BlockBase');
goog.provide('Blockly.Events.BlockChange');
goog.provide('Blockly.Events.BlockCreate');
goog.provide('Blockly.Events.BlockDelete');
goog.provide('Blockly.Events.BlockMove');

goog.require('Blockly.Events');
goog.require('Blockly.Events.Abstract');

goog.require('goog.array');
goog.require('goog.math.Coordinate');


/**
 * Abstract class for a block event.
 * @param {Blockly.Block} block The block this event corresponds to.
 * @extends {Blockly.Events.Abstract}
 * @constructor
 */
Blockly.Events.BlockBase = function(block) {
  Blockly.Events.BlockBase.superClass_.constructor.call(this);

  /**
   * The block id for the block this event pertains to
   * @type {string}
   */
  this.blockId = block.id;
  this.workspaceId = block.workspace.id;
};
goog.inherits(Blockly.Events.BlockBase, Blockly.Events.Abstract);

/**
 * Encode the event as JSON.
 * @return {!Object} JSON representation.
 */
Blockly.Events.BlockBase.prototype.toJson = function() {
  const json = Blockly.Events.BlockBase.superClass_.toJson.call(this);
  json['blockId'] = this.blockId;
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
Blockly.Events.BlockBase.prototype.fromJson = function(json) {
  Blockly.Events.BlockBase.superClass_.toJson.call(this);
  this.blockId = json['blockId'];
};

/**
 * Class for a block change event.
 * @param {Blockly.Block} block The changed block.  Null for a blank event.
 * @param {string} element One of 'field', 'comment', 'disabled', etc.
 * @param {?string} name Name of input or field affected, or null.
 * @param {*} oldValue Previous value of element.
 * @param {*} newValue New value of element.
 * @extends {Blockly.Events.BlockBase}
 * @constructor
 */
Blockly.Events.BlockChange = function(block, element, name, oldValue, newValue) {
  if (!block) {
    return;  // Blank event to be populated by fromJson.
  }
  Blockly.Events.BlockChange.superClass_.constructor.call(this, block);
  this.element = element;
  this.name = name;
  this.oldValue = oldValue;
  this.newValue = newValue;
};
goog.inherits(Blockly.Events.BlockChange, Blockly.Events.BlockBase);

/**
 * Type of this event.
 * @type {string}
 */
Blockly.Events.BlockChange.prototype.type = Blockly.Events.CHANGE;

/**
 * Encode the event as JSON.
 * @return {!Object} JSON representation.
 */
Blockly.Events.BlockChange.prototype.toJson = function() {
  const json = Blockly.Events.BlockChange.superClass_.toJson.call(this);
  json['element'] = this.element;
  if (this.name) {
    json['name'] = this.name;
  }
  json['newValue'] = this.newValue;
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
Blockly.Events.BlockChange.prototype.fromJson = function(json) {
  Blockly.Events.BlockChange.superClass_.fromJson.call(this, json);
  this.element = json['element'];
  this.name = json['name'];
  this.newValue = json['newValue'];
};

/**
 * Does this event record any change of state?
 * @return {boolean} False if something changed.
 */
Blockly.Events.BlockChange.prototype.isNull = function() {
  return this.oldValue == this.newValue;
};

/**
 * Run a change event.
 * @param {boolean} forward True if run forward, false if run backward (undo).
 */
Blockly.Events.BlockChange.prototype.run = function(forward) {
  const workspace = this.getEventWorkspace_();
  const block = workspace.getBlockById(this.blockId);
  if (!block) {
    console.warn("Can't change non-existent block: " + this.blockId);
    return;
  }
  if (block.mutator) {
    // Close the mutator (if open) since we don't want to update it.
    block.mutator.setVisible(false);
  }
  let value = forward ? this.newValue : this.oldValue;
  switch (this.element) {
    case 'field': {
      const field = block.getField(this.name);
      if (field) {
        // Run the validator for any side-effects it may have.
        // The validator's opinion on validity is ignored.
        field.callValidator(value);
        field.setValue(value);
      } else {
        console.warn("Can't set non-existent field: " + this.name);
      }
      break;
    }
    case 'comment':
      block.setCommentText(value || null);
      break;
    case 'collapsed':
      block.setCollapsed(value);
      break;
    case 'disabled':
      block.setDisabled(value);
      break;
    case 'inline':
      block.setInputsInline(value);
      break;
    case 'mutation': {
      let oldMutation = '';
      if (block.mutationToDom) {
        const oldMutationDom = block.mutationToDom();
        oldMutation = oldMutationDom && Blockly.Xml.domToText(oldMutationDom);
      }
      if (block.domToMutation) {
        value = value || '<mutation></mutation>';
        const dom = Blockly.Xml.textToDom('<xml>' + value + '</xml>');
        block.domToMutation(dom.firstChild);
      }
      Blockly.Events.fire(new Blockly.Events.BlockChange(
          block, 'mutation', null, oldMutation, value));
      break;
    }
    default:
      console.warn('Unknown change type: ' + this.element);
  }
};

/**
 * Class for a block creation event.
 * @param {Blockly.Block} block The created block.  Null for a blank event.
 * @extends {Blockly.Events.BlockBase}
 * @constructor
 */
Blockly.Events.BlockCreate = function(block) {
  if (!block) {
    return;  // Blank event to be populated by fromJson.
  }
  Blockly.Events.BlockCreate.superClass_.constructor.call(this, block);

  if (block.workspace.rendered) {
    this.xml = Blockly.Xml.blockToDomWithXY(block);
  } else {
    this.xml = Blockly.Xml.blockToDom(block);
  }
  this.ids = Blockly.Events.getDescendantIds_(block);
};
goog.inherits(Blockly.Events.BlockCreate, Blockly.Events.BlockBase);

/**
 * Type of this event.
 * @type {string}
 */
Blockly.Events.BlockCreate.prototype.type = Blockly.Events.CREATE;

/**
 * Encode the event as JSON.
 * @return {!Object} JSON representation.
 */
Blockly.Events.BlockCreate.prototype.toJson = function() {
  const json = Blockly.Events.BlockCreate.superClass_.toJson.call(this);
  json['xml'] = Blockly.Xml.domToText(this.xml);
  json['ids'] = this.ids;
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
Blockly.Events.BlockCreate.prototype.fromJson = function(json) {
  Blockly.Events.BlockCreate.superClass_.fromJson.call(this, json);
  this.xml = Blockly.Xml.textToDom('<xml>' + json['xml'] + '</xml>').firstChild;
  this.ids = json['ids'];
};

/**
 * Run a creation event.
 * @param {boolean} forward True if run forward, false if run backward (undo).
 */
Blockly.Events.BlockCreate.prototype.run = function(forward) {
  const workspace = this.getEventWorkspace_();
  if (forward) {
    const xml = goog.dom.createDom('xml');
    xml.appendChild(this.xml);
    Blockly.Xml.domToWorkspace(xml, workspace);
  } else {
    for (let i = 0, id; id = this.ids[i]; i++) {
      const block = workspace.getBlockById(id);
      if (block) {
        block.dispose(false, false);
      } else if (id == this.blockId) {
        // Only complain about root-level block.
        console.warn("Can't uncreate non-existent block: " + id);
      }
    }
  }
};

/**
 * Class for a block deletion event.
 * @param {Blockly.Block} block The deleted block.  Null for a blank event.
 * @extends {Blockly.Events.BlockBase}
 * @constructor
 */
Blockly.Events.BlockDelete = function(block) {
  if (!block) {
    return;  // Blank event to be populated by fromJson.
  }
  if (block.getParent()) {
    throw 'Connected blocks cannot be deleted.';
  }
  Blockly.Events.BlockDelete.superClass_.constructor.call(this, block);

  if (block.workspace.rendered) {
    this.oldXml = Blockly.Xml.blockToDomWithXY(block);
  } else {
    this.oldXml = Blockly.Xml.blockToDom(block);
  }
  this.ids = Blockly.Events.getDescendantIds_(block);
};
goog.inherits(Blockly.Events.BlockDelete, Blockly.Events.BlockBase);

/**
 * Type of this event.
 * @type {string}
 */
Blockly.Events.BlockDelete.prototype.type = Blockly.Events.DELETE;

/**
 * Encode the event as JSON.
 * @return {!Object} JSON representation.
 */
Blockly.Events.BlockDelete.prototype.toJson = function() {
  const json = Blockly.Events.BlockDelete.superClass_.toJson.call(this);
  json['ids'] = this.ids;
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
Blockly.Events.BlockDelete.prototype.fromJson = function(json) {
  Blockly.Events.BlockDelete.superClass_.fromJson.call(this, json);
  this.ids = json['ids'];
};

/**
 * Run a deletion event.
 * @param {boolean} forward True if run forward, false if run backward (undo).
 */
Blockly.Events.BlockDelete.prototype.run = function(forward) {
  const workspace = this.getEventWorkspace_();
  if (forward) {
    for (let i = 0, id; id = this.ids[i]; i++) {
      const block = workspace.getBlockById(id);
      if (block) {
        block.dispose(false, false);
      } else if (id == this.blockId) {
        // Only complain about root-level block.
        console.warn("Can't delete non-existent block: " + id);
      }
    }
  } else {
    const xml = goog.dom.createDom('xml');
    xml.appendChild(this.oldXml);
    Blockly.Xml.domToWorkspace(xml, workspace);
  }
};

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
  const workspace = Blockly.Workspace.getById(this.workspaceId);
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
