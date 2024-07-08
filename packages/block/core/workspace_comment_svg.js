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
 * @fileoverview Object representing a code comment on a rendered workspace.
 * @author fenichel@google.com (Rachel Fenichel)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.WorkspaceCommentSvg');

import * as browserEvents from './browser_events';
import * as common from './common';
import * as eventUtils from './events/utils';
import {Ui} from './events/ui';
import * as utils from './utils';
import {WorkspaceComment} from './workspace_comment';

const asserts = goog.require('goog.asserts');
const dom = goog.require('goog.dom');
const Coordinate = goog.require('goog.math.Coordinate');


/**
 * Class for a workspace comment's SVG representation.
 * @extends {WorkspaceComment}
 */
export class WorkspaceCommentSvg extends WorkspaceComment {
  /**
   * @param {!Blockly.Workspace} workspace The block's workspace.
   * @param {string} content The content of this workspace comment.
   * @param {number} height Height of the comment.
   * @param {number} width Width of the comment.
   * @param {boolean} minimized Whether this comment is minimized.
   * @param {string=} opt_id Optional ID.  Use this ID if provided, otherwise
   *     create a new ID.
   */
  constructor(workspace, content, height, width, minimized, opt_id) {
    super(workspace, content, height, width, minimized, opt_id);
    // Create core elements for the block.
    /**
     * @type {SVGElement}
     * @private
     */
    this.svgGroup_ = utils.createSvgElement(
        'g', {}, null);
    this.svgGroup_.translate_ = '';

    this.svgRect_ = utils.createSvgElement(
        'rect',
        {
          'class': 'scratchCommentRect scratchWorkspaceCommentBorder',
          'x': 0,
          'y': 0,
          'rx': 4 * WorkspaceCommentSvg.BORDER_WIDTH,
          'ry': 4 * WorkspaceCommentSvg.BORDER_WIDTH
        });
    this.svgGroup_.appendChild(this.svgRect_);


    /**
     * Whether the comment is rendered onscreen and is a part of the DOM.
     * @type {boolean}
     * @private
     */
    this.rendered_ = false;

    /**
     * Whether to move the comment to the drag surface when it is dragged.
     * True if it should move, false if it should be translated directly.
     * @type {boolean}
     * @private
     */
    this.useDragSurface_ =
        utils.is3dSupported() && !!workspace.blockDragSurface_;

    this.render();
  }

  /**
   * Dispose of this comment.
   * @package
   */
  dispose() {
    if (!this.workspace) {
      // The comment has already been deleted.
      return;
    }
    // If this comment is being deleted, unlink the mouse events.
    if (common.getSelected() == this) {
      this.unselect();
      this.workspace.cancelCurrentGesture();
    }

    if (eventUtils.isEnabled()) {
      eventUtils.fire(new (eventUtils.get(eventUtils.COMMENT_DELETE))(this));
    }

    dom.removeNode(this.svgGroup_);
    // Sever JavaScript to DOM connections.
    this.svgGroup_ = null;
    this.svgRect_ = null;
    // Dispose of any rendered components
    this.disposeInternal_();

    eventUtils.disable();
    super.dispose();
    eventUtils.enable();
  }

  /**
   * Create and initialize the SVG representation of a workspace comment.
   * May be called more than once.
   * @package
   */
  initSvg() {
    asserts.assert(this.workspace.rendered, 'Workspace is headless.');
    if (!this.workspace.options.readOnly && !this.eventsInit_) {
      browserEvents.conditionalBind(
          this.svgRectTarget_, 'mousedown', this, this.pathMouseDown_);
      browserEvents.conditionalBind(
          this.svgHandleTarget_, 'mousedown', this, this.pathMouseDown_);
    }
    this.eventsInit_ = true;

    this.updateMovable();
    if (!this.getSvgRoot().parentNode) {
      this.workspace.getBubbleCanvas().appendChild(this.getSvgRoot());
    }
  }

  /**
   * Handle a mouse-down on an SVG comment.
   * @param {!Event} e Mouse down event or touch start event.
   * @private
   */
  pathMouseDown_(e) {
    const gesture = this.workspace.getGesture(e);
    if (gesture) {
      gesture.handleBubbleStart(e, this);
    }
  }

  /**
   * Show the context menu for this workspace comment.
   * @param {!Event} e Mouse event.
   * @private
   */
  showContextMenu_(e) {
    throw new Error(
        'The implementation of showContextMenu should be ' +
        'monkey-patched in by blockly.js');
  }

