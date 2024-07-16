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
 * @fileoverview The class representing one block.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Block');

import {Blocks} from './blocks';
import {Colours} from './colours';
import * as common from './common';
import {Connection} from './connection';
import * as constants from './constants';
import * as eventUtils from './events/utils';
import {BlockChange} from './events/block_change';
import {BlockCreate} from './events/block_create';
import {BlockDelete} from './events/block_delete';
import {BlockMove} from './events/block_move';
import * as Extensions from './extensions';
import {Field} from './field';
import {FieldDropdown} from './field_dropdown';
import {FieldLabel} from './field_label';
import {Input} from './input';
import * as utils from './utils';

const arrayUtils = goog.require('goog.array');
const asserts = goog.require('goog.asserts');
const color = goog.require('goog.color');
const Coordinate = goog.require('goog.math.Coordinate');
const stringUtils = goog.require('goog.string');


/**
 * Class for one block.
 * Not normally called directly, workspace.newBlock() is preferred.
 * @param {!Blockly.Workspace} workspace The block's workspace.
 * @param {?string} prototypeName Name of the language object containing
 *     type-specific functions for this block.
 * @param {string=} opt_id Optional ID.  Use this ID if provided, otherwise
 *     create a new ID.  If the ID conflicts with an in-use ID, a new one will
 *     be generated.
 * @constructor
 */
export const Block = function(workspace, prototypeName, opt_id) {
  const flyoutWorkspace = workspace && workspace.getFlyout && workspace.getFlyout() ?
     workspace.getFlyout().getWorkspace() : null;
  /** @type {string} */
  this.id = (opt_id && !workspace.getBlockById(opt_id) &&
      (!flyoutWorkspace || !flyoutWorkspace.getBlockById(opt_id))) ?
      opt_id : utils.genUid();
  workspace.blockDB_[this.id] = this;
  /** @type {Connection} */
  this.outputConnection = null;
  /** @type {Connection} */
  this.nextConnection = null;
  /** @type {Connection} */
  this.previousConnection = null;
  /** @type {!Array.<!Input>} */
  this.inputList = [];
  /** @type {boolean|undefined} */
  this.inputsInline = true;
  /** @type {boolean} */
  this.disabled = false;
  /** @type {string|!Function} */
  this.tooltip = '';
  /** @type {boolean} */
  this.contextMenu = true;

  /**
   * @type {Block}
   * @protected
   */
  this.parentBlock_ = null;

  /**
   * @type {!Array.<!Block>}
   * @protected
   */
  this.childBlocks_ = [];

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
   * @type {boolean}
   * @private
   */
  this.editable_ = true;

  /**
   * @type {boolean}
   * @private
   */
  this.isShadow_ = false;

  /**
   * @type {boolean}
   * @protected
   */
  this.collapsed_ = false;

  /**
   * @type {boolean}
   * @private
   */
  this.checkboxInFlyout_ = false;

  /** @type {string|Blockly.Comment} */
  this.comment = null;

  /**
   * @type {?number}
   * @private
   */
  this.outputShape_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.category_ = null;

  /**
   * The block's position in workspace units.  (0, 0) is at the workspace's
   * origin; scale does not change this value.
   * @type {!Coordinate}
   * @private
   */
  this.xy_ = new Coordinate(0, 0);

  /** @type {!Blockly.Workspace} */
  this.workspace = workspace;
  /** @type {boolean} */
  this.isInFlyout = workspace.isFlyout;
  /** @type {boolean} */
  this.isInMutator = workspace.isMutator;

  /** @type {boolean} */
  this.RTL = workspace.RTL;

  /** @type {boolean} */
  this.isInsertionMarker_ = false;

  // Copy the type-specific functions and data from the prototype.
  if (prototypeName) {
    /** @type {string} */
    this.type = prototypeName;
    const prototype = Blocks[prototypeName];
    asserts.assertObject(prototype,
        'Error: Unknown block type "%s".', prototypeName);
    Object.assign(this, prototype);
  }

  workspace.addTopBlock(this);

  // Call an initialization function, if it exists.
  if (typeof this.init === 'function') {
    this.init();
  }
  // Record initial inline state.
  /** @type {boolean|undefined} */
  this.inputsInlineDefault = this.inputsInline;

  // Fire a create event.
  if (eventUtils.isEnabled()) {
    const existingGroup = eventUtils.getGroup();
    if (!existingGroup) {
      eventUtils.setGroup(true);
    }
    try {
      eventUtils.fire(new BlockCreate(this));
    } finally {
      if (!existingGroup) {
        eventUtils.setGroup(false);
      }
    }

  }
  // Bind an onchange function, if it exists.
  if (typeof this.onchange === 'function') {
    this.setOnChange(this.onchange);
  }
};

/**
 * Optional text data that round-trips beween blocks and JSON.
 * Has no effect. May be used by 3rd parties for meta information.
 * @type {?string}
 */
Block.prototype.data = null;

/**
 * Colour of the block in '#RRGGBB' format.
 * @type {string}
 * @private
 */
Block.prototype.colour_ = '#FF0000';

/**
 * Secondary colour of the block in '#RRGGBB' format.
 * @type {string}
 * @private
 */
Block.prototype.colourSecondary_ = '#FF0000';

/**
 * Tertiary colour of the block in '#RRGGBB' format.
 * @type {string}
 * @private
 */
Block.prototype.colourTertiary_ = '#FF0000';

/**
 * Quaternary colour of the block in '#RRGGBB' format.
 * @type {string}
 * @private
 */
Block.prototype.colourQuaternary = '#FF0000';

/**
 * Fill colour used to override default shadow colour behaviour.
 * @type {string}
 * @private
 */
Block.prototype.shadowColour_ = null;

/**
 * Dispose of this block.
 * @param {boolean} healStack If true, then try to heal any gap by connecting
 *     the next statement with the previous statement.  Otherwise, dispose of
 *     all children of this block.
 */
Block.prototype.dispose = function(healStack) {
  if (!this.workspace) {
    // Already deleted.
    return;
  }
  // Terminate onchange event calls.
  if (this.onchangeWrapper_) {
    this.workspace.removeChangeListener(this.onchangeWrapper_);
  }
  this.unplug(healStack);
  if (eventUtils.isEnabled()) {
    eventUtils.fire(new BlockDelete(this));
  }
  eventUtils.disable();

  try {
    // This block is now at the top of the workspace.
    // Remove this block from the workspace's list of top-most blocks.
    if (this.workspace) {
      this.workspace.removeTopBlock(this);
      // Remove from block database.
      delete this.workspace.blockDB_[this.id];
      this.workspace = null;
    }

    // Just deleting this block from the DOM would result in a memory leak as
    // well as corruption of the connection database.  Therefore we must
    // methodically step through the blocks and carefully disassemble them.

    if (common.getSelected() == this) {
      common.setSelected(null);
    }

    // First, dispose of all my children.
    for (let i = this.childBlocks_.length - 1; i >= 0; i--) {
      this.childBlocks_[i].dispose(false);
    }
    // Then dispose of myself.
    // Dispose of all inputs and their fields.
    for (let i = 0, input; input = this.inputList[i]; i++) {
      input.dispose();
    }
    this.inputList.length = 0;
    // Dispose of any remaining connections (next/previous/output).
    const connections = this.getConnections_(true);
    for (let i = 0; i < connections.length; i++) {
      const connection = connections[i];
      if (connection.isConnected()) {
        connection.disconnect();
      }
      connections[i].dispose();
    }
  } finally {
    eventUtils.enable();
  }
};

