/**
 * @license
 * Copyright 2024 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import * as Constants from './constants';

export class ProcedureArgumentDragStrategy implements Blockly.IDragStrategy {
  /** Newly duplicated block. */
  private newBlock: Blockly.BlockSvg | null = null;

  /** Previous dragging strategy of the block. */
  private previousStrategy: Blockly.IDragStrategy;

  /**
   * @param block The target block of the strategy.
   */
  constructor(private block: Blockly.BlockSvg) {
    this.previousStrategy = block.getDragStrategy();
  }

  /**
   * Returns true iff the element is currently movable.
   * @returns True iff movable.
   */
  isMovable(): boolean {
    return true;
  }

  /**
   * Handles any drag startup (e.g moving elements to the front of the
   * workspace).
   * @param e PointerEvent that started the drag; can be used to
   *     check modifier keys, etc.  May be missing when dragging is
   *     triggered programatically rather than by user.
   */
  startDrag(e?: PointerEvent): void {
    // Duplicate self if the block is part of procedure definition.
    if (this.block.getParent()?.type === Constants.PROCEDURES_PROTOTYPE_BLOCK_TYPE) {
      this.newBlock = Blockly.clipboard.paste(
        this.block.toCopyData()!,
        this.block.workspace
      ) as Blockly.BlockSvg;
      this.newBlock.startDrag(e);
    } else {
      // Otherwise, fallback to previous dragging strategy.
      this.block.setDragStrategy(this.previousStrategy);
      this.block.startDrag(e);
    }
  }

  /**
   * Handles moving elements to the new location, and updating any
   * visuals based on that (e.g connection previews for blocks).
   * @param newLoc Workspace coordinate to which the draggable has
   *     been dragged.
   * @param e PointerEvent that continued the drag.  Can be
   *     used to check modifier keys, etc.
   */
  drag(newLoc: Blockly.utils.Coordinate, e?: PointerEvent): void {
    this.newBlock?.drag(newLoc, e);
  }

  /**
   * Handles any drag cleanup, including e.g. connecting or deleting
   * blocks.
   * @param e PointerEvent that finished the drag.  Can be
   *     used to check modifier keys, etc.
   */
  endDrag(e?: PointerEvent): void {
    this.newBlock?.endDrag();
  }

  /**
   * Moves the draggable back to where it was at the start of the drag.
   */
  revertDrag(): void {
    this.newBlock?.dispose();
  }
}
