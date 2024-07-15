/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2011 Google Inc.
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
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Connection');

import * as common from './common';
import * as constants from './constants';
import * as eventUtils from './events/utils';
import {BlockMove} from './events/block_move';
import * as Xml from './xml';

const arrayUtils = goog.require('goog.array');
const asserts = goog.require('goog.asserts');


/**
 * Class for a connection between blocks.
 */
export class Connection {
  /**
   * @param {!Blockly.Block} source The block establishing this connection.
   * @param {number} type The type of the connection.
   */
  constructor(source, type) {
    /**
     * @type {!Blockly.Block}
     * @protected
     */
    this.sourceBlock_ = source;
    /** @type {number} */
    this.type = type;
    // Shortcut for the databases for this connection's workspace.
    if (source.workspace.connectionDBList) {
      this.db_ = source.workspace.connectionDBList[type];
      this.dbOpposite_ =
          source.workspace.connectionDBList[constants.OPPOSITE_TYPE[type]];
      this.hidden_ = !this.db_;
    }
  }

  /**
   * Connect two connections together.  This is the connection on the superior
   * block.
   * @param {!Connection} childConnection Connection on inferior block.
   * @protected
   */
  connect_(childConnection) {
    const parentConnection = this;
    const parentBlock = parentConnection.getSourceBlock();
    const childBlock = childConnection.getSourceBlock();
    let isSurroundingC = false;
    let previousParentConnection;
    if (parentConnection == parentBlock.getFirstStatementConnection()) {
      isSurroundingC = true;
    }
    // Disconnect any existing parent on the child connection.
    if (childConnection.isConnected()) {
      // Scratch-specific behaviour:
      // If we're using a c-shaped block to surround a stack, remember where the
      // stack used to be connected.
      if (isSurroundingC) {
        previousParentConnection = childConnection.targetConnection;
      }
      childConnection.disconnect();
    }
    if (parentConnection.isConnected()) {
      // Other connection is already connected to something.
      // Disconnect it and reattach it or bump it as needed.
      let orphanBlock = parentConnection.targetBlock();
      let shadowDom = parentConnection.getShadowDom();
      // Temporarily set the shadow DOM to null so it does not respawn.
      parentConnection.setShadowDom(null);
      // Displaced shadow blocks dissolve rather than reattaching or bumping.
      if (orphanBlock.isShadow()) {
        // Save the shadow block so that field values are preserved.
        shadowDom = Xml.blockToDom(orphanBlock);
        orphanBlock.dispose();
        orphanBlock = null;
      } else if (parentConnection.type == constants.NEXT_STATEMENT) {
        // Statement connections.
        // Statement blocks may be inserted into the middle of a stack.
        // Split the stack.
        if (!orphanBlock.previousConnection) {
          throw 'Orphan block does not have a previous connection.';
        }
        // Attempt to reattach the orphan at the bottom of the newly inserted
        // block.  Since this block may be a stack, walk down to the end.
        let newBlock = childBlock;
        while (newBlock.nextConnection) {
          const nextBlock = newBlock.getNextBlock();
          if (nextBlock && !nextBlock.isShadow()) {
            newBlock = nextBlock;
          } else {
            if (orphanBlock.previousConnection.checkType_(
                newBlock.nextConnection)) {
              newBlock.nextConnection.connect(orphanBlock.previousConnection);
              orphanBlock = null;
            }
            break;
          }
        }
      }
      if (orphanBlock) {
        // Unable to reattach orphan.
        parentConnection.disconnect();
        if (eventUtils.getRecordUndo()) {
          // Bump it off to the side after a moment.
          const group = eventUtils.getGroup();
          setTimeout(function() {
            // Verify orphan hasn't been deleted or reconnected (user on meth).
            if (orphanBlock.workspace && !orphanBlock.getParent()) {
              eventUtils.setGroup(group);
              if (orphanBlock.outputConnection) {
                orphanBlock.outputConnection.bumpAwayFrom_(parentConnection);
              } else if (orphanBlock.previousConnection) {
                orphanBlock.previousConnection.bumpAwayFrom_(parentConnection);
              }
              eventUtils.setGroup(false);
            }
          }, constants.BUMP_DELAY);
        }
      }
      // Restore the shadow DOM.
      parentConnection.setShadowDom(shadowDom);
    }

    if (isSurroundingC && previousParentConnection) {
      previousParentConnection.connect(parentBlock.previousConnection);
    }

    let event;
    if (eventUtils.isEnabled()) {
      event = new BlockMove(childBlock);
    }
    // Establish the connections.
    Connection.connectReciprocally_(parentConnection, childConnection);
    // Demote the inferior block so that one is a child of the superior one.
    childBlock.setParent(parentBlock);
    if (event) {
      event.recordNew();
      eventUtils.fire(event);
    }
  }

