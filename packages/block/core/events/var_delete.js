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
goog.declareModuleId('Blockly.Events.VarDelete');

import * as Events from './events';
import {VarBase} from './var_base';


/**
 * Class for a variable deletion event.
 * @param {Blockly.VariableModel} variable The deleted variable.
 *     Null for a blank event.
 * @extends {VarBase}
 * @constructor
 */
export const VarDelete = function(variable) {
  if (!variable) {
    return;  // Blank event to be populated by fromJson.
  }
  VarDelete.superClass_.constructor.call(this, variable);
  this.varType = variable.type;
  this.varName = variable.name;
  this.isLocal = variable.isLocal;
  this.isCloud = variable.isCloud;
};
goog.inherits(VarDelete, VarBase);

/**
 * Type of this event.
 * @type {string}
 */
VarDelete.prototype.type = Events.VAR_DELETE;

/**
 * Encode the event as JSON.
 * @return {!Object} JSON representation.
 */
VarDelete.prototype.toJson = function() {
  const json = VarDelete.superClass_.toJson.call(this);
  json['varType'] = this.varType;
  json['varName'] = this.varName;
  json['isLocal'] = this.isLocal;
  json['isCloud'] = this.isCloud;
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
VarDelete.prototype.fromJson = function(json) {
  VarDelete.superClass_.fromJson.call(this, json);
  this.varType = json['varType'];
  this.varName = json['varName'];
  this.isLocal = json['isLocal'];
  this.isCloud = json['isCloud'];
};

/**
 * Run a variable deletion event.
 * @param {boolean} forward True if run forward, false if run backward (undo).
 */
VarDelete.prototype.run = function(forward) {
  const workspace = this.getEventWorkspace_();
  if (forward) {
    workspace.deleteVariableById(this.varId);
  } else {
    workspace.createVariable(this.varName, this.varType, this.varId, this.isLocal, this.isCloud);
  }
};

Events.register(Events.VAR_DELETE, VarDelete);
