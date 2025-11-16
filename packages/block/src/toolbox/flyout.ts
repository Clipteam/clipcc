/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ContinuousToolBox} from './toolbox';
import {ContinuousFlyoutMetrics} from './flyout_metrics';

/**
 * Class for continuous flyout.
 */
export class ContinuousVerticalFlyout extends Blockly.VerticalFlyout {
  /**
   * The percentage of the distance to the scrollTarget that should be
   * scrolled at a time. Lower values will produce a smoother, slower scroll.
   */
  static readonly SCROLL_ANIMATION_FRACTION = 0.3;

  /** The width of the flyout, if not otherwise specified. */
  static readonly DEFAULT_WIDTH = 250;

  /** Maps from category names to their positions. */
  protected scrollPositions: Map<string, number> = new Map<string, number>();

  /**
   * The target position for the flyout scroll animation in pixels.
   * Is a number while animating, null otherwise.
   */
  private scrollTarget: number | null = null;

  /**
   * @param workspaceOptions Dictionary of options for the workspace.
   */
  constructor(workspaceOptions: Blockly.Options) {
    super(workspaceOptions);
    this.workspace_.setMetricsManager(
      new ContinuousFlyoutMetrics(this.workspace_, this)
    );
  }

  /**
   * Show and populate the flyout.
   * @param flyoutDef Contents to display
   *     in the flyout. This is either an array of Nodes, a NodeList, a
   *     toolbox definition, or a string with the name of the dynamic category.
   */
  override show(flyoutDef: Blockly.utils.toolbox.FlyoutDefinition | string): void {
    super.show(flyoutDef);
    this.recordScrollPositions();
    this.workspace_.resizeContents();
  }

  /**
   * Set whether the flyout is visible.
   * Override to record drag targets when flyout becomes visible.
   * @param visible True if visible.
   */
  override setVisible(visible: boolean): void {
    const wasVisible = this.isVisible();
    super.setVisible(visible);

    // Refresh drag targets when flyout becomes visible
    if (!wasVisible && visible && !this.autoClose) {
      this.targetWorkspace.recordDragTargets();
    }
  }

  /**
   * Sets the translation of the flyout to match the scrollbars.
   * Override to update the selected category.
   * @param xyRatio Contains a y property which is a float between 0 and 1
   *     specifying the degree of scrolling and a similar x property.
   */
  protected override setMetrics_(xyRatio: { x: number; y: number; }): void {
    super.setMetrics_(xyRatio);

    // Auto select category on scrolling.
    if (this.scrollTarget) {
      // If we are currently auto-scrolling, due to selecting a category by
      // clicking on it, do not update the category selection.
      return;
    }
    const category = this.getCategoryByScrollPosition(-this.workspace_.scrollY);
    if (category) {
      (this.targetWorkspace.getToolbox() as ContinuousToolBox).updateSelectedCategory(category);
    }
  }

  /**
   * Add extra padding to the bottom of the flyout to make it possible
   * to scroll to the last category.
   * @param contentMetrics Content metrics for the flyout.
   * @param viewMetrics View metrics for the flyout.
   * @returns Extra padding.
   */
  getExtraPadding(
    contentMetrics: Blockly.MetricsManager.ContainerRegion,
    viewMetrics: Blockly.MetricsManager.ContainerRegion
  ): {width: number; height: number} {
    if (this.scrollPositions.size > 0) {
      const lastCategoryPosition = Array.from(this.scrollPositions.values()).pop()!;
      const margin = 2 * this.MARGIN * this.workspace_.scale;
      const lastCategoryHeight = contentMetrics.height - lastCategoryPosition * this.workspace_.scale;
      return {
        width: 0,
        height: Math.max(0, viewMetrics.height - lastCategoryHeight - margin)
      };
    }
    return {width: 0, height: 0};
  }

  /**
   * Records scroll position for each category in the toolbox.
   * The scroll position is determined by the coordinates of each category's
   * label after the entire flyout has been rendered.
   */
  recordScrollPositions(): void {
    this.scrollPositions.clear();
    for (const item of this.contents) {
      if (item.getType() === 'label') {
        const button = item.getElement() as Blockly.FlyoutButton;
        const position = button.getPosition();
        this.scrollPositions.set(button.getButtonText(), position.y - this.MARGIN);
      }
    }
  }

