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
goog.declareModuleId('Blockly.Events.VarCreate');

import * as eventUtils from './utils';
import {VarBase} from './var_base';


/**
 * Class for a variable creation event.
 * @extends {VarBase}
 */
export class VarCreate extends VarBase {
  /**
   * @param {Blockly.VariableModel} variable The created variable.
   *     Null for a blank event.
   */
  constructor(variable) {
    super(variable);

    /**
     * Type of this event.
     * @type {string}
     */
    this.type = eventUtils.VAR_CREATE;

    this.varType = variable.type;
    this.varName = variable.name;
    this.isLocal = variable.isLocal;
    this.isCloud = variable.isCloud;
  }

  /**
   * Encode the event as JSON.
   * @return {!Object} JSON representation.
   */
  toJson() {
    const json = super.toJson();
    json['varType'] = this.varType;
    json['varName'] = this.varName;
    json['isLocal'] = this.isLocal;
    json['isCloud'] = this.isCloud;
    return json;
  }

  /**
   * Decode the JSON event.
   * @param {!Object} json JSON representation.
   */
  fromJson(json) {
    super.fromJson(json);
    this.varType = json['varType'];
    this.varName = json['varName'];
    this.isLocal = json['isLocal'];
    this.isCloud = json['isCloud'];
  }

  /**
   * Run a variable creation event.
   * @param {boolean} forward True if run forward, false if run backward (undo).
   */
  run(forward) {
    const workspace = this.getEventWorkspace_();
    if (forward) {
      workspace.createVariable(this.varName, this.varType, this.varId, this.isLocal, this.isCloud);
    } else {
      workspace.deleteVariableById(this.varId);
    }
  }
}

eventUtils.register(eventUtils.VAR_CREATE, VarCreate);
