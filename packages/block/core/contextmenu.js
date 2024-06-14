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
 * @fileoverview Functionality for the right-click context menus.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

/**
 * @name ContextMenu
 * @namespace
 */
import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.ContextMenu');

import * as browserEvents from './browser_events';
import * as clipboard from './clipboard';
import * as constants from './constants';
import * as eventUtils from './events/utils';
import {BlockCreate} from './events/block_create';
import {Msg} from './msg';
import * as scratchBlocksUtils from './scratch_blocks_utils';
import * as utils from './utils';
import * as uiMenu from './ui_menu_utils';
import {WidgetDiv} from './widgetdiv';
import {WorkspaceComment} from './workspace_comment';
import {WorkspaceCommentSvg} from './workspace_comment_svg';
import * as blocks from './serialization/blocks';

const events = goog.require('goog.events');
const Coordinate = goog.require('goog.math.Coordinate');
const Component = goog.require('goog.ui.Component');
const Menu = goog.require('goog.ui.Menu');
const MenuItem = goog.require('goog.ui.MenuItem');
const userAgent = goog.require('goog.userAgent');


export const ContextMenu = function() {};

/**
 * Which block is the context menu attached to?
 * @type {Blockly.Block}
 */
ContextMenu.currentBlock = null;

/**
 * Opaque data that can be passed to browserEvents.unbind.
 * @type {Array.<!Array>}
 * @private
 */
ContextMenu.eventWrapper_ = null;

/**
 * Construct the menu based on the list of options and show the menu.
 * @param {!Event} e Mouse event.
 * @param {!Array.<!Object>} options Array of menu options.
 * @param {boolean} rtl True if RTL, false if LTR.
 */
ContextMenu.show = function(e, options, rtl) {
  WidgetDiv.show(ContextMenu, rtl, null);
  if (!options.length) {
    ContextMenu.hide();
    return;
  }
  const menu = ContextMenu.populate_(options, rtl);

  events.listen(
      menu, Component.EventType.ACTION, ContextMenu.hide);

  ContextMenu.position_(menu, e, rtl);
  // 1ms delay is required for focusing on context menus because some other
  // mouse event is still waiting in the queue and clears focus.
  setTimeout(function() {menu.getElement().focus();}, 1);
  ContextMenu.currentBlock = null;  // May be set by Blockly.Block.
};

/**
 * Create the context menu object and populate it with the given options.
 * @param {!Array.<!Object>} options Array of menu options.
 * @param {boolean} rtl True if RTL, false if LTR.
 * @return {!Menu} The menu that will be shown on right click.
 * @private
 */
ContextMenu.populate_ = function(options, rtl) {
  /* Here's what one option object looks like:
    {text: 'Make It So',
     enabled: true,
     callback: Blockly.MakeItSo}
  */
  const menu = new Menu();
  menu.setRightToLeft(rtl);
  for (let i = 0, option; option = options[i]; i++) {
    const menuItem = new MenuItem(option.text);
    menuItem.setRightToLeft(rtl);
    menu.addChild(menuItem, true);
    menuItem.setEnabled(option.enabled);
    if (option.enabled) {
      events.listen(
          menuItem, Component.EventType.ACTION, option.callback);
      menuItem.handleContextMenu = function(/* e */) {
        // Right-clicking on menu option should count as a click.
        events.dispatchEvent(this, Component.EventType.ACTION);
      };
    }
  }
  return menu;
};

/**
 * Add the menu to the page and position it correctly.
 * @param {!Menu} menu The menu to add and position.
 * @param {!Event} e Mouse event for the right click that is making the context
 *     menu appear.
 * @param {boolean} rtl True if RTL, false if LTR.
 * @private
 */
ContextMenu.position_ = function(menu, e, rtl) {
  // Record windowSize and scrollOffset before adding menu.
  const viewportBBox = utils.getViewportBBox();
  // This one is just a point, but we'll pretend that it's a rect so we can use
  // some helper functions.
  const anchorBBox = {
    top: e.clientY + viewportBBox.top,
    bottom: e.clientY + viewportBBox.top,
    left: e.clientX + viewportBBox.left,
    right: e.clientX + viewportBBox.left
  };

  ContextMenu.createWidget_(menu);
  const menuSize = uiMenu.getSize(menu);

  if (rtl) {
    uiMenu.adjustBBoxesForRTL(viewportBBox, anchorBBox, menuSize);
  }

  WidgetDiv.positionWithAnchor(viewportBBox, anchorBBox, menuSize, rtl);
  // Calling menuDom.focus() has to wait until after the menu has been placed
  // correctly.  Otherwise it will cause a page scroll to get the misplaced menu
  // in view.  See issue #1329.
  menu.getElement().focus();
};

