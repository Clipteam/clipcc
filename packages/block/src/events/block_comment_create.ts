/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {BlockCommentBase, BlockCommentBaseJson} from './block_comment_base';
import type {BlockCommentIcon, BlockCommentState} from '../block_comment_icon';

export class BlockCommentCreate extends BlockCommentBase {
  json?: BlockCommentState;
  type = 'block_comment_create';

  constructor(icon?: BlockCommentIcon) {
    super(icon);
    if (!icon) return;
    this.json = icon.saveState();
    // Disable undo because Blockly already tracks comment creation for
    // undo purposes; this event exists solely to keep the Scratch VM apprised
    // of the state of things.
    this.recordUndo = false;
  }

  override toJson(): BlockCommentCreateJson {
    if (!this.json) {
      throw new Error('No comment json.');
    }

    return Object.assign(super.toJson(), this.json);
  }

  static override fromJson(
    json: BlockCommentCreateJson,
    workspace: Blockly.Workspace,
    event?: BlockCommentCreate
  ): BlockCommentCreate {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BlockCommentCreate()
    ) as BlockCommentCreate;
    newEvent.json = {
      x: json['x'],
      y: json['y'],
      width: json['width'],
      height: json['height'],
      text: json['text'],
      collapsed: json['collapsed']
    };

    return newEvent;
  }
}

interface BlockCommentCreateJson extends BlockCommentBaseJson, BlockCommentState {}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  'block_comment_create',
  BlockCommentCreate
);
