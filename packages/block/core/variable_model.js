/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2017 Google Inc.
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
 * @fileoverview Components for the variable model.
 * @author marisaleung@google.com (Marisa Leung)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.VariableModel');

import * as Events from './events/events';
import {VarCreate} from './events/var_create';
import * as scratchBlocksUtils from './scratch_blocks_utils';
import * as utils from './utils';


/**
 * Class for a variable model.
 * Holds information for the variable including name, ID, and type.
 * @param {!Blockly.Workspace} workspace The variable's workspace.
 * @param {!string} name The name of the variable. This must be unique across
 *     each variable type.
 * @param {?string} opt_type The type of the variable like 'int' or 'string'.
 *     Does not need to be unique. Field_variable can filter variables based on
 *     their type. This will default to '' which is a specific type.
 * @param {string=} opt_id The unique ID of the variable. This will default to
 *     a UUID.
 * @param {boolean=} opt_isLocal Whether the variable is locally scoped.
 * @param {boolean=} opt_isCloud Whether the variable is a cloud variable.
 * @see {Blockly.FieldVariable}
 * @constructor
 */
export const VariableModel = function(workspace, name, opt_type, opt_id,
    opt_isLocal, opt_isCloud) {
  /**
   * The workspace the variable is in.
   * @type {!Blockly.Workspace}
   */
  this.workspace = workspace;

  /**
   * The name of the variable, typically defined by the user. It must be
   * unique across all names used for procedures and variables. It may be
   * changed by the user.
   * @type {string}
   */
  this.name = name;

  /**
   * The type of the variable, such as 'int' or 'sound_effect'. This may be
   * used to build a list of variables of a specific type. By default this is
   * the empty string '', which is a specific type.
   * @see {Blockly.FieldVariable}
   * @type {string}
   */
  this.type = opt_type || '';

  /**
   * A unique id for the variable. This should be defined at creation and
   * not change, even if the name changes. In most cases this should be a
   * UUID.
   * @type {string}
   * @private
   */
  this.id_ = opt_id || utils.genUid();

  /**
   * Whether this variable is locally scoped.
   * @package
   */
  this.isLocal = opt_isLocal || false;

  /**
   * Whether the variable is a cloud variable.
   * @package
   */
  this.isCloud = opt_isCloud || false;

  Events.fire(new VarCreate(this));
};

/**
 * @return {!string} The ID for the variable.
 */
VariableModel.prototype.getId = function() {
  return this.id_;
};

/**
 * A custom compare function for the VariableModel objects.
 * @param {VariableModel} var1 First variable to compare.
 * @param {VariableModel} var2 Second variable to compare.
 * @return {number} -1 if name of var1 is less than name of var2, 0 if equal,
 *     and 1 if greater.
 * @package
 */
VariableModel.compareByName = function(var1, var2) {
  return scratchBlocksUtils.compareStrings(var1.name, var2.name);
};