/**
 * Call initModel on all fields on the block.
 * May be called more than once.
 * Either initModel or initSvg must be called after creating a block and before
 * the first interaction with it.  Interactions include UI actions
 * (e.g. clicking and dragging) and firing events (e.g. create, delete, and
 * change).
 * @public
 */
Block.prototype.initModel = function() {
  for (let i = 0, input; input = this.inputList[i]; i++) {
    for (let j = 0, field; field = input.fieldRow[j]; j++) {
      if (field.initModel) {
        field.initModel();
      }
    }
  }
};

/**
 * Unplug this block from its superior block.  If this block is a statement,
 * optionally reconnect the block underneath with the block on top.
 * @param {boolean=} opt_healStack Disconnect child statement and reconnect
 *   stack.  Defaults to false.
 */
Block.prototype.unplug = function(opt_healStack) {
  if (this.outputConnection) {
    if (this.outputConnection.isConnected()) {
      // Disconnect from any superior block.
      this.outputConnection.disconnect();
    }
  } else {
    let previousTarget = null;
    if (this.previousConnection) {
      if (this.previousConnection.isConnected()) {
        // Remember the connection that any next statements need to connect to.
        previousTarget = this.previousConnection.targetConnection;
        // Detach this block from the parent's tree.
        this.previousConnection.disconnect();
      }
    }
    const nextBlock = this.getNextBlock();
    if (opt_healStack && nextBlock) {
      // Disconnect the next statement.
      const nextTarget = this.nextConnection.targetConnection;
      nextTarget.disconnect();
      if (previousTarget && previousTarget.checkType_(nextTarget)) {
        // Attach the next statement to the previous statement.
        previousTarget.connect(nextTarget);
      }
    }
  }
};

/**
 * Returns all connections originating from this block.
 * @return {!Array.<!Connection>} Array of connections.
 * @private
 */
Block.prototype.getConnections_ = function() {
  const myConnections = [];
  if (this.outputConnection) {
    myConnections.push(this.outputConnection);
  }
  if (this.previousConnection) {
    myConnections.push(this.previousConnection);
  }
  if (this.nextConnection) {
    myConnections.push(this.nextConnection);
  }
  for (let i = 0, input; input = this.inputList[i]; i++) {
    if (input.connection) {
      myConnections.push(input.connection);
    }
  }
  return myConnections;
};

/**
 * Walks down a stack of blocks and finds the last next connection on the stack.
 * @return {Connection} The last next connection on the stack, or null.
 * @package
 */
Block.prototype.lastConnectionInStack = function() {
  let nextConnection = this.nextConnection;
  while (nextConnection) {
    const nextBlock = nextConnection.targetBlock();
    if (!nextBlock) {
      // Found a next connection with nothing on the other side.
      return nextConnection;
    }
    nextConnection = nextBlock.nextConnection;
  }
  // Ran out of next connections.
  return null;
};

/**
 * Bump unconnected blocks out of alignment.  Two blocks which aren't actually
 * connected should not coincidentally line up on screen.
 * @protected
 */
Block.prototype.bumpNeighbours_ = function() {
  console.warn('Not expected to reach this bumpNeighbours_ function. The ' +
    'BlockSvg function for bumpNeighbours_ was expected to be called instead.');
};

/**
 * Return the parent block or null if this block is at the top level.
 * @return {Block} The block that holds the current block.
 */
Block.prototype.getParent = function() {
  // Look at the DOM to see if we are nested in another block.
  return this.parentBlock_;
};

/**
 * Return the input that connects to the specified block.
 * @param {!Block} block A block connected to an input on this block.
 * @return {Input} The input that connects to the specified block.
 */
Block.prototype.getInputWithBlock = function(block) {
  for (let i = 0, input; input = this.inputList[i]; i++) {
    if (input.connection && input.connection.targetBlock() == block) {
      return input;
    }
  }
  return null;
};

/**
 * Return the input that contains the specified connection
 * @param {!Connection} conn A connection on this block.
 * @return {Input} The input that contains the specified connection.
 */
Block.prototype.getInputWithConnection = function(conn) {
  for (let i = 0, input; input = this.inputList[i]; i++) {
    if (input.connection == conn) {
      return input;
    }
  }
  return null;
};

/**
 * Return the parent block that surrounds the current block, or null if this
 * block has no surrounding block.  A parent block might just be the previous
 * statement, whereas the surrounding block is an if statement, while loop, etc.
 * @return {Block} The block that surrounds the current block.
 */
Block.prototype.getSurroundParent = function() {
  let block = this;
  let prevBlock;
  do {
    prevBlock = block;
    block = block.getParent();
    if (!block) {
      // Ran off the top.
      return null;
    }
  } while (block.getNextBlock() == prevBlock);
  // This block is an enclosing parent, not just a statement in a stack.
  return block;
};

/**
 * Return the next statement block directly connected to this block.
 * @return {Block} The next statement block or null.
 */
Block.prototype.getNextBlock = function() {
  return this.nextConnection && this.nextConnection.targetBlock();
};

/**
 * Return the previous statement block directly connected to this block.
 * @return {Block} The previous statement block or null.
 */
Block.prototype.getPreviousBlock = function() {
  return this.previousConnection && this.previousConnection.targetBlock();
};

/**
 * Return the connection on the first statement input on this block, or null if
 * there are none.
 * @return {Connection} The first statement connection or null.
 */
Block.prototype.getFirstStatementConnection = function() {
  for (let i = 0, input; input = this.inputList[i]; i++) {
    if (input.connection && input.connection.type == constants.NEXT_STATEMENT) {
      return input.connection;
    }
  }
  return null;
};

/**
 * Return the top-most block in this block's tree.
 * This will return itself if this block is at the top level.
 * @return {!Block} The root block.
 */
Block.prototype.getRootBlock = function() {
  let rootBlock;
  let block = this;
  do {
    rootBlock = block;
    block = rootBlock.parentBlock_;
  } while (block);
  return rootBlock;
};