  /**
   * Select this comment.  Highlight it visually.
   * @package
   */
  select() {
    if (common.getSelected() == this) {
      return;
    }
    let oldId = null;
    if (common.getSelected()) {
      oldId = common.getSelected().id;
      // Unselect any previously selected block or comment.
      eventUtils.disable();
      try {
        common.getSelected().unselect();
      } finally {
        eventUtils.enable();
      }
    }
    const event = new Ui(null, 'selected', oldId, this.id);
    event.workspaceId = this.workspace.id;
    eventUtils.fire(event);
    common.setSelected(this);
    this.addSelect();
  }

  /**
   * Unselect this comment.  Remove its highlighting.
   * @package
   */
  unselect() {
    if (common.getSelected() != this) {
      return;
    }
    const event = new Ui(null, 'selected', this.id, null);
    event.workspaceId = this.workspace.id;
    eventUtils.fire(event);
    common.setSelected(null);
    this.removeSelect();
  }

  /**
   * Select this comment.  Highlight it visually.
   * @package
   */
  addSelect() {
    utils.addClass(
        /** @type {!Element} */ (this.svgGroup_), 'blocklySelected');
    this.setFocus();
  }

  /**
   * Unselect this comment.  Remove its highlighting.
   * @package
   */
  removeSelect() {
    utils.removeClass(
        /** @type {!Element} */ (this.svgGroup_), 'blocklySelected');
    this.blurFocus();
  }

  /**
   * Focus this comment.  Highlight it visually.
   * @package
   */
  addFocus() {
    utils.addClass(
        /** @type {!Element} */ (this.svgGroup_), 'blocklyFocused');
  }

  /**
   * Unfocus this comment.  Remove its highlighting.
   * @package
   */
  removeFocus() {
    utils.removeClass(
        /** @type {!Element} */ (this.svgGroup_), 'blocklyFocused');
  }

  /**
   * Return the coordinates of the top-left corner of this comment relative to the
   * drawing surface's origin (0,0), in workspace units.
   * If the comment is on the workspace, (0, 0) is the origin of the workspace
   * coordinate system.
   * This does not change with workspace scale.
   * @return {!Coordinate} Object with .x and .y properties in
   *     workspace coordinates.
   * @package
   */
  getRelativeToSurfaceXY() {
    let x = 0;
    let y = 0;

    const dragSurfaceGroup = this.useDragSurface_ ?
        this.workspace.blockDragSurface_.getGroup() : null;

    let element = this.getSvgRoot();
    if (element) {
      do {
        // Loop through this comment and every parent.
        const xy = utils.getRelativeXY(element);
        x += xy.x;
        y += xy.y;
        // If this element is the current element on the drag surface, include
        // the translation of the drag surface itself.
        if (this.useDragSurface_ &&
            this.workspace.blockDragSurface_.getCurrentBlock() == element) {
          const surfaceTranslation =
              this.workspace.blockDragSurface_.getSurfaceTranslation();
          x += surfaceTranslation.x;
          y += surfaceTranslation.y;
        }
        element = element.parentNode;
      } while (element && element != this.workspace.getBubbleCanvas() &&
          element != dragSurfaceGroup);
    }
    this.xy_ = new Coordinate(x, y);
    return this.xy_;
  }

  /**
   * Move a comment by a relative offset.
   * @param {number} dx Horizontal offset, in workspace units.
   * @param {number} dy Vertical offset, in workspace units.
   * @package
   */
  moveBy(dx, dy) {
    const event = new (eventUtils.get(eventUtils.COMMENT_MOVE))(this);
    // TODO: Do I need to look up the relative to surface XY position here?
    const xy = this.getRelativeToSurfaceXY();
    this.translate(xy.x + dx, xy.y + dy);
    event.recordNew();
    eventUtils.fire(event);
    this.workspace.resizeContents();
  }

  /**
   * Transforms a comment by setting the translation on the transform attribute
   * of the block's SVG.
   * @param {number} x The x coordinate of the translation in workspace units.
   * @param {number} y The y coordinate of the translation in workspace units.
   * @package
   */
  translate(x, y) {
    this.xy_ = new Coordinate(x, y);
    this.getSvgRoot().setAttribute('transform',
        'translate(' + x + ',' + y + ')');
  }

