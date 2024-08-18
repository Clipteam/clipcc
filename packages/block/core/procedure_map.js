/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2023 Clip Team
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @fileoverview Object representing a map of procedures.
 * @author cuizhihui030925@outlook.com (Alex Cui)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.ProcedureMap');

import * as eventUtils from './events/utils';
import {FuncUpdate} from './events/func_update';
import * as Procedures from './procedures';
import {ProcedureModel} from './procedure_model';

/**
 * Class for a procedure map. This contains a dictionary data structure with
 * procedure proccodes as keys and its mutation as values.
 * @param {!Blockly.Workspace} workspace The workspace this map belongs to.
 */
export const ProcedureMap = function(workspace) {
  /**
   * A map from proccode to global procedure models.
   * @type {!Object.<string, ProcedureModel>}
   * @private
   */
  this.globalProcedureMap_ = {};

  /**
   * A map from proccode to local procedure models.
   * @type {!Object.<string, ProcedureModel>}
   * @private
   */
  this.localProcedureMap_ = {};

  /**
   * The worksapce this map belongs to.
   * @type {!Blockly.Worksapce}
   */
  this.workspace = workspace;
};

/**
 * Clear the procedure map.
 */
ProcedureMap.prototype.clear = function() {
  this.globalProcedureMap_ = new Object(null);
  this.localProcedureMap_ = new Object(null);
};

/**
 * Get the variable by the given proccode. Local procedures are checked first.
 * Return null if it is not found.
 * @param {string} procCode The proccode to check for.
 * @return {ProcedureModel} The procedure model or null if not found.
 */
ProcedureMap.prototype.getProcedure = function(procCode) {
  return this.localProcedureMap_[procCode] ||
      this.globalProcedureMap_[procCode] ||
      null;
};

/**
 * Get all global procedure definition mutations.
 * @return {!Array.<Element>} Array of mutation xml elements.
 * @package
 */
ProcedureMap.prototype.allGlobalProcedureMutations = function() {
  return Object.values(this.globalProcedureMap_)
      .map(procedure => procedure.mutation);
};

/**
 * Get all local procedure definition mutations.
 * @return {!Array.<Object>} Array of mutation extra states.
 * @package
 */
ProcedureMap.prototype.allLocalProcedureMutations = function() {
  return Object.values(this.localProcedureMap_)
      .map(procedure => procedure.mutation);
};

/**
 * Create a procedure with a given mutation. Definition block should be created
 * externally if necessary.
 * @param {!Array.<Element> | !Object} mutation The mutation of the procedure.
 * @return {ProcedureModel} The newly created procedure.
 */
ProcedureMap.prototype.createProcedureFromMutation = function(mutation) {
  if (mutation.childNodes) {
    // Add xml attributes to object
    const obj = {};
    for (const attr of mutation.attributes) {
      obj[attr.nodeName] = attr.value;
    }
    mutation = obj;
  }

  const procCode = mutation['proccode'];
  const external = mutation['external'];
  let procedure = this.getProcedure(procCode);

  if (procedure && procedure.isExternal() === external) {
    // There is a procedure defined in current target with the same procCode.
    console.warn('Procedure "' + procCode + '" is already in use.');
    return procedure;
  }

  procedure = new ProcedureModel(this.workspace, mutation);
  if (procedure.isGlobal()) {
    this.globalProcedureMap_[procedure.getProcCode()] = procedure;
  } else {
    this.localProcedureMap_[procedure.getProcCode()] = procedure;
  }

  return procedure;
};

/**
 * Remove a procedure from definition root block.
 * @param {!Blockly.Block} definitionRoot The root block of the stack that
 *     defines the custom procedure.
 */
ProcedureMap.prototype.removeProcedure = function(definitionRoot) {
  const block = definitionRoot.getInput('custom_block').connection.targetBlock();
  if (block.global_) {
    delete this.globalProcedureMap_[block.getProcCode()];
  } else {
    delete this.localProcedureMap_[block.getProcCode()];
  }
};

/**
 * Update a procedure with new mutation.
 * @param {string} procCode Old proccode of procedure.
 * @param {Object} newMutation New mutation of procedure.
 */
ProcedureMap.prototype.updateProcedure = function(procCode, newMutation) {
  const oldProcedure = this.getProcedure(procCode);
  if (!oldProcedure) {
    console.warn('Procedure "' + procCode + '" is is not found.');
    return;
  }

  const oldMutation = oldProcedure.mutation;
  if (JSON.stringify(oldMutation) === JSON.stringify(newMutation)) {
    return;
  }

  const defineBlock = Procedures.getDefineBlock(procCode, this.workspace);
  const prototypeBlock = Procedures.getPrototypeBlock(procCode, this.workspace);
  if (defineBlock && prototypeBlock) {
    const callers = Procedures.getCallers(procCode, defineBlock.workspace, true);
    callers.push(prototypeBlock);
    for (const caller of callers) {
      caller.loadExtraState(newMutation);
    }
  }

  if (oldMutation['global'] == 'true') {
    delete this.globalProcedureMap_[procCode];
  } else {
    delete this.localProcedureMap_[procCode];
  }
  this.createProcedureFromMutation(newMutation);

  eventUtils.setGroup(true);
  eventUtils.fire(new FuncUpdate(this.workspace, oldMutation, newMutation));
  eventUtils.setGroup(false);
};
