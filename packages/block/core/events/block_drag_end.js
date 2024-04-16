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
import * as Xml from '../xml';


/**
 * Class for a block end drag event.
 * @extends {BlockBase}
 * @class
 */
export class EndBlockDrag extends BlockBase {
  /**
   * @param {Blockly.Block} block The moved block.  Null for a blank event.
   * @param {boolean} isOutside True if the moved block is outside of the
   *     blocks workspace.
   */
  constructor(block, isOutside) {
    if (!block) {
      return;  // Blank event to be populated by fromJson.
    }
    super(block);
    /**
    * Type of this event.
    * @type {string}
    */
    this.type = eventUtils.END_DRAG;
    this.isOutside = isOutside;
    // If drag ends outside the blocks workspace, send the block XML
    if (isOutside) {
      this.xml = Xml.blockToDom(block, true /* opt_noId */);
    }
    this.recordUndo = false;
  }

  /**
   * Encode the event as JSON.
   * @return {!Object} JSON representation.
   */
  toJson() {
    const json = super.toJson();
    if (this.isOutside) {
      json['isOutside'] = this.isOutside;
    }
    if (this.xml) {
      json['xml'] = this.xml;
    }
    return json;
  }

  /**
   * Decode the JSON event.
   * @param {!Object} json JSON representation.
   */
  fromJson(json) {
    super.fromJson(json);
    this.isOutside = json['isOutside'];
    this.xml = json['xml'];
  }
}

eventUtils.register(eventUtils.END_DRAG, EndBlockDrag);