  /**
   * Move this comment to its workspace's drag surface, accounting for positioning.
   * Generally should be called at the same time as setDragging(true).
   * Does nothing if useDragSurface_ is false.
   * @private
   */
  moveToDragSurface_() {
    if (!this.useDragSurface_) {
      return;
    }
    // The translation for drag surface blocks,
    // is equal to the current relative-to-surface position,
    // to keep the position in sync as it move on/off the surface.
    // This is in workspace coordinates.
    const xy = this.getRelativeToSurfaceXY();
    this.clearTransformAttributes_();
    this.workspace.blockDragSurface_.translateSurface(xy.x, xy.y);
    // Execute the move on the top-level SVG component
    this.workspace.blockDragSurface_.setBlocksAndShow(this.getSvgRoot());
  }

  /**
   * Move this comment back to the workspace block canvas.
   * Generally should be called at the same time as setDragging(false).
   * Does nothing if useDragSurface_ is false.
   * @param {!Coordinate} newXY The position the comment should take on
   *     on the workspace canvas, in workspace coordinates.
   * @private
   */
  moveOffDragSurface_(newXY) {
    if (!this.useDragSurface_) {
      return;
    }
    // Translate to current position, turning off 3d.
    this.translate(newXY.x, newXY.y);
    this.workspace.blockDragSurface_.clearAndHide(this.workspace.getCanvas());
  }

  /**
   * Move this comment during a drag, taking into account whether we are using a
   * drag surface to translate blocks.
   * @param {?Blockly.BlockDragSurfaceSvg} dragSurface The surface that carries
   *     rendered items during a drag, or null if no drag surface is in use.
   * @param {!Coordinate} newLoc The location to translate to, in
   *     workspace coordinates.
   * @package
   */
  moveDuringDrag(dragSurface, newLoc) {
    if (dragSurface) {
      dragSurface.translateSurface(newLoc.x, newLoc.y);
    } else {
      this.svgGroup_.translate_ = 'translate(' + newLoc.x + ',' + newLoc.y + ')';
      this.svgGroup_.setAttribute('transform',
          this.svgGroup_.translate_ + this.svgGroup_.skew_);
    }
  }

  /**
   * Move the bubble group to the specified location in workspace coordinates.
   * @param {number} x The x position to move to.
   * @param {number} y The y position to move to.
   * @package
   */
  moveTo(x, y) {
    this.translate(x, y);
  }

  /**
   * Clear the comment of transform="..." attributes.
   * Used when the comment is switching from 3d to 2d transform or vice versa.
   * @private
   */
  clearTransformAttributes_() {
    utils.removeAttribute(this.getSvgRoot(), 'transform');
  }

  /**
   * Return the rendered size of the comment or the stored size if the comment is
   * not rendered. This differs from getHeightWidth in the behavior of rendered
   * minimized comments. This function reports the actual size of the minimized
   * comment instead of the full sized comment height/width.
   * @return {!{height: number, width: number}} Object with height and width
   *    properties in workspace units.
   * @package
   */
  getBubbleSize() {
    if (this.rendered_) {
      return {
        width: parseInt(this.svgRect_.getAttribute('width')),
        height: parseInt(this.svgRect_.getAttribute('height'))
      };
    } else {
      this.getHeightWidth();
    }
  }

  /**
   * Returns the coordinates of a bounding box describing the dimensions of this
   * comment.
   * Coordinate system: workspace coordinates.
   * @return {!{topLeft: Coordinate, bottomRight: Coordinate}}
   *    Object with top left and bottom right coordinates of the bounding box.
   * @package
   */
  getBoundingRectangle() {
    const blockXY = this.getRelativeToSurfaceXY();
    const commentBounds = this.getHeightWidth();
    let topLeft;
    let bottomRight;
    if (this.RTL) {
      topLeft = new Coordinate(blockXY.x - (commentBounds.width),
          blockXY.y);
      // Add the width of the tab/puzzle piece knob to the x coordinate
      // since X is the corner of the rectangle, not the whole puzzle piece.
      bottomRight = new Coordinate(blockXY.x,
          blockXY.y + commentBounds.height);
    } else {
      // Subtract the width of the tab/puzzle piece knob to the x coordinate
      // since X is the corner of the rectangle, not the whole puzzle piece.
      topLeft = new Coordinate(blockXY.x, blockXY.y);
      bottomRight = new Coordinate(blockXY.x + commentBounds.width,
          blockXY.y + commentBounds.height);
    }
    return {topLeft: topLeft, bottomRight: bottomRight};
  }

