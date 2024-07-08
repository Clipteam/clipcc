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
goog.declareModuleId('Blockly.Events.BlockBase');

import {Abstract} from './abstract';

/**
 * Abstract class for a block event.
 * @extends {Abstract}
 */
export class BlockBase extends Abstract {
  /**
   * @param {Blockly.Block} block The block this event corresponds to.
   */
  constructor(block) {
    super();

    if (!block) {
      return;  // Blank event to be populated by fromJson.
    }

    /**
    * The block id for the block this event pertains to
    * @type {string}
    */
    this.blockId = block.id;
    this.workspaceId = block.workspace.id;
  }

  /**
  * Encode the event as JSON.
  * @return {!Object} JSON representation.
  */
  toJson() {
    const json = super.toJson();
    json['blockId'] = this.blockId;
    return json;
  }

  /**
  * Decode the JSON event.
  * @param {!Object} json JSON representation.
  */
  fromJson(json) {
    super.toJson();
    this.blockId = json['blockId'];
  }
}
