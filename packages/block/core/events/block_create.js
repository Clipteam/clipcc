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
import * as Xml from '../xml';

const dom = goog.require('goog.dom');


/**
 * Class for a block creation event.
 * @extends {BlockBase}
 * @class
 */
export class BlockCreate extends BlockBase {
  /**
   * @param {Blockly.Block} block The created block.  Null for a blank event.
   */
  constructor(block) {
    if (!block) {
      return;  // Blank event to be populated by fromJson.
    }
    super(block);

    /**
    * Type of this event.
    * @type {string}
    */
    this.type = eventUtils.CREATE;
    if (block.workspace.rendered) {
      this.xml = Xml.blockToDomWithXY(block);
    } else {
      this.xml = Xml.blockToDom(block);
    }
    this.ids = eventUtils.getDescendantIds(block);
  }

  /**
   * Encode the event as JSON.
   * @return {!Object} JSON representation.
   */
  toJson() {
    const json = super.toJson();
    json['xml'] = Xml.domToText(this.xml);
    json['ids'] = this.ids;
    return json;
  }

  /**
   * Decode the JSON event.
   * @param {!Object} json JSON representation.
   */
  fromJson(json) {
    super.fromJson(json);
    this.xml = Xml.textToDom('<xml>' + json['xml'] + '</xml>').firstChild;
    this.ids = json['ids'];
  }

  /**
   * Run a creation event.
   * @param {boolean} forward True if run forward, false if run backward (undo).
   */
  run(forward) {
    const workspace = this.getEventWorkspace_();
    if (forward) {
      const xml = dom.createDom('xml');
      xml.appendChild(this.xml);
      Xml.domToWorkspace(xml, workspace);
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
  }
}

eventUtils.register(eventUtils.BLOCK_CREATE, BlockCreate);
