/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test, beforeAll, afterAll} from '@jest/globals';
import * as Blockly from 'blockly/core';
import {defineTestBlock} from '../helpers/block';
import {BlockCommentCollapse} from '../../src/events/block_comment_collapse';
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

  describe('Undo and Redo', () => {
    test('Undo', () => {
      const event = new BlockCommentCollapse(icon, true);
      event.run(false);
      expect(icon.getCollapsed()).toBeFalsy();
    });

    test('Redo', () => {
      const event = new BlockCommentCollapse(icon, false);
      event.run(true);
      expect(icon.getCollapsed()).toBeFalsy();
    });
  });

  describe('Serialization', () => {
    test('Events Round-Trip through JSON', () => {
      const event = new BlockCommentCollapse(icon, false);
      const json = event.toJson();
      expect(json).toEqual({
        type: 'block_comment_collapse',
        blockId: block.id,
        newCollapsed: false,
        group: '',
        commentId: undefined // Comment ID is undefined because the anchored comment is not rendered.
      });

      const newEvent = BlockCommentCollapse.fromJson(json, workspace);
      expect(newEvent).toEqual(event);
    });
  });
});
