/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {AnchoredComment} from '../anchored_comment';
import {BlockCommentBase, BlockCommentBaseJson} from './block_comment_base';

interface CommentJson {
  x: number;
  y: number;
  width: number;
  height: number;
};

class BlockCommentCreate extends BlockCommentBase {
  json?: CommentJson;
  type = 'block_comment_create';

  constructor(optAnchoredComment?: AnchoredComment) {
    super(optAnchoredComment);
    if (!optAnchoredComment) return;
    const size = optAnchoredComment.getSize();
    const commentXY = optAnchoredComment.getRelativeToSurfaceXY();
    this.json = {
      x: commentXY.x,
      y: commentXY.y,
      width: size.width,
      height: size.height
    };
    // Disable undo because Blockly already tracks comment creation for
    // undo purposes; this event exists solely to keep the Scratch VM apprised
    // of the state of things.
    this.recordUndo = false;
  }

  toJson(): BlockCommentCreateJson {
    if (!this.json) {
      throw new Error('No comment json.');
    }

    return {
      ...super.toJson(),
      ...this.json
    };
  }

  static fromJson(
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
      height: json['height']
    };

    return newEvent;
  }
}

interface BlockCommentCreateJson extends BlockCommentBaseJson, CommentJson {}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  'block_comment_create',
  BlockCommentCreate
);
