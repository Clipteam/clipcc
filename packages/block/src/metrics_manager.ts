/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {getCommentBubbleFromBlock} from './utils';
import type {BlockCommentDelete} from './events/block_comment_delete';

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
          this.trackedCommentedBlocks.add(block!);
        }
        break;
      }
      case Blockly.Events.BLOCK_CHANGE: {
        const changeEvent = e as Blockly.Events.BlockChange;
        if (changeEvent.element !== 'comment' || !changeEvent.blockId) break;
        const block = this.workspace_.getBlockById(changeEvent.blockId);
        if (!block) break;
        if (block.getCommentText() === null) {
          this.trackedCommentedBlocks.delete(block!);
        } else {
          this.trackedCommentedBlocks.add(block!);
        }
        break;
      }
      case 'block_comment_delete': {
        const deleteEvent = e as BlockCommentDelete;
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
}

// Register and override the original metrics manager.
Blockly.registry.register(
  Blockly.registry.Type.METRICS_MANAGER,
  Blockly.registry.DEFAULT,
  MetricsManager,
  true
);
