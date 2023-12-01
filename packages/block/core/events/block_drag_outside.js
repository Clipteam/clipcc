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
goog.declareModuleId('Blockly.Events.DragBlockOutside');

import * as eventUtils from './utils';
import {BlockBase} from './block_base';


/**
 * Class for a block drag event. Fired when block dragged into or out of
 * the blocks UI.
 * @param {Blockly.Block} block The moved block.  Null for a blank event.
 * @extends {BlockBase}
 * @constructor
 */
export const DragBlockOutside = function(block) {
  if (!block) {
    return;  // Blank event to be populated by fromJson.
  }
  DragBlockOutside.superClass_.constructor.call(this, block);
  this.recordUndo = false;
};
goog.inherits(DragBlockOutside, BlockBase);

/**
 * Type of this event.
 * @type {string}
 */
DragBlockOutside.prototype.type = eventUtils.DRAG_OUTSIDE;

/**
 * Encode the event as JSON.
 * @return {!Object} JSON representation.
 */
DragBlockOutside.prototype.toJson = function() {
  const json = DragBlockOutside.superClass_.toJson.call(this);
  if (this.isOutside) {
    json['isOutside'] = this.isOutside;
  }
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
DragBlockOutside.prototype.fromJson = function(json) {
  DragBlockOutside.superClass_.fromJson.call(this, json);
  this.isOutside = json['isOutside'];
};

eventUtils.register(eventUtils.DRAG_OUTSIDE, DragBlockOutside);
