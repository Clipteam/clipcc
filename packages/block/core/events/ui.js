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
 * @fileoverview Events fired as a result of UI actions in Blockly's editor.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Events.Ui');

import * as eventUtils from './utils';
import {Abstract} from './abstract';


/**
 * Class for a UI event.
 * UI events are events that don't need to be sent over the wire for multi-user
 * editing to work (e.g. scrolling the workspace, zooming, opening toolbox
 * categories).
 * UI events do not undo or redo.
 * @param {Blockly.Block} block The affected block.
 * @param {string} element One of 'selected', 'comment', 'mutator', etc.
 * @param {*} oldValue Previous value of element.
 * @param {*} newValue New value of element.
 * @extends {Abstract}
 * @constructor
 */
export const Ui = function(block, element, oldValue, newValue) {
  Ui.superClass_.constructor.call(this);
  this.blockId = block ? block.id : null;
  this.workspaceId = block ? block.workspace.id : null;
  this.element = element;
  this.oldValue = oldValue;
  this.newValue = newValue;
  // UI events do not undo or redo.
  this.recordUndo = false;
};
goog.inherits(Ui, Abstract);

/**
 * Type of this event.
 * @type {string}
 */
Ui.prototype.type = eventUtils.UI;

/**
 * Encode the event as JSON.
 * @return {!Object} JSON representation.
 */
Ui.prototype.toJson = function() {
  const json = Ui.superClass_.toJson.call(this);
  json['element'] = this.element;
  if (this.newValue !== undefined) {
    json['newValue'] = this.newValue;
  }
  if (this.blockId) {
    json['blockId'] = this.blockId;
  }
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
Ui.prototype.fromJson = function(json) {
  Ui.superClass_.fromJson.call(this, json);
  this.element = json['element'];
  this.newValue = json['newValue'];
  this.blockId = json['blockId'];
};

eventUtils.register(eventUtils.UI, Ui);
