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

goog.provide('Blockly.ProcedureMap');

/**
 * Class for a procedure map. This contains a dictionary data structure with
 * procedure proccodes as keys and its mutation as values. 
 * @param {!Blockly.Workspace} workspace The workspace this map belongs to.
 */
Blockly.ProcedureMap = function(workspace) {
  /**
   * A map from procedure proccode to list of global procedures.
   * @type {!Object.<string, Element>}
   * @private
   */
  this.globalProcedureMap_ = {};

  /**
   * A map from procedure proccode to list of local procedures.
   * @type {!Object.<string, Element>}
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
Blockly.ProcedureMap.prototype.clear = function() {
  this.globalProcedureMap_ = new Object(null);
  this.localProcedureMap_ = new Object(null);
};

/**
 * Get the variable by the given proccode.
 * Return null if it is not found.
 * @param {string} proccode The proccode to check for.
 * @return {Element} The mutation with the given name, or null if not found.
 */
Blockly.ProcedureMap.prototype.getProcedure = function(proccode) {
  if (this.globalProcedureMap_.hasOwnProperty(proccode)) {
    return this.globalProcedureMap_[proccode];
  }
  if (this.localProcedureMap_.hasOwnProperty(proccode)) {
    return this.localProcedureMap_[proccode];
  }
  return null;
};

/**
 * Get all global procedure definition mutations.
 * @return {!Array.<Element>} Array of mutation xml elements.
 * @package
 */
Blockly.ProcedureMap.prototype.allGlobalProcedureMutations = function() {
  return Object.values(this.globalProcedureMap_);
};

/**
 * Get all local procedure definition mutations.
 * @return {!Array.<Element>} Array of mutation xml elements.
 * @package
 */
Blockly.ProcedureMap.prototype.allLocalProcedureMutations = function() {
  return Object.values(this.localProcedureMap_);
};

/**
 * Create a procedure with a given mutation.
 * @param {Element} mutation The mutation of the procedure.
 * @returns {Element} The newly created procedure.
 */
Blockly.ProcedureMap.prototype.createProcedureFromMutation = function(mutation) {
  var procedure = this.getProcedure(mutation.getAttribute('proccode'));
  if (procedure) {
    console.warn('Procedure "' + mutation.getAttribute('proccode') + '" is already in use.');
    return procedure;
  }
  if (mutation.getAttribute('global') == 'true') {
    procedure = this.globalProcedureMap_[mutation.getAttribute('proccode')] = mutation;
  }
  else {
    procedure = this.localProcedureMap_[mutation.getAttribute('proccode')] = mutation;
  }
  return procedure;
};

/**
 * Remove a procedure from definition root block.
 * @param {string} procCode The identifier of the procedure to delete.
 * @param {!Blockly.Block} definitionRoot The root block of the stack that
 *     defines the custom procedure.
 */
Blockly.ProcedureMap.prototype.removeProcedure = function(definitionRoot) {
  var block = definitionRoot.getChildren()[0];
  if (block.global_) {
    delete this.globalProcedureMap_[block.getProcCode()];
  }
  else {
    delete this.localProcedureMap_[block.getProcCode()];
  }
};
