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
  /**
   * Blocks being observed for virtualization.
   */
  protected observedBlocks = new Set<string>();
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
    proto.maybeFireViewportChangeEvent = function() {
      originalMaybeFireViewportChangeEvent.call(this);
      manager.virtualize();
    };

    const originalResize = proto.resize;
    proto.resize = function() {
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
          const block = this.workspace.getBlockById(id);
          if (!block) continue;
          if (!block.getParent()) {
            // Observe top blocks only.
            this.observe(id);
          }
        }
        break;
      }
      // This event only happens when a block's connections are changed.
      case Blockly.Events.BLOCK_MOVE: {
        // See blockly/core/connection.ts#L131
        const event = e as Blockly.Events.BlockMove;
        if (!event.blockId) break;

        const block = this.workspace.getBlockById(event.blockId);
        if (!block) break;
        if (!block.getParent()) {
          // Observe top blocks only.
          this.observe(block.id);
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
   * Actual logics to check whether these blocks are offscreen,
   * then update their visibility.
   */
  protected virtualizeInternal(): void {
    // Check workspace here since it's public.
    if (!this.workspace) {
      this.dispose();
      return;
    }

    const scale = this.workspace.getScale();
    const metrics = this.workspace.getMetrics();
    // metrics.flyoutWidth always return 0 since it's not always open.
    const flyoutWidth = this.workspace.getFlyout()?.getWidth() ?? 0;
    const viewLeft = metrics.viewLeft - flyoutWidth;
    const viewRight = metrics.viewLeft + metrics.viewWidth;
    const viewTop = metrics.viewTop;
    const viewBottom = metrics.viewTop + metrics.viewHeight;
    for (const blockId of this.observedBlocks) {
      const block = this.workspace.getBlockById(blockId);
      if (!block) continue;
      const blockBoundingBox = block.getBoundingRectangle();
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
   * @param blockId The block to observe.
   */
  protected observe(blockId: string): void {
    this.observedBlocks.add(blockId);
  }

  /**
   * Stop observing a block.
   * @param blockId The block ID to stop observing.
   */
  protected unobserve(blockId: string): void {
    this.observedBlocks.delete(blockId);
  }

  /**
   * Dispose the manager.
   */
  dispose(): void {
    this.observedBlocks.clear();
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
