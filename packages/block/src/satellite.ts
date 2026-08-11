/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {ISatellite} from './interfaces/i_satellite';

/**
 * Drag strategy for a satellite block whose parent owns its movement.
 */
class SatelliteDragStrategy implements Blockly.IDragStrategy {
  constructor(private readonly block: Blockly.BlockSvg) {}

  isMovable() {
    return this.block.getParent()?.isMovable() ?? false;
  }

  startDrag(e?: PointerEvent | KeyboardEvent): Blockly.IDraggable {
    return this.block.getParent()?.startDrag(e) ?? this.block;
  }

  drag(newLoc: Blockly.utils.Coordinate, e?: PointerEvent | KeyboardEvent) {
    this.block.getParent()?.drag(newLoc, e);
  }

  endDrag(
    e: PointerEvent | KeyboardEvent | undefined,
    disposition: Blockly.DragDisposition
  ) {
    this.block.getParent()?.endDrag(e, disposition);
  }

  revertDrag() {
    this.block.getParent()?.revertDrag();
  }
}

/**
 * Applies the common interaction behavior for a satellite block.
 * @param block The satellite block.
 */
export function applySatelliteBehavior(block: Blockly.BlockSvg & ISatellite): void {
  block.satellite = true;
  block.setDeletable(false);
  block.isDuplicatable = () => false;
  block.setDragStrategy(new SatelliteDragStrategy(block));

  const originalShowContextMenu = block.showContextMenu.bind(block);
  block.showContextMenu = function(e: Event) {
    const parent = this.getParent();
    if (parent) {
      parent.showContextMenu(e);
    } else {
      originalShowContextMenu(e);
    }
  };
}
