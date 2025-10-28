/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {isShadowTemplate} from './interfaces/i_shadow_template';

/**
 * Custom dragger.
 */
export class Dragger extends Blockly.dragging.Dragger {
  /**
   * Handles any drag startup. Shadow template blocks should be duplicated
   * before dragging.
   * @param e The pointer event.
   */
  override onDragStart(e: PointerEvent): void {
    // Duplicate the shadow template block and drag the new block.
    if (
      this.draggable instanceof Blockly.BlockSvg &&
      this.draggable.isShadow() &&
      isShadowTemplate(this.draggable) &&
      this.draggable.shadowTemplate
    ) {
      if (!Blockly.Events.getGroup()) {
        Blockly.Events.setGroup(true);
      }

      this.draggable = this.duplicateBlock(this.draggable);
      Blockly.getFocusManager().focusNode(this.draggable as Blockly.BlockSvg);
    }

    super.onDragStart(e);
  }

  /**
   * Duplicate the given block and place it correctly.
   * @param originalBlock The block to be duplicated.
   * @returns The newly created block.
   */
  protected duplicateBlock(originalBlock: Blockly.BlockSvg): Blockly.BlockSvg {
    Blockly.Events.disable();

    const json = Blockly.serialization.blocks.save(originalBlock)!;
    this.workspace.setResizesEnabled(false);
    const newBlock = Blockly.serialization.blocks.append(json, this.workspace) as Blockly.BlockSvg;

    newBlock.moveTo(originalBlock.getRelativeToSurfaceXY());

    Blockly.Events.enable();
    Blockly.Events.fire(new (Blockly.Events.get(Blockly.Events.BLOCK_CREATE))(newBlock));

    return newBlock;
  }
}

// Register and overrides the original dragger.
Blockly.registry.register(Blockly.registry.Type.BLOCK_DRAGGER, Blockly.registry.DEFAULT, Dragger, true);
