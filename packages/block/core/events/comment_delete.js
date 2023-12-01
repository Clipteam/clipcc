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
goog.declareModuleId('Blockly.Events.CommentDelete');

import * as eventUtils from './utils';
import {CommentBase} from './comment_base';
import * as Xml from '../xml';

const dom = goog.require('goog.dom');


/**
 * Class for a comment deletion event.
 * @param {Blockly.WorkspaceComment | Blockly.ScratchBlockComment} comment
 *     The deleted comment. Null for a blank event.
 * @extends {CommentBase}
 * @constructor
 */
export const CommentDelete = function(comment) {
  if (!comment) {
    return;  // Blank event to be populated by fromJson.
  }
  CommentDelete.superClass_.constructor.call(this, comment);
  this.xy = comment.getXY();
  this.minimized = comment.isMinimized() || false;
  this.text = comment.getText();
  const hw = comment.getHeightWidth();
  this.height = hw.height;
  this.width = hw.width;

  this.xml = comment.toXmlWithXY();
};
goog.inherits(CommentDelete, CommentBase);

/**
 * Type of this event.
 * @type {string}
 */
CommentDelete.prototype.type = eventUtils.COMMENT_DELETE;

/**
 * Encode the event as JSON.
 * TODO (github.com/google/blockly/issues/1266): "Full" and "minimal"
 * serialization.
 * @return {!Object} JSON representation.
 */
CommentDelete.prototype.toJson = function() {
  const json = CommentDelete.superClass_.toJson.call(this);
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
CommentDelete.prototype.fromJson = function(json) {
  CommentDelete.superClass_.fromJson.call(this, json);
};

/**
 * Run a creation event.
 * @param {boolean} forward True if run forward, false if run backward (undo).
 */
CommentDelete.prototype.run = function(forward) {
  if (forward) {
    const comment = this.getComment_();
    if (comment) {
      comment.dispose(false, false);
    } else {
      // Only complain about root-level block.
      console.warn("Can't delete non-existent comment: " + this.commentId);
    }
  } else {
    const workspace = this.getEventWorkspace_();
    if (this.blockId) {
      const block = workspace.getBlockById(this.blockId);
      block.setCommentText(this.text, this.commentId, this.xy.x, this.xy.y, this.minimized);
      block.comment.setSize(this.width, this.height);
    } else {
      const xml = dom.createDom('xml');
      xml.appendChild(this.xml);
      Xml.domToWorkspace(xml, workspace);
    }
  }
};

eventUtils.register(eventUtils.COMMENT_DELETE, CommentDelete);