  /**
   * Sever all links to this connection (not including from the source object).
   */
  dispose() {
    if (this.isConnected()) {
      throw 'Disconnect connection before disposing of it.';
    }
    if (this.inDB_) {
      this.db_.removeConnection_(this);
    }
    this.db_ = null;
    this.dbOpposite_ = null;
  }

  /**
   * @return {boolean} true if the connection is not connected or is connected to
   *    an insertion marker, false otherwise.
   */
  isConnectedToNonInsertionMarker() {
    return this.targetConnection && !this.targetBlock().isInsertionMarker();
  }

  /**
   * Get the source block for this connection.
   * @return {Blockly.Block} The source block, or null if there is none.
   */
  getSourceBlock() {
    return this.sourceBlock_;
  }

  /**
   * Does the connection belong to a superior block (higher in the source stack)?
   * @return {boolean} True if connection faces down or right.
   */
  isSuperior() {
    return this.type == constants.INPUT_VALUE ||
        this.type == constants.NEXT_STATEMENT;
  }

  /**
   * Is the connection connected?
   * @return {boolean} True if connection is connected to another connection.
   */
  isConnected() {
    return !!this.targetConnection;
  }

  /**
   * Checks whether the current connection can connect with the target
   * connection.
   * @param {Connection} target Connection to check compatibility with.
   * @return {number} Connection.CAN_CONNECT if the connection is legal,
   *    an error code otherwise.
   * @private
   */
  canConnectWithReason_(target) {
    if (!target) {
      return Connection.REASON_TARGET_NULL;
    }
    let blockA;
    let blockB;
    let superiorConn;
    if (this.isSuperior()) {
      blockA = this.sourceBlock_;
      blockB = target.getSourceBlock();
      superiorConn = this;
    } else {
      blockB = this.sourceBlock_;
      blockA = target.getSourceBlock();
      superiorConn = target;
    }
    if (blockA && blockA == blockB) {
      return Connection.REASON_SELF_CONNECTION;
    } else if (target.type != constants.OPPOSITE_TYPE[this.type]) {
      return Connection.REASON_WRONG_TYPE;
    } else if (blockA && blockB && blockA.workspace !== blockB.workspace) {
      return Connection.REASON_DIFFERENT_WORKSPACES;
    } else if (!this.checkType_(target)) {
      return Connection.REASON_CHECKS_FAILED;
    } else if (blockA.isShadow() && !blockB.isShadow()) {
      return Connection.REASON_SHADOW_PARENT;
    } else if ((blockA.type == constants.PROCEDURES_DEFINITION_BLOCK_TYPE &&
        blockB.type != constants.PROCEDURES_PROTOTYPE_BLOCK_TYPE &&
        superiorConn == blockA.getInput('custom_block').connection) ||
        (blockB.type == constants.PROCEDURES_PROTOTYPE_BLOCK_TYPE &&
        blockA.type != constants.PROCEDURES_DEFINITION_BLOCK_TYPE)) {
      // Hack to fix #1127: Fail attempts to connect to the custom_block input
      // on a defnoreturn block, unless the connecting block is a specific type.
      // And hack to fix #1534: Fail attempts to connect anything but a
      // defnoreturn block to a prototype block.
      return Connection.REASON_CUSTOM_PROCEDURE;
    }
    return Connection.CAN_CONNECT;
  }

