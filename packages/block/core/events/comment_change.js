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
goog.declareModuleId('Blockly.Events.CommentChange');

import * as eventUtils from './utils';
import {CommentBase} from './comment_base';

/**
 * Class for a comment change event.
 * @extends {CommentBase}
 */
export class CommentChange extends CommentBase {
  /**
   * @param {Blockly.WorkspaceComment | Blockly.ScratchBlockComment} comment
   *     The comment that is being changed. Null for a blank event.
   * @param {!object} oldContents Object containing previous state of a comment's
   *     properties. The possible properties can be: 'minimized', 'text', or
   *     'width' and 'height' together. Must contain the same property (or in the
   *     case of 'width' and 'height' properties) as the 'newContents' param.
   * @param {!object} newContents Object containing the new state of a comment's
   *     properties. The possible properties can be: 'minimized', 'text', or
   *     'width' and 'height' together. Must contain the same property (or in the
   *     case of 'width' and 'height' properties) as the 'oldContents' param.
   */
  constructor(comment, oldContents, newContents) {
    super(comment);

    /**
     * Type of this event.
     * @type {string}
     */
    this.type = eventUtils.COMMENT_CHANGE;

    this.oldContents_ = oldContents;
    this.newContents_ = newContents;
  }

  /**
   * Encode the event as JSON.
   * @return {!Object} JSON representation.
   */
  toJson() {
    const json = super.toJson();
    json['newContents'] = this.newContents_;
    return json;
  }

  /**
   * Decode the JSON event.
   * @param {!Object} json JSON representation.
   */
  fromJson(json) {
    super.fromJson(json);
    this.newContents_ = json['newValue'];
  }

  /**
   * Does this event record any change of state?
   * @return {boolean} False if something changed.
   */
  isNull() {
    return this.oldContents_ == this.newContents_;
  }

  /**
   * Run a change event.
   * @param {boolean} forward True if run forward, false if run backward (undo).
   */
  run(forward) {
    const comment = this.getComment_();
    if (!comment) {
      console.warn('Can\'t change non-existent comment: ' + this.commentId);
      return;
    }
    const contents = forward ? this.newContents_ : this.oldContents_;

    if (Object.prototype.hasOwnProperty.call(contents, 'minimized')) {
      comment.setMinimized(contents.minimized);
    }
    if (Object.prototype.hasOwnProperty.call(contents, 'width') &&
        Object.prototype.hasOwnProperty.call(contents, 'height')) {
      comment.setSize(contents.width, contents.height);
    }
    if (Object.prototype.hasOwnProperty.call(contents, 'text')) {
      comment.setText(contents.text);
    }
  }
}

eventUtils.register(eventUtils.COMMENT_CHANGE, CommentChange);
