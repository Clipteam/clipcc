/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {AnchoredComment} from '../anchored_comment';
import {BlockCommentBase, BlockCommentBaseJson} from './block_comment_base';
import {BlockCommentIcon} from '../block_comment_icon';

export class BlockCommentCollapse extends BlockCommentBase {
  type = 'block_comment_collapse';
  newCollapsed: boolean;

  constructor(anchoredComment?: AnchoredComment, collapsed?: boolean) {
    super(anchoredComment);
    this.newCollapsed = !!collapsed;
  }

  override toJson(): BlockCommentCollapseJson {
    return {
      ...super.toJson(),
      newCollapsed: this.newCollapsed
    };
  }

  static override fromJson(
    json: BlockCommentCollapseJson,
    workspace: Blockly.Workspace,
    event?: BlockCommentCollapse
  ): BlockCommentBase {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BlockCommentCollapse()
    ) as BlockCommentCollapse;
    newEvent.newCollapsed = json['newCollapsed'];
    return newEvent;
  }

  override run(forward: boolean) {
    if (!this.blockId) {
      throw new Error('Block ID is not set.');
    }
    const workspace = this.getEventWorkspace_();
    const block = workspace.getBlockById(this.blockId);

    if (!block) {
      throw new Error(`Block with ID ${this.blockId} not found.`);
    }

    const comment = block.getIcon(Blockly.icons.IconType.COMMENT) as BlockCommentIcon;
    if (!comment) {
      throw new Error(
        `Comment icon for block with ID ${this.blockId} not found.`
      );
    }

    comment.setCollapsed(forward ? this.newCollapsed : !this.newCollapsed);
  }
}

export interface BlockCommentCollapseJson extends BlockCommentBaseJson {
  newCollapsed: boolean;
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  'block_comment_collapse',
  BlockCommentCollapse
);