  /**
   * Checks whether the current connection and target connection are compatible
   * and throws an exception if they are not.
   * @param {Connection} target The connection to check compatibility
   *    with.
   * @private
   */
  checkConnection_(target) {
    switch (this.canConnectWithReason_(target)) {
      case Connection.CAN_CONNECT:
        break;
      case Connection.REASON_SELF_CONNECTION:
        throw 'Attempted to connect a block to itself.';
      case Connection.REASON_DIFFERENT_WORKSPACES:
        // Usually this means one block has been deleted.
        throw 'Blocks not on same workspace.';
      case Connection.REASON_WRONG_TYPE:
        throw 'Attempt to connect incompatible types.';
      case Connection.REASON_TARGET_NULL:
        throw 'Target connection is null.';
      case Connection.REASON_CHECKS_FAILED:
        throw 'Connection checks failed. ' + this + ' expected '  + this.check_ + ', found ' + target.check_;
      case Connection.REASON_SHADOW_PARENT:
        throw 'Connecting non-shadow to shadow block.';
      case Connection.REASON_CUSTOM_PROCEDURE:
        throw 'Trying to replace a shadow on a custom procedure definition.';
      default:
        throw 'Unknown connection failure: this should never happen!';
    }
  }

  /**
   * Check if the two connections can be dragged to connect to each other.
   * This is used by the connection database when searching for the closest
   * connection.
   * @param {!Connection} candidate A nearby connection to check, which
   *     must be a previous connection.
   * @return {boolean} True if the connection is allowed, false otherwise.
   */
  canConnectToPrevious_(candidate) {
    if (this.targetConnection) {
      // This connection is already occupied.
      // A next connection will never disconnect itself mid-drag.
      return false;
    }

    // Don't let blocks try to connect to themselves or ones they nest.
    if (common.draggingConnections.indexOf(candidate) != -1) {
      return false;
    }

    const firstStatementConnection =
        this.sourceBlock_.getFirstStatementConnection();
    // Is it a C-shaped (e.g. repeat) or E-shaped (e.g. if-else) block?
    const isComplexStatement = firstStatementConnection != null;
    const isFirstStatementConnection = this == firstStatementConnection;
    const isNextConnection = this == this.sourceBlock_.nextConnection;

    // Scratch-specific behaviour: can connect to the first statement input of a
    // C-shaped or E-shaped block, or to the next connection of any statement
    // block, but not to the second statement input of an E-shaped block.
    if (isComplexStatement && !isFirstStatementConnection && !isNextConnection) {
      return false;
    }

    // Complex blocks with no previous connection will not be allowed to connect
    // mid-stack.
    const sourceHasPreviousConn = this.sourceBlock_.previousConnection != null;

    if (isFirstStatementConnection && sourceHasPreviousConn) {
      return true;
    }

    if (isNextConnection ||
        (isFirstStatementConnection && !sourceHasPreviousConn)) {
      // If the candidate is the first connection in a stack, we can connect.
      if (!candidate.targetConnection) {
        return true;
      }

      const targetBlock = candidate.targetBlock();
      // If it is connected a real block, game over.
      if (!targetBlock.isInsertionMarker()) {
        return false;
      }
      // If it's connected to an insertion marker but that insertion marker
      // is the first block in a stack, it's still fine.  If that insertion
      // marker is in the middle of a stack, it won't work.
      return !targetBlock.getPreviousBlock();
    }
  }