/**
 * Create and render the menu widget inside Blockly's widget div.
 * @param {!Menu} menu The menu to add to the widget div.
 * @private
 */
ContextMenu.createWidget_ = function(menu) {
  const div = WidgetDiv.DIV;
  menu.render(div);
  const menuDom = menu.getElement();
  utils.addClass(menuDom, 'blocklyContextMenu');
  // Prevent system context menu when right-clicking a Blockly context menu.
  browserEvents.conditionalBind(
      menuDom, 'contextmenu', null, utils.noEvent);
  // Enable autofocus after the initial render to avoid issue #1329.
  menu.setAllowAutoFocus(true);
};

/**
 * Hide the context menu.
 */
ContextMenu.hide = function() {
  WidgetDiv.hideIfOwner(ContextMenu);
  ContextMenu.currentBlock = null;
  if (ContextMenu.eventWrapper_) {
    browserEvents.unbind(ContextMenu.eventWrapper_);
  }
};

/**
 * Create a callback function that creates and configures a block,
 *   then places the new block next to the original.
 * @param {!Blockly.Block} block Original block.
 * @param {!Object} state JSON representation of new block.
 * @return {!Function} Function that creates a block.
 */
ContextMenu.callbackFactory = function(block, state) {
  return function() {
    eventUtils.disable();
    let newBlock;
    try {
      newBlock = blocks.load(state, block.workspace);
      // Move the new block next to the old block.
      const xy = block.getRelativeToSurfaceXY();
      if (block.RTL) {
        xy.x -= constants.SNAP_RADIUS;
      } else {
        xy.x += constants.SNAP_RADIUS;
      }
      xy.y += constants.SNAP_RADIUS * 2;
      newBlock.moveBy(xy.x, xy.y);
    } finally {
      eventUtils.enable();
    }
    if (eventUtils.isEnabled() && !newBlock.isShadow()) {
      eventUtils.fire(new BlockCreate(newBlock));
    }
    newBlock.select();
  };
};

// Helper functions for creating context menu options.

/**
 * Make a context menu option for deleting the current block.
 * @param {!Blockly.BlockSvg} block The block where the right-click originated.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 * @package
 */
ContextMenu.blockDeleteOption = function(block) {
  // Option to delete this block but not blocks lower in the stack.
  // Count the number of blocks that are nested in this block,
  // ignoring shadows and without ordering.
  let descendantCount = block.getDescendants(false, true).length;
  const nextBlock = block.getNextBlock();
  if (nextBlock) {
    // Blocks in the current stack would survive this block's deletion.
    descendantCount -= nextBlock.getDescendants(false, true).length;
  }
  const deleteOption = {
    text: descendantCount == 1 ? Msg.DELETE_BLOCK :
        Msg.DELETE_X_BLOCKS.replace('%1', String(descendantCount)),
    enabled: true,
    callback: function() {
      eventUtils.setGroup(true);
      block.dispose(true, true);
      eventUtils.setGroup(false);
    }
  };
  return deleteOption;
};

/**
 * Make a context menu option for showing help for the current block.
 * @param {!Blockly.BlockSvg} block The block where the right-click originated.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 * @package
 */
ContextMenu.blockHelpOption = function(block) {
  const url = typeof block.helpUrl === 'function' ? block.helpUrl() : block.helpUrl;
  const helpOption = {
    enabled: !!url,
    text: Msg.HELP,
    callback: function() {
      block.showHelp_();
    }
  };
  return helpOption;
};

/**
 * Make a context menu option for duplicating the current block.
 * @param {!Blockly.BlockSvg} block The block where the right-click originated.
 * @param {!Event} event Event that caused the context menu to open.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 * @package
 */