/**
 * Find all the blocks that are directly nested inside this one.
 * Includes value and statement inputs, as well as any following statement.
 * Excludes any connection on an output tab or any preceding statement.
 * Blocks are optionally sorted by position; top to bottom.
 * @param {boolean} ordered Sort the list if true.
 * @return {!Array.<!Block>} Array of blocks.
 */
Block.prototype.getChildren = function(ordered) {
  if (!ordered) {
    return this.childBlocks_;
  }
  const blocks = [];
  for (let i = 0, input; input = this.inputList[i]; i++) {
    if (input.connection) {
      const child = input.connection.targetBlock();
      if (child) {
        blocks.push(child);
      }
    }
  }
  const next = this.getNextBlock();
  if (next) {
    blocks.push(next);
  }
  return blocks;
};

/**
 * Set parent of this block to be a new block or null.
 * @param {Block} newParent New parent block.
 */
Block.prototype.setParent = function(newParent) {
  if (newParent == this.parentBlock_) {
    return;
  }
  if (this.parentBlock_) {
    // Remove this block from the old parent's child list.
    arrayUtils.remove(this.parentBlock_.childBlocks_, this);

    // Disconnect from superior blocks.
    if (this.previousConnection && this.previousConnection.isConnected()) {
      throw 'Still connected to previous block.';
    }
    if (this.outputConnection && this.outputConnection.isConnected()) {
      throw 'Still connected to parent block.';
    }
    this.parentBlock_ = null;
    // This block hasn't actually moved on-screen, so there's no need to update
    // its connection locations.
  } else {
    // Remove this block from the workspace's list of top-most blocks.
    this.workspace.removeTopBlock(this);
  }

  this.parentBlock_ = newParent;
  if (newParent) {
    // Add this block to the new parent's child list.
    newParent.childBlocks_.push(this);
  } else {
    this.workspace.addTopBlock(this);
  }
};

/**
 * Find all the blocks that are directly or indirectly nested inside this one.
 * Includes this block in the list.
 * Includes value and statement inputs, as well as any following statements.
 * Excludes any connection on an output tab or any preceding statements.
 * Blocks are optionally sorted by position, top to bottom.
 * @param {boolean} ordered Sort the list if true.
 * @param {boolean=} opt_ignoreShadows If set, don't include shadow blocks.
 * @return {!Array.<!Block>} Flattened array of blocks.
 */
Block.prototype.getDescendants = function(ordered, opt_ignoreShadows) {
  const blocks = [this];
  const childBlocks = this.getChildren(ordered);
  for (let child, i = 0; child = childBlocks[i]; i++) {
    if (!opt_ignoreShadows || !child.isShadow_) {
      blocks.push.apply(
          blocks, child.getDescendants(ordered, opt_ignoreShadows));
    }
  }
  return blocks;
};

/**
 * Get whether this block is deletable or not.
 * @return {boolean} True if deletable.
 */
Block.prototype.isDeletable = function() {
  return this.deletable_ && !this.isShadow_ &&
      !(this.workspace && this.workspace.options.readOnly);
};

/**
 * Set whether this block is deletable or not.
 * @param {boolean} deletable True if deletable.
 */
Block.prototype.setDeletable = function(deletable) {
  this.deletable_ = deletable;
};

/**
 * Get whether this block is movable or not.
 * @return {boolean} True if movable.
 */
Block.prototype.isMovable = function() {
  return this.movable_ && !this.isShadow_ &&
      !(this.workspace && this.workspace.options.readOnly);
};

/**
 * Set whether this block is movable or not.
 * @param {boolean} movable True if movable.
 */
Block.prototype.setMovable = function(movable) {
  this.movable_ = movable;
};

/**
 * Get whether this block is a shadow block or not.
 * @return {boolean} True if a shadow.
 */
Block.prototype.isShadow = function() {
  return this.isShadow_;
};

/**
 * Set whether this block is a shadow block or not.
 * @param {boolean} shadow True if a shadow.
 */
Block.prototype.setShadow = function(shadow) {
  this.isShadow_ = shadow;
};

/**
 * Get whether this block is an insertion marker block or not.
 * @return {boolean} True if an insertion marker.
 */
Block.prototype.isInsertionMarker = function() {
  return this.isInsertionMarker_;
};

/**
 * Set whether this block is an insertion marker block or not.
 * @param {boolean} insertionMarker True if an insertion marker.
 */
Block.prototype.setInsertionMarker = function(insertionMarker) {
  if (this.isInsertionMarker_ == insertionMarker) {
    return;  // No change.
  }
  this.isInsertionMarker_ = insertionMarker;
  // TODO: handle removing insertion marker status.
  if (this.isInsertionMarker_) {
    this.setColour(Colours.insertionMarker);
    this.setOpacity(Colours.insertionMarkerOpacity);
    utils.addClass(/** @type {!Element} */ (this.svgGroup_),
        'blocklyInsertionMarker');
  }
};

/**
 * Get whether this block is editable or not.
 * @return {boolean} True if editable.
 */
Block.prototype.isEditable = function() {
  return this.editable_ && !(this.workspace && this.workspace.options.readOnly);
};

/**
 * Set whether this block is editable or not.
 * @param {boolean} editable True if editable.
 */
Block.prototype.setEditable = function(editable) {
  this.editable_ = editable;
  for (let i = 0, input; input = this.inputList[i]; i++) {
    for (let j = 0, field; field = input.fieldRow[j]; j++) {
      field.updateEditable();
    }
  }
};

/**
 * Set whether the connections are hidden (not tracked in a database) or not.
 * Recursively walk down all child blocks (except collapsed blocks).
 * @param {boolean} hidden True if connections are hidden.
 */
Block.prototype.setConnectionsHidden = function(hidden) {
  if (!hidden && this.isCollapsed()) {
    if (this.outputConnection) {
      this.outputConnection.setHidden(hidden);
    }
    if (this.previousConnection) {
      this.previousConnection.setHidden(hidden);
    }
    if (this.nextConnection) {
      this.nextConnection.setHidden(hidden);
      const child = this.nextConnection.targetBlock();
      if (child) {
        child.setConnectionsHidden(hidden);
      }
    }
  } else {
    const myConnections = this.getConnections_(true);
    for (let i = 0, connection; connection = myConnections[i]; i++) {
      connection.setHidden(hidden);
      if (connection.isSuperior()) {
        const child = connection.targetBlock();
        if (child) {
          child.setConnectionsHidden(hidden);
        }
      }
    }
  }
};

/**
 * Find the connection on this block that corresponds to the given connection
 * on the other block.
 * Used to match connections between a block and its insertion marker.
 * @param {!Block} otherBlock The other block to match against.
 * @param {!Connection} conn The other connection to match.
 * @return {Connection} the matching connection on this block, or null.
 */
Block.prototype.getMatchingConnection = function(otherBlock, conn) {
  const connections = this.getConnections_(true);
  const otherConnections = otherBlock.getConnections_(true);
  if (connections.length != otherConnections.length) {
    throw "Connection lists did not match in length.";
  }
  for (let i = 0; i < otherConnections.length; i++) {
    if (otherConnections[i] == conn) {
      return connections[i];
    }
  }
  return null;
};

