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

/**
 * @fileoverview Utility methods for Scratch Blocks but not Blockly.
 * @author fenichel@google.com (Rachel Fenichel)
 */
'use strict';

/**
 * @name Blockly.scratchBlocksUtils
 * @namespace
 **/
import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.scratchBlocksUtils');

import * as eventUtils from './events/utils';
import {BlockCreate} from './events/block_create';
import * as registry from './registry';
import * as Touch from './touch';
import * as utils from './utils';
import * as Xml from './xml';

const dom = goog.require('goog.dom');


/**
 * Measure some text using a canvas in-memory.
 * Does not exist in Blockly, but needed in scratch-blocks
 * @param {string} fontSize E.g., '10pt'
 * @param {string} fontFamily E.g., 'Arial'
 * @param {string} fontWeight E.g., '600'
 * @param {string} text The actual text to measure
 * @return {number} Width of the text in px.
 * @package
 */
export const measureText = function(fontSize, fontFamily,
    fontWeight, text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = fontWeight + ' ' + fontSize + ' ' + fontFamily;
  return context.measureText(text).width;
};

/**
 * Encode a string's HTML entities.
 * E.g., <a> -> &lt;a&gt;
 * Does not exist in Blockly, but needed in scratch-blocks
 * @param {string} rawStr Unencoded raw string to encode.
 * @return {string} String with HTML entities encoded.
 * @package
 */
export const encodeEntities = function(rawStr) {
  // CC-BY-SA https://stackoverflow.com/questions/18749591/encode-html-entities-in-javascript
  return rawStr.replace(/[\u00A0-\u9999<>&]/gim, function(i) {
    return '&#' + i.charCodeAt(0) + ';';
  });
};

/**
 * Re-assign obscured shadow blocks new IDs to prevent collisions
 * Scratch specific to help the VM handle deleting obscured shadows.
 * @param {Blockly.Block} block the root block to be processed.
 * @package
 */
export const changeObscuredShadowIds = function(block) {
  const blocks = block.getDescendants(false);
  for (let i = blocks.length - 1; i >= 0; i--) {
    const descendant = blocks[i];
    for (let j = 0; j < descendant.inputList.length; j++) {
      const connection = descendant.inputList[j].connection;
      if (connection) {
        const shadowDom = connection.getShadowDom();
        if (shadowDom) {
          shadowDom.setAttribute('id', utils.genUid());
          connection.setShadowDom(shadowDom);
        }
      }
    }
  }
};

/**
 * Whether a block is both a shadow block and an argument reporter.  These
 * blocks have special behaviour in scratch-blocks: they're duplicated when
 * dragged, and they are rendered slightly differently from normal shadow
 * blocks.
 * @param {!Blockly.BlockSvg} block The block that should be used to make this
 *     decision.
 * @return {boolean} True if the block should be duplicated on drag.
 * @package
 */
export const isShadowArgumentReporter = function(block) {
  return (block.isShadow() && (block.type == 'argument_reporter_boolean' ||
      block.type == 'argument_reporter_string_number'));
};

/**
 * Compare strings with natural number sorting.
 * @param {string} str1 First input.
 * @param {string} str2 Second input.
 * @return {number} -1, 0, or 1 to signify greater than, equality, or less than.
 */
export const compareStrings = function(str1, str2) {
  return str1.localeCompare(str2, [], {
    sensitivity: 'base',
    numeric: true
  });
};

/**
 * Determine if this block can be recycled in the flyout.  Blocks that have no
 * variables and are not dynamic shadows can be recycled.
 * @param {Blockly.Block} block The block to check.
 * @return {boolean} True if the block can be recycled.
 * @package
 */
export const blockIsRecyclable = function(block) {
  // If the block needs to parse mutations or extra state, never recycle.
  if ((block.mutationToDom && block.domToMutation) ||
    (block.saveExtraState && block.loadExtraState)) {
    return false;
  }

  for (let i = 0; i < block.inputList.length; i++) {
    const input = block.inputList[i];
    for (let j = 0; j < input.fieldRow.length; j++) {
      const field = input.fieldRow[j];
      // No variables.
      if (field instanceof registry.getClass(registry.Type.FIELD, 'field_variable') ||
          field instanceof registry.getClass(registry.Type.FIELD, 'field_variable_getter')) {
        return false;
      }
      if (field instanceof registry.getClass(registry.Type.FIELD, 'field_dropdown') ||
          field instanceof registry.getClass(registry.Type.FIELD, 'field_numberdropdown') ||
          field instanceof registry.getClass(registry.Type.FIELD, 'field_textdropdown')) {
        if (field.isOptionListDynamic()) {
          return false;
        }
      }
    }
    // Check children.
    if (input.connection) {
      const child = input.connection.targetBlock();
      if (child && !blockIsRecyclable(child)) {
        return false;
      }
    }
  }
  return true;
};


