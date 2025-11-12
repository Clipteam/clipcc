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

  constructor(optAnchoredComment?: AnchoredComment) {
    super();
    this.isBlank = !optAnchoredComment;

    if (!optAnchoredComment?.sourceBlock) return;

    this.commentId = optAnchoredComment.id;
    this.blockId = optAnchoredComment.sourceBlock.id;
    this.workspaceId = optAnchoredComment.sourceBlock.workspace.id;
  }

  override toJson(): BlockCommentBaseJson {
    return {
      ...super.toJson(),
      commentId: this.commentId,
      blockId: this.blockId
    };
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