/**
 * Set the URL of this block's help page.
 * @param {string|Function} url URL string for block help, or function that
 *     returns a URL.  Null for no help.
 */
Block.prototype.setHelpUrl = function(url) {
  this.helpUrl = url;
};

/**
 * Change the tooltip text for a block.
 * @param {string|!Function} newTip Text for tooltip or a parent element to
 *     link to for its tooltip.  May be a function that returns a string.
 */
Block.prototype.setTooltip = function(newTip) {
  this.tooltip = newTip;
};

/**
 * Get the colour of a block.
 * @return {string} #RRGGBB string.
 */
Block.prototype.getColour = function() {
  return this.colour_;
};

/**
 * Get the secondary colour of a block.
 * @return {string} #RRGGBB string.
 */
Block.prototype.getColourSecondary = function() {
  return this.colourSecondary_;
};

/**
 * Get the tertiary colour of a block.
 * @return {string} #RRGGBB string.
 */
Block.prototype.getColourTertiary = function() {
  return this.colourTertiary_;
};

/**
 * Get the quaternary colour of a block.
 * @return {string} #RRGGBB string.
 */
Block.prototype.getColourQuaternary = function() {
  return this.colourQuaternary_;
};

/**
 * Get the shadow colour of a block.
 * @return {string} #RRGGBB string.
 */
Block.prototype.getShadowColour = function() {
  return this.shadowColour_;
};

/**
 * Set the shadow colour of a block.
 * @param {number|string} colour HSV hue value, or #RRGGBB string.
 */
Block.prototype.setShadowColour = function(colour) {
  this.shadowColour_ = this.makeColour_(colour);
  if (this.rendered) {
    this.updateColour();
  }
};

/**
 * Clear the shadow colour of a block.
 */
Block.prototype.clearShadowColour = function() {
  this.shadowColour_ = null;
  if (this.rendered) {
    this.updateColour();
  }
};

