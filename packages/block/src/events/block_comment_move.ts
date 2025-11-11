/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {AnchoredComment} from '../anchored_comment';
import {BlockCommentBase, BlockCommentBaseJson} from './block_comment_base';
import type {BlockCommentIcon} from '../block_comment_icon';

export class BlockCommentMove extends BlockCommentBase {
  type = 'block_comment_move';
  oldCoordinate_?: Blockly.utils.Coordinate;
  newCoordinate_?: Blockly.utils.Coordinate;

  constructor(
    optAnchoredComment?: AnchoredComment,
    oldCoordinate?: Blockly.utils.Coordinate,
    newCoordinate?: Blockly.utils.Coordinate
  ) {
    super(optAnchoredComment);
    this.oldCoordinate_ = oldCoordinate;
    this.newCoordinate_ = newCoordinate;
  }

  toJson(): BlockCommentMoveJson {
    return {
      ...super.toJson(),
      newCoordinate: this.newCoordinate_!,
      oldCoordinate: this.oldCoordinate_!
    };
  }

  static fromJson(
    json: BlockCommentMoveJson,
    workspace: Blockly.Workspace,
    event?: BlockCommentMove
  ): BlockCommentMove {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BlockCommentMove()
    ) as BlockCommentMove;
    newEvent.newCoordinate_ = new Blockly.utils.Coordinate(
      json['newCoordinate']['x'],
      json['newCoordinate']['y']
    );
    newEvent.oldCoordinate_ = new Blockly.utils.Coordinate(
      json['oldCoordinate']['x'],
      json['oldCoordinate']['y']
    );

    return newEvent;
  }

  run(forward: boolean) {
    if (!this.oldCoordinate_ || !this.newCoordinate_) {
      throw new Error('Incomplete coordinate');
    }

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

    comment.setBubbleLocation(
      forward ? this.newCoordinate_ : this.oldCoordinate_
    );
  }
}

interface BlockCommentMoveJson extends BlockCommentBaseJson {
  newCoordinate: {
    x: number;
    y: number;
  };
  oldCoordinate: {
    x: number;
    y: number;
  };
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  'block_comment_move',
  BlockCommentMove
);
