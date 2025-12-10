/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {QuadTree} from './utils/quad_tree';

export class VirtualizedManager {
  /**
   * Hold a weak reference to the workspace to avoid memory leaks.
   */
  protected workspaceRef: WeakRef<Blockly.WorkspaceSvg>;
  /**
   * Blocks being observed for virtualization.
   */
  protected observedBlocks = new Set<string>();
  /**
   * The quad tree used to manage block positions.
   */
  protected quadTree: QuadTree<string>;
  /**
   * Set of blocks that are currently hidden.
   */
  protected hiddenBlocks = new Set<string>();
  /**
   * Whether to update block visibility immediately on viewport changes.
   * If true, workspace methods will be hooked to listen viewport changes immediately.
   */
  protected immediate: boolean;
  /**
   * Whether a virtualization check has been requested.
   * Any requested check will perform in next microtask.
   */
  protected requestedCheck = false;

  constructor(workspace: Blockly.WorkspaceSvg, immediate = true) {
    this.workspaceRef = new WeakRef(workspace);
    this.immediate = immediate;

    const rect = this.getViewportRect();
    const viewWidth = rect.right - rect.left;
    const viewHeight = rect.bottom - rect.top;
    const cx = (rect.left + rect.right) / 2;
    const cy = (rect.top + rect.bottom) / 2;

    const halfW = viewWidth * 2;
    const halfH = viewHeight * 2;

    this.quadTree = new QuadTree(
      new Blockly.utils.Rect(cy - halfH, cy + halfH, cx - halfW, cx + halfW)
    );

    for (const block of workspace.getAllBlocks(false)) {
      this.observe(block.id);
    }

    this.virtualize();

    if (immediate) {
      this.hookWorkspace();
    }
    workspace.addChangeListener(this.workspaceChangeListener);
  }

  /**
   * Get the workspace from WeakRef.
   * Always exists since the manager is tied to the workspace's lifecycle.
   * @returns The workspace.
   */
  protected get workspace(): Blockly.WorkspaceSvg {
    return this.workspaceRef.deref()!;
  }

  /**
   * Hook workspace methods to update block visibility immediately on viewport changes.
   */
  protected hookWorkspace() {
    const proto: Blockly.WorkspaceSvg = Object.getPrototypeOf(this.workspace);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const manager = this;
    const originalMaybeFireViewportChangeEvent = proto.maybeFireViewportChangeEvent;
    this.workspace.maybeFireViewportChangeEvent = function() {
      originalMaybeFireViewportChangeEvent.call(this);
      manager.virtualize();
    };

    const originalResize = proto.resize;
    this.workspace.resize = function() {
      originalResize.call(this);
      manager.virtualize();
    };
  }

  protected workspaceChangeListener = (e: Blockly.Events.Abstract) => {
    switch (e.type) {
      case Blockly.Events.BLOCK_CREATE: {
        const event = e as Blockly.Events.BlockCreate;
        if (!event.ids) break;

        for (const id of event.ids) {
          this.observe(id);
        }
        this.virtualize();
        break;
      }
      case Blockly.Events.BLOCK_DELETE: {
        const event = e as Blockly.Events.BlockDelete;
        if (!event.blockId) break;
        this.unobserve(event.blockId);
        this.virtualize();
        break;
      }
      case Blockly.Events.BLOCK_MOVE:
      case Blockly.Events.BLOCK_CHANGE: {
        const event = e as (Blockly.Events.BlockMove | Blockly.Events.BlockChange);
        if (!event.blockId) break;
        if (event instanceof Blockly.Events.BlockChange) {
          if (event.element === 'disabled' || event.element === 'comment') {
            // No need to update position for these changes.
            break;
          }
        }
        const block = this.workspace.getBlockById(event.blockId);
        if (block) {
          const descendants = block.getDescendants(false);
          for (const desc of descendants) {
            if (this.observedBlocks.has(desc.id)) {
              this.updateBlockPosition(desc.id);
            } else {
              this.observe(desc.id);
            }
          }
        }
        break;
      }
      case Blockly.Events.BLOCK_DRAG: {
        const event = e as Blockly.Events.BlockDrag;
        if (!event.blockId) break;
        const block = this.workspace.getBlockById(event.blockId);
        if (!block) break;
        this.addDraggingBuffer(block);
        break;
      }
      case Blockly.Events.VIEWPORT_CHANGE: {
        if (this.immediate) break;
        this.virtualize();
        break;
      }
    }
  };

