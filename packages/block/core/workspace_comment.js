/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2017 Google Inc.
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
 * @fileoverview Object representing a code comment on the workspace.
 * @author fenichel@google.com (Rachel Fenichel)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.WorkspaceComment');

import * as eventUtils from './events/utils';
import * as utils from './utils';

const dom = goog.require('goog.dom');
const Coordinate = goog.require('goog.math.Coordinate');


/**
 * Class for a workspace comment.
 * @param {!Blockly.Workspace} workspace The block's workspace.
 * @param {string} content The content of this workspace comment.
 * @param {number} height Height of the comment.
 * @param {number} width Width of the comment.
 * @param {boolean} minimized Whether this comment is in the minimized state
 * @param {string=} opt_id Optional ID.  Use this ID if provided, otherwise
 *     create a new ID.  If the ID conflicts with an in-use ID, a new one will
 *     be generated.
 * @constructor
 */
export const WorkspaceComment = function(workspace, content, height, width, minimized, opt_id) {
  /** @type {string} */
  this.id = (opt_id && !workspace.getCommentById(opt_id)) ?
      opt_id : utils.genUid();

  workspace.addTopComment(this);

  /**
   * The comment's position in workspace units.  (0, 0) is at the workspace's
   * origin; scale does not change this value.
   * @type {!Coordinate}
   * @protected
   */
  this.xy_ = new Coordinate(0, 0);

  /**
   * The comment's height in workspace units.  Scale does not change this value.
   * @type {number}
   * @private
   */
  this.height_ = height;

  /**
   * The comment's width in workspace units.  Scale does not change this value.
   * @type {number}
   * @private
   */
  this.width_ = width;

  /**
   * The comment's minimized state.
   * @type{boolean}
   * @private
   */
  this.isMinimized_ = minimized;

  /**
   * @type {!Blockly.Workspace}
   */
  this.workspace = workspace;

  /**
   * @protected
   * @type {boolean}
   */
  this.RTL = workspace.RTL;

  /**
   * @type {boolean}
   * @private
   */
  this.deletable_ = true;

  /**
   * @type {boolean}
   * @private
   */
  this.movable_ = true;

  /**
   * @protected
   * @type {!string}
   */
  this.content_ = content;

  /**
   * @package
   * @type {boolean}
   */
  this.isComment = true;

  WorkspaceComment.fireCreateEvent(this);
};

/**
 * Maximum lable length (actual label length will include
 * one additional character, the ellipsis).
 * @private
 */
WorkspaceComment.MAX_LABEL_LENGTH = 12;

/**
 * Maximum character length for comment text.
 * @private
 */
WorkspaceComment.COMMENT_TEXT_LIMIT = 8000;

/**
 * Dispose of this comment.
 * @package
 */
WorkspaceComment.prototype.dispose = function() {
  if (!this.workspace) {
    // The comment has already been deleted.
    return;
  }

  if (eventUtils.isEnabled()) {
    eventUtils.fire(new (eventUtils.get(eventUtils.COMMENT_DELETE))(this));
  }

  // Remove from the list of top comments and the comment database.
  this.workspace.removeTopComment(this);
  this.workspace = null;
};

// Height, width, x, and y are all stored on even non-rendered comments, to
// preserve state if you pass the contents through a headless workspace.

/**
 * Get comment height.
 * @return {number} comment height.
 * @package
 */
WorkspaceComment.prototype.getHeight = function() {
  return this.height_;
};

/**
 * Set comment height.
 * @param {number} height comment height.
 * @package
 */
WorkspaceComment.prototype.setHeight = function(height) {
  this.height_ = height;
};

/**
 * Get comment width.
 * @return {number} comment width.
 * @package
 */
WorkspaceComment.prototype.getWidth = function() {
  return this.width_;
};

/**
 * Set comment width.
 * @param {number} width comment width.
 * @package
 */
WorkspaceComment.prototype.setWidth = function(width) {
  this.width_ = width;
};

/**
 * Get the height and width of this comment.
 * @return {{height: number, width: number}} The height and width of this comment;
 *     these numbers do not change as the workspace scales.
 */
WorkspaceComment.prototype.getHeightWidth = function() {
  return {height: this.height_, width: this.width_};
};

/**
 * Get stored location.
 * @return {!Coordinate} The comment's stored location.  This is not
 *     valid if the comment is currently being dragged.
 * @package
 */
WorkspaceComment.prototype.getXY = function() {
  return this.xy_.clone();
};

/**
 * Move a comment by a relative offset.
 * @param {number} dx Horizontal offset, in workspace units.
 * @param {number} dy Vertical offset, in workspace units.
 * @package
 */
WorkspaceComment.prototype.moveBy = function(dx, dy) {
  const event = new (eventUtils.get(eventUtils.COMMENT_MOVE))(this);
  this.xy_.translate(dx, dy);
  event.recordNew();
  eventUtils.fire(event);
};

/**
 * Get whether this comment is deletable or not.
 * @return {boolean} True if deletable.
 * @package
 */
WorkspaceComment.prototype.isDeletable = function() {
  return this.deletable_ &&
      !(this.workspace && this.workspace.options.readOnly);
};

/**
 * Set whether this comment is deletable or not.
 * @param {boolean} deletable True if deletable.
 * @package
 */
WorkspaceComment.prototype.setDeletable = function(deletable) {
  this.deletable_ = deletable;
};

/**
 * Get whether this comment is movable or not.
 * @return {boolean} True if movable.
 * @package
 */
WorkspaceComment.prototype.isMovable = function() {
  return this.movable_ &&
      !(this.workspace && this.workspace.options.readOnly);
};

