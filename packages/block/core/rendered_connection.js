/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2016 Google Inc.
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
 * @fileoverview Components for creating connections between blocks.
 * @author fenichel@google.com (Rachel Fenichel)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.RenderedConnection');

import * as common from './common';
import {Connection} from './connection';
import * as constants from './constants';
import * as eventUtils from './events/utils';
import * as rendererConstants from './renderer/constants';
import * as utils from './utils';

const dom = goog.require('goog.dom');
const Coordinate = goog.require('goog.math.Coordinate');


/**
 * Class for a connection between blocks that may be rendered on screen.
 * @param {!Blockly.Block} source The block establishing this connection.
 * @param {number} type The type of the connection.
 * @extends {Connection}
 * @constructor
 */
export const RenderedConnection = function(source, type) {
  RenderedConnection.superClass_.constructor.call(this, source, type);

  /**
   * Workspace units, (0, 0) is top left of block.
   * @type {!Coordinate}
   * @private
   */
  this.offsetInBlock_ = new Coordinate(0, 0);
};
goog.inherits(RenderedConnection, Connection);

/**
 * Returns the distance between this connection and another connection in
 * workspace units.
 * @param {!Connection} otherConnection The other connection to measure
 *     the distance to.
 * @return {number} The distance between connections, in workspace units.
 */
RenderedConnection.prototype.distanceFrom = function(otherConnection) {
  const xDiff = this.x_ - otherConnection.x_;
  const yDiff = this.y_ - otherConnection.y_;
  return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
};

/**
 * Move the block(s) belonging to the connection to a point where they don't
 * visually interfere with the specified connection.
 * @param {!Connection} staticConnection The connection to move away
 *     from.
 * @private
 */
RenderedConnection.prototype.bumpAwayFrom_ = function(staticConnection) {
  if (this.sourceBlock_.workspace.isDragging()) {
    // Don't move blocks around while the user is doing the same.
    return;
  }
  // Move the root block.
  let rootBlock = this.sourceBlock_.getRootBlock();
  if (rootBlock.isInFlyout) {
    // Don't move blocks around in a flyout.
    return;
  }
  let reverse = false;
  if (!rootBlock.isMovable()) {
    // Can't bump an uneditable block away.
    // Check to see if the other block is movable.
    rootBlock = staticConnection.getSourceBlock().getRootBlock();
    if (!rootBlock.isMovable()) {
      return;
    }
    // Swap the connections and move the 'static' connection instead.
    staticConnection = this;
    reverse = true;
  }
  // Raise it to the top for extra visibility.
  const selected = common.getSelected() == rootBlock;
  selected || rootBlock.addSelect();
  let dx = (staticConnection.x_ + constants.SNAP_RADIUS) - this.x_;
  let dy = (staticConnection.y_ + constants.SNAP_RADIUS) - this.y_;
  if (reverse) {
    // When reversing a bump due to an uneditable block, bump up.
    dy = -dy;
  }
  if (rootBlock.RTL) {
    dx = -dx;
  }
  rootBlock.moveBy(dx, dy);
  selected || rootBlock.removeSelect();
};

/**
 * Change the connection's coordinates.
 * @param {number} x New absolute x coordinate, in workspace coordinates.
 * @param {number} y New absolute y coordinate, in workspace coordinates.
 */
RenderedConnection.prototype.moveTo = function(x, y) {
  // Remove it from its old location in the database (if already present)
  if (this.inDB_) {
    this.db_.removeConnection_(this);
  }
  this.x_ = x;
  this.y_ = y;
  // Insert it into its new location in the database.
  if (!this.hidden_) {
    this.db_.addConnection(this);
  }
};

/**
 * Change the connection's coordinates.
 * @param {number} dx Change to x coordinate, in workspace units.
 * @param {number} dy Change to y coordinate, in workspace units.
 */
RenderedConnection.prototype.moveBy = function(dx, dy) {
  this.moveTo(this.x_ + dx, this.y_ + dy);
};

/**
 * Move this connection to the location given by its offset within the block and
 * the location of the block's top left corner.
 * @param {!Coordinate} blockTL The location of the top left corner
 *     of the block, in workspace coordinates.
 */
RenderedConnection.prototype.moveToOffset = function(blockTL) {
  this.moveTo(blockTL.x + this.offsetInBlock_.x,
      blockTL.y + this.offsetInBlock_.y);
};

/**
 * Set the offset of this connection relative to the top left of its block.
 * @param {number} x The new relative x, in workspace units.
 * @param {number} y The new relative y, in workspace units.
 */
