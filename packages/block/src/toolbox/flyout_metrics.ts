/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ContinuousVerticalFlyout} from './flyout';

/**
 * Class for calculating metrics for a continuous flyout's workspace.
 */
export class ContinuousFlyoutMetrics extends Blockly.FlyoutMetricsManager {
  /**
   * @param workspace The flyout's workspace.
   * @param flyout The flyout.
   */
  constructor(workspace: Blockly.WorkspaceSvg, flyout: ContinuousVerticalFlyout) {
    super(workspace, flyout);
  }

  /**
   * Add extra padding to the bottom of the flyout to make it possible
   * to scroll to the last category.
   * @param getWorkspaceCoordinates Whether consider workspace scale or not.
   * @param viewMetrics The optional view metrics.
   * @param contentMetrics The optional content metrics.
   * @returns The scroll metrics with extra paddings.
   */
  override getScrollMetrics(
    getWorkspaceCoordinates?: boolean,
    viewMetrics?: Blockly.MetricsManager.ContainerRegion,
    contentMetrics?: Blockly.MetricsManager.ContainerRegion
  ): { height: number; width: number; top: number; left: number; } {
    const scrollMetrics = super.getScrollMetrics(getWorkspaceCoordinates, viewMetrics, contentMetrics);
    const extraMetrics = (this.flyout_ as ContinuousVerticalFlyout).getExtraPadding(
      contentMetrics || this.getContentMetrics(),
      viewMetrics || this.getViewMetrics()
    );
    scrollMetrics.height += extraMetrics.height;
    scrollMetrics.width = 0; // Scroll width should be 0 for vertical toolbox.
    return scrollMetrics;
  }
}
