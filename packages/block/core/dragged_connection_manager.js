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
 * @fileoverview Class that controls updates to connections during drags.
 * @author fenichel@google.com (Rachel Fenichel)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.DraggedConnectionManager');

import * as BlockAnimations from './block_animations';
import * as common from './common';
import * as constants from './constants';


/**
 * Class that controls updates to connections during drags.  It is primarily
 * responsible for finding the closest eligible connection and highlighting or
 * unhiglighting it as needed during a drag.
 * @param {!Blockly.BlockSvg} block The top block in the stack being dragged.
 * @constructor
 */
export const DraggedConnectionManager = function(block) {
  common.setSelected(block);

  /**
   * The top block in the stack being dragged.
   * Does not change during a drag.
   * @type {!Blockly.Block}
   * @private
   */
  this.topBlock_ = block;

  /**
   * The workspace on which these connections are being dragged.
   * Does not change during a drag.
   * @type {!Blockly.WorkspaceSvg}
   * @private
   */
  this.workspace_ = block.workspace;

  /**
   * The connections on the dragging blocks that are available to connect to
   * other blocks.  This includes all open connections on the top block, as well
   * as the last connection on the block stack.
   * Does not change during a drag.
   * @type {!Array.<!Blockly.RenderedConnection>}
   * @private
   */
  this.availableConnections_ = this.initAvailableConnections_();

  /**
   * The connection that this block would connect to if released immediately.
   * Updated on every mouse move.
   * @type {Blockly.RenderedConnection}
   * @private
   */
  this.closestConnection_ = null;

  /**
   * The connection that would connect to this.closestConnection_ if this block
   * were released immediately.
   * Updated on every mouse move.
   * @type {Blockly.RenderedConnection}
   * @private
   */
  this.localConnection_ = null;

  /**
   * The distance between this.closestConnection_ and this.localConnection_,
   * in workspace units.
   * Updated on every mouse move.
   * @type {number}
   * @private
   */
  this.radiusConnection_ = 0;

  /**
   * Whether the block would be deleted if it were dropped immediately.
   * Updated on every mouse move.
   * @type {boolean}
   * @private
   */
  this.wouldDeleteBlock_ = false;
};

/**
 * Sever all links from this object.
 * @package
 */
DraggedConnectionManager.prototype.dispose = function() {
  this.topBlock_ = null;
  this.workspace_ = null;
  this.availableConnections_.length = 0;
  this.closestConnection_ = null;
  this.localConnection_ = null;
};

/**
 * Return whether the block would be deleted if dropped immediately, based on
 * information from the most recent move event.
 * @return {boolean} true if the block would be deleted if dropped immediately.
 * @package
 */
DraggedConnectionManager.prototype.wouldDeleteBlock = function() {
  return this.wouldDeleteBlock_;
};

/**
 * Return whether the block would be connected if dropped immediately, based on
 * information from the most recent move event.
 * @return {boolean} true if the block would be connected if dropped immediately.
 * @package
 */
DraggedConnectionManager.prototype.wouldConnectBlock = function() {
  return !!this.closestConnection_;
};

/**
 * Connect to the closest connection and render the results.
 * This should be called at the end of a drag.
 * @package
 */
DraggedConnectionManager.prototype.applyConnections = function() {
  if (this.closestConnection_) {
    // Connect two blocks together.
    this.localConnection_.connect(this.closestConnection_);
    if (this.topBlock_.rendered) {
      // Trigger a connection animation.
      // Determine which connection is inferior (lower in the source stack).
      const inferiorConnection = this.localConnection_.isSuperior() ?
          this.closestConnection_ : this.localConnection_;
      BlockAnimations.connectionUiEffect(
          inferiorConnection.getSourceBlock());
      // Bring the just-edited stack to the front.
      const rootBlock = this.topBlock_.getRootBlock();
      rootBlock.bringToFront();
    }
    this.removeHighlighting_();
  }
};

/**
 * Update highlighted connections based on the most recent move location.
 * @param {!goog.math.Coordinate} dxy Position relative to drag start,
 *     in workspace units.
 * @param {?number} deleteArea One of {@link Blockly.constants.DELETE_AREA_TRASH},
 *     {@link constants.DELETE_AREA_TOOLBOX}, or {@link Blockly.constants.DELETE_AREA_NONE}.
 * @param {?boolean} isOutside True if the drag is going outside the blocks workspace
 * @package
 */
DraggedConnectionManager.prototype.update = function(dxy, deleteArea, isOutside) {
  let oldClosestConnection;
  let closestConnectionChanged;
  // If dragged outside, don't connect, since the connections aren't visible.
  if (!isOutside) {
    oldClosestConnection = this.closestConnection_;
    closestConnectionChanged = this.updateClosest_(dxy);
    if (closestConnectionChanged && oldClosestConnection) {
      oldClosestConnection.unhighlight();
    }
  } else if (this.closestConnection_) {
    this.closestConnection_.unhighlight();
    this.closestConnection_ = null;
  }

  // Prefer connecting over dropping into the trash can, but prefer dragging to
  // the toolbox over connecting to other blocks.
  const wouldConnect = !!this.closestConnection_ &&
      deleteArea != constants.DELETE_AREA_TOOLBOX;
  const wouldDelete = !!deleteArea && !this.topBlock_.getParent() &&
      this.topBlock_.isDeletable();
  this.wouldDeleteBlock_ = wouldDelete && !wouldConnect;

  if (!this.wouldDeleteBlock_ && closestConnectionChanged &&
      this.closestConnection_) {
    this.addHighlighting_();
  }
};

/**
 * Remove highlighting from the currently highlighted connection, if it exists.
 * @private
 */
DraggedConnectionManager.prototype.removeHighlighting_ = function() {
  if (this.closestConnection_) {
    this.closestConnection_.unhighlight();
  }
};

/**
 * Add highlighting to the closest connection, if it exists.
 * @private
 */
DraggedConnectionManager.prototype.addHighlighting_ = function() {
  if (this.closestConnection_) {
    this.closestConnection_.highlight();
  }
};

/**
 * Populate the list of available connections on this block stack.  This should
 * only be called once, at the beginning of a drag.
 * @return {!Array.<!Blockly.RenderedConnection>} a list of available
 *     connections.
 * @private
 */
DraggedConnectionManager.prototype.initAvailableConnections_ = function() {
  const available = this.topBlock_.getConnections_(false);
  // Also check the last connection on this stack
  const lastOnStack = this.topBlock_.lastConnectionInStack();
  if (lastOnStack && lastOnStack != this.topBlock_.nextConnection) {
    available.push(lastOnStack);
  }
  return available;
};

/**
 * Find the new closest connection, and update internal state in response.
 * @param {!goog.math.Coordinate} dxy Position relative to the drag start,
 *     in workspace units.
 * @return {boolean} Whether the closest connection has changed.
 * @private
 */
DraggedConnectionManager.prototype.updateClosest_ = function(dxy) {
  const oldClosestConnection = this.closestConnection_;

  this.closestConnection_ = null;
  this.localConnection_ = null;
  this.radiusConnection_ = constants.SNAP_RADIUS;
  for (let i = 0; i < this.availableConnections_.length; i++) {
    const myConnection = this.availableConnections_[i];
    const neighbour = myConnection.closest(this.radiusConnection_, dxy);
    if (neighbour.connection) {
      this.closestConnection_ = neighbour.connection;
      this.localConnection_ = myConnection;
      this.radiusConnection_ = neighbour.radius;
    }
  }
  return oldClosestConnection != this.closestConnection_;
};
