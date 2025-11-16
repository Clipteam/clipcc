/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {AnchoredComment} from './anchored_comment';
import type {BlockCommentIcon} from './block_comment_icon';

export class MetricsManager extends Blockly.MetricsManager {
  protected trackedBlockComments = new Set<AnchoredComment>();

  constructor(workspace: Blockly.WorkspaceSvg) {
    super(workspace);
    this.workspace_.addChangeListener(this.commentChangeListener.bind(this));
  }

  commentChangeListener(e: Blockly.Events.Abstract): void {
    switch (e.type) {
      case Blockly.Events.BLOCK_CHANGE: {
        const changeEvent = e as Blockly.Events.BlockChange;
        if (changeEvent.element !== 'comment' || !changeEvent.blockId) break;
        const commentIcon =
          this.workspace_.getBlockById(changeEvent.blockId)
            ?.getIcon(Blockly.icons.IconType.COMMENT) as BlockCommentIcon;
        if (!commentIcon) break;
        if (changeEvent.newValue === null) {
          this.trackedBlockComments.delete(commentIcon.getBubble());
        } else {
          this.trackedBlockComments.add(commentIcon.getBubble());
        }
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
    // Dirty hack to include block comment bubbles in content metrics.
    const originalTopElements: Blockly.IBoundedElement[] = [...this.workspace_['topBoundedElements']];
    this.workspace_['topBoundedElements'].push(...Array.from(this.trackedBlockComments));
    const metrics = super.getContentMetrics(optGetWorkspaceCoordinates);
    this.workspace_['topBoundedElements'] = originalTopElements;
    return metrics;
  }
}

// Register and overrides the original metrics manager.
Blockly.registry.register(
  Blockly.registry.Type.METRICS_MANAGER,
  Blockly.registry.DEFAULT,
  MetricsManager,
  true
);