  /**
   * Check if the two connections can be dragged to connect to each other.
   * This is used by the connection database when searching for the closest
   * connection.
   * @param {!Connection} candidate A nearby connection to check.
   * @return {boolean} True if the connection is allowed, false otherwise.
   */
  isConnectionAllowed(candidate) {

    // Don't consider insertion markers.
    if (candidate.sourceBlock_.isInsertionMarker()) {
      return false;
    }

    // Type checking.
    const canConnect = this.canConnectWithReason_(candidate);
    if (canConnect != Connection.CAN_CONNECT) {
      return false;
    }

    const firstStatementConnection =
        this.sourceBlock_.getFirstStatementConnection();
    switch (candidate.type) {
      case constants.PREVIOUS_STATEMENT:
        return this.canConnectToPrevious_(candidate);
      case constants.OUTPUT_VALUE: {
        // Can't drag an input to an output--you have to move the inferior block.
        return false;
      }
      case constants.INPUT_VALUE: {
        // Offering to connect the left (male) of a value block to an already
        // connected value pair is ok, we'll splice it in.
        // However, don't offer to splice into an unmovable block.
        if (candidate.targetConnection &&
            !candidate.targetBlock().isMovable() &&
            !candidate.targetBlock().isShadow()) {
          return false;
        }
        break;
      }
      case constants.NEXT_STATEMENT: {
        // Scratch-specific behaviour:
        // If this is a c-block, we can't connect this block's
        // previous connection unless we're connecting to the end of the last
        // block on a stack or there's already a block connected inside the c.
        if (firstStatementConnection &&
            this == this.sourceBlock_.previousConnection &&
            candidate.isConnectedToNonInsertionMarker() &&
            !firstStatementConnection.targetConnection) {
          return false;
        }
        // Don't let a block with no next connection bump other blocks out of the
        // stack.  But covering up a shadow block or stack of shadow blocks is
        // fine.  Similarly, replacing a terminal statement with another terminal
        // statement is allowed.
        if (candidate.isConnectedToNonInsertionMarker() &&
            !this.sourceBlock_.nextConnection &&
            !candidate.targetBlock().isShadow() &&
            candidate.targetBlock().nextConnection) {
          return false;
        }
        break;
      }
      default:
        throw 'Unknown connection type in isConnectionAllowed';
    }

    // Don't let blocks try to connect to themselves or ones they nest.
    if (common.draggingConnections.indexOf(candidate) != -1) {
      return false;
    }

    return true;
  }

  /**
   * Connect this connection to another connection.
   * @param {!Connection} otherConnection Connection to connect to.
   */
  connect(otherConnection) {
    if (this.targetConnection == otherConnection) {
      // Already connected together.  NOP.
      return;
    }
    this.checkConnection_(otherConnection);
    // Determine which block is superior (higher in the source stack).
    if (this.isSuperior()) {
      // Superior block.
      this.connect_(otherConnection);
    } else {
      // Inferior block.
      otherConnection.connect_(this);
    }
  }

  /**
   * Update two connections to target each other.
   * @param {Connection} first The first connection to update.
   * @param {Connection} second The second connection to update.
   * @private
   */
  static connectReciprocally_(first, second) {
    asserts.assert(first && second, 'Cannot connect null connections.');
    first.targetConnection = second;
    second.targetConnection = first;
  }

  /**
   * Does the given block have one and only one connection point that will accept
   * an orphaned block?
   * @param {!Blockly.Block} block The superior block.
   * @param {!Blockly.Block} orphanBlock The inferior block.
   * @return {Connection} The suitable connection point on 'block',
   *     or null.
   * @private
   */
  static singleConnection_(block, orphanBlock) {
    let connection = false;
    for (let i = 0; i < block.inputList.length; i++) {
      const thisConnection = block.inputList[i].connection;
      if (thisConnection && thisConnection.type == constants.INPUT_VALUE &&
          orphanBlock.outputConnection.checkType_(thisConnection)) {
        if (connection) {
          return null;  // More than one connection.
        }
        connection = thisConnection;
      }
    }
    return connection;
  }

