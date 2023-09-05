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
goog.declareModuleId('Blockly.Events.CommentMove');

import * as Events from './events';
import {CommentBase} from './comment_base';
import {ScratchBlockComment} from '../scratch_block_comment';

const Coordinate = goog.require('goog.math.Coordinate');


/**
 * Class for a comment move event.  Created before the move.
 * @param {Blockly.WorkspaceComment | ScratchBlockComment} comment
 *     The comment that is being moved. Null for a blank event.
 * @extends {CommentBase}
 * @constructor
 */
export const CommentMove = function(comment) {
  if (!comment) {
    return;  // Blank event to be populated by fromJson.
  }
  CommentMove.superClass_.constructor.call(this, comment);

  /**
   * The comment that is being moved.  Will be cleared after recording the new
   * location.
   * @type {?Blockly.WorkspaceComment | ScratchBlockComment}
   */
  this.comment_ = comment;

  this.workspaceWidth_ = comment.workspace.getWidth();
  /**
   * The location before the move, in workspace coordinates.
   * @type {!Coordinate}
   */
  this.oldCoordinate_ = this.currentLocation_();

  /**
   * The location after the move, in workspace coordinates.
   * @type {!Coordinate}
   */
  this.newCoordinate_ = null;
};
goog.inherits(CommentMove, CommentBase);

/**
 * Calculate the current, language agnostic location of the comment.
 * This value should not report different numbers in LTR vs. RTL.
 * @return {Coordinate} The location of the comment.
 * @private
 */
CommentMove.prototype.currentLocation_ = function() {
  const xy = this.comment_.getXY();
  if (!this.comment_.workspace.RTL) {
    return xy;
  }

  let rtlAwareX;
  if (this.comment_ instanceof ScratchBlockComment) {
    const commentWidth = this.comment_.getBubbleSize().width;
    rtlAwareX = this.workspaceWidth_ - xy.x - commentWidth;
  } else {
    rtlAwareX = this.workspaceWidth_ - xy.x;
  }
  return new Coordinate(rtlAwareX, xy.y);
};

/**
 * Record the comment's new location.  Called after the move.  Can only be
 * called once.
 */
CommentMove.prototype.recordNew = function() {
  if (!this.comment_) {
    throw new Error('Tried to record the new position of a comment on the ' +
        'same event twice.');
  }
  this.newCoordinate_ = this.currentLocation_();
  this.comment_ = null;
};

/**
 * Type of this event.
 * @type {string}
 */
CommentMove.prototype.type = Events.COMMENT_MOVE;

/**
 * Override the location before the move.  Use this if you don't create the
 * event until the end of the move, but you know the original location.
 * @param {!Coordinate} xy The location before the move, in workspace
 *     coordinates.
 */
CommentMove.prototype.setOldCoordinate = function(xy) {
  this.oldCoordinate_ = new Coordinate(this.comment_.workspace.RTL ?
      this.workspaceWidth_ - xy.x : xy.x, xy.y);
};

/**
 * Encode the event as JSON.
 * TODO (github.com/google/blockly/issues/1266): "Full" and "minimal"
 * serialization.
 * @return {!Object} JSON representation.
 */
CommentMove.prototype.toJson = function() {
  const json = CommentMove.superClass_.toJson.call(this);
  if (this.newCoordinate_) {
    json['newCoordinate'] = Math.round(this.newCoordinate_.x) + ',' +
        Math.round(this.newCoordinate_.y);
  }
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
CommentMove.prototype.fromJson = function(json) {
  CommentMove.superClass_.fromJson.call(this, json);

  if (json['newCoordinate']) {
    const xy = json['newCoordinate'].split(',');
    this.newCoordinate_ =
        new Coordinate(parseFloat(xy[0]), parseFloat(xy[1]));
  }
};

/**
 * Does this event record any change of state?
 * @return {boolean} False if something changed.
 */
CommentMove.prototype.isNull = function() {
  return Coordinate.equals(this.oldCoordinate_, this.newCoordinate_);
};

/**
 * Run a move event.
 * @param {boolean} forward True if run forward, false if run backward (undo).
 */
CommentMove.prototype.run = function(forward) {
  const comment = this.getComment_();
  if (!comment) {
    console.warn('Can\'t move non-existent comment: ' + this.commentId);
    return;
  }

  const target = forward ? this.newCoordinate_ : this.oldCoordinate_;

  if (comment instanceof ScratchBlockComment) {
    if (comment.workspace.RTL) {
      comment.moveTo(this.workspaceWidth_ - target.x, target.y);
    } else {
      comment.moveTo(target.x, target.y);
    }
  } else {
    // TODO: Check if the comment is being dragged, and give up if so.
    const current = comment.getXY();
    if (comment.workspace.RTL) {
      const deltaX = target.x - (this.workspaceWidth_ - current.x);
      comment.moveBy(-deltaX, target.y - current.y);
    } else {
      comment.moveBy(target.x - current.x, target.y - current.y);
    }

  }
};

Events.register(Events.COMMENT_MOVE, CommentMove);