  /**
   * Scrolls flyout to given position.
   * @param position The y position to scroll to.
   * @param animation True if plays animation on scrolling.
   */
  scrollTo(position: number, animation?: boolean): void {
    if (animation) {
      const metrics = this.workspace_.getMetrics();
      this.scrollTarget = Math.min(
        position * this.workspace_.scale,
        Math.max(metrics.scrollHeight - metrics.viewHeight, 0)
      );
      this.stepScrollAnimation();
    } else {
      this.workspace_.scrollbar?.setY(position * this.workspace_.scale);
    }
  }

  /**
   * Scrolls flyout to the given category.
   * @param category Category name.
   * @param animation True if plays animation on scrolling.
   */
  scrollToCategory(category: string, animation?: boolean): void {
    const position = this.scrollPositions.get(category);
    if (position !== undefined) {
      this.scrollTo(position, animation);
    } else {
      console.warn(`Cannot scroll to category ${category}`);
    }
  }

  /**
   * Get an item in the toolbox based on the scroll position of the flyout.
   * @param position Current scroll position of the workspace.
   * @returns The category name of scroll position, null if not found.
   */
  getCategoryByScrollPosition(position: number): string | null {
    const scaledPosition = Math.round(position / this.workspace_.scale);
    // Traverse in reverse to find the category.
    for (const category of Array.from(this.scrollPositions.keys()).reverse()) {
      const position = this.scrollPositions.get(category)!;
      if (position <= scaledPosition) {
        return category;
      }
    }
    return null;
  }

  /**
   * Step the scrolling animation by scrolling a fraction of the way to
   * a scroll target, and request the next frame if necessary.
   */
  private stepScrollAnimation(): void {
    if (this.scrollTarget === null) {
      return;
    }

    const scrollPos = -this.workspace_.scrollY;
    const diff = this.scrollTarget - scrollPos;
    if (Math.abs(diff) < 1) {
      this.workspace_.scrollbar?.setY(this.scrollTarget);
      this.scrollTarget = null;
      return;
    }

    this.workspace_.scrollbar?.setY(scrollPos + diff * ContinuousVerticalFlyout.SCROLL_ANIMATION_FRACTION);
    requestAnimationFrame(this.stepScrollAnimation.bind(this));
  }

  /**
   * Compute width of flyout.
   * For RTL: Lay out the blocks and buttons to be right-aligned.
   */
  protected override reflowInternal_(): void {
    this.workspace_.scale = this.getFlyoutScale();
    const flyoutWidth = ContinuousVerticalFlyout.DEFAULT_WIDTH * this.workspace_.scale;

    if (this.getWidth() !== flyoutWidth) {
      if (this.RTL) {
        // With the flyoutWidth known, right-align the flyout contents.
        for (const item of this.getContents()) {
          const oldX = item.getElement().getBoundingRectangle().left;
          const newX =
            flyoutWidth / this.workspace_.scale -
            item.getElement().getBoundingRectangle().getWidth() -
            this.MARGIN -
            this.tabWidth_;
          item.getElement().moveBy(newX - oldX, 0);
        }
      }

      // TODO(#7689): Remove this.
      // Workspace with no scrollbars where this is permanently
      // open on the left.
      // If scrollbars exist they properly update the metrics.
      if (
        !this.targetWorkspace.scrollbar &&
        !this.autoClose &&
        this.targetWorkspace.getFlyout() === this &&
        this.toolboxPosition_ === Blockly.utils.toolbox.Position.LEFT
      ) {
        this.targetWorkspace.translate(
          this.targetWorkspace.scrollX + flyoutWidth,
          this.targetWorkspace.scrollY
        );
      }

      this.width_ = flyoutWidth;
      this.position();
      this.targetWorkspace.resizeContents();
      this.targetWorkspace.recordDragTargets();
    }
  }
}
