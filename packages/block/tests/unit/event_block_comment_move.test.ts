/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test, beforeAll, afterAll, beforeEach, afterEach} from '@jest/globals';
import * as Blockly from 'blockly/core';
import {defineTestBlock} from '../helpers/block';
import {BlockCommentMove} from '../../src/events/block_comment_move';
import {BlockCommentIcon} from '../../src/block_comment_icon';

describe('Event: BlockCommentMove', () => {
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
    test('Stores old and new coordinates', () => {
      const oldCoord = new Blockly.utils.Coordinate(10, 20);
      const newCoord = new Blockly.utils.Coordinate(30, 40);
      const event = new BlockCommentMove(icon, oldCoord, newCoord);
      expect(event.oldCoordinate).toEqual(oldCoord);
      expect(event.newCoordinate).toEqual(newCoord);
    });
  });

  describe('Undo and Redo', () => {
    test('Undo', () => {
      const oldCoord = new Blockly.utils.Coordinate(10, 20);
      const newCoord = new Blockly.utils.Coordinate(30, 40);
      icon.setBubbleLocation(newCoord);

      const event = new BlockCommentMove(icon, oldCoord, newCoord);
      event.run(false);

      const location = icon.getBubbleLocation();
      expect(location).toBeDefined();
      expect(location!.x).toBe(oldCoord.x);
      expect(location!.y).toBe(oldCoord.y);
    });

    test('Redo', () => {
      const oldCoord = new Blockly.utils.Coordinate(10, 20);
      const newCoord = new Blockly.utils.Coordinate(30, 40);
      icon.setBubbleLocation(oldCoord);

      const event = new BlockCommentMove(icon, oldCoord, newCoord);
      event.run(true);

      const location = icon.getBubbleLocation();
      expect(location).toBeDefined();
      expect(location!.x).toBe(newCoord.x);
      expect(location!.y).toBe(newCoord.y);
    });
  });

  describe('Serialization', () => {
    test('Events Round-Trip through JSON', () => {
      const oldCoord = new Blockly.utils.Coordinate(10, 20);
      const newCoord = new Blockly.utils.Coordinate(30, 40);
      const event = new BlockCommentMove(icon, oldCoord, newCoord);
      const json = event.toJson();
      expect(json).toEqual({
        type: 'block_comment_move',
        blockId: block.id,
        newX: 30,
        newY: 40,
        oldX: 10,
        oldY: 20,
        group: '',
        commentId: undefined // Comment ID is undefined because the anchored comment is not rendered.
      });

      const newEvent = BlockCommentMove.fromJson(json, workspace);
      expect(newEvent.oldCoordinate).toEqual(oldCoord);
      expect(newEvent.newCoordinate).toEqual(newCoord);
      expect(newEvent.blockId).toEqual(event.blockId);
    });

    test('Throws error when coordinates are incomplete', () => {
      const event = new BlockCommentMove(icon);
      expect(() => event.toJson())
        .toThrow('The event is incomplete. Either pass a comment to the constructor, or call fromJson.');
    });
  });

  describe('Error Handling', () => {
    test('Throws error when running without coordinates', () => {
      const event = new BlockCommentMove(icon);
      expect(() => event.run(true))
        .toThrow('The event is incomplete. Either pass a comment to the constructor, or call fromJson.');
    });

    test('Throws error when block not found', () => {
      const oldCoord = new Blockly.utils.Coordinate(10, 20);
      const newCoord = new Blockly.utils.Coordinate(30, 40);
      const event = new BlockCommentMove(icon, oldCoord, newCoord);
      event.blockId = 'non-existent-block';
      expect(() => event.run(true)).toThrow('Block with ID non-existent-block not found.');
    });
  });
});