/**
* Create an #RRGGBB string colour from a colour HSV hue value or #RRGGBB string.
* @param {number|string} colour HSV hue value, or #RRGGBB string.
* @return {string} #RRGGBB string.
* @private
*/
Block.prototype.makeColour_ = function(colour) {
  const hue = Number(colour);
  if (!isNaN(hue)) {
    return common.hueToRgb(hue);
  } else if (typeof colour === 'string' && colour.match(/^#[0-9a-fA-F]{6}$/)) {
    return colour;
  } else {
    throw 'Invalid colour: ' + colour;
  }
};

/**
 * Change the colour of a block, and optional secondary/teriarty colours.
 * @param {number|string} colour HSV hue value, or #RRGGBB string.
 * @param {number|string} colourSecondary HSV hue value, or #RRGGBB string.
 * @param {number|string} colourTertiary HSV hue value, or #RRGGBB string.
 * @param {number|string} colourQuaternary HSV hue value, or #RRGGBB string.
 */
Block.prototype.setColour = function(colour, colourSecondary, colourTertiary,
    colourQuaternary) {
  this.colour_ = this.makeColour_(colour);
  if (colourSecondary !== undefined) {
    this.colourSecondary_ = this.makeColour_(colourSecondary);
  } else {
    this.colourSecondary_ = color.rgbArrayToHex(
        color.darken(color.hexToRgb(this.colour_), 0.1));
  }
  if (colourTertiary !== undefined) {
    this.colourTertiary_ = this.makeColour_(colourTertiary);
  } else {
    this.colourTertiary_ = color.rgbArrayToHex(
        color.darken(color.hexToRgb(this.colour_), 0.2));
  }
  if (colourQuaternary !== undefined) {
    this.colourQuaternary_ = this.makeColour_(colourQuaternary);
  } else {
    this.colourQuaternary_ = this.colourTertiary_;
  }
  if (this.rendered) {
    this.updateColour();
  }
};

/**
 * Sets a callback function to use whenever the block's parent workspace
 * changes, replacing any prior onchange handler. This is usually only called
 * from the constructor, the block type initializer function, or an extension
 * initializer function.
 * @param {function(Blockly.Events.Abstract)} onchangeFn The callback to call
 *     when the block's workspace changes.
 * @throws {Error} if onchangeFn is not falsey or a function.
 */
Block.prototype.setOnChange = function(onchangeFn) {
  if (onchangeFn && typeof onchangeFn !== 'function') {
    throw new Error("onchange must be a function.");
  }
  if (this.onchangeWrapper_) {
    this.workspace.removeChangeListener(this.onchangeWrapper_);
  }
  this.onchange = onchangeFn;
  if (this.onchange) {
    this.onchangeWrapper_ = onchangeFn.bind(this);
    this.workspace.addChangeListener(this.onchangeWrapper_);
  }
};

/**
 * Returns the named field from a block.
 * @param {string} name The name of the field.
 * @return {Blockly.Field} Named field, or null if field does not exist.
 */
Block.prototype.getField = function(name) {
  for (let i = 0, input; input = this.inputList[i]; i++) {
    for (let j = 0, field; field = input.fieldRow[j]; j++) {
      if (field.name === name) {
        return field;
      }
    }
  }
  return null;
};

/**
 * Return all variables referenced by this block.
 * @return {!Array.<string>} List of variable names.
 * @package
 */
Block.prototype.getVars = function() {
  const vars = [];
  for (let i = 0, input; input = this.inputList[i]; i++) {
    for (let j = 0, field; field = input.fieldRow[j]; j++) {
      if (field.referencesVariables()) {
        vars.push(field.getValue());
      }
    }
  }
  return vars;
};

/**
 * Return all variables referenced by this block.
 * @return {!Array.<!Blockly.VariableModel>} List of variable models.
 * @package
 */
Block.prototype.getVarModels = function() {
  const vars = [];
  for (let i = 0, input; input = this.inputList[i]; i++) {
    for (let j = 0, field; field = input.fieldRow[j]; j++) {
      if (field.referencesVariables()) {
        const model = this.workspace.getVariableById(field.getValue());
        // Check if the variable actually exists (and isn't just a potential
        // variable).
        if (model) {
          vars.push(model);
        }
      }
    }
  }
  return vars;
};

/**
 * Notification that a variable is renaming but keeping the same ID.  If the
 * variable is in use on this block, rerender to show the new name.
 * @param {!Blockly.VariableModel} variable The variable being renamed.
 * @package
 */
Block.prototype.updateVarName = function(variable) {
  for (let i = 0, input; input = this.inputList[i]; i++) {
    for (let j = 0, field; field = input.fieldRow[j]; j++) {
      if (field.referencesVariables() &&
          variable.getId() == field.getValue()) {
        field.setText(variable.name);
      }
    }
  }
};

/**
 * Notification that a variable is renaming.
 * If the ID matches one of this block's variables, rename it.
 * @param {string} oldId ID of variable to rename.
 * @param {string} newId ID of new variable.  May be the same as oldId, but with
 *     an updated name.
 */
Block.prototype.renameVarById = function(oldId, newId) {
  for (let i = 0, input; input = this.inputList[i]; i++) {
    for (let j = 0, field; field = input.fieldRow[j]; j++) {
      if (field.referencesVariables() &&
          oldId == field.getValue()) {
        field.setValue(newId);
      }
    }
  }
};

/**
 * Returns the language-neutral value from the field of a block.
 * @param {string} name The name of the field.
 * @return {?string} Value from the field or null if field does not exist.
 */
Block.prototype.getFieldValue = function(name) {
  const field = this.getField(name);
  if (field) {
    return field.getValue();
  }
  return null;
};

/**
 * Change the field value for a block (e.g. 'CHOOSE' or 'REMOVE').
 * @param {string} newValue Value to be the new field.
 * @param {string} name The name of the field.
 */
Block.prototype.setFieldValue = function(newValue, name) {
  const field = this.getField(name);
  asserts.assertObject(field, 'Field "%s" not found.', name);
  field.setValue(newValue);
};

/**
 * Set whether this block can chain onto the bottom of another block.
 * @param {boolean} newBoolean True if there can be a previous statement.
 * @param {(string|Array.<string>|null)=} opt_check Statement type or
 *     list of statement types.  Null/undefined if any type could be connected.
 */
Block.prototype.setPreviousStatement = function(newBoolean, opt_check) {
  if (newBoolean) {
    if (opt_check === undefined) {
      opt_check = null;
    }
    if (!this.previousConnection) {
      asserts.assert(!this.outputConnection,
          'Remove output connection prior to adding previous connection.');
      this.previousConnection =
          this.makeConnection_(constants.PREVIOUS_STATEMENT);
    }
    this.previousConnection.setCheck(opt_check);
  } else {
    if (this.previousConnection) {
      asserts.assert(!this.previousConnection.isConnected(),
          'Must disconnect previous statement before removing connection.');
      this.previousConnection.dispose();
      this.previousConnection = null;
    }
  }
};

/**
 * Set whether another block can chain onto the bottom of this block.
 * @param {boolean} newBoolean True if there can be a next statement.
 * @param {(string|Array.<string>|null)=} opt_check Statement type or
 *     list of statement types.  Null/undefined if any type could be connected.
 */
Block.prototype.setNextStatement = function(newBoolean, opt_check) {
  if (newBoolean) {
    if (opt_check === undefined) {
      opt_check = null;
    }
    if (!this.nextConnection) {
      this.nextConnection = this.makeConnection_(constants.NEXT_STATEMENT);
    }
    this.nextConnection.setCheck(opt_check);
  } else {
    if (this.nextConnection) {
      asserts.assert(!this.nextConnection.isConnected(),
          'Must disconnect next statement before removing connection.');
      this.nextConnection.dispose();
      this.nextConnection = null;
    }
  }
};

/**
 * Set whether this block returns a value.
 * @param {boolean} newBoolean True if there is an output.
 * @param {(string|Array.<string>|null)=} opt_check Returned type or list
 *     of returned types.  Null or undefined if any type could be returned
 *     (e.g. variable get).
 */
Block.prototype.setOutput = function(newBoolean, opt_check) {
  if (newBoolean) {
    if (opt_check === undefined) {
      opt_check = null;
    }
    if (!this.outputConnection) {
      asserts.assert(!this.previousConnection,
          'Remove previous connection prior to adding output connection.');
      this.outputConnection = this.makeConnection_(constants.OUTPUT_VALUE);
    }
    this.outputConnection.setCheck(opt_check);
  } else {
    if (this.outputConnection) {
      asserts.assert(!this.outputConnection.isConnected(),
          'Must disconnect output value before removing connection.');
      this.outputConnection.dispose();
      this.outputConnection = null;
    }
  }
};

/**
 * Set whether value inputs are arranged horizontally or vertically.
 * @param {boolean} newBoolean True if inputs are horizontal.
 */
Block.prototype.setInputsInline = function(newBoolean) {
  if (this.inputsInline != newBoolean) {
    eventUtils.fire(new BlockChange(
        this, 'inline', null, this.inputsInline, newBoolean));
    this.inputsInline = newBoolean;
  }
};

/**
 * Get whether value inputs are arranged horizontally or vertically.
 * @return {boolean} True if inputs are horizontal.
 */
Block.prototype.getInputsInline = function() {
  if (this.inputsInline != undefined) {
    // Set explicitly.
    return this.inputsInline;
  }
  // Not defined explicitly.  Figure out what would look best.
  for (let i = 1; i < this.inputList.length; i++) {
    if (this.inputList[i - 1].type == constants.DUMMY_INPUT &&
        this.inputList[i].type == constants.DUMMY_INPUT) {
      // Two dummy inputs in a row.  Don't inline them.
      return false;
    }
  }
  for (let i = 1; i < this.inputList.length; i++) {
    if (this.inputList[i - 1].type == constants.INPUT_VALUE &&
        this.inputList[i].type == constants.DUMMY_INPUT) {
      // Dummy input after a value input.  Inline them.
      return true;
    }
  }
  return false;
};

/**
 * Get whether the block is disabled or not.
 * @returns {boolean} True if disabled.
 */
Block.prototype.isDisabled = function() {
  return this.disabled;
};

/**
 * Set whether the block is disabled or not.
 * @param {boolean} disabled True if disabled.
 */
Block.prototype.setDisabled = function(disabled) {
  if (this.disabled != disabled) {
    eventUtils.fire(new BlockChange(
        this, 'disabled', null, this.disabled, disabled));
    this.disabled = disabled;
  }
};

/**
 * Get whether the block is disabled or not due to parents.
 * The block's own disabled property is not considered.
 * @return {boolean} True if disabled.
 */
Block.prototype.getInheritedDisabled = function() {
  let ancestor = this.getSurroundParent();
  while (ancestor) {
    if (ancestor.disabled) {
      return true;
    }
    ancestor = ancestor.getSurroundParent();
  }
  // Ran off the top.
  return false;
};

/**
 * Get whether the block is collapsed or not.
 * @return {boolean} True if collapsed.
 */
Block.prototype.isCollapsed = function() {
  return this.collapsed_;
};

/**
 * Set whether the block is collapsed or not.
 * @param {boolean} collapsed True if collapsed.
 */
Block.prototype.setCollapsed = function(collapsed) {
  if (this.collapsed_ != collapsed) {
    eventUtils.fire(new BlockChange(
        this, 'collapsed', null, this.collapsed_, collapsed));
    this.collapsed_ = collapsed;
  }
};

/**
 * Create a human-readable text representation of this block and any children.
 * @param {number=} opt_maxLength Truncate the string to this length.
 * @param {string=} opt_emptyToken The placeholder string used to denote an
 *     empty field. If not specified, '?' is used.
 * @return {string} Text of block.
 */
Block.prototype.toString = function(opt_maxLength, opt_emptyToken) {
  let text = [];
  const emptyFieldPlaceholder = opt_emptyToken || '?';
  if (this.collapsed_) {
    text.push(this.getInput('_TEMP_COLLAPSED_INPUT').fieldRow[0].text_);
  } else {
    for (let i = 0, input; input = this.inputList[i]; i++) {
      for (let j = 0, field; field = input.fieldRow[j]; j++) {
        if (field instanceof FieldDropdown && !field.getValue()) {
          text.push(emptyFieldPlaceholder);
        } else {
          text.push(field.getText());
        }
      }
      if (input.connection) {
        const child = input.connection.targetBlock();
        if (child) {
          text.push(child.toString(undefined, opt_emptyToken));
        } else {
          text.push(emptyFieldPlaceholder);
        }
      }
    }
  }
  text = stringUtils.trim(text.join(' ')) || '???';
  if (opt_maxLength) {
    // TODO: Improve truncation so that text from this block is given priority.
    // E.g. "1+2+3+4+5+6+7+8+9=0" should be "...6+7+8+9=0", not "1+2+3+4+5...".
    // E.g. "1+2+3+4+5=6+7+8+9+0" should be "...4+5=6+7...".
    text = stringUtils.truncate(text, opt_maxLength);
  }
  return text;
};

/**
 * Shortcut for appending a value input row.
 * @param {string} name Language-neutral identifier which may used to find this
 *     input again.  Should be unique to this block.
 * @return {!Input} The input object created.
 */
Block.prototype.appendValueInput = function(name) {
  return this.appendInput_(constants.INPUT_VALUE, name);
};

/**
 * Shortcut for appending a statement input row.
 * @param {string} name Language-neutral identifier which may used to find this
 *     input again.  Should be unique to this block.
 * @return {!Input} The input object created.
 */
Block.prototype.appendStatementInput = function(name) {
  return this.appendInput_(constants.NEXT_STATEMENT, name);
};

/**
 * Shortcut for appending a dummy input row.
 * @param {string=} opt_name Language-neutral identifier which may used to find
 *     this input again.  Should be unique to this block.
 * @return {!Input} The input object created.
 */
Block.prototype.appendDummyInput = function(opt_name) {
  return this.appendInput_(constants.DUMMY_INPUT, opt_name || '');
};

/**
 * Initialize this block using a cross-platform, internationalization-friendly
 * JSON description.
 * @param {!Object} json Structured data describing the block.
 */
Block.prototype.jsonInit = function(json) {
  const warningPrefix = json['type'] ? 'Block "' + json['type'] + '": ' : '';

  // Validate inputs.
  asserts.assert(
      json['output'] == undefined || json['previousStatement'] == undefined,
      warningPrefix + 'Must not have both an output and a previousStatement.');

  // Set basic properties of block.
  if (json['colour'] !== undefined) {
    this.setColourFromJson_(json);
  }

  // Interpolate the message blocks.
  let i = 0;
  while (json['message' + i] !== undefined) {
    this.interpolate_(json['message' + i], json['args' + i] || [],
        json['lastDummyAlign' + i]);
    i++;
  }

  if (json['inputsInline'] !== undefined) {
    this.setInputsInline(json['inputsInline']);
  }
  // Set output and previous/next connections.
  if (json['output'] !== undefined) {
    this.setOutput(true, json['output']);
  }
  if (json['previousStatement'] !== undefined) {
    this.setPreviousStatement(true, json['previousStatement']);
  }
  if (json['nextStatement'] !== undefined) {
    this.setNextStatement(true, json['nextStatement']);
  }
  if (json['tooltip'] !== undefined) {
    const rawValue = json['tooltip'];
    const localizedText = utils.replaceMessageReferences(rawValue);
    this.setTooltip(localizedText);
  }
  if (json['enableContextMenu'] !== undefined) {
    const rawValue = json['enableContextMenu'];
    this.contextMenu = !!rawValue;
  }
  if (json['helpUrl'] !== undefined) {
    const rawValue = json['helpUrl'];
    const localizedValue = utils.replaceMessageReferences(rawValue);
    this.setHelpUrl(localizedValue);
  }
  if (typeof json['extensions'] === 'string') {
    console.warn('JSON attribute \'extensions\' should be an array of ' +
      'strings. Found raw string in JSON for \'' + json['type'] + '\' block.');
    json['extensions'] = [json['extensions']];  // Correct and continue.
  }

  // Add the mutator to the block
  if (json['mutator'] !== undefined) {
    Extensions.apply(json['mutator'], this, true);
  }

  if (Array.isArray(json['extensions'])) {
    const extensionNames = json['extensions'];
    for (let i = 0; i < extensionNames.length; ++i) {
      const extensionName = extensionNames[i];
      Extensions.apply(extensionName, this, false);
    }
  }
  if (json['outputShape'] !== undefined) {
    this.setOutputShape(json['outputShape']);
  }
  if (json['checkboxInFlyout'] !== undefined) {
    this.setCheckboxInFlyout(json['checkboxInFlyout']);
  }
  if (json['category'] !== undefined) {
    this.setCategory(json['category']);
  }
};

/**
 * Add key/values from mixinObj to this block object. By default, this method
 * will check that the keys in mixinObj will not overwrite existing values in
 * the block, including prototype values. This provides some insurance against
 * mixin / extension incompatibilities with future block features. This check
 * can be disabled by passing true as the second argument.
 * @param {!Object} mixinObj The key/values pairs to add to this block object.
 * @param {boolean=} opt_disableCheck Option flag to disable overwrite checks.
 */
Block.prototype.mixin = function(mixinObj, opt_disableCheck) {
  if (opt_disableCheck !== undefined && typeof opt_disableCheck !== 'boolean') {
    throw new Error("opt_disableCheck must be a boolean if provided");
  }
  if (!opt_disableCheck) {
    const overwrites = [];
    for (const key in mixinObj) {
      if (this[key] !== undefined) {
        overwrites.push(key);
      }
    }
    if (overwrites.length) {
      throw new Error('Mixin will overwrite block members: ' +
        JSON.stringify(overwrites));
    }
  }
  Object.assign(this, mixinObj);
};

/**
 * Set the colour of the block from strings or string table references.
 * @param {string|?} primary Primary colour, which may be a string that contains
 *     string table references.
 * @param {string|?} secondary Secondary colour, which may be a string that
 *     contains string table references.
 * @param {string|?} tertiary Tertiary colour, which may be a string that
 *     contains string table references.
 * @param {string|?} quaternary Quaternary colour, which may be a string that
 *     contains string table references.
 * @private
 */
Block.prototype.setColourFromRawValues_ = function(primary, secondary,
    tertiary, quaternary) {
  primary = typeof primary === 'string' ?
      utils.replaceMessageReferences(primary) : primary;
  secondary = typeof secondary === 'string' ?
      utils.replaceMessageReferences(secondary) : secondary;
  tertiary = typeof tertiary === 'string' ?
      utils.replaceMessageReferences(tertiary) : tertiary;
  quaternary = typeof quaternary === 'string' ?
      utils.replaceMessageReferences(quaternary) : quaternary;

  this.setColour(primary, secondary, tertiary, quaternary);
};

/**
 * Set the colour of the block from JSON, replacing message references as
 * needed.
 * @param {!Object} json Structured data describing the block.
 * @private
 */
Block.prototype.setColourFromJson_ = function(json) {
  this.setColourFromRawValues_(json['colour'], json['colourSecondary'],
      json['colourTertiary'], json['colourQuaternary']);
};

/**
 * Interpolate a message description onto the block.
 * @param {string} message Text contains interpolation tokens (%1, %2, ...)
 *     that match with fields or inputs defined in the args array.
 * @param {!Array} args Array of arguments to be interpolated.
 * @param {string=} lastDummyAlign If a dummy input is added at the end,
 *     how should it be aligned?
 * @private
 */
Block.prototype.interpolate_ = function(message, args, lastDummyAlign) {
  const tokens = utils.tokenizeInterpolation(message);
  // Interpolate the arguments.  Build a list of elements.
  const indexDup = [];
  let indexCount = 0;
  const elements = [];
  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i];
    if (typeof token == 'number') {
      if (token <= 0 || token > args.length) {
        throw new Error('Block "' + this.type + '": ' +
            'Message index %' + token + ' out of range.');
      }
      if (indexDup[token]) {
        throw new Error('Block "' + this.type + '": ' +
            'Message index %' + token + ' duplicated.');
      }
      indexDup[token] = true;
      indexCount++;
      elements.push(args[token - 1]);
    } else {
      token = token.trim();
      if (token) {
        elements.push(token);
      }
    }
  }
  if (indexCount != args.length) {
    throw new Error('Block "' + this.type + '": ' +
        'Message does not reference all ' + args.length + ' arg(s).');
  }
  // Add last dummy input if needed.
  if (elements.length && (typeof elements[elements.length - 1] == 'string' ||
      stringUtils.startsWith(
          elements[elements.length - 1]['type'], 'field_'))) {
    const dummyInput = {type: 'input_dummy'};
    if (lastDummyAlign) {
      dummyInput['align'] = lastDummyAlign;
    }
    elements.push(dummyInput);
  }
  // Lookup of alignment constants.
  const alignmentLookup = {
    'LEFT': constants.ALIGN_LEFT,
    'RIGHT': constants.ALIGN_RIGHT,
    'CENTRE': constants.ALIGN_CENTRE
  };
  // Populate block with inputs and fields.
  const fieldStack = [];
  for (let i = 0; i < elements.length; i++) {
    let element = elements[i];
    if (typeof element == 'string') {
      fieldStack.push([element, undefined]);
    } else {
      let field = null;
      let input = null;
      let altRepeat;
      do {
        altRepeat = false;
        if (typeof element == 'string') {
          field = new FieldLabel(element);
        } else {
          switch (element['type']) {
            case 'input_value':
              input = this.appendValueInput(element['name']);
              break;
            case 'input_statement':
              input = this.appendStatementInput(element['name']);
              break;
            case 'input_dummy':
              input = this.appendDummyInput(element['name']);
              break;
            default:
              field = Field.fromJson(element);

              // Unknown field.
              if (!field) {
                if (element['alt']) {
                  element = element['alt'];
                  altRepeat = true;
                } else {
                  console.warn('Blockly could not create a field of type ' +
                      element['type'] +
                      '. You may need to register your custom field.  See ' +
                      'github.com/google/blockly/issues/1584');
                }
              }
          }
        }
      } while (altRepeat);
      if (field) {
        fieldStack.push([field, element['name']]);
      } else if (input) {
        if (element['check']) {
          input.setCheck(element['check']);
        }
        if (element['align']) {
          input.setAlign(alignmentLookup[element['align']]);
        }
        for (let j = 0; j < fieldStack.length; j++) {
          input.appendField(fieldStack[j][0], fieldStack[j][1]);
        }
        fieldStack.length = 0;
      }
    }
  }
};

