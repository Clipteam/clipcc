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
goog.declareModuleId('Blockly.Events.VarRename');

import * as Events from './events';
import {VarBase} from './var_base';


/**
 * Class for a variable rename event.
 * @param {Blockly.VariableModel} variable The renamed variable.
 *     Null for a blank event.
 * @param {string} newName The new name the variable will be changed to.
 * @extends {VarBase}
 * @constructor
 */
export const VarRename = function(variable, newName) {
  if (!variable) {
    return;  // Blank event to be populated by fromJson.
  }
  VarRename.superClass_.constructor.call(this, variable);
  this.oldName = variable.name;
  this.newName = newName;
};
goog.inherits(VarRename, VarBase);

/**
 * Type of this event.
 * @type {string}
 */
VarRename.prototype.type = Events.VAR_RENAME;

/**
 * Encode the event as JSON.
 * @return {!Object} JSON representation.
 */
VarRename.prototype.toJson = function() {
  const json = VarRename.superClass_.toJson.call(this);
  json['oldName'] = this.oldName;
  json['newName'] = this.newName;
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
VarRename.prototype.fromJson = function(json) {
  VarRename.superClass_.fromJson.call(this, json);
  this.oldName = json['oldName'];
  this.newName = json['newName'];
};

/**
 * Run a variable rename event.
 * @param {boolean} forward True if run forward, false if run backward (undo).
 */
VarRename.prototype.run = function(forward) {
  const workspace = this.getEventWorkspace_();
  if (forward) {
    workspace.renameVariableById(this.varId, this.newName);
  } else {
    workspace.renameVariableById(this.varId, this.oldName);
  }
};

Events.register(Events.VAR_RENAME, VarRename);