/**
 * Creates a callback function for a click on the "duplicate" context menu
 * option in Scratch Blocks.  The block is duplicated and attached to the mouse,
 * which acts as though it were pressed and mid-drag.  Clicking the mouse
 * releases the new dragging block.
 * @param {!Blockly.BlockSvg} oldBlock The block that will be duplicated.
 * @param {!Event} event Event that caused the context menu to open.
 * @return {Function} A callback function that duplicates the block and starts a
 *     drag.
 * @package
 */
export const duplicateAndDragCallback = function(oldBlock, event) {
  const isMouseEvent = Touch.getTouchIdentifierFromEvent(event) === 'mouse';
  return function(e) {
    // Give the context menu a chance to close.
    setTimeout(function() {
      const ws = oldBlock.workspace;
      const svgRootOld = oldBlock.getSvgRoot();
      if (!svgRootOld) {
        throw new Error('oldBlock is not rendered.');
      }

      // Create the new block by cloning the block in the flyout (via XML).
      const xml = Xml.blockToDom(oldBlock);
      // The target workspace would normally resize during domToBlock, which
      // will lead to weird jumps.
      // Resizing will be enabled when the drag ends.
      ws.setResizesEnabled(false);

      // Disable events and manually emit events after the block has been
      // positioned and has had its shadow IDs fixed (Scratch-specific).
      eventUtils.disable();
      let newBlock;
      try {
        // Using domToBlock instead of domToWorkspace means that the new block
        // will be placed at position (0, 0) in main workspace units.
        newBlock = Xml.domToBlock(xml, ws);

        // Scratch-specific: Give shadow dom new IDs to prevent duplicating on paste
        changeObscuredShadowIds(newBlock);

        const svgRootNew = newBlock.getSvgRoot();
        if (!svgRootNew) {
          throw new Error('newBlock is not rendered.');
        }

        // The position of the old block in workspace coordinates.
        const oldBlockPosWs = oldBlock.getRelativeToSurfaceXY();

        // Place the new block as the same position as the old block.
        // TODO: Offset by the difference between the mouse position and the upper
        // left corner of the block.
        newBlock.moveBy(oldBlockPosWs.x, oldBlockPosWs.y);
        if (!isMouseEvent) {
          const offsetX = ws.RTL ? -100 : 100;
          const offsetY = 100;
          newBlock.moveBy(offsetX, offsetY); // Just offset the block for touch.
        }
      } finally {
        eventUtils.enable();
      }
      if (eventUtils.isEnabled()) {
        eventUtils.fire(new BlockCreate(newBlock));
      }

      if (isMouseEvent) {
        // e is not a real mouseEvent/touchEvent/pointerEvent.  It's an event
        // created by the context menu and has the coordinates of the mouse
        // click that opened the context menu.
        const fakeEvent = {
          clientX: event.clientX,
          clientY: event.clientY,
          type: 'mousedown',
          preventDefault: function() {
            e.preventDefault();
          },
          stopPropagation: function() {
            e.stopPropagation();
          },
          target: e.target
        };
        ws.startDragWithFakeEvent(fakeEvent, newBlock);
      }
    }, 0);
  };
};

/**
 * Creates a callback function for a click on the "copy" context menu option.
 * @param {!Blockly.BlockSvg} block The block that will be copied.
 * @return {Function} A callback function that copy the block.
 * @package
 */
export const copyCallback = function(block) {
  return function() {
    /** @type {Clipboard} */
    const clipboard = goog.global.navigator.clipboard;

    const xml = dom.createDom('xml');
    xml.appendChild(Xml.blockToDom(block, true));
    clipboard.writeText(Xml.domToText(xml));
  };
};

/**
 * Creates a callback function for a click on the "paste" context menu option.
 * @param {!Blockly.WorkspaceSvg} ws The workspace that the block will paste on.
 * @param {!MouseEvent} event Mouse Event.
 * @return {Function} A callback function that paste the block.
 * @package
 */
export const pasteCallback = function(ws, event) {
  return function() {
    /** @type {Clipboard} */
    const clipboard = goog.global.navigator.clipboard;

    clipboard.readText().then(function(data) {
      eventUtils.disable();
      let newBlock;
      try {
        const xml = Xml.textToDom(data);
        if (!xml) {
          throw 'Invalid XML';
        }

        newBlock = Xml.domToBlock(xml.firstChild, ws);

        const point = utils.mouseToSvg(event, ws.getParentSvg(),  ws.getInverseScreenCTM());
        const rel = ws.getOriginOffsetInPixels();
        const x = (point.x - rel.x) / ws.scale;
        const y = (point.y - rel.y) / ws.scale;

        newBlock.moveBy(ws.RTL ? -x : x, y);
        // Refresh toolbox to adapting new blocks
        ws.refreshToolboxSelection_();
      } finally {
        eventUtils.enable();
        if (eventUtils.isEnabled() && newBlock) {
          eventUtils.fire(new BlockCreate(newBlock));
        }
      }
    });
  };
};