  /**
   * Disconnect this connection.
   * @param {boolean=} opt_noRespawnShadow True if don't respawn shadow block. Defaults to false.
   */
  disconnect(opt_noRespawnShadow) {
    const otherConnection = this.targetConnection;
    asserts.assert(otherConnection, 'Source connection not connected.');
    asserts.assert(otherConnection.targetConnection == this,
        'Target connection not connected to source connection.');

    let parentBlock, childBlock, parentConnection;
    if (this.isSuperior()) {
      // Superior block.
      parentBlock = this.sourceBlock_;
      childBlock = otherConnection.getSourceBlock();
      parentConnection = this;
    } else {
      // Inferior block.
      parentBlock = otherConnection.getSourceBlock();
      childBlock = this.sourceBlock_;
      parentConnection = otherConnection;
    }
    this.disconnectInternal_(parentBlock, childBlock);
    if (!opt_noRespawnShadow) {
      parentConnection.respawnShadow_();
    }
  }

  /**
   * Disconnect two blocks that are connected by this connection.
   * @param {!Blockly.Block} parentBlock The superior block.
   * @param {!Blockly.Block} childBlock The inferior block.
   * @protected
   */
  disconnectInternal_(parentBlock, childBlock) {
    let event;
    if (eventUtils.isEnabled()) {
      event = new BlockMove(childBlock);
    }
    const otherConnection = this.targetConnection;
    otherConnection.targetConnection = null;
    this.targetConnection = null;
    childBlock.setParent(null);
    if (event) {
      event.recordNew();
      eventUtils.fire(event);
    }
  }

  /**
   * Respawn the shadow block if there was one connected to the this connection.
   * @protected
   */
  respawnShadow_() {
    const parentBlock = this.getSourceBlock();
    const shadow = this.getShadowDom();
    if (parentBlock.workspace && shadow && eventUtils.getRecordUndo()) {
      const blockShadow =
          Xml.domToBlock(shadow, parentBlock.workspace);
      if (blockShadow.outputConnection) {
        this.connect(blockShadow.outputConnection);
      } else if (blockShadow.previousConnection) {
        this.connect(blockShadow.previousConnection);
      } else {
        throw 'Child block does not have output or previous statement.';
      }
    }
  }

  /**
   * Returns the block that this connection connects to.
   * @return {Blockly.Block} The connected block or null if none is connected.
   */
  targetBlock() {
    if (this.isConnected()) {
      return this.targetConnection.getSourceBlock();
    }
    return null;
  }

  /**
   * Is this connection compatible with another connection with respect to the
   * value type system.  E.g. square_root("Hello") is not compatible.
   * @param {!Connection} otherConnection Connection to compare against.
   * @return {boolean} True if the connections share a type.
   * @protected
   */
  checkType_(otherConnection) {
    if (!this.check_ || !otherConnection.check_) {
      // One or both sides are promiscuous enough that anything will fit.
      return true;
    }
    // Find any intersection in the check lists.
    for (let i = 0; i < this.check_.length; i++) {
      if (otherConnection.check_.indexOf(this.check_[i]) != -1) {
        return true;
      }
    }
    // No intersection.
    return false;
  }

  /**
   * Function to be called when this connection's compatible types have changed.
   * @private
   */
  onCheckChanged_() {
    // The new value type may not be compatible with the existing connection.
    if (this.isConnected() && !this.checkType_(this.targetConnection)) {
      const child = this.isSuperior() ? this.targetBlock() : this.sourceBlock_;
      child.unplug();
    }
  }

  /**
   * Change a connection's compatibility.
   * @param {*} check Compatible value type or list of value types.
   *     Null if all types are compatible.
   * @return {!Connection} The connection being modified
   *     (to allow chaining).
   */
  setCheck(check) {
    if (check) {
      // Ensure that check is in an array.
      if (!Array.isArray(check)) {
        check = [check];
      }
      this.check_ = check;
      this.onCheckChanged_();
    } else {
      this.check_ = null;
    }
    return this;
  }

  /**
   * Returns a shape enum for this connection.
   * Used in scratch-blocks to draw unoccupied inputs.
   * @return {number} Enum representing shape.
   */
  getOutputShape() {
    if (!this.check_) return constants.OUTPUT_SHAPE_ROUND;
    if (this.check_.indexOf('Boolean') !== -1) {
      return constants.OUTPUT_SHAPE_HEXAGONAL;
    }
    if (this.check_.indexOf('Number') !== -1) {
      return constants.OUTPUT_SHAPE_ROUND;
    }
    if (this.check_.indexOf('String') !== -1) {
      return constants.OUTPUT_SHAPE_SQUARE;
    }
    return constants.OUTPUT_SHAPE_ROUND;
  }