ContextMenu.blockDuplicateOption = function(block, event) {
  const duplicateOption = {
    text: Msg.DUPLICATE,
    enabled: true,
    callback:
        scratchBlocksUtils.duplicateAndDragCallback(block, event)
  };
  return duplicateOption;
};

/**
 * Make a context menu option for adding or removing comments on the current
 * block.
 * @param {!Blockly.BlockSvg} block The block where the right-click originated.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 * @package
 */
ContextMenu.blockCommentOption = function(block) {
  const commentOption = {
    enabled: !userAgent.IE
  };
  // If there's already a comment, add an option to delete it.
  if (block.comment) {
    commentOption.text = Msg.REMOVE_COMMENT;
    commentOption.callback = function() {
      block.setCommentText(null);
    };
  } else {
    // If there's no comment, add an option to create a comment.
    commentOption.text = Msg.ADD_COMMENT;
    commentOption.callback = function() {
      block.setCommentText('');
      block.comment.focus();
    };
  }
  return commentOption;
};

/**
 * Make a context menu option for copying the current block.
 * @param {!Blockly.BlockSvg} block The block where the right-click originated.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 */
ContextMenu.blockCopyOption = function(block) {
  return {
    text: Msg.COPY,
    enabled: true,
    callback: scratchBlocksUtils.copyCallback(block)
  };
};

/**
 * Make a context menu option for pasting blocks on the workspace.
 * @param {!Blockly.WorkspaceSvg} ws The workspace where the right-click
 *     originated.
 * @param {!Event} e Mouse event.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 */
ContextMenu.wsPasteOption = function(ws, e) {
  return {
    text: Msg.PASTE,
    enabled: true,
    callback: scratchBlocksUtils.pasteCallback(ws, e)
  };
};

/**
 * Make a context menu option for undoing the most recent action on the
 * workspace.
 * @param {!Blockly.WorkspaceSvg} ws The workspace where the right-click
 *     originated.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 * @package
 */
ContextMenu.wsUndoOption = function(ws) {
  return {
    text: Msg.UNDO,
    enabled: ws.hasUndoStack(),
    callback: ws.undo.bind(ws, false)
  };
};

/**
 * Make a context menu option for redoing the most recent action on the
 * workspace.
 * @param {!Blockly.WorkspaceSvg} ws The workspace where the right-click
 *     originated.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 * @package
 */
ContextMenu.wsRedoOption = function(ws) {
  return {
    text: Msg.REDO,
    enabled: ws.hasRedoStack(),
    callback: ws.undo.bind(ws, true)
  };
};

/**
 * Make a context menu option for cleaning up blocks on the workspace, by
 * aligning them vertically.
 * @param {!Blockly.WorkspaceSvg} ws The workspace where the right-click
 *     originated.
 * @param {number} numTopBlocks The number of top blocks on the workspace.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 * @package
 */
ContextMenu.wsCleanupOption = function(ws, numTopBlocks) {
  return {
    text: Msg.CLEAN_UP,
    enabled: numTopBlocks > 1,
    callback: ws.cleanUp.bind(ws, true)
  };
};

/**
 * Helper function for toggling delete state on blocks on the workspace, to be
 * called from a right-click menu.
 * @param {!Array.<!Blockly.BlockSvg>} topBlocks The list of top blocks on the
 *     the workspace.
 * @param {boolean} shouldCollapse True if the blocks should be collapsed, false
 *     if they should be expanded.
 * @private
 */
ContextMenu.toggleCollapseFn_ = function(topBlocks, shouldCollapse) {
  // Add a little animation to collapsing and expanding.
  const DELAY = 10;
  let ms = 0;
  for (let i = 0; i < topBlocks.length; i++) {
    let block = topBlocks[i];
    while (block) {
      setTimeout(block.setCollapsed.bind(block, shouldCollapse), ms);
      block = block.getNextBlock();
      ms += DELAY;
    }
  }
};

/**
 * Make a context menu option for collapsing all block stacks on the workspace.
 * @param {boolean} hasExpandedBlocks Whether there are any non-collapsed blocks
 *     on the workspace.
 * @param {!Array.<!Blockly.BlockSvg>} topBlocks The list of top blocks on the
 *     the workspace.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 * @package
 */
