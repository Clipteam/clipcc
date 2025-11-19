/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test, beforeAll, afterAll, beforeEach} from '@jest/globals';
import * as Blockly from 'blockly/core';
import {defineTestBlock} from '../helpers/block';
import {BlockCommentResize} from '../../src/events/block_comment_resize';
import {BlockCommentIcon} from '../../src/block_comment_icon';

describe('Event: BlockCommentResize', () => {
  let workspace: Blockly.Workspace;
  let block: Blockly.BlockSvg;
  let icon: BlockCommentIcon;

  beforeAll(() => {
    defineTestBlock();
    workspace = new Blockly.Workspace();
    Blockly.Events.disable();
  });

  beforeEach(() => {
    block = workspace.newBlock('test_block') as Blockly.BlockSvg;
    icon = new BlockCommentIcon(block);
    block.addIcon(icon);
  });

  afterAll(() => {
    workspace.dispose();
  });

  describe('Constructor', () => {
    test('Stores old and new sizes', () => {
      const oldSize = new Blockly.utils.Size(100, 200);
      const newSize = new Blockly.utils.Size(150, 250);
      const event = new BlockCommentResize(icon, oldSize, newSize);
      expect(event.oldSize).toEqual(oldSize);
      expect(event.newSize).toEqual(newSize);
    });
  });

  describe('Undo and Redo', () => {
    test('Undo', () => {
      const oldSize = new Blockly.utils.Size(100, 200);
      const newSize = new Blockly.utils.Size(150, 250);
      icon.setBubbleSize(newSize);

      const event = new BlockCommentResize(icon, oldSize, newSize);
      event.run(false);

      const size = icon.getBubbleSize();
      expect(size.width).toBe(oldSize.width);
      expect(size.height).toBe(oldSize.height);
    });

    test('Redo', () => {
      const oldSize = new Blockly.utils.Size(100, 200);
      const newSize = new Blockly.utils.Size(150, 250);
      icon.setBubbleSize(oldSize);

      const event = new BlockCommentResize(icon, oldSize, newSize);
      event.run(true);

      const size = icon.getBubbleSize();
      expect(size.width).toBe(newSize.width);
      expect(size.height).toBe(newSize.height);
    });
  });

  describe('Serialization', () => {
    test('Events Round-Trip through JSON', () => {
      const oldSize = new Blockly.utils.Size(100, 200);
      const newSize = new Blockly.utils.Size(150, 250);
      const event = new BlockCommentResize(icon, oldSize, newSize);
      const json = event.toJson();
      expect(json).toEqual({
        type: 'block_comment_resize',
        blockId: block.id,
        oldWidth: 100,
        oldHeight: 200,
        newWidth: 150,
        newHeight: 250,
        group: '',
        commentId: undefined // Comment ID is undefined because the anchored comment is not rendered.
      });

      const newEvent = BlockCommentResize.fromJson(json, workspace);
      expect(newEvent.oldSize).toEqual(oldSize);
      expect(newEvent.newSize).toEqual(newSize);
      expect(newEvent.blockId).toEqual(event.blockId);
    });

    test('Throws error when old size is undefined', () => {
      const event = new BlockCommentResize(icon);
      expect(() => event.toJson()).toThrow('The old comment size is undefined');
    });

    test('Throws error when new size is undefined', () => {
      const oldSize = new Blockly.utils.Size(100, 200);
      const event = new BlockCommentResize(icon, oldSize);
      expect(() => event.toJson()).toThrow('The new comment size is undefined');
    });
  });

  describe('Error Handling', () => {
    test('Throws error when running without sizes', () => {
      const event = new BlockCommentResize(icon);
      expect(() => event.run(true)).toThrow('Either oldSize or newSize is undefined');
    });

    test('Throws error when block not found', () => {
      const oldSize = new Blockly.utils.Size(100, 200);
      const newSize = new Blockly.utils.Size(150, 250);
      const event = new BlockCommentResize(icon, oldSize, newSize);
      event.blockId = 'non-existent-block';
      expect(() => event.run(true)).toThrow('Block with ID non-existent-block not found.');
    });
  });
});
