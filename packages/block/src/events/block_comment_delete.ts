/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {AnchoredComment} from '../anchored_comment';
import {BlockCommentBase} from './block_comment_base';

class BlockCommentDelete extends BlockCommentBase {
  type = 'block_comment_delete';

  constructor(optAnchoredComment?: AnchoredComment) {
    super(optAnchoredComment);
    if (!optAnchoredComment) return;

    // Disable undo because Blockly already tracks comment deletion for
    // undo purposes; this event exists solely to keep the Scratch VM apprised
    // of the state of things.
    this.recordUndo = false;
  }
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  'block_comment_delete',
  BlockCommentDelete
);