/**
 * Set whether this comment is movable or not.
 * @param {boolean} movable True if movable.
 * @package
 */
WorkspaceComment.prototype.setMovable = function(movable) {
  this.movable_ = movable;
};

/**
 * Returns this comment's text.
 * @return {string} Comment text.
 * @package
 */
WorkspaceComment.prototype.getText = function() {
  return this.content_;
};

/**
 * Set this comment's text content.
 * @param {string} text Comment text.
 * @package
 */
WorkspaceComment.prototype.setText = function(text) {
  if (this.content_ != text) {
    eventUtils.fire(new (eventUtils.get(eventUtils.COMMENT_CHANGE))(
        this, {text: this.content_}, {text: text}));
    this.content_ = text;
  }
};

/**
 * Check whether this comment is currently minimized.
 * @return {boolean} True if minimized
 * @package
 */
WorkspaceComment.prototype.isMinimized = function() {
  return this.isMinimized_;
};

/**
 * Encode a comment state as JSON.
 * @return {!Object} The comment state in JSON.
 * @package
 */
WorkspaceComment.prototype.toState = function() {
  const state = {
    id: this.id,
    content: this.getText(),
  };
  if (this.isMinimized_)  {
    state.minimized = true;
  }

  return state;
};

/**
 * Encode a comment state as JSON with XY coordinates.
 * @return {!Object} The comment state in JSON.
 * @package
 */
WorkspaceComment.prototype.toStateWithXY = function() {
  const commentState = this.toState();
  commentState.x = Math.round(this.xy_.x);
  commentState.y =  Math.round(this.xy_.y);
  commentState.h = this.height_;
  commentState.w = this.width_;
  return commentState;
};

/**
 * Encode a comment subtree as XML with XY coordinates.
 * @param {boolean=} opt_noId True if the encoder should skip the comment id.
* @return {!Element} Tree of XML elements.
 * @package
  */
WorkspaceComment.prototype.toXmlWithXY = function(opt_noId) {
  const element = this.toXml(opt_noId);
  element.setAttribute('x', Math.round(this.xy_.x));
  element.setAttribute('y', Math.round(this.xy_.y));
  element.setAttribute('h', this.height_);
  element.setAttribute('w', this.width_);
  return element;
};

/**
 * Get the truncated text for this comment to display in the minimized
 * top bar.
 * @return {string} The truncated comment text
 * @package
 */
WorkspaceComment.prototype.getLabelText = function() {
  if (this.content_.length > WorkspaceComment.MAX_LABEL_LENGTH) {
    if (this.RTL) {
      return '\u2026' + this.content_.slice(0, WorkspaceComment.MAX_LABEL_LENGTH);
    }
    return this.content_.slice(0, WorkspaceComment.MAX_LABEL_LENGTH) + '\u2026';
  } else {
    return this.content_;
  }
};

/**
 * Fire a create event for the given workspace comment, if comments are enabled.
 * @param {!WorkspaceComment} comment The comment that was just created.
 * @package
 */
WorkspaceComment.fireCreateEvent = function(comment) {
  if (eventUtils.isEnabled()) {
    const existingGroup = eventUtils.getGroup();
    if (!existingGroup) {
      eventUtils.setGroup(true);
    }
    try {
      eventUtils.fire(new (eventUtils.get(eventUtils.COMMENT_CREATE))(comment));
    } finally {
      if (!existingGroup) {
        eventUtils.setGroup(false);
      }
    }
  }
};

/**
 * Decode an XML comment tag and create a comment on the workspace.
 * @param {!Element} xmlComment XML comment element.
 * @param {!Blockly.Workspace} workspace The workspace.
 * @return {!WorkspaceComment} The created workspace comment.
 * @package
 */
WorkspaceComment.fromXml = function(xmlComment, workspace) {
  const info = WorkspaceComment.parseAttributes(xmlComment);

  const comment = new WorkspaceComment(
      workspace, info.content, info.h, info.w, info.minimized, info.id);

  if (!isNaN(info.x) && !isNaN(info.y)) {
    comment.moveBy(info.x, info.y);
  }

  WorkspaceComment.fireCreateEvent(comment);
  return comment;
};

/**
 * Decode an XML comment tag and return the results in an object.
 * @param {!Element} xml XML comment element.
 * @return {!Object} An object containing the information about the comment.
 * @package
 */
WorkspaceComment.parseAttributes = function(xml) {
  const xmlH = xml.getAttribute('h');
  const xmlW = xml.getAttribute('w');

  return {
    /* @type {string} */
    id: xml.getAttribute('id'),
    /**
     * The height of the comment in workspace units, or 100 if not specified.
     * @type {number}
     */
    h: xmlH ? parseInt(xmlH, 10) : 100,
    /**
     * The width of the comment in workspace units, or 100 if not specified.
     * @type {number}
     */
    w: xmlW ? parseInt(xmlW, 10) : 100,
    /**
     * The x position of the comment in workspace coordinates, or NaN if not
     * specified in the XML.
     * @type {number}
     */
    x: parseInt(xml.getAttribute('x'), 10),
    /**
     * The y position of the comment in workspace coordinates, or NaN if not
     * specified in the XML.
     * @type {number}
     */
    y: parseInt(xml.getAttribute('y'), 10),
    /**
     * Whether this comment is minimized. Defaults to false if not specified in
     * the XML.
     * @type {boolean}
     */
    minimized: xml.getAttribute('minimized') == 'true' || false,
    /* @type {string} */
    content: xml.textContent
  };
};
