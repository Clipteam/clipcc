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

'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Events.FuncUpdate');

import * as eventUtils from './utils';
import {FuncBase} from './func_base';
import * as Xml from '../xml';

/**
 * Class for a function update event.
 * @param {!Workspace} workspace The workspace of procedure.
 * @param {Element} oldMutation The mutation of function.
 * @param {Element} newMutation The new mutation of function.
 * @extends {FuncBase}
 * @constructor
 */
export const FuncUpdate = function(workspace, oldMutation, newMutation) {
  FuncUpdate.superClass_.constructor.call(this, workspace, oldMutation);
  this.oldMutation = Xml.domToText(oldMutation);
  this.newMutation = Xml.domToText(newMutation);
};
goog.inherits(FuncUpdate, FuncBase);

/**
 * Type of this event.
 * @type {string}
 */
FuncUpdate.prototype.type = eventUtils.FUNC_UPDATE;

/**
 * Encode the event as JSON.
 * @return {!Object} JSON representation.
 */
FuncUpdate.prototype.toJson = function() {
  const json = FuncUpdate.superClass_.toJson.call(this);
  json['oldMutation'] = this.oldMutation;
  json['newMutation'] = this.newMutation;
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
FuncUpdate.prototype.fromJson = function(json) {
  FuncUpdate.superClass_.toJson.call(this);
  this.oldMutation = json['oldMutation'];
  this.newMutation = json['newMutation'];
};

/**
 * Run a function update event.
 * @param {boolean} forward True if run forward, false if run backward (undo).
 */
FuncUpdate.prototype.run = function(forward) {
  const workspace = this.getEventWorkspace_();
  if (forward) {
    workspace.updateProcedure(this.procCode, this.newMutation);
  } else {
    const newMutationDom = Xml.textToDom('<xml>' + this.newMutation + '</xml>');
    const newProcCode = newMutationDom.getAttribute('proccode');
    workspace.updateProcedure(newProcCode, this.oldMutation);
  }
};

eventUtils.register(eventUtils.FUNC_UPDATE, FuncUpdate);
