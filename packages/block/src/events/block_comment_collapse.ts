/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {BlockCommentBase, BlockCommentBaseJson} from './block_comment_base';
import type {BlockCommentIcon} from '../block_comment_icon';

/**
 * Notifies listeners when a block comment is collapsed/uncollapsed.
 */
export class BlockCommentCollapse extends BlockCommentBase {
  /** Type of this event. */
  override type = 'block_comment_collapse';

  /** Whether the comment is collpased. */
  newCollapsed?: boolean;

  /**
   * @param icon The comment icon this event corresponds to.
   * @param collapsed Whether the comment is collapsed.
   */
  constructor(icon?: BlockCommentIcon, collapsed?: boolean) {
    super(icon);
    if (!icon) return;
    this.newCollapsed = !!collapsed;
  }

  /**
   * Encode the event as JSON.
   * @returns JSON representation.
   */
  override toJson(): BlockCommentCollapseJson {
    const json = super.toJson() as BlockCommentCollapseJson;
    if (this.newCollapsed === undefined) {
      throw new Error('The event is incomplete. Either pass a comment to the constructor, or call fromJson.');
    }
    json.newCollapsed = this.newCollapsed;
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
    json: BlockCommentCollapseJson,
    workspace: Blockly.Workspace,
    event?: BlockCommentCollapse
  ): BlockCommentCollapse {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BlockCommentCollapse()
    ) as BlockCommentCollapse;
    newEvent.newCollapsed = json.newCollapsed;
    return newEvent;
  }

  /**
   * Run an event.
   * @param forward True if run forward, false if run backward (undo).
   */
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
      throw new Error(`Comment icon for block with ID ${this.blockId} not found.`);
    }

    comment.setCollapsed(forward ? !!this.newCollapsed : !this.newCollapsed);
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