RenderedConnection.prototype.setOffsetInBlock = function(x, y) {
  this.offsetInBlock_.x = x;
  this.offsetInBlock_.y = y;
};

/**
 * Move the blocks on either side of this connection right next to each other.
 * @private
 */
RenderedConnection.prototype.tighten_ = function() {
  const dx = this.targetConnection.x_ - this.x_;
  const dy = this.targetConnection.y_ - this.y_;
  if (dx != 0 || dy != 0) {
    const block = this.targetBlock();
    const svgRoot = block.getSvgRoot();
    if (!svgRoot) {
      throw 'block is not rendered.';
    }
    // Workspace coordinates.
    const xy = utils.getRelativeXY(svgRoot);
    block.getSvgRoot().setAttribute('transform',
        'translate(' + (xy.x - dx) + ',' + (xy.y - dy) + ')');
    block.moveConnections_(-dx, -dy);
  }
};

/**
 * Find the closest compatible connection to this connection.
 * All parameters are in workspace units.
 * @param {number} maxLimit The maximum radius to another connection.
 * @param {!Coordinate} dxy Offset between this connection's location
 *     in the database and the current location (as a result of dragging).
 * @return {!{connection: ?Connection, radius: number}} Contains two
 *     properties: 'connection' which is either another connection or null,
 *     and 'radius' which is the distance.
 */
RenderedConnection.prototype.closest = function(maxLimit, dxy) {
  return this.dbOpposite_.searchForClosest(this, maxLimit, dxy);
};

/**
 * Add highlighting around this connection.
 */
RenderedConnection.prototype.highlight = function() {
  const steps = 'm -20,0 h 5 ' + rendererConstants.NOTCH_PATH_LEFT + ' h 5';
  const xy = this.sourceBlock_.getRelativeToSurfaceXY();
  const x = this.x_ - xy.x;
  const y = this.y_ - xy.y;
  Connection.highlightedPath_ = utils.createSvgElement(
      'path',
      {
        'class': 'blocklyHighlightedConnectionPath',
        'd': steps,
        transform: 'translate(' + x + ',' + y + ')' +
            (this.sourceBlock_.RTL ? ' scale(-1 1)' : '')
      },
      this.sourceBlock_.getSvgRoot());
};

/**
 * Unhide this connection, as well as all down-stream connections on any block
 * attached to this connection.  This happens when a block is expanded.
 * Also unhides down-stream comments.
 * @return {!Array.<!Blockly.Block>} List of blocks to render.
 */
RenderedConnection.prototype.unhideAll = function() {
  this.setHidden(false);
  // All blocks that need unhiding must be unhidden before any rendering takes
  // place, since rendering requires knowing the dimensions of lower blocks.
  // Also, since rendering a block renders all its parents, we only need to
  // render the leaf nodes.
  const renderList = [];
  if (this.type != constants.INPUT_VALUE && this.type != constants.NEXT_STATEMENT) {
    // Only spider down.
    return renderList;
  }
  const block = this.targetBlock();
  if (block) {
    let connections;
    if (block.isCollapsed()) {
      // This block should only be partially revealed since it is collapsed.
      connections = [];
      block.outputConnection && connections.push(block.outputConnection);
      block.nextConnection && connections.push(block.nextConnection);
      block.previousConnection && connections.push(block.previousConnection);
    } else {
      // Show all connections of this block.
      connections = block.getConnections_(true);
    }
    for (let i = 0; i < connections.length; i++) {
      renderList.push.apply(renderList, connections[i].unhideAll());
    }
    if (!renderList.length) {
      // Leaf block.
      renderList[0] = block;
    }
  }
  return renderList;
};

/**
 * Remove the highlighting around this connection.
 */
RenderedConnection.prototype.unhighlight = function() {
  dom.removeNode(Connection.highlightedPath_);
  delete Connection.highlightedPath_;
};

/**
 * Set whether this connections is hidden (not tracked in a database) or not.
 * @param {boolean} hidden True if connection is hidden.
 */
RenderedConnection.prototype.setHidden = function(hidden) {
  this.hidden_ = hidden;
  if (hidden && this.inDB_) {
    this.db_.removeConnection_(this);
  } else if (!hidden && !this.inDB_) {
    this.db_.addConnection(this);
  }
};

/**
 * Hide this connection, as well as all down-stream connections on any block
 * attached to this connection.  This happens when a block is collapsed.
 * Also hides down-stream comments.
 */
