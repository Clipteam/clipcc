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

  constructor(anchoredComment?: AnchoredComment) {
    super();
    this.isBlank = !anchoredComment;

    if (!anchoredComment?.sourceBlock) return;

    this.commentId = anchoredComment.id;
    this.blockId = anchoredComment.sourceBlock.id;
    this.workspaceId = anchoredComment.sourceBlock.workspace.id;
  }

  override toJson(): BlockCommentBaseJson {
    const json: BlockCommentBaseJson = {
      ...super.toJson()
    };

    if (this.commentId) {
      json['commentId'] = this.commentId;
    }

    if (this.blockId) {
      json['blockId'] = this.blockId;
    }

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
