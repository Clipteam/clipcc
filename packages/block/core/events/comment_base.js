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
goog.declareModuleId('Blockly.Events.CommentBase');

import * as eventUtils from './utils';
import {Abstract} from './abstract';

/**
 * Abstract class for a comment event.
 * @extends {Abstract}
 */
export class CommentBase extends Abstract {
  /**
   * @param {Blockly.WorkspaceComment | Blockly.ScratchBlockComment} comment
   *    The comment this event corresponds to.
  
   */
  constructor(comment) {
    super();
    
    if (!comment) {
      return;  // Blank event to be populated by fromJson.
    }

    /**
    * The ID of the comment this event pertains to.
    * @type {string}
    */
    this.commentId = comment.id;

    /**
    * The workspace identifier for this event.
    * @type {string}
    */
    this.workspaceId = comment.workspace.id;

    /**
    * The ID of the block this comment belongs to or null if it is not a block
    * comment.
    * @type {string}
    */
    this.blockId = comment.blockId || null;

    /**
    * The event group id for the group this event belongs to. Groups define
    * events that should be treated as an single action from the user's
    * perspective, and should be undone together.
    * @type {string}
    */
    this.group = eventUtils.getGroup();
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
    if (this.commentId) {
      json['commentId'] = this.commentId;
    }
    if (this.blockId) {
      json['blockId'] = this.blockId;
    }
    return json;
  }

  /**
  * Decode the JSON event.
  * @param {!Object} json JSON representation.
  */
  fromJson(json) {
    this.commentId = json['commentId'];
    this.group = json['group'];
    this.blockId = json['blockId'];
  }

  /**
  * Helper function for finding the comment this event pertains to.
  * @return {?(Blockly.WorkspaceComment | Blockly.ScratchBlockComment)}
  *     The comment this event pertains to, or null if it no longer exists.
  * @private
  */
  getComment_() {
    const workspace = this.getEventWorkspace_();
    return workspace.getCommentById(this.commentId);
  }
}
