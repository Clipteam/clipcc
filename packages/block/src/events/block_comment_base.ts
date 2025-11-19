/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {BlockCommentIcon} from '../block_comment_icon';

export class BlockCommentBase extends Blockly.Events.Abstract {
  isBlank: boolean;
  commentId?: string;
  blockId?: string;
  workspaceId?: string;

  constructor(icon?: BlockCommentIcon) {
    super();
    this.isBlank = !icon;
    if (!icon) return;

    const sourceBlock = icon.getSourceBlock();
    const anchoredComment = icon.getBubble();

    // Anchored comment is a bubble, so comment only exists if it's rendered.
    this.commentId = anchoredComment?.id;
    this.blockId = sourceBlock.id;
    this.workspaceId = sourceBlock.workspace.id;
  }

  override toJson(): BlockCommentBaseJson {
    const json = super.toJson() as BlockCommentBaseJson;

    if (!this.blockId) {
      throw new Error('The block ID is undefined. Either pass a block to the constructor, or call fromJson');
    }

    json['commentId'] = this.commentId;
    json['blockId'] = this.blockId;

    return json;
  }

  static override fromJson(
    json: BlockCommentBaseJson,
    workspace: Blockly.Workspace,
    event?: BlockCommentBase
  ): BlockCommentBase {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BlockCommentBase()
    ) as BlockCommentBase;
    newEvent.commentId = json['commentId'];
    newEvent.blockId = json['blockId'];
    return newEvent;
  }
}

export interface BlockCommentBaseJson extends Blockly.Events.AbstractEventJson {
  commentId?: string;
  blockId?: string;
}