/**
 * Add a value input, statement input or local variable to this block.
 * @param {number} type Either constants.INPUT_VALUE or constants.NEXT_STATEMENT or
 *     Blockly.constants.DUMMY_INPUT.
 * @param {string} name Language-neutral identifier which may used to find this
 *     input again.  Should be unique to this block.
 * @return {!Input} The input object created.
 * @protected
 */
Block.prototype.appendInput_ = function(type, name) {
  let connection = null;
  if (type == constants.INPUT_VALUE || type == constants.NEXT_STATEMENT) {
    connection = this.makeConnection_(type);
  }
  const input = new Input(type, name, this, connection);
  // Append input to list.
  this.inputList.push(input);
  return input;
};

/**
 * Move a named input to a different location on this block.
 * @param {string} name The name of the input to move.
 * @param {?string} refName Name of input that should be after the moved input,
 *   or null to be the input at the end.
 */
Block.prototype.moveInputBefore = function(name, refName) {
  if (name == refName) {
    return;
  }
  // Find both inputs.
  let inputIndex = -1;
  let refIndex = refName ? -1 : this.inputList.length;
  for (let i = 0, input; input = this.inputList[i]; i++) {
    if (input.name == name) {
      inputIndex = i;
      if (refIndex != -1) {
        break;
      }
    } else if (refName && input.name == refName) {
      refIndex = i;
      if (inputIndex != -1) {
        break;
      }
    }
  }
  asserts.assert(inputIndex != -1, 'Named input "%s" not found.', name);
  asserts.assert(
      refIndex != -1, 'Reference input "%s" not found.', refName);
  this.moveNumberedInputBefore(inputIndex, refIndex);
};

