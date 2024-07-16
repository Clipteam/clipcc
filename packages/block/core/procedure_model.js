/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2024 Clip Team
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
 * @fileoverview Components for the procedure model.
 * @author cuizhihui030925@outlook.com (Alex Cui)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.ProcedureModel');

/**
 * Class for a procedure model.
 * Holds information for the procedure.
 * @param {!Blockly.workspace} workspace The procedure's workspace.
 * @param {!Element} mutation Mutation of the procedure.
 */
export const ProcedureModel = function(workspace, mutation) {
  /**
   * The workspace the procedure is in.
   * @type {!Blockly.Workspace}
   */
  this.workspace = workspace;

  /**
   * Mutation of the procedure.
   * @type {!Object}
   * @package
   */
  this.mutation = mutation;

  /**
   * The name of the procedure, it should be unique for all procedures defined
   * in one target.
   * @type {string}
   * @private
   */
  this.procCode = mutation['proccode'];

  /**
   * True if procedure is defined outside current workspace.
   * @type {boolean}
   * @private
   */
  this.external = mutation['external'] === 'true';

  /**
   * True if procedure is global.
   * @type {boolean}
   * @private
   */
  this.global = mutation['global'] === 'true';
};

/**
 * @return {string} The procCode of procedure.
 */
ProcedureModel.prototype.getProcCode = function() {
  return this.procCode;
};

/**
 * @return {boolean} True if procedure is defined outside current workspace.
 */
ProcedureModel.prototype.isExternal = function() {
  return this.external;
};

/**
 * @return {boolean} True if procedure is global.
 */
ProcedureModel.prototype.isGlobal = function() {
  return this.global;
};
