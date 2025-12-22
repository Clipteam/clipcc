/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * Class for a block drag event. Fired when block dragged into or out of
 * the blocks UI.
 */
export class BlockDragOutside extends Blockly.Events.BlockBase {
  override type = 'block_drag_outside';
  /** Whether the block is outside of the blocks UI. */
  isOutside: boolean;

  /**
   * @param block The moved block.  Null for a blank event.
   * @param isOutside Whether the block is outside of the blocks UI.
   */
  constructor(block?: Blockly.BlockSvg, isOutside = false) {
    super(block);
    this.isOutside = isOutside;
    this.recordUndo = false;
  }

  /**
   * Encode the event as JSON.
   * @returns The JSON representation.
   */
  override toJson(): BlockDragOutsideJson {
    const json = super.toJson() as BlockDragOutsideJson;
    json.isOutside = this.isOutside;
    return json;
  }

  /**
   * Decodes the JSON event.
   * @param json The JSON representation.
   * @param workspace The workspace of the event belong to.
   * @param event The event to append new properties to. Should be a subclass
   *     of Abstract (like all events), but we can't specify that due to the
   *     fact that parameters to static methods in subclasses must be
   *     supertypes of parameters to static methods in superclasses.
   * @returns The newly created event instance.
   */
  static override fromJson(
    json: BlockDragOutsideJson,
    workspace: Blockly.Workspace,
    event?: Blockly.Events.Abstract
  ): BlockDragOutside {
    const newEvent = super.fromJson(
      json, workspace,
      event ?? new BlockDragOutside()
    ) as BlockDragOutside;
    newEvent.isOutside = json.isOutside;
    return newEvent;
  }
}

export interface BlockDragOutsideJson extends Blockly.Events.BlockBaseJson {
  isOutside: boolean;
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  'block_drag_outside',
  BlockDragOutside
);
