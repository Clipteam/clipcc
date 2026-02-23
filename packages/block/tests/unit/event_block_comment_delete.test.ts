/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test, beforeAll, afterAll, beforeEach, afterEach} from '@jest/globals';
import * as Blockly from 'blockly/core';
import {defineTestBlock} from '../helpers/block';
import {BlockCommentDelete} from '../../src/events/block_comment_delete';
import {BlockCommentIcon} from '../../src/block_comment_icon';

describe('Event: BlockCommentDelete', () => {
  let workspace: Blockly.Workspace;
  let block: Blockly.BlockSvg;
  let icon: BlockCommentIcon;

  beforeAll(() => {
    defineTestBlock();
    workspace = new Blockly.Workspace();
    Blockly.Events.disable();
  });

  beforeEach(() => {
    block = workspace.newBlock('test_block', 'test_id') as Blockly.BlockSvg;
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
      const event = new BlockCommentDelete(icon);
      expect(event.recordUndo).toBe(false);
    });

    test('Sets block ID', () => {
      const event = new BlockCommentDelete(icon);
      expect(event.blockId).toBe(block.id);
    });
  });

  describe('Serialization', () => {
    test('Events Round-Trip through JSON', () => {
      const event = new BlockCommentDelete(icon);
      const json = event.toJson();
      expect(json).toEqual({
        type: 'block_comment_delete',
        commentId: 'anchored_comment_test_id',
        blockId: block.id,
        group: ''
      });

      const newEvent = BlockCommentDelete.fromJson(json, workspace);
      expect(newEvent).toEqual(event);
    });
  });
});
