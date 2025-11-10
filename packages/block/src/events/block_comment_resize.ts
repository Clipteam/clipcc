/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {AnchoredComment} from '../anchored_comment';
import {BlockCommentBase, BlockCommentBaseJson} from './block_comment_base';
import {BlockCommentIcon} from '../block_comment_icon';

export class BlockCommentResize extends BlockCommentBase {
  type = 'block_comment_resize';
  oldSize?: Blockly.utils.Size;
  newSize?: Blockly.utils.Size;

  constructor(optAnchoredComment?: AnchoredComment, oldSize?: Blockly.utils.Size, newSize?: Blockly.utils.Size) {
    super(optAnchoredComment);
    if (!optAnchoredComment) return;

    this.oldSize = oldSize;
    this.newSize = newSize;
  }

  toJson(): BlockCommentResizeJson {
    const json = super.toJson() as BlockCommentResizeJson;
    if (!this.oldSize) {
      throw new Error(
        'The old comment size is undefined. Either pass a comment to ' +
          'the constructor, or call fromJson'
      );
    }
    if (!this.newSize) {
      throw new Error(
        'The new comment size is undefined. Either call ' +
          'recordCurrentSizeAsNewSize, or call fromJson'
      );
    }
    json['oldWidth'] = Math.round(this.oldSize.width);
    json['oldHeight'] = Math.round(this.oldSize.height);
    json['newWidth'] = Math.round(this.newSize.width);
    json['newHeight'] = Math.round(this.newSize.height);
    return json;
  }

  static fromJson(
    json: BlockCommentResizeJson,
    workspace: Blockly.Workspace,
    event?: BlockCommentResize
  ): BlockCommentBase {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BlockCommentResize()
    ) as BlockCommentResize;
    newEvent.oldSize = new Blockly.utils.Size(json['oldWidth'], json['oldHeight']);
    newEvent.newSize = new Blockly.utils.Size(json['newWidth'], json['newHeight']);
    return newEvent;
  }

  run(forward: boolean) {
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

    const size = forward ? this.newSize : this.oldSize;
    if (!size) {
      throw new Error(
        'Either oldSize or newSize is undefined. ' +
          'Either pass a comment to the constructor and call ' +
          'recordCurrentSizeAsNewSize, or call fromJson'
      );
    }
    comment.setBubbleSize(size);
  }
}

export interface BlockCommentResizeJson extends BlockCommentBaseJson {
  oldWidth: number;
  oldHeight: number;
  newWidth: number;
  newHeight: number;
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  'block_comment_resize',
  BlockCommentResize
);