RenderedConnection.prototype.hideAll = function() {
  this.setHidden(true);
  if (this.targetConnection) {
    const blocks = this.targetBlock().getDescendants(false);
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      // Hide all connections of all children.
      const connections = block.getConnections_(true);
      for (let j = 0; j < connections.length; j++) {
        connections[j].setHidden(true);
      }
      // Close all bubbles of all children.
      const icons = block.getIcons();
      for (let j = 0; j < icons.length; j++) {
        icons[j].setVisible(false);
      }
    }
  }
};

/**
 * Check if the two connections can be dragged to connect to each other.
 * @param {!Connection} candidate A nearby connection to check.
 * @param {number} maxRadius The maximum radius allowed for connections, in
 *     workspace units.
 * @return {boolean} True if the connection is allowed, false otherwise.
 */
RenderedConnection.prototype.isConnectionAllowed = function(candidate,
    maxRadius) {
  if (this.distanceFrom(candidate) > maxRadius) {
    return false;
  }

  return RenderedConnection.superClass_.isConnectionAllowed.call(this,
      candidate);
};

/**
 * Disconnect two blocks that are connected by this connection.
 * @param {!Blockly.Block} parentBlock The superior block.
 * @param {!Blockly.Block} childBlock The inferior block.
 * @private
 */
RenderedConnection.prototype.disconnectInternal_ = function(parentBlock,
    childBlock) {
  RenderedConnection.superClass_.disconnectInternal_.call(this,
      parentBlock, childBlock);
  // Rerender the parent so that it may reflow.
  if (parentBlock.rendered) {
    parentBlock.render();
  }
  if (childBlock.rendered) {
    childBlock.updateDisabled();
    childBlock.render();
  }
};

/**
 * Respawn the shadow block if there was one connected to the this connection.
 * Render/rerender blocks as needed.
 * @private
 */
RenderedConnection.prototype.respawnShadow_ = function() {
  const parentBlock = this.getSourceBlock();
  // Respawn the shadow block if there is one.
  const shadowDom = this.getShadowDom();
  const shadowState = this.getShadowState();
  if (parentBlock.workspace && (shadowDom || shadowState) && eventUtils.getRecordUndo()) {
    RenderedConnection.superClass_.respawnShadow_.call(this);
    const blockShadow = this.targetBlock();
    if (!blockShadow) {
      throw 'Couldn\'t respawn the shadow block that should exist here.';
    }
    blockShadow.initSvg();
    blockShadow.render(false);
    if (parentBlock.rendered) {
      parentBlock.render();
    }
  }
};

/**
 * Find all nearby compatible connections to this connection.
 * Type checking does not apply, since this function is used for bumping.
 * @param {number} maxLimit The maximum radius to another connection, in
 *     workspace units.
 * @return {!Array.<!Connection>} List of connections.
 * @private
 */
RenderedConnection.prototype.neighbours_ = function(maxLimit) {
  return this.dbOpposite_.getNeighbours(this, maxLimit);
};

/**
 * Connect two connections together.  This is the connection on the superior
 * block.  Rerender blocks as needed.
 * @param {!Connection} childConnection Connection on inferior block.
 * @private
 */
RenderedConnection.prototype.connect_ = function(childConnection) {
  RenderedConnection.superClass_.connect_.call(this, childConnection);

  const parentConnection = this;
  const parentBlock = parentConnection.getSourceBlock();
  const childBlock = childConnection.getSourceBlock();

  if (parentBlock.rendered) {
    parentBlock.updateDisabled();
  }
  if (childBlock.rendered) {
    childBlock.updateDisabled();
  }
  if (parentBlock.rendered && childBlock.rendered) {
    if (parentConnection.type == constants.NEXT_STATEMENT ||
        parentConnection.type == constants.PREVIOUS_STATEMENT) {
      // Child block may need to square off its corners if it is in a stack.
      // Rendering a child will render its parent.
      childBlock.render();
    } else {
      // Child block does not change shape.  Rendering the parent node will
      // move its connected children into position.
      parentBlock.render();
    }
  }
};

/**
 * Function to be called when this connection's compatible types have changed.
 * @private
 */
RenderedConnection.prototype.onCheckChanged_ = function() {
  // The new value type may not be compatible with the existing connection.
  if (this.isConnected() && !this.checkType_(this.targetConnection)) {
    const child = this.isSuperior() ? this.targetBlock() : this.sourceBlock_;
    child.unplug();
    // Bump away.
    this.sourceBlock_.bumpNeighbours_();
  }
};