ContextMenu.wsCollapseOption = function(hasExpandedBlocks, topBlocks) {
  return {
    enabled: hasExpandedBlocks,
    text: Msg.COLLAPSE_ALL,
    callback: function() {
      ContextMenu.toggleCollapseFn_(topBlocks, true);
    }
  };
};

/**
 * Make a context menu option for expanding all block stacks on the workspace.
 * @param {boolean} hasCollapsedBlocks Whether there are any collapsed blocks
 *     on the workspace.
 * @param {!Array.<!Blockly.BlockSvg>} topBlocks The list of top blocks on the
 *     the workspace.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 * @package
 */
ContextMenu.wsExpandOption = function(hasCollapsedBlocks, topBlocks) {
  return {
    enabled: hasCollapsedBlocks,
    text: Msg.EXPAND_ALL,
    callback: function() {
      ContextMenu.toggleCollapseFn_(topBlocks, false);
    }
  };
};

/**
 * Make a context menu option for deleting the current workspace comment.
 * @param {!WorkspaceCommentSvg} comment The workspace comment where the
 *     right-click originated.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 * @package
 */
ContextMenu.commentDeleteOption = function(comment) {
  const deleteOption = {
    text: Msg.DELETE,
    enabled: true,
    callback: function() {
      eventUtils.setGroup(true);
      comment.dispose(true, true);
      eventUtils.setGroup(false);
    }
  };
  return deleteOption;
};

/**
 * Make a context menu option for duplicating the current workspace comment.
 * @param {!WorkspaceCommentSvg} comment The workspace comment where the
 *     right-click originated.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 * @package
 */
ContextMenu.commentDuplicateOption = function(comment) {
  const duplicateOption = {
    text: Msg.DUPLICATE,
    enabled: true,
    callback: function() {
      clipboard.duplicate(comment);
    }
  };
  return duplicateOption;
};

/**
 * Make a context menu option for adding a comment on the workspace.
 * @param {!Blockly.WorkspaceSvg} ws The workspace where the right-click
 *     originated.
 * @param {!Event} e The right-click mouse event.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 * @package
 */
ContextMenu.workspaceCommentOption = function(ws, e) {
  // Helper function to create and position a comment correctly based on the
  // location of the mouse event.
  const addWsComment = function() {
    // Disable events while this comment is getting created
    // so that we can fire a single create event for this comment
    // at the end (instead of CommentCreate followed by CommentMove,
    // which results in unexpected undo behavior).
    let disabled = false;
    if (eventUtils.isEnabled()) {
      eventUtils.disable();
      disabled = true;
    }
    const comment = new WorkspaceCommentSvg(
        ws, '', WorkspaceCommentSvg.DEFAULT_SIZE,
        WorkspaceCommentSvg.DEFAULT_SIZE, false);

    const injectionDiv = ws.getInjectionDiv();
    // Bounding rect coordinates are in client coordinates, meaning that they
    // are in pixels relative to the upper left corner of the visible browser
    // window.  These coordinates change when you scroll the browser window.
    const boundingRect = injectionDiv.getBoundingClientRect();

    // The client coordinates offset by the injection div's upper left corner.
    const clientOffsetPixels = new Coordinate(
        e.clientX - boundingRect.left, e.clientY - boundingRect.top);

    // The offset in pixels between the main workspace's origin and the upper
    // left corner of the injection div.
    const mainOffsetPixels = ws.getOriginOffsetInPixels();

    // The position of the new comment in pixels relative to the origin of the
    // main workspace.
    const finalOffsetPixels = Coordinate.difference(clientOffsetPixels,
        mainOffsetPixels);

    // The position of the new comment in main workspace coordinates.
    const finalOffsetMainWs = finalOffsetPixels.scale(1 / ws.scale);

    const commentX = finalOffsetMainWs.x;
    const commentY = finalOffsetMainWs.y;
    comment.moveBy(commentX, commentY);
    if (ws.rendered) {
      comment.initSvg();
      comment.render(false);
      comment.select();
    }
    if (disabled) {
      eventUtils.enable();
    }
    WorkspaceComment.fireCreateEvent(comment);
  };

  const wsCommentOption = {enabled: true};
  wsCommentOption.text = Msg.ADD_COMMENT;
  wsCommentOption.callback = function() {
    addWsComment();
  };
  return wsCommentOption;
};

// End helper functions for creating context menu options.
