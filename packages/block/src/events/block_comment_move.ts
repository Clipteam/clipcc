/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {BlockCommentBase, BlockCommentBaseJson} from './block_comment_base';
import type {BlockCommentIcon} from '../block_comment_icon';

/**
 * Notifies listeners when a block comment is moved.
 */
export class BlockCommentMove extends BlockCommentBase {
  /** Type of this event. */
  override type = 'block_comment_move';

  /** The previous coordinate before move. */
  oldCoordinate_?: Blockly.utils.Coordinate;

  /** The new coordinate after move. */
  newCoordinate_?: Blockly.utils.Coordinate;

  /**
   * @param icon The comment icon this event corresponds to.
   * @param oldCoordinate The previous coordinate before move.
   * @param newCoordinate The new coordinate after move.
   */
  constructor(
    icon?: BlockCommentIcon,
    oldCoordinate?: Blockly.utils.Coordinate,
    newCoordinate?: Blockly.utils.Coordinate
  ) {
    super(icon);
    if (!icon) return;
    this.oldCoordinate_ = oldCoordinate;
    this.newCoordinate_ = newCoordinate;
  }

  /**
   * Encode the event as JSON.
   * @returns JSON representation.
   */
  override toJson(): BlockCommentMoveJson {
    if (!this.newCoordinate_ || !this.oldCoordinate_) {
      throw new Error('The event is incomplete. Either pass a comment to the constructor, or call fromJson.');
    }

    const json = super.toJson() as BlockCommentMoveJson;
    json.newX = this.newCoordinate_.x;
    json.newY = this.newCoordinate_.y;
    json.oldX = this.oldCoordinate_.x;
    json.oldY = this.oldCoordinate_.y;
    return json;
  }

  /**
   * Deserializes the JSON event.
   * @param json The JSON object that describes the event.
   * @param workspace The workspace of the event belong to.
   * @param event The event to append new properties to. Should be a subclass
   *     of Abstract (like all events), but we can't specify that due to the
   *     fact that parameters to static methods in subclasses must be
   *     supertypes of parameters to static methods in superclasses.
   * @returns The newly created event instance.
   */
  static override fromJson(
    json: BlockCommentMoveJson,
    workspace: Blockly.Workspace,
    event?: Blockly.Events.Abstract
  ): BlockCommentMove {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BlockCommentMove()
    ) as BlockCommentMove;
    newEvent.newCoordinate_ = new Blockly.utils.Coordinate(json.newX, json.newY);
    newEvent.oldCoordinate_ = new Blockly.utils.Coordinate(json.oldX, json.oldY);
    return newEvent;
  }

  /**
   * Run an event.
   * @param forward True if run forward, false if run backward (undo).
   */
  override run(forward: boolean) {
    if (!this.oldCoordinate_ || !this.newCoordinate_) {
      throw new Error('The event is incomplete. Either pass a comment to the constructor, or call fromJson.');
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

export interface BlockCommentMoveJson extends BlockCommentBaseJson {
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
