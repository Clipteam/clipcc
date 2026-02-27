/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {getCommentBubbleFromBlock} from './scratch_blocks_utils';

export class MetricsManager extends Blockly.MetricsManager {
  protected trackedCommentedBlocks = new Set<Blockly.Block>();

  constructor(workspace: Blockly.WorkspaceSvg) {
    super(workspace);
    this.workspace_.addChangeListener(this.commentChangeListener.bind(this));
  }

  commentChangeListener(e: Blockly.Events.Abstract): void {
    switch (e.type) {
      case Blockly.Events.BLOCK_CREATE: {
        const createEvent = e as Blockly.Events.BlockCreate;
        if (!createEvent.ids) break;
        for (const id of createEvent.ids) {
          const block = this.workspace_.getBlockById(id);
          if (!block || block.getCommentText() === null) break;
          this.trackedCommentedBlocks.add(block);
        }
        break;
      }
      case Blockly.Events.BLOCK_CHANGE: {
        const changeEvent = e as Blockly.Events.BlockChange;
        if (changeEvent.element !== 'comment' || !changeEvent.blockId) break;
        const block = this.workspace_.getBlockById(changeEvent.blockId);
        if (!block) break;
        if (block.getCommentText() === null) {
          this.trackedCommentedBlocks.delete(block);
        } else {
          this.trackedCommentedBlocks.add(block);
        }
        break;
      }
      case Blockly.Events.BLOCK_DELETE: {
        const deleteEvent = e as Blockly.Events.BlockDelete;
        if (!deleteEvent.blockId) break;
        const block = this.workspace_.getBlockById(deleteEvent.blockId);
        if (!block || block.getCommentText() === null) break;
        this.trackedCommentedBlocks.delete(block);
        break;
      }
    }
  }

  /**
   * Gets content metrics in either pixel or workspace coordinates.
   * The content area is a rectangle around all the top bounded elements on the
   * workspace (workspace comments, blocks, and block comment bubbles).
   * @param getWorkspaceCoordinates True to get the content metrics in
   *     workspace coordinates, false to get them in pixel coordinates.
   * @returns The metrics for the content container.
   */
  override getContentMetrics(getWorkspaceCoordinates?: boolean): Blockly.MetricsManager.ContainerRegion {
    const scale = getWorkspaceCoordinates ? 1 : this.workspace_.scale;
    const metrics = super.getContentMetrics(getWorkspaceCoordinates);
    if (!this.trackedCommentedBlocks.size) return metrics;

    let commentsTop = Infinity;
    let commentsLeft = Infinity;
    let commentsBottom = -Infinity;
    let commentsRight = -Infinity;
    let hasComments = false;

    for (const block of this.trackedCommentedBlocks) {
      const comment = getCommentBubbleFromBlock(block);
      if (!comment) continue;
      hasComments = true;
      const commentMetrics = comment.getBoundingRectangle();

      if (commentMetrics.top < commentsTop) commentsTop = commentMetrics.top;
      if (commentMetrics.left < commentsLeft) commentsLeft = commentMetrics.left;
      if (commentMetrics.bottom > commentsBottom) commentsBottom = commentMetrics.bottom;
      if (commentMetrics.right > commentsRight) commentsRight = commentMetrics.right;
    }

    if (!hasComments) return metrics;

    const scaledTop = commentsTop * scale;
    const scaledLeft = commentsLeft * scale;
    const scaledBottom = commentsBottom * scale;
    const scaledRight = commentsRight * scale;

    const metricsBottom = metrics.top + metrics.height;
    const metricsRight = metrics.left + metrics.width;

    // Expand the bounding box to include comments
    metrics.top = Math.min(metrics.top, scaledTop);
    metrics.left = Math.min(metrics.left, scaledLeft);

    const newBottom = Math.max(metricsBottom, scaledBottom);
    const newRight = Math.max(metricsRight, scaledRight);

    // Update height and width based on new bounds
    metrics.height = newBottom - metrics.top;
    metrics.width = newRight - metrics.left;

    return metrics;
  }

  /**
   * Computes the viewport size to not include the toolbox and the flyout.
   * The default viewport includes the flyout.
   * @param getWorkspaceCoordinates True to get the view metrics in workspace
   *     coordinates, false to get them in pixel coordinates.
   * @returns The width, height, top and left of the viewport in either
   *     workspace coordinates or pixel coordinates.
   */
  override getViewMetrics(
    getWorkspaceCoordinates = false
  ): Blockly.MetricsManager.ContainerRegion {
    const scale = getWorkspaceCoordinates ? this.workspace_.scale : 1;
    const svgMetrics = this.getSvgMetrics();
    const toolboxMetrics = this.getToolboxMetrics();
    const flyoutMetrics = this.getFlyoutMetrics(false);
    const toolboxPosition = toolboxMetrics.position;

    if (this.workspace_.getToolbox()) {
      // Note: Not actually supported at this time due to ContinuousToolbox
      // only supporting a vertical flyout. But included for completeness.
      if (
        toolboxPosition == Blockly.TOOLBOX_AT_TOP ||
        toolboxPosition == Blockly.TOOLBOX_AT_BOTTOM
      ) {
        svgMetrics.height -= toolboxMetrics.height + flyoutMetrics.height;
      } else if (
        toolboxPosition == Blockly.TOOLBOX_AT_LEFT ||
        toolboxPosition == Blockly.TOOLBOX_AT_RIGHT
      ) {
        svgMetrics.width -= toolboxMetrics.width + flyoutMetrics.width;
      }
    }
    return {
      height: svgMetrics.height / scale,
      width: svgMetrics.width / scale,
      top: -this.workspace_.scrollY / scale,
      left: -this.workspace_.scrollX / scale
    };
  }

  /**
   * Gets the absolute left and absolute top in pixel coordinates.
   * This is where the visible workspace starts in relation to the SVG
   * container, adjusted to not include the area behind the flyout.
   * @returns The absolute metrics for the workspace.
   */
  override getAbsoluteMetrics(): Blockly.MetricsManager.AbsoluteMetrics {
    const toolboxMetrics = this.getToolboxMetrics();
    const flyoutMetrics = this.getFlyoutMetrics(false);
    const toolboxPosition = toolboxMetrics.position;
    let absoluteLeft = 0;

    if (
      this.workspace_.getToolbox() &&
      toolboxPosition == Blockly.TOOLBOX_AT_LEFT
    ) {
      absoluteLeft = toolboxMetrics.width + flyoutMetrics.width;
    }
    let absoluteTop = 0;
    if (
      this.workspace_.getToolbox() &&
      toolboxPosition == Blockly.TOOLBOX_AT_TOP
    ) {
      absoluteTop = toolboxMetrics.height + flyoutMetrics.height;
    }
    return {
      top: absoluteTop,
      left: absoluteLeft
    };
  }
}

// Register and override the original metrics manager.
Blockly.registry.register(
  Blockly.registry.Type.METRICS_MANAGER,
  Blockly.registry.DEFAULT,
  MetricsManager,
  true
);
