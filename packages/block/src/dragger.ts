/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {isShadowTemplate} from './interfaces/i_shadow_template';
import {isDynamicDeletable} from './interfaces/i_dynamic_deletable';
import {BlockDragOutside} from './events/block_drag_outside';
import {BlockDragEnd} from './events/block_drag_end';

/**
 * Custom dragger.
 */
export class Dragger extends Blockly.dragging.Dragger {
  static readonly BOUNDLESS_CLASS = 'blocklyBlockDragBoundless';

  static readonly MOUSE_THROUGH_CLASS = 'blocklyDraggingMouseThrough';

  /** Whether the drag originated from the flyout. */
  protected originatedFromFlyout = false;
  /** Whether the block was outside of the blocks UI during the drag. */
  protected wasOutside = false;
  /** The workspace in which the drag started. */
  protected dragWorkspace!: Blockly.WorkspaceSvg;

  /**
   * Handles any drag startup. Shadow template blocks should be duplicated
   * before dragging.
   * @param e The pointer event.
   * @returns The draggable object.
   */
  override onDragStart(e: PointerEvent | KeyboardEvent): Blockly.IDraggable {
    this.dragWorkspace = this.draggable.workspace;
    if (e instanceof PointerEvent && this.draggable instanceof Blockly.BlockSvg) {
      const workspace = this.dragWorkspace;
      // Make elements can drag outside of workspace bounds.
      workspace.addClass(Dragger.BOUNDLESS_CLASS);
      const absoluteMetrics = workspace.getMetricsManager().getAbsoluteMetrics();
      const viewMetrics = workspace.getMetricsManager().getViewMetrics();
      if (
        workspace.RTL ?
          e.clientX > workspace.getParentSvg().getBoundingClientRect().left +
          viewMetrics.width :
          e.clientX < absoluteMetrics.left
      ) {
        this.originatedFromFlyout = true;
      }

      // Duplicate the shadow template block and drag the new block.
      if (
        this.draggable.isShadow() && isShadowTemplate(this.draggable) && this.draggable.shadowTemplate
      ) {
        if (!Blockly.Events.getGroup()) {
          Blockly.Events.setGroup(true);
        }
        this.draggable = this.duplicateBlock(this.draggable);
        Blockly.getFocusManager().focusNode(this.draggable as Blockly.BlockSvg);
      }
    }

    return super.onDragStart(e);
  }

  /**
   * Handles motion during an ongoing drag operation.
   * @param event The event that triggered this call.
   * @param totalDelta The change in pointer position since the last invocation.
   */
  override onDrag(event: PointerEvent | KeyboardEvent | undefined, totalDelta: Blockly.utils.Coordinate) {
    super.onDrag(event, totalDelta);
    if (event instanceof PointerEvent) {
      this.maybeFireDragOutsideEvent(event);
    }
  }

  /**
   * Returns whether or not the dragged item should return to its starting
   * position.
   * @param event The drag event that triggered this check.
   * @param rootDraggable The topmost item being dragged.
   * @returns True if the draggable should return to its starting position.
   */
  override shouldReturnToStart(coordinate: Blockly.utils.Coordinate, rootDraggable: Blockly.IDraggable) {
    // If a block is dragged out of the workspace to be e.g. dropped on another
    // sprite, it should remain in the same place on the workspace where it was,
    // rather than being moved to an invisible part of the workspace.
    return this.wasOutside || super.shouldReturnToStart(coordinate, rootDraggable);
  }

  /**
   * Checks whether to fire a BlockDragOutside event if the block has moved
   * in or out of the blocks UI.
   * @param event The pointer event.
   */
  protected maybeFireDragOutsideEvent(event: PointerEvent) {
    if (!(this.draggable instanceof Blockly.BlockSvg)) return;

    const isOutside = !this.isInsideWorkspace(event);
    if (isOutside !== this.wasOutside) {
      const block = this.getDragRoot(this.draggable);
      const event = new BlockDragOutside(block, isOutside);
      Blockly.Events.fire(event);
      this.wasOutside = isOutside;

      // Set pointer-events on dragging block to allow mouse events to pass through
      // to GUI elements when dragging outside workspace.
      this.setMouseThroughStyle(block, isOutside);
    }
  }