  /**
   * Check whether these blocks are offscreen, then update their visibility.
   * This method performs in next microtask to batch multiple calls.
   */
  protected virtualize(): void {
    if (this.requestedCheck) return;
    this.requestedCheck = true;

    // Perform in next microtask.
    Promise.resolve().then(() => {
      this.requestedCheck = false;
      this.virtualizeInternal();
    });
  }

  /**
   * Get the current viewport rectangle in workspace coordinates.
   * @returns The viewport rectangle.
   */
  protected getViewportRect(): Blockly.utils.Rect {
    const scale = this.workspace.getScale();
    const metrics = this.workspace.getMetrics();
    // metrics.flyoutWidth always return 0 since it's not always open.
    const flyoutWidth = this.workspace.getFlyout()?.getWidth() ?? 0;
    const viewLeft = (metrics.viewLeft - flyoutWidth) / scale;
    const viewTop = metrics.viewTop / scale;
    const viewWidth = (metrics.viewWidth + flyoutWidth) / scale;
    const viewHeight = metrics.viewHeight / scale;

    return new Blockly.utils.Rect(
      viewTop,
      viewTop + viewHeight,
      viewLeft,
      viewLeft + viewWidth
    );
  }

  /**
   * Actual logic to check whether these blocks are offscreen,
   * then update their visibility.
   */
  protected virtualizeInternal(): void {
    // Check workspace here since it may get called in public.
    if (!this.workspace) {
      this.dispose();
      return;
    }

    const viewRect = this.getViewportRect();
    const visibleIds = new Set(this.quadTree.query(viewRect));
    // Found the last visible blocks in their stacks.
    const lastVisibleBlocks = new Set<Blockly.BlockSvg>();
    const processedIds = new Set<string>();
    for (const id of visibleIds) {
      let block: Blockly.BlockSvg | null = this.workspace.getBlockById(id);
      while (block) {
        // Avoid processing the same block again.
        if (processedIds.has(block.id)) break;
        processedIds.add(block.id);
        const next = block.getNextBlock();
        if (!next) { // Reached the end of the stack...
          lastVisibleBlocks.add(block); // then it's the last visible block!
          break;
        }
        if (!visibleIds.has(next.id)) { // Next block is not visible...
          lastVisibleBlocks.add(block); // then it's the last visible block!
          break;
        }
        block = next;
      }
    }

    const proposedToHide = new Set<string>();
    // Update top block's visibility
    const topBlocks = this.workspace.getTopBlocks(false);
    for (const block of topBlocks) {
      if (!visibleIds.has(block.id)) {
        if (!this.hiddenBlocks.has(block.id)) {
          proposedToHide.add(block.id);
        }
      } else if (this.hiddenBlocks.has(block.id)) {
        this.setBlockVisibility(block, true);
      }
    }

    // Hide the block after the last visible blocks if has.
    for (const block of lastVisibleBlocks) {
      const root = block.getRootBlock();
      proposedToHide.delete(root.id);
      const target = block.getNextBlock();
      if (target) {
        this.setBlockVisibility(target, false);
      }

      if (!this.isBlockVisible(block)) {
        this.setBlockVisibility(block, true);
      }

      // Show previous hidden blocks
      let prev = block.getPreviousBlock();
      while (prev) {
        if (!this.isBlockVisible(prev)) {
          this.setBlockVisibility(prev, true);
          break;
        }
        prev = prev.getPreviousBlock();
      }
    }

    // Finally hide proposed blocks
    for (const id of proposedToHide) {
      const block = this.workspace.getBlockById(id);
      if (block) {
        this.setBlockVisibility(block, false);
      }
    }
  }

