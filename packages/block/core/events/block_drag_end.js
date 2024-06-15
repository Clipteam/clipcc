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
goog.declareModuleId('Blockly.Events.EndBlockDrag');

import * as eventUtils from './utils';
import {BlockBase} from './block_base';
import * as blocks from '../serialization/blocks';


/**
 * Class for a block end drag event.
 * @param {Blockly.Block} block The moved block.  Null for a blank event.
 * @param {boolean} isOutside True if the moved block is outside of the
 *     blocks workspace.
 * @extends {BlockBase}
 * @constructor
 */
export const EndBlockDrag = function(block, isOutside) {
  if (!block) {
    return;  // Blank event to be populated by fromJson.
  }
  EndBlockDrag.superClass_.constructor.call(this, block);
  this.isOutside = isOutside;
  // If drag ends outside the blocks workspace, send the block state
  if (isOutside) {
    this.json = blocks.save(block, {noId: true});
  }
  this.recordUndo = false;
};
goog.inherits(EndBlockDrag, BlockBase);

/**
 * Type of this event.
 * @type {string}
 */
EndBlockDrag.prototype.type = eventUtils.END_DRAG;

/**
 * Encode the event as JSON.
 * @return {!Object} JSON representation.
 */
EndBlockDrag.prototype.toJson = function() {
  const json = EndBlockDrag.superClass_.toJson.call(this);
  if (this.isOutside) {
    json['isOutside'] = this.isOutside;
  }
  if (this.json) {
    json['json'] = this.json;
  }
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
EndBlockDrag.prototype.fromJson = function(json) {
  EndBlockDrag.superClass_.fromJson.call(this, json);
  this.isOutside = json['isOutside'];
  this.json = json['json'];
};

eventUtils.register(eventUtils.END_DRAG, EndBlockDrag);
