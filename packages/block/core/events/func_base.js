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
goog.declareModuleId('Blockly.Events.FuncBase');

import {Abstract} from './abstract';

/**
 * Abstract class for a function event.
 * @param {!Workspace} workspace The workspace of procedure.
 * @param {Object} mutation The mutation of procedure.
 * @extends {Abstract}
 * @constructor
 */
export const FuncBase = function(workspace, mutation) {
  FuncBase.superClass_.constructor.call(this);
  this.workspaceId = workspace.id;
  this.procCode = mutation['proccode'];
};
goog.inherits(FuncBase, Abstract);

/**
 * Encode the event as JSON.
 * @return {!Object} JSON representation.
 */
FuncBase.prototype.toJson = function() {
  const json = FuncBase.superClass_.toJson.call(this);
  json['procCode'] = this.procCode;
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
FuncBase.prototype.fromJson = function(json) {
  FuncBase.superClass_.toJson.call(this);
  this.procCode = json['procCode'];
};

