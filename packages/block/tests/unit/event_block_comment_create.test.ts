/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test, beforeAll, afterAll, beforeEach} from '@jest/globals';
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

  afterAll(() => {
    workspace.dispose();
  });

  describe('Constructor', () => {
    test('Captures comment state', () => {
      const event = new BlockCommentCreate(icon);
      expect(event.json).toBeDefined();
      expect(event.json).toHaveProperty('x');
      expect(event.json).toHaveProperty('y');
      expect(event.json).toHaveProperty('width');
      expect(event.json).toHaveProperty('height');
      expect(event.json).toHaveProperty('text');
      expect(event.json).toHaveProperty('collapsed');
    });

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
      expect(json).toHaveProperty('x');
      expect(json).toHaveProperty('y');
      expect(json).toHaveProperty('width');
      expect(json).toHaveProperty('height');
      expect(json).toHaveProperty('text');
      expect(json).toHaveProperty('collapsed');

      const newEvent = BlockCommentCreate.fromJson(json, workspace);
      expect(newEvent.json).toEqual(event.json);
      expect(newEvent.blockId).toEqual(event.blockId);
    });

    test('Throws error when json is undefined', () => {
      const event = new BlockCommentCreate();
      expect(() => event.toJson()).toThrow('No comment json.');
    });
  });
});
