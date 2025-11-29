/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test, beforeAll, afterAll, beforeEach, afterEach} from '@jest/globals';
import * as Blockly from 'blockly/core';
import {defineTestBlock} from '../helpers/block';
import {BlockCommentCreate} from '../../src/events/block_comment_create';
import {BlockCommentIcon} from '../../src/block_comment_icon';

describe('Event: BlockCommentCreate', () => {
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

  afterEach(() => {
    block.dispose();
  });

  afterAll(() => {
    workspace.dispose();
  });

  describe('Constructor', () => {
    test('recordUndo is false', () => {
      const event = new BlockCommentCreate(icon);
      expect(event.recordUndo).toBe(false);
    });
  });

  describe('Serialization', () => {
    test('Events Round-Trip through JSON', () => {
      const event = new BlockCommentCreate(icon);
      const json = event.toJson();
      expect(json).toHaveProperty('type', 'block_comment_create');
      expect(json).toHaveProperty('blockId', block.id);

      const newEvent = BlockCommentCreate.fromJson(json, workspace);
      expect(newEvent.blockId).toEqual(event.blockId);
    });

    test('Throws error when json is undefined', () => {
      const event = new BlockCommentCreate();
      expect(() => event.toJson())
        .toThrow('The block ID is undefined. Either pass a comment to the constructor, or call fromJson.');
    });
  });
});
