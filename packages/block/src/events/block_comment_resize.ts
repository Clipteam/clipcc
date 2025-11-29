/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {BlockCommentBase, BlockCommentBaseJson} from './block_comment_base';
import {BlockCommentIcon} from '../block_comment_icon';

/**
 * Notifies listeners when a block comment is resized.
 */
export class BlockCommentResize extends BlockCommentBase {
  /** Type of this event. */
  override type = 'block_comment_resize';

  /** The previous size before resizing. */
  oldSize?: Blockly.utils.Size;

  /** The new size after resizing. */
  newSize?: Blockly.utils.Size;

  /**
   * @param icon The comment icon this event corresponds to.
   * @param oldSize The previous size before resizing.
   * @param newSize The new size after resizing.
   */
  constructor(
    icon?: BlockCommentIcon,
    oldSize?: Blockly.utils.Size,
    newSize?: Blockly.utils.Size
  ) {
    super(icon);
    if (!icon) return;
    this.oldSize = oldSize;
    this.newSize = newSize;
  }

  /**
   * Encode the event as JSON.
   * @returns JSON representation.
   */
  override toJson(): BlockCommentResizeJson {
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
    json.oldWidth = Math.round(this.oldSize.width);
    json.oldHeight = Math.round(this.oldSize.height);
    json.newWidth = Math.round(this.newSize.width);
    json.newHeight = Math.round(this.newSize.height);
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
    json: BlockCommentResizeJson,
    workspace: Blockly.Workspace,
    event?: BlockCommentResize
  ): BlockCommentResize {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BlockCommentResize()
    ) as BlockCommentResize;
    newEvent.oldSize = new Blockly.utils.Size(json.oldWidth, json.oldHeight);
    newEvent.newSize = new Blockly.utils.Size(json.newWidth, json.newHeight);
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