  /**
   * Display possible-visible blocks during dragging.
   * @param block The block to add extra buffer blocks.
   */
  protected addDraggingBuffer(block: Blockly.BlockSvg): void {
    const scale = this.workspace.getScale();
    const metrics = this.workspace.getMetrics();
    const viewHeight = metrics.viewHeight / scale;
    const buffer = Math.ceil(viewHeight / block.height) * 2;
    let current: Blockly.BlockSvg | null = block.getNextBlock();
    for (let i = 0; i < buffer; ++i) {
      if (!current) break;
      if (this.hiddenBlocks.has(current.id)) {
        this.setBlockVisibility(current, true);
      }
      current = current.getNextBlock();
    }
    if (current) {
      this.setBlockVisibility(current, false);
    }
  }

  /**
   * Check whether a block is visible.
   * @param block The block to check.
   * @returns Whether the block is visible.
   */
  protected isBlockVisible(block: Blockly.BlockSvg): boolean {
    return !this.hiddenBlocks.has(block.id);
  }

  /**
   * Set the visibility of a block.
   * @param block The block to set visibility for.
   * @param visible Whether the block visible.
   */
  protected setBlockVisibility(block: Blockly.BlockSvg, visible: boolean): void {
    const svgRoot = block.getSvgRoot();
    if (visible) {
      Blockly.utils.dom.removeClass(svgRoot, 'blocklyVirtualizedHidden');
      this.hiddenBlocks.delete(block.id);
    } else {
      Blockly.utils.dom.addClass(svgRoot, 'blocklyVirtualizedHidden');
      this.hiddenBlocks.add(block.id);
    }
  }

  /**
   * Start observing a block for virtualization.
   * @param blockId The block to observe.
   */
  protected observe(blockId: string): void {
    if (this.observedBlocks.has(blockId)) return;
    const block = this.workspace.getBlockById(blockId);
    // Track statement blocks only.
    if (!block || block.outputConnection?.isConnected()) return;

    const rect = this.getBlockBoundingRect(block);
    this.observedBlocks.add(blockId);
    this.quadTree.insert(blockId, rect);
  }

  /**
   * Stop observing a block.
   * @param blockId The block ID to stop observing.
   */
  protected unobserve(blockId: string): void {
    this.observedBlocks.delete(blockId);
    this.quadTree.remove(blockId);
    const block = this.workspace.getBlockById(blockId);
    // Make sure the block is visible when unobserved.
    if (block) {
      this.setBlockVisibility(block, true);
    }
  }

  /**
   * Update the position of a block in the QuadTree.
   * @param blockId The block ID to update.
   */
  protected updateBlockPosition(blockId: string): void {
    const block = this.workspace.getBlockById(blockId);
    if (!block) return;

    const rect = this.getBlockBoundingRect(block);
    this.quadTree.insert(blockId, rect);
  }

  /**
   * Get the bounding rectangle of a block relative to the workspace surface.
   * Consider inputs but not next blocks.
   * @param block The block to get bounding rectangle for.
   * @returns The bounding rectangle.
   */
  protected getBlockBoundingRect(block: Blockly.BlockSvg): Blockly.utils.Rect {
    const blockXY = block.getRelativeToSurfaceXY();
    let left;
    let right;
    if (block.RTL) {
      left = blockXY.x - block.width;
      right = blockXY.x;
    } else {
      left = blockXY.x;
      right = blockXY.x + block.width;
    }
    return new Blockly.utils.Rect(blockXY.y, blockXY.y + block.height, left, right);
  }

  /**
   * Dispose the manager.
   */
  dispose(): void {
    this.observedBlocks.clear();
    this.quadTree.clear();
    if (this.workspace) {
      this.workspace.removeChangeListener(this.workspaceChangeListener);
    }
  }
}

/**
 * Virtualize the given workspace. Make blocks offscreen invisible.
 * @param workspace The workspace to virtualize.
 * @param immediate Whether update block's visibility immediately.
 * Immediate mode hijacks workspace methods to update visibility immediately on viewport changes.
  If false, it uses workspace change listener to update visibility, which may be delayed. and you
  need to call `virtualize()` manually when window resized.
  Default to true.
 * @returns The VirtualizedManager instance.
 */
export function virtualize(workspace: Blockly.WorkspaceSvg, immediate = true): VirtualizedManager {
  if (workspace.getFlyout()) {
    virtualize(workspace.getFlyout()!.getWorkspace(), immediate);
  }

  return new VirtualizedManager(workspace, immediate);
}
