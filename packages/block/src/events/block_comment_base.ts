/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {BlockCommentIcon} from '../block_comment_icon';

/**
 * Abstract class for any event related to block comments.
 */
export class BlockCommentBase extends Blockly.Events.Abstract {
  override isBlank: boolean;

  /** The ID of the comment associated with this event. */
  commentId?: string;

  /** The ID of the block associated with this event. */
  blockId?: string;

  /**
   * @param icon The comment icon this event corresponds to.
   */
  constructor(icon?: BlockCommentIcon) {
    super();
    this.isBlank = !icon;
    if (!icon) return;

    const sourceBlock = icon.getSourceBlock();

    this.commentId = icon.commentId;
    this.blockId = sourceBlock.id;
    this.workspaceId = sourceBlock.workspace.id;
  }

  /**
   * Encode the event as JSON.
   * @returns JSON representation.
   */
  override toJson(): BlockCommentBaseJson {
    const json = super.toJson() as BlockCommentBaseJson;

    if (!this.blockId) {
      throw new Error('The block ID is undefined. Either pass a comment to the constructor, or call fromJson.');
    }

    json.commentId = this.commentId;
    json.blockId = this.blockId;

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
    json: BlockCommentBaseJson,
    workspace: Blockly.Workspace,
    event?: Blockly.Events.Abstract
  ): BlockCommentBase {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BlockCommentBase()
    ) as BlockCommentBase;
    newEvent.commentId = json.commentId;
    newEvent.blockId = json.blockId;
    return newEvent;
  }
}

export interface BlockCommentBaseJson extends Blockly.Events.AbstractEventJson {
  commentId?: string;
  blockId?: string;
}
