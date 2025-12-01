/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

export class VirtualizedManager {
  /**
   * Hold a weak reference to the workspace to avoid memory leaks.
   */
  protected workspaceRef: WeakRef<Blockly.WorkspaceSvg>;
  protected observingBlocks = new Map<string, Blockly.BlockSvg>();

  constructor(workspace: Blockly.WorkspaceSvg) {
    this.workspaceRef = new WeakRef(workspace);

    workspace.addChangeListener(this.workspaceChangeListener);
  }

  protected workspaceChangeListener = (e: Blockly.Events.Abstract) => {
    switch (e.type) {
      // This event only happens when a block's connections are changed.
      case Blockly.Events.BLOCK_MOVE: {
        // See blockly/core/connection.ts#L131
        const event = e as Blockly.Events.BlockMove;
        if (event.type !== Blockly.Events.BLOCK_MOVE) break;
        if (!event.blockId) break;

        const block = this.workspace.getBlockById(event.blockId);
        if (!block) break;
        if (!block.getParent()) {
          // Observe top blocks only.
          this.observe(block);
        } else {
          this.unobserve(block.id);
          if (!this.isBlockVisible(block)) {
            this.setBlockVisibility(block, true);
          }
        }

        break;
      }
      case Blockly.Events.BLOCK_DELETE: {
        const event = e as Blockly.Events.BlockDelete;
        if (!event.blockId) break;
        this.unobserve(event.blockId);
        break;
      }
      case Blockly.Events.VIEWPORT_CHANGE: {
        this.virtualize();
        break;
      }
    }
  };

  /**
   * Get the workspace from WeakRef.
   * Always exists since the manager is tied to the workspace's lifecycle.
   * @returns The workspace.
   */
  protected get workspace(): Blockly.WorkspaceSvg {
    return this.workspaceRef.deref()!;
  }

  /**
   * Check whether these blocks are offscreen, then update their visibility.
   */
  virtualize(): void {
    // Check workspace here since it's public.
    if (!this.workspace) {
      this.dispose();
      return;
    }

    const metrics = this.workspace.getMetrics();
    const viewLeft = metrics.viewLeft;
    const viewRight = metrics.viewLeft + metrics.viewWidth;
    const viewTop = metrics.viewTop;
    const viewBottom = metrics.viewTop + metrics.viewHeight;
    for (const [, block] of this.observingBlocks) {
      const blockBoundingBox = block.getBoundingRectangle();
      const scale = this.workspace.getScale();
      blockBoundingBox.left *= scale;
      blockBoundingBox.right *= scale;
      blockBoundingBox.top *= scale;
      blockBoundingBox.bottom *= scale;

      const isOffscreen =
        blockBoundingBox.right < viewLeft ||
        blockBoundingBox.left > viewRight ||
        blockBoundingBox.bottom < viewTop ||
        blockBoundingBox.top > viewBottom;

      if (isOffscreen) {
        if (this.isBlockVisible(block)) {
          this.setBlockVisibility(block, false);
        }
      } else {
        if (!this.isBlockVisible(block)) {
          this.setBlockVisibility(block, true);
        }
      }
    }
  }

  /**
   * Check whether a block is visible.
   * @param block The block to check.
   * @returns Whether the block is visible.
   */
  protected isBlockVisible(block: Blockly.BlockSvg): boolean {
    return !Blockly.utils.dom.hasClass(block.getSvgRoot(), 'blocklyBlockHidden');
  }

  /**
   * Set the visibility of a block.
   * @param block The block to set visibility for.
   * @param visible Whether the block visible.
   */
  protected setBlockVisibility(block: Blockly.BlockSvg, visible: boolean): void {
    if (visible) {
      Blockly.utils.dom.removeClass(block.getSvgRoot(), 'blocklyBlockHidden');
    } else {
      Blockly.utils.dom.addClass(block.getSvgRoot(), 'blocklyBlockHidden');
    }
  }

  /**
   * Start observing a block for virtualization.
   * @param block The block to observe.
   */
  protected observe(block: Blockly.BlockSvg): void {
    this.observingBlocks.set(block.id, block);
  }

  /**
   * Stop observing a block.
   * @param blockId The block ID to stop observing.
   */
  protected unobserve(blockId: string): void {
    this.observingBlocks.delete(blockId);
  }

  /**
   * Dispose the manager.
   */
  dispose(): void {
    this.observingBlocks.clear();
    if (this.workspace) {
      this.workspace.removeChangeListener(this.workspaceChangeListener);
    }
  }
}

/**
 * Virtualize the given workspace. Make blocks offscreen invisible.
 * @param workspace The workspace to virtualize.
 * @returns The VirtualizedManager instance.
 */
export function virtualize(workspace: Blockly.WorkspaceSvg): VirtualizedManager {
  if (workspace.getFlyout()) {
    virtualize(workspace.getFlyout()!.getWorkspace());
  }

  return new VirtualizedManager(workspace);
}
