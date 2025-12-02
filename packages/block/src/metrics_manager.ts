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