  /**
   * Add or remove the UI indicating if this comment is movable or not.
   * @package
   */
  updateMovable() {
    if (this.isMovable()) {
      utils.addClass(
          /** @type {!Element} */ (this.svgGroup_), 'blocklyDraggable');
    } else {
      utils.removeClass(
          /** @type {!Element} */ (this.svgGroup_), 'blocklyDraggable');
    }
  }

  /**
   * Set whether this comment is movable or not.
   * @param {boolean} movable True if movable.
   * @package
   */
  setMovable(movable) {
    super.setMovable( movable);
    this.updateMovable();
  }

  /**
   * Recursively adds or removes the dragging class to this node and its children.
   * @param {boolean} adding True if adding, false if removing.
   * @package
   */
  setDragging(adding) {
    if (adding) {
      const group = this.getSvgRoot();
      group.translate_ = '';
      group.skew_ = '';
      utils.addClass(
          /** @type {!Element} */ (this.svgGroup_), 'blocklyDragging');
    } else {
      utils.removeClass(
          /** @type {!Element} */ (this.svgGroup_), 'blocklyDragging');
    }
  }

  /**
   * Return the root node of the SVG or null if none exists.
   * @return {Element} The root SVG node (probably a group).
   * @package
   */
  getSvgRoot() {
    return this.svgGroup_;
  }

  /**
   * Returns this comment's text.
   * @return {string} Comment text.
   * @package
   */
  getText() {
    return this.textarea_ ? this.textarea_.value : this.content_;
  }

  /**
   * Set this comment's text.
   * @param {string} text Comment text.
   * @package
   */
  setText(text) {
    super.setText( text);
    if (this.textarea_) {
      this.textarea_.value = text;
    }
  }

  /**
   * Update the cursor over this comment by adding or removing a class.
   * @param {boolean} enable True if the delete cursor should be shown, false
   *     otherwise.
   * @package
   */
  setDeleteStyle(enable) {
    if (enable) {
      utils.addClass(
          /** @type {!Element} */ (this.svgGroup_), 'blocklyDraggingDelete');
    } else {
      utils.removeClass(
          /** @type {!Element} */ (this.svgGroup_), 'blocklyDraggingDelete');
    }
  }

  setAutoLayout() {
    // NOP for compatibility with the bubble dragger.
  }

  /**
   * Decode an XML comment tag and create a rendered comment on the workspace.
   * @param {!Element} xmlComment XML comment element.
   * @param {!Blockly.Workspace} workspace The workspace.
   * @param {number=} opt_wsWidth The width of the workspace, which is used to
   *     position comments correctly in RTL.
   * @return {!WorkspaceCommentSvg} The created workspace comment.
   * @package
   */
  static fromXml(xmlComment, workspace, opt_wsWidth) {
    eventUtils.disable();
    let comment;
    try {
      const info = WorkspaceComment.parseAttributes(xmlComment);

      comment = new WorkspaceCommentSvg(workspace,
          info.content, info.h, info.w, info.minimized, info.id);
      if (workspace.rendered) {
        comment.initSvg();
        comment.render(false);
      }
      // Position the comment correctly, taking into account the width of a
      // rendered RTL workspace.
      if (!isNaN(info.x) && !isNaN(info.y)) {
        if (workspace.RTL) {
          const wsWidth = opt_wsWidth || workspace.getWidth();
          comment.moveBy(wsWidth - info.x, info.y);
        } else {
          comment.moveBy(info.x, info.y);
        }
      }
    } finally {
      eventUtils.enable();
    }
    WorkspaceComment.fireCreateEvent(comment);

    return comment;
  }

  /**
   * Encode a comment subtree as XML with XY coordinates.
   * @param {boolean=} opt_noId True if the encoder should skip the comment id.
   * @return {!Element} Tree of XML elements.
   * @package
   */
  toXmlWithXY(opt_noId) {
    let width;  // Not used in LTR.
    if (this.workspace.RTL) {
      // Here be performance dragons: This calls getMetrics().
      width = this.workspace.getWidth();
    }
    const element = this.toXml(opt_noId);
    const xy = this.getRelativeToSurfaceXY();
    element.setAttribute('x',
        Math.round(this.workspace.RTL ? width - xy.x : xy.x));
    element.setAttribute('y', Math.round(xy.y));
    element.setAttribute('h', this.getHeight());
    element.setAttribute('w', this.getWidth());
    return element;
  }
}



/**
 * The width and height to use to size a workspace comment when it is first
 * added, before it has been edited by the user.
 * @type {number}
 * @package
 */
WorkspaceCommentSvg.DEFAULT_SIZE = 200;
