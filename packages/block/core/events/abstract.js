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
 * @fileoverview Abstract class for events fired as a result of actions in
 *     Blockly's editor.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Events.Abstract');

import * as common from '../common';
import * as eventUtils from './utils';

/**
 * Abstract class for an event.
 */
export class Abstract {
  constructor() {
    /**
    * The workspace identifier for this event.
    * @type {string|undefined}
    */
    this.workspaceId = undefined;

    /**
    * The event group id for the group this event belongs to. Groups define
    * events that should be treated as an single action from the user's
    * perspective, and should be undone together.
    * @type {string}
    */
    this.group = eventUtils.getGroup();

    /**
    * Sets whether the event should be added to the undo stack.
    * @type {boolean}
    */
    this.recordUndo = eventUtils.getRecordUndo();
  }

  /**
  * Encode the event as JSON.
  * @return {!Object} JSON representation.
  */
  toJson() {
    const json = {
      'type': this.type
    };
    if (this.group) {
      json['group'] = this.group;
    }
    return json;
  }

  /**
  * Decode the JSON event.
  * @param {!Object} json JSON representation.
  */
  fromJson(json) {
    this.group = json['group'];
  }

  /**
  * Does this event record any change of state?
  * By default we assume events are non-null.  Subclasses may override to
  * indicate that they do not change state.
  * @return {boolean} False if something changed.
  */
  isNull() {
    return false;
  }

  /**
  * Run an event.
  * @param {boolean} _forward True if run forward, false if run backward (undo).
  */
  run(_forward) {
    // Defined by subclasses.
  }

  /**
  * Get workspace the event belongs to.
  * @return {Blockly.Workspace} The workspace the event belongs to.
  * @throws {Error} if workspace is null.
  * @protected
  */
  getEventWorkspace_() {
    const workspace = common.getWorkspaceById(this.workspaceId);
    if (!workspace) {
      throw Error('Workspace is null. Event must have been generated from real' +
       ' Blockly events.');
    }
    return workspace;
  }
}