/**
 * Move a numbered input to a different location on this block.
 * @param {number} inputIndex Index of the input to move.
 * @param {number} refIndex Index of input that should be after the moved input.
 */
Block.prototype.moveNumberedInputBefore = function(
    inputIndex, refIndex) {
  // Validate arguments.
  asserts.assert(inputIndex != refIndex, 'Can\'t move input to itself.');
  asserts.assert(inputIndex < this.inputList.length,
      'Input index ' + inputIndex + ' out of bounds.');
  asserts.assert(refIndex <= this.inputList.length,
      'Reference input ' + refIndex + ' out of bounds.');
  // Remove input.
  const input = this.inputList[inputIndex];
  this.inputList.splice(inputIndex, 1);
  if (inputIndex < refIndex) {
    refIndex--;
  }
  // Reinsert input.
  this.inputList.splice(refIndex, 0, input);
};

/**
 * Remove an input from this block.
 * @param {string} name The name of the input.
 * @param {boolean=} opt_quiet True to prevent error if input is not present.
 * @throws {asserts.AssertionError} if the input is not present and
 *     opt_quiet is not true.
 */
Block.prototype.removeInput = function(name, opt_quiet) {
  for (let i = 0, input; input = this.inputList[i]; i++) {
    if (input.name == name) {
      if (input.connection && input.connection.isConnected()) {
        input.connection.setShadowState(null);
        const block = input.connection.targetBlock();
        if (block.isShadow()) {
          // Destroy any attached shadow block.
          block.dispose();
        } else {
          // Disconnect any attached normal block.
          block.unplug();
        }
      }
      input.dispose();
      this.inputList.splice(i, 1);
      return;
    }
  }
  if (!opt_quiet) {
    asserts.fail('Input "%s" not found.', name);
  }
};