  /**
   * Change a connection's shadow block.
   * @param {Element} shadow DOM representation of a block or null.
   */
  setShadowDom(shadow) {
    this.shadowDom_ = shadow;
  }

  /**
   * Return a connection's shadow block.
   * @return {Element} shadow DOM representation of a block or null.
   */
  getShadowDom() {
    return this.shadowDom_;
  }

  /**
   * Find all nearby compatible connections to this connection.
   * Type checking does not apply, since this function is used for bumping.
   *
   * Headless configurations (the default) do not have neighboring connection,
   * and always return an empty list (the default).
   * {@link Blockly.RenderedConnection} overrides this behavior with a list
   * computed from the rendered positioning.
   * @param {number} maxLimit The maximum radius to another connection.
   * @return {!Array.<!Connection>} List of connections.
   * @private
   */
  neighbours_() /* maxLimit */{
    return [];
  }

  /**
   * This method returns a string describing this Connection in developer terms
   * (English only). Intended to on be used in console logs and errors.
   * @return {string} The description.
   */
  toString() {
    let msg;
    const block = this.sourceBlock_;
    if (!block) {
      return 'Orphan Connection';
    } else if (block.outputConnection == this) {
      msg = 'Output Connection of ';
    } else if (block.previousConnection == this) {
      msg = 'Previous Connection of ';
    } else if (block.nextConnection == this) {
      msg = 'Next Connection of ';
    } else {
      const parentInput = arrayUtils.find(block.inputList, function(input) {
        return input.connection == this;
      }, this);
      if (parentInput) {
        msg = 'Input "' + parentInput.name + '" connection on ';
      } else {
        console.warn('Connection not actually connected to sourceBlock_');
        return 'Orphan Connection';
      }
    }
    return msg + block.toDevString();
  }
}

/**
 * Constants for checking whether two connections are compatible.
 */
Connection.CAN_CONNECT = 0;
Connection.REASON_SELF_CONNECTION = 1;
Connection.REASON_WRONG_TYPE = 2;
Connection.REASON_TARGET_NULL = 3;
Connection.REASON_CHECKS_FAILED = 4;
Connection.REASON_DIFFERENT_WORKSPACES = 5;
Connection.REASON_SHADOW_PARENT = 6;
// Fixes #1127, but may be the wrong solution.
Connection.REASON_CUSTOM_PROCEDURE = 7;

/**
 * Connection this connection connects to.  Null if not connected.
 * @type {Connection}
 */
Connection.prototype.targetConnection = null;

/**
 * List of compatible value types.  Null if all types are compatible.
 * @type {Array}
 * @private
 */
Connection.prototype.check_ = null;

/**
 * DOM representation of a shadow block, or null if none.
 * @type {Element}
 * @private
 */
Connection.prototype.shadowDom_ = null;

/**
 * Horizontal location of this connection.
 * @type {number}
 * @protected
 */
Connection.prototype.x_ = 0;

/**
 * Vertical location of this connection.
 * @type {number}
 * @protected
 */
Connection.prototype.y_ = 0;

/**
 * Has this connection been added to the connection database?
 * @type {boolean}
 * @protected
 */
Connection.prototype.inDB_ = false;

/**
 * Connection database for connections of this type on the current workspace.
 * @type {Blockly.ConnectionDB}
 * @protected
 */
Connection.prototype.db_ = null;

/**
 * Connection database for connections compatible with this type on the
 * current workspace.
 * @type {Blockly.ConnectionDB}
 * @protected
 */
Connection.prototype.dbOpposite_ = null;

/**
 * Whether this connections is hidden (not tracked in a database) or not.
 * @type {boolean}
 * @protected
 */
Connection.prototype.hidden_ = null;
