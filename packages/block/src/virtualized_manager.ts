/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {QuadTree} from './utils/quad_tree';

export class VirtualizedManager {
  /**
   * Height of each buffered block during dragging, in pixels.
   */
  static readonly BUFFERED_BLOCK_HEIGHT = 40;
  /**
   * Hold a weak reference to the workspace to avoid memory leaks.
   */
  protected workspaceRef: WeakRef<Blockly.WorkspaceSvg>;
  /**
   * Blocks being observed for virtualization.
   */
  protected observedBlocks = new Map<string, {block: Blockly.BlockSvg; rect: Blockly.utils.Rect}>();
  /**
   * The quad tree used to manage block positions.
   */
  protected quadTree: QuadTree<Blockly.BlockSvg>;
  /**
   * Set of blocks that are currently hidden.
   */
  protected hiddenBlocks = new Set<Blockly.BlockSvg>();
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

    const halfW = viewWidth / 2;
    const halfH = viewHeight / 2;

    this.quadTree = new QuadTree(
      new Blockly.utils.Rect(cy - halfH, cy + halfH, cx - halfW, cx + halfW)
    );

    for (const block of workspace.getAllBlocks(false)) {
      this.observe(block);
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
   * Should only be called when `immediate` is true.
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

    const originalDispose = proto.dispose;
    this.workspace.dispose = function() {
      originalDispose.call(this);
      manager.dispose();
    };
  }

