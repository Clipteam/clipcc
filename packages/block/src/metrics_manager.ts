/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {getCommentBubbleFromBlock} from './utils';
import type {BlockCommentDelete} from './events/block_comment_delete';
import {ContinuousMetrics} from '@blockly/continuous-toolbox';

export class MetricsManager extends ContinuousMetrics {
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
          const hasComment = !!getCommentBubbleFromBlock(block);
          if (!hasComment) break;
          this.trackedCommentedBlocks.add(block!);
        }
        break;
      }
      case Blockly.Events.BLOCK_CHANGE: {
        const changeEvent = e as Blockly.Events.BlockChange;
        if (changeEvent.element !== 'comment' || !changeEvent.blockId) break;
        const block = this.workspace_.getBlockById(changeEvent.blockId);
        const hasComment = !!getCommentBubbleFromBlock(block);
        if (!hasComment) break;
        if (!block?.getCommentText()) {
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
        if (!block) break;
        this.trackedCommentedBlocks.delete(block);
        break;
      }
    }
  }

  /**
   * Gets content metrics in either pixel or workspace coordinates.
   * The content area is a rectangle around all the top bounded elements on the
   * workspace (workspace comments, blocks, and block comment bubbles).
   * @param optGetWorkspaceCoordinates True to get the content metrics in
   *     workspace coordinates, false to get them in pixel coordinates.
   * @returns The metrics for the content container.
   */
  override getContentMetrics(optGetWorkspaceCoordinates?: boolean): Blockly.MetricsManager.ContainerRegion {
    const scale = optGetWorkspaceCoordinates ? 1 : this.workspace_.scale;
    const metrics = super.getContentMetrics(optGetWorkspaceCoordinates);

    for (const block of this.trackedCommentedBlocks) {
      const comment = getCommentBubbleFromBlock(block);
      if (!comment) continue;
      const commentMetrics = comment.getBoundingRectangle();

      const commentTop = commentMetrics.top * scale;
      const commentLeft = commentMetrics.left * scale;
      const commentBottom = commentMetrics.bottom * scale;
      const commentRight = commentMetrics.right * scale;

      // Expand the bounding box to include this comment
      metrics.top = Math.min(metrics.top, commentTop);
      metrics.left = Math.min(metrics.left, commentLeft);

      const metricsBottom = metrics.top + metrics.height;
      const metricsRight = metrics.left + metrics.width;

      const newBottom = Math.max(metricsBottom, commentBottom);
      const newRight = Math.max(metricsRight, commentRight);

      // Update height and width based on new bounds
      metrics.height = newBottom - metrics.top;
      metrics.width = newRight - metrics.left;
    }

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