  /**
   * Sets or removes the mouse-through style on a block and its descendants.
   * When enabled, mouse events will pass through the block to elements below.
   * @param block The block to modify.
   * @param enable Whether to enable mouse-through style.
   */
  protected setMouseThroughStyle(block: Blockly.BlockSvg, enable: boolean) {
    const svgGroup = block.getSvgRoot();
    if (!svgGroup) return;

    if (enable) {
      Blockly.utils.dom.addClass(svgGroup, Dragger.MOUSE_THROUGH_CLASS);
    } else {
      Blockly.utils.dom.removeClass(svgGroup, Dragger.MOUSE_THROUGH_CLASS);
    }
  }

  /**
   * Returns the root block to use for firing BlockDragOutside events.
   * @param block The block being dragged.
   * @returns The root block for the drag event.
   */
  protected getDragRoot(block: Blockly.BlockSvg) {
    return block.isShadow() ? block.getParent() as Blockly.BlockSvg : block;
  }

  /**
   * Returns whether or not the given event occurred within the bounds of the
   * workspace.
   * @param event The event to check.
   * @returns True if the event occurred inside the workspace.
   */
  protected isInsideWorkspace(event: PointerEvent) {
    const bounds = this.draggable.workspace.getParentSvg().getBoundingClientRect();
    const workspaceRect = new Blockly.utils.Rect(
      bounds.top,
      bounds.bottom,
      bounds.left,
      bounds.right
    );
    return workspaceRect.contains(event.clientX, event.clientY);
  }

  /**
   * Duplicate the given block and place it correctly.
   * @param originalBlock The block to be duplicated.
   * @returns The newly created block.
   */
  protected duplicateBlock(originalBlock: Blockly.BlockSvg): Blockly.BlockSvg {
    Blockly.Events.disable();

    const json = Blockly.serialization.blocks.save(originalBlock)!;
    this.draggable.workspace.setResizesEnabled(false);
    const newBlock = Blockly.serialization.blocks.append(json, this.draggable.workspace) as Blockly.BlockSvg;

    newBlock.moveTo(originalBlock.getRelativeToSurfaceXY());

    Blockly.Events.enable();
    Blockly.Events.fire(new (Blockly.Events.get(Blockly.Events.BLOCK_CREATE))(newBlock));

    return newBlock;
  }

  /**
   * Handles any drag cleanup.
   * @param e The event that finished the drag.
   */
  override onDragEnd(e?: PointerEvent | KeyboardEvent): void {
    // Check for IDynamicDeletable.
    const root = this.draggable instanceof Blockly.BlockSvg ? this.draggable.getRootBlock() : this.draggable;
    if (e instanceof PointerEvent && isDynamicDeletable(root) && Blockly.isDeletable(root)) {
      const coordinate = new Blockly.utils.Coordinate(e.clientX, e.clientY);
      if (this.wouldDeleteDraggable(coordinate, root) && !root.checkDeletable(false)) {
        this.draggable.revertDrag();
        this.draggable.endDrag(e, Blockly.DragDisposition.REVERT);
        return;
      }
    }

    super.onDragEnd(e);

    if (this.draggable instanceof Blockly.BlockSvg) {
      if (e instanceof PointerEvent) {
        this.maybeFireDragOutsideEvent(e);
      }
      const block = this.getDragRoot(this.draggable);
      const event = new BlockDragEnd(block, this.wasOutside);
      Blockly.Events.fire(event);

      // Always remove the mouse-through style at drag end
      this.setMouseThroughStyle(block, false);

      // If this block was dragged out of the flyout and dropped outside of
      // the workspace (e.g. on a different sprite), the block that was created
      // on the workspace in order to depict the block mid-drag needs to be
      // deleted.
      if (this.originatedFromFlyout && this.wasOutside) {
        Blockly.renderManagement.finishQueuedRenders().then(() => {
          const rootBlock = this.getDragRoot(this.draggable as Blockly.BlockSvg);
          rootBlock.dispose(true, false);
        });
      }
    }
    this.dragWorkspace.removeClass(Dragger.BOUNDLESS_CLASS);
  }
}

// Register and overrides the original dragger.
Blockly.registry.register(Blockly.registry.Type.BLOCK_DRAGGER, Blockly.registry.DEFAULT, Dragger, true);
