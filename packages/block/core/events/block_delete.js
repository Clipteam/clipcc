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

goog.provide('Blockly.Events.BlockDelete');

goog.require('Blockly.Events');
goog.require('Blockly.Events.BlockBase');

goog.require('goog.dom');


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
  this.ids = Blockly.Events.getDescendantIds(block);
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

Blockly.Events.register(Blockly.Events.BLOCK_DELETE, Blockly.Events.BlockDelete);
