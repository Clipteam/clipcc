/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {BlockCommentBase, BlockCommentBaseJson} from './block_comment_base';
import {BlockCommentIcon} from '../block_comment_icon';

/**
 * Notifies listeners when a block comment is deleted. This event is fired
 * before BlockChange to remove a comment.
 */
export class BlockCommentDelete extends BlockCommentBase {
  /** Type of this event. */
  override type = 'block_comment_delete';

  /**
   * @param icon The comment icon this event corresponds to.
   */
  constructor(icon?: BlockCommentIcon) {
    super(icon);

    // Disable undo because Blockly already tracks comment creation for
    // undo purposes; this event exists solely to keep the Scratch VM apprised
    // of the state of things.
    this.recordUndo = false;
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
  ): BlockCommentDelete {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BlockCommentDelete()
    ) as BlockCommentDelete;
    newEvent.recordUndo = false;
    return newEvent;
  }
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  'block_comment_delete',
  BlockCommentDelete
);
