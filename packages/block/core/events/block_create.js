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

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Events.BlockCreate');

import * as eventUtils from './utils';
import {BlockBase} from './block_base';
import * as blocks from '../serialization/blocks';
import * as Xml from '../xml';

/**
 * Class for a block creation event.
 * @param {Blockly.Block} block The created block.  Null for a blank event.
 * @extends {BlockBase}
 * @constructor
 */
export const BlockCreate = function(block) {
  if (!block) {
    return;  // Blank event to be populated by fromJson.
  }
  BlockCreate.superClass_.constructor.call(this, block);

  this.xml = Xml.blockToDomWithXY(block);

  /**
   * JSON representation of the block that was just created.
   * @type { !blocks.State }
   */
  this.json = /** @type {!blocks.State} */ (blocks.save(
      block, { addCoordinates: true }));
  this.ids = eventUtils.getDescendantIds(block);
};
goog.inherits(BlockCreate, BlockBase);

/**
 * Type of this event.
 * @type {string}
 */
BlockCreate.prototype.type = eventUtils.CREATE;

/**
 * Encode the event as JSON.
 * @return {!Object} JSON representation.
 */
BlockCreate.prototype.toJson = function() {
  const json = BlockCreate.superClass_.toJson.call(this);
  json['xml'] = Xml.domToText(this.xml);
  json['json'] = this.json;
  json['ids'] = this.ids;
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
BlockCreate.prototype.fromJson = function(json) {
  BlockCreate.superClass_.fromJson.call(this, json);
  this.xml = Xml.textToDom('<xml>' + json['xml'] + '</xml>').firstChild;
  this.json = /** @type {!blocks.State} */ (json['json']);
  this.ids = json['ids'];
};

/**
 * Run a creation event.
 * @param {boolean} forward True if run forward, false if run backward (undo).
 */
BlockCreate.prototype.run = function(forward) {
  const workspace = this.getEventWorkspace_();
  if (forward) {
    blocks.load(this.json, workspace);
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

eventUtils.register(eventUtils.BLOCK_CREATE, BlockCreate);