/**
 * Fetches the named input object.
 * @param {string} name The name of the input.
 * @return {Input} The input object, or null if input does not exist.
 */
Block.prototype.getInput = function(name) {
  for (let i = 0, input; input = this.inputList[i]; i++) {
    if (input.name == name) {
      return input;
    }
  }
  // This input does not exist.
  return null;
};

/**
 * Fetches the block attached to the named input.
 * @param {string} name The name of the input.
 * @return {Block} The attached value block, or null if the input is
 *     either disconnected or if the input does not exist.
 */
Block.prototype.getInputTargetBlock = function(name) {
  const input = this.getInput(name);
  return input && input.connection && input.connection.targetBlock();
};

/**
 * Returns the comment on this block (or '' if none).
 * @return {string} Block's comment.
 */
Block.prototype.getCommentText = function() {
  return this.comment || '';
};

/**
 * Set this block's comment text.
 * @param {?string} text The text, or null to delete.
 */
Block.prototype.setCommentText = function(text) {
  if (this.comment != text) {
    eventUtils.fire(new BlockChange(
        this, 'comment', null, this.comment, text || ''));
    this.comment = text;
  }
};

/**
 * Set this block's output shape.
 * e.g., OUTPUT_SHAPE_NORMAL(null), OUTPUT_SHAPE_HEXAGONAL, OUTPUT_SHAPE_ROUND, OUTPUT_SHAPE_SQUARE.
 * @param {?number} outputShape Value representing output shape
 *     (see constants.js).
 */
Block.prototype.setOutputShape = function(outputShape) {
  this.outputShape_ = outputShape;
};

/**
 * Get this block's output shape.
 * @return {?number} Value representing output shape (see constants.js).
 */
Block.prototype.getOutputShape = function() {
  return this.outputShape_;
};

/**
 * Set this block's category (for styling purposes)
 * @param {?string} category The block's category (see constants.js).
 */
Block.prototype.setCategory = function(category) {
  this.category_ = category;
};

/**
 * Get this block's category (for styling purposes)
 * @return {?string} category The block's category (see constants.js).
 */
Block.prototype.getCategory = function() {
  return this.category_;
};

/**
 * Set whether this block has a checkbox next to it in the flyout.
 * @param {boolean} hasCheckbox True if this block should have a checkbox.
 */
Block.prototype.setCheckboxInFlyout = function(hasCheckbox) {
  this.checkboxInFlyout_ = hasCheckbox;
};

/**
 * Get whether this block has a checkbox next to it in the flyout.
 * @return {boolean} True if this block should have a checkbox.
 */
Block.prototype.hasCheckboxInFlyout = function() {
  return this.checkboxInFlyout_;
};

/**
 * Set this block's warning text.
 * @param {?string} text The text, or null to delete.
 * @abstract
 */
Block.prototype.setWarningText = function(/* text */) {
  // NOP.
};

/**
 * Give this block a mutator dialog.
 * @param {Blockly.Mutator} mutator A mutator dialog instance or null to remove.
 * @abstract
 */
Block.prototype.setMutator = function(/* mutator */) {
  // NOP.
};

/**
 * Return the coordinates of the top-left corner of this block relative to the
 * drawing surface's origin (0,0), in workspace units.
 * @return {!Coordinate} Object with .x and .y properties.
 */
Block.prototype.getRelativeToSurfaceXY = function() {
  return this.xy_;
};

/**
 * Move a block by a relative offset.
 * @param {number} dx Horizontal offset, in workspace units.
 * @param {number} dy Vertical offset, in workspace units.
 */
Block.prototype.moveBy = function(dx, dy) {
  asserts.assert(!this.parentBlock_, 'Block has parent.');
  const event = new BlockMove(this);
  this.xy_.translate(dx, dy);
  event.recordNew();
  eventUtils.fire(event);
};

/**
 * Create a connection of the specified type.
 * @param {number} type The type of the connection to create.
 * @return {!Connection} A new connection of the specified type.
 * @private
 */
Block.prototype.makeConnection_ = function(type) {
  return new Connection(this, type);
};

/**
 * Recursively checks whether all statement and value inputs are filled with
 * blocks. Also checks all following statement blocks in this stack.
 * @param {boolean=} opt_shadowBlocksAreFilled An optional argument controlling
 *     whether shadow blocks are counted as filled. Defaults to true.
 * @return {boolean} True if all inputs are filled, false otherwise.
 */
Block.prototype.allInputsFilled = function(opt_shadowBlocksAreFilled) {
  // Account for the shadow block filledness toggle.
  if (opt_shadowBlocksAreFilled === undefined) {
    opt_shadowBlocksAreFilled = true;
  }
  if (!opt_shadowBlocksAreFilled && this.isShadow()) {
    return false;
  }

  // Recursively check each input block of the current block.
  for (let i = 0, input; input = this.inputList[i]; i++) {
    if (!input.connection) {
      continue;
    }
    const target = input.connection.targetBlock();
    if (!target || !target.allInputsFilled(opt_shadowBlocksAreFilled)) {
      return false;
    }
  }

  // Recursively check the next block after the current block.
  const next = this.getNextBlock();
  if (next) {
    return next.allInputsFilled(opt_shadowBlocksAreFilled);
  }

  return true;
};

/**
 * This method returns a string describing this Block in developer terms (type
 * name and ID; English only).
 *
 * Intended to on be used in console logs and errors. If you need a string that
 * uses the user's native language (including block text, field values, and
 * child blocks), use [toString()]{@link Block#toString}.
 * @return {string} The description.
 */
Block.prototype.toDevString = function() {
  let msg = this.type ? '"' + this.type + '" block' : 'Block';
  if (this.id) {
    msg += ' (id="' + this.id + '")';
  }
  return msg;
};
