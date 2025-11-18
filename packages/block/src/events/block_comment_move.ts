/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {AnchoredComment} from '../anchored_comment';
import {BlockCommentBase, BlockCommentBaseJson} from './block_comment_base';
import type {BlockCommentIcon} from '../block_comment_icon';

export class BlockCommentMove extends BlockCommentBase {
  type = 'block_comment_move';
  oldCoordinate?: Blockly.utils.Coordinate;
  newCoordinate?: Blockly.utils.Coordinate;

  constructor(
    anchoredComment?: AnchoredComment,
    oldCoordinate?: Blockly.utils.Coordinate,
    newCoordinate?: Blockly.utils.Coordinate
  ) {
    super(anchoredComment);
    this.oldCoordinate = oldCoordinate;
    this.newCoordinate = newCoordinate;
  }

  override toJson(): BlockCommentMoveJson {
    if (!this.newCoordinate || !this.oldCoordinate) {
      throw new Error('Incomplete coordinate');
    }

    const json = super.toJson() as BlockCommentMoveJson;
    json['newX'] = this.newCoordinate.x;
    json['newY'] = this.newCoordinate.y;
    json['oldX'] = this.oldCoordinate.x;
    json['oldY'] = this.oldCoordinate.y;
    return json;
  }

  static override fromJson(
    json: BlockCommentMoveJson,
    workspace: Blockly.Workspace,
    event?: BlockCommentMove
  ): BlockCommentMove {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BlockCommentMove()
    ) as BlockCommentMove;
    newEvent.newCoordinate = new Blockly.utils.Coordinate(
      json['newX'],
      json['newY']
    );
    newEvent.oldCoordinate = new Blockly.utils.Coordinate(
      json['oldX'],
      json['oldY']
    );

    return newEvent;
  }

  override run(forward: boolean) {
    if (!this.oldCoordinate || !this.newCoordinate) {
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
      forward ? this.newCoordinate : this.oldCoordinate
    );
  }
}

interface BlockCommentMoveJson extends BlockCommentBaseJson {
  newX: number;
  newY: number;
  oldX: number;
  oldY: number;
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  'block_comment_move',
  BlockCommentMove
);
