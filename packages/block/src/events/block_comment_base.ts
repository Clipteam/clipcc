/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {AnchoredComment} from '../anchored_comment';

export class BlockCommentBase extends Blockly.Events.Abstract {
  isBlank: boolean;
  commentId?: string;
  blockId?: string;
  workspaceId?: string;

  constructor(anchoredComment: AnchoredComment | null = null) {
    super();
    this.isBlank = !anchoredComment;

    if (!anchoredComment?.sourceBlock) return;

    this.commentId = anchoredComment.id;
    this.blockId = anchoredComment.sourceBlock.id;
    this.workspaceId = anchoredComment.sourceBlock.workspace.id;
  }

  override toJson(): BlockCommentBaseJson {
    const json = super.toJson() as BlockCommentBaseJson;

    if (!this.blockId) {
      throw new Error('The block ID is undefined. Either pass a block to the constructor, or call fromJson');
    }
    if (!this.commentId) {
      throw new Error('The comment ID is undefined. Either pass a comment to the constructor, or call fromJson');
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
