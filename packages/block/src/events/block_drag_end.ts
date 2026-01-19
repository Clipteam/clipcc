/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * Class for a block end drag event.
 */
export class BlockDragEnd extends Blockly.Events.BlockBase {
  override type = 'block_drag_end';
  /** Whether the block is outside of the blocks UI. */
  isOutside: boolean;
  /**
   * The serialized block state after the drag.
   * Only set if the block is dropped outside of the blocks UI.
   */
  json: Blockly.serialization.blocks.State | null = null;

  /**
   * @param block The moved block.  Null for a blank event.
   * @param isOutside Whether the block is outside of the blocks UI.
   */
  constructor(block?: Blockly.BlockSvg, isOutside = false) {
    super(block);
    this.isOutside = isOutside;
    if (isOutside && block) {
      this.json = Blockly.serialization.blocks.save(block, {
        saveIds: false
      });
    }
    this.recordUndo = false;
  }

  /**
   * Encode the event as JSON.
   * @returns The JSON representation.
   */
  override toJson(): BlockDragEndJson {
    const json = super.toJson() as BlockDragEndJson;
    json.isOutside = this.isOutside;
    if (this.json) {
      json.json = this.json;
    }
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
    json: BlockDragEndJson,
    workspace: Blockly.Workspace,
    event?: Blockly.Events.Abstract
  ): BlockDragEnd {
    const newEvent = super.fromJson(
      json, workspace,
      event ?? new BlockDragEnd()
    ) as BlockDragEnd;
    newEvent.isOutside = json.isOutside;
    if (json.json) {
      newEvent.json = json.json;
    }
    return newEvent;
  }
}

export interface BlockDragEndJson extends Blockly.Events.BlockBaseJson {
  isOutside: boolean;
  json?: Blockly.serialization.blocks.State;
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  'block_drag_end',
  BlockDragEnd
);
