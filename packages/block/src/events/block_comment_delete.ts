/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {BlockCommentBase} from './block_comment_base';
import type {BlockCommentIcon} from '../block_comment_icon';

export class BlockCommentDelete extends BlockCommentBase {
  type = 'block_comment_delete';

  constructor(icon?: BlockCommentIcon) {
    super(icon);
    if (!icon) return;

    // Disable undo because Blockly already tracks comment deletion for
    // undo purposes; this event exists solely to keep the Scratch VM apprised
    // of the state of things.
    this.recordUndo = false;
  }

  static override fromJson(
    json: Blockly.Events.AbstractEventJson,
    workspace: Blockly.Workspace,
    event?: BlockCommentDelete
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