  protected workspaceChangeListener = (e: Blockly.Events.Abstract) => {
    switch (e.type) {
      case Blockly.Events.BLOCK_CREATE: {
        const event = e as Blockly.Events.BlockCreate;
        if (!event.ids) break;

        for (const id of event.ids) {
          const block = this.workspace.getBlockById(id);
          if (block) this.observe(block);
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
        let block = this.workspace.getBlockById(event.blockId);
        if (event instanceof Blockly.Events.BlockChange) {
          if (event.element === 'disabled' || event.element === 'comment') {
            // No need to update position for these changes.
            break;
          }
          if (block && event.element === 'field') {
            // Field change may affect block size. Update its parent.
            block = block.getParent();
          }
        }
        if (block) {
          const descendants = block.getDescendants(false);
          for (const desc of descendants) {
            if (this.observedBlocks.has(desc.id)) {
              this.updateObserve(desc);
            } else {
              this.observe(desc);
            }
          }
        }
        this.virtualize();
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
    const visibleBlocks = new Set(this.quadTree.query(viewRect));
    // Found the last visible blocks in their stacks.
    const lastVisibleBlocks = new Set<Blockly.BlockSvg>();
    const processedIds = new Set<string>();
    const rootBlocks = this.workspace.getTopBlocks(false);
    for (const block of visibleBlocks) {
      let current: Blockly.BlockSvg | null = block;
      while (current) {
        // Avoid processing the same block again.
        if (processedIds.has(current.id)) break;
        processedIds.add(current.id);
        const next = current.getNextBlock();
        if (!next) { // Reached the end of the stack...
          lastVisibleBlocks.add(current); // then it's the last visible block!
          break;
        }
        if (!visibleBlocks.has(next)) { // Next block is not visible...
          lastVisibleBlocks.add(current); // then it's the last visible block!
          break;
        }

        const inputs = current.getChildren(false);
        for (const input of inputs) {
          if (input === next) continue;
          if (input.getPreviousBlock()) {
            // It's a branch's root, add to rootBlocks.
            rootBlocks.push(input);
          }
        }
        current = next;
      }
    }

    const blocksToHide = new Set<Blockly.BlockSvg>();
    const blocksToShow = new Set<Blockly.BlockSvg>();

    // Update root block's visibility
    for (const block of rootBlocks) {
      if (!visibleBlocks.has(block)) {
        blocksToHide.add(block);
      }
    }

    // Hide the block after the last visible blocks if has.
    for (const block of lastVisibleBlocks) {
      const root = block.getRootBlock();
      blocksToHide.delete(root);
      const target = block.getNextBlock();
      if (target) {
        blocksToHide.add(target);
      }

      // Show previous hidden blocks
      let prev: Blockly.BlockSvg | null = block;
      while (prev) {
        if (blocksToShow.has(prev)) break;
        blocksToShow.add(prev);
        blocksToHide.delete(prev);
        prev = prev.getPreviousBlock();
      }
    }

    // Finally hide proposed blocks
    for (const block of blocksToHide) {
      if (blocksToShow.has(block)) continue;
      if (!this.hiddenBlocks.has(block)) {
        this.setBlockVisibility(block, false);
      }
    }

    for (const block of blocksToShow) {
      if (this.hiddenBlocks.has(block)) {
        this.setBlockVisibility(block, true);
      }
    }
  }

  /**
   * Display possible-visible blocks during dragging.
   * @param block The block to add extra buffer blocks.
   * @param buffer Number of blocks to show as buffer. If not provided, it will be
   * calculated based on workspace height.
   */
  protected addDraggingBuffer(block: Blockly.BlockSvg, buffer?: number): void {
    if (!buffer) {
      const scale = this.workspace.getScale();
      const {height} = this.workspace.getCachedParentSvgSize();
      buffer = Math.ceil(height / VirtualizedManager.BUFFERED_BLOCK_HEIGHT / scale);
    }

    let current: Blockly.BlockSvg | null = block;
    for (let i = 0; i < buffer; ++i) {
      if (!current) break;
      if (this.hiddenBlocks.has(current)) {
        this.setBlockVisibility(current, true);
      }
      const children = current.getChildren(false);
      const nextBlock = current.getNextBlock();
      for (const child of children) {
        if (child === nextBlock) continue;
        this.addDraggingBuffer(child, buffer - i - 1);
      }
      current = nextBlock;
    }
    if (current && this.hiddenBlocks.has(current)) {
      this.setBlockVisibility(current, false);
    }
  }

  /**
   * Check whether a block is visible.
   * @param block The block to check.
   * @returns Whether the block is visible.
   */
  protected isBlockVisible(block: Blockly.BlockSvg): boolean {
    return !this.hiddenBlocks.has(block);
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
      this.hiddenBlocks.delete(block);
    } else {
      Blockly.utils.dom.addClass(svgRoot, 'blocklyVirtualizedHidden');
      this.hiddenBlocks.add(block);
    }
  }

  /**
   * Start observing a block for virtualization.
   * @param block The block to observe.
   */
  protected observe(block: Blockly.BlockSvg): void {
    if (this.observedBlocks.has(block.id)) return;
    // Track root-level blocks only.
    if (block.outputConnection?.isConnected()) return;

    const rect = this.getBlockBoundingRect(block);
    this.observedBlocks.set(block.id, {block, rect});
    this.quadTree.insert(block, rect);
  }

  /**
   * Stop observing a block.
   * @param blockId The block ID to stop observing.
   */
  protected unobserve(blockId: string): void {
    const entry = this.observedBlocks.get(blockId);
    if (!entry) return;
    this.observedBlocks.delete(blockId);
    this.quadTree.remove(entry.block, entry.rect);
    // Make sure the block is visible when unobserved.
    this.setBlockVisibility(entry.block, true);
  }

  /**
   * Update the status for observed block.
   * @param block The block to update.
   */
  protected updateObserve(block: Blockly.BlockSvg): void {
    const entry = this.observedBlocks.get(block.id);
    if (!entry) return;
    if (block.outputConnection?.isConnected()) {
      this.unobserve(block.id);
      return;
    }

    this.quadTree.remove(block, entry.rect);
    const rect = this.getBlockBoundingRect(block);
    entry.rect = rect;
    this.quadTree.insert(block, rect);
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
      if (this.immediate) {
        // Restore hooked methods.
        if (Object.hasOwnProperty.call(this.workspace, 'maybeFireViewportChangeEvent')) {
          // @ts-expect-error The original method is in its prototype, safe to delete here.
          delete this.workspace.maybeFireViewportChangeEvent;
        }
        if (Object.hasOwnProperty.call(this.workspace, 'resize')) {
          // @ts-expect-error The original method is in its prototype, safe to delete here.
          delete this.workspace.resize;
        }
        if (Object.hasOwnProperty.call(this.workspace, 'dispose')) {
          // @ts-expect-error The original method is in its prototype, safe to delete here.
          delete this.workspace.dispose;
        }
      }
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
