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
goog.declareModuleId('Blockly.Events.CommentCreate');

import * as Events from './events';
import {CommentBase} from './comment_base';
import * as Xml from '../xml';

const dom = goog.require('goog.dom');


/**
 * Class for a comment creation event.
 * @param {Blockly.WorkspaceComment | Blockly.ScratchBlockComment} comment
 *     The created comment. Null for a blank event.
 * @param {string=} opt_blockId Optional id for the block this comment belongs
 *     to, if it is a block comment.
 * @extends {CommentBase}
 * @constructor
 */
export const CommentCreate = function(comment) {
  if (!comment) {
    return;  // Blank event to be populated by fromJson.
  }
  CommentCreate.superClass_.constructor.call(this, comment);

  /**
   * The text content of this comment.
   * @type {string}
   */
  this.text = comment.getText();

  /**
   * The XY position of this comment on the workspace.
   * @type {goog.math.Coordinate}
   */
  this.xy = comment.getXY();

  const hw = comment.getHeightWidth();

  /**
   * The width of this comment when it is full size.
   * @type {number}
   */
  this.width = hw.width;

  /**
   * The height of this comment when it is full size.
   * @type {number}
   */
  this.height = hw.height;

  /**
   * Whether or not this comment is minimized.
   * @type {boolean}
   */
  this.minimized = comment.isMinimized() || false;

  this.xml = comment.toXmlWithXY();
};
goog.inherits(CommentCreate, CommentBase);

/**
 * Type of this event.
 * @type {string}
 */
CommentCreate.prototype.type = Events.COMMENT_CREATE;

/**
 * Encode the event as JSON.
 * TODO (github.com/google/blockly/issues/1266): "Full" and "minimal"
 * serialization.
 * @return {!Object} JSON representation.
 */
CommentCreate.prototype.toJson = function() {
  const json = CommentCreate.superClass_.toJson.call(this);
  json['xml'] = Xml.domToText(this.xml);
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
CommentCreate.prototype.fromJson = function(json) {
  CommentCreate.superClass_.fromJson.call(this, json);
  this.xml = Xml.textToDom('<xml>' + json['xml'] + '</xml>').firstChild;
};

/**
 * Run a creation event.
 * @param {boolean} forward True if run forward, false if run backward (undo).
 */
CommentCreate.prototype.run = function(forward) {
  if (forward) {
    const workspace = this.getEventWorkspace_();
    if (this.blockId) {
      const block = workspace.getBlockById(this.blockId);
      if (block) {
        block.setCommentText('', this.commentId, this.xy.x, this.xy.y, this.minimized);
      }
    } else {
      const xml = dom.createDom('xml');
      xml.appendChild(this.xml);
      Xml.domToWorkspace(xml, workspace);
    }
  } else {
    const comment = this.getComment_();
    if (comment) {
      comment.dispose(false, false);
    } else {
      // Only complain about root-level block.
      console.warn("Can't uncreate non-existent comment: " + this.commentId);
    }
  }
};

Events.register(Events.COMMENT_CREATE, CommentCreate);
