/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {Toolbox} from './toolbox';
import {FlyoutMetrics} from './flyout_metrics';
import type {FlyoutButton} from './flyout_button';
import type {BlockFlyoutInflater} from './inflaters/block';
import {FlyoutStatusIndicatorLabel} from './flyout_status_indicator_label';
import styles from '../styles/flyout.css';

/**
 * Class for customized flyout.
 */
export class VerticalFlyout extends Blockly.VerticalFlyout {
  /**
   * The percentage of the distance to the animation target that should be
   * processed at a time. Lower values will produce a smoother, slower scroll.
   */
  static readonly ANIMATION_FRACTION = 0.3;

  /** The width of the flyout, if not otherwise specified. */
  static readonly DEFAULT_WIDTH = 350;

  /** Default vertical gap. */
  override readonly GAP_Y: number = 10;

  /** Maps from category names to their positions. */
  protected scrollPositions: Map<string, number> = new Map<string, number>();

  /**
   * The target position for the flyout scroll animation in pixels.
   * Is a number while animating, null otherwise.
   */
  private scrollTarget: number | null = null;

  /**
   * The starting position for the flyout scroll animation in pixels.
   * Is a number while animating, null otherwise.
   */
  private scrollFrom: number | null = null;

  /**
   * The start time of the scroll animation.
   */
  private scrollStartTime: number | null = null;

  /**
   * The ID of the current animation frame request.
   * Used to cancel the previous animation when a new one starts.
   */
  private scrollAnimationId: number | null = null;

  /**
   * The target collapse state for the flyout collapse animation.
   * Is a boolean while animating, null otherwise.
   */
  private collapseTarget: boolean | null = null;

  /**
   * The start time of the collapse animation.
   */
  private collapseStartTime: number | null = null;

  /**
   * The ID of the current collapse animation frame request.
   * Used to cancel the previous animation when a new one starts.
   */
  private collapseAnimationId: number | null = null;

  /**
   * Whether to animate the flyout collapse/expand.
   */
  private animateCollapse = false;

  /**
   * The current x offset for collapse animation in pixels.
   * Used to offset the flyout position during animation.
   */
  private collapseAnimationOffset = 0;

  /**
   * @param workspaceOptions Dictionary of options for the workspace.
   */
  constructor(workspaceOptions: Blockly.Options) {
    super(workspaceOptions);
    this.workspace_.setMetricsManager(new FlyoutMetrics(this.workspace_, this));
    this.setRecyclingEnabled(true);
    this.setCollapseAnimationEnabled(true);
  }

  /**
   * Sets the function used to determine whether a block is recyclable.
   * @param func The function used to determine if a block is recyclable.
   */
  setBlockIsRecyclable(func: (block: Blockly.Block) => boolean) {
    this.getRecyclableInflater().recycleEligibilityChecker = func;
  }

  /**
   * Set whether the flyout can recycle blocks.
   * @param isEnabled True to allow blocks to be recycled, false otherwise.
   */
  setRecyclingEnabled(isEnabled: boolean) {
    this.getRecyclableInflater().recyclingEnabled = isEnabled;
  }

  /**
   * Returns the recyclable block flyout inflater.
   * @returns The recyclable inflater.
   */
  protected getRecyclableInflater(): BlockFlyoutInflater {
    return this.getInflaterForType('block') as BlockFlyoutInflater;
  }

  /**
   * Enable or disable collapse animation.
   * @param enabled Whether to enable collapse animation.
   */
  setCollapseAnimationEnabled(enabled: boolean) {
    this.animateCollapse = enabled;
  }

  /**
   * Show and populate the flyout.
   * @param flyoutDef Contents to display
   *     in the flyout. This is either an array of Nodes, a NodeList, a
   *     toolbox definition, or a string with the name of the dynamic category.
   */
  override show(flyoutDef: Blockly.utils.toolbox.FlyoutDefinition | string): void {
    // Disable collapse animation while populating the flyout to avoid jank.
    const prevAnimateCollapse = this.animateCollapse;
    if (prevAnimateCollapse) this.setCollapseAnimationEnabled(false);

    super.show(flyoutDef);
    this.recordScrollPositions();
    this.workspace_.resizeContents();

    if (prevAnimateCollapse) this.setCollapseAnimationEnabled(true);
  }

  /**
   * Set whether the flyout is visible.
   * Override to record drag targets when flyout becomes visible.
   * @param visible True if visible.
   */
  override setVisible(visible: boolean): void {
    const wasVisible = this.isVisible();
    if (wasVisible === visible && this.collapseTarget === null) {
      return;
    }
    const currentOffset = this.collapseAnimationOffset;
    this.cancelCollapseAnimation();
    if (this.animateCollapse) {
      // Let collapse animation decide visibility
      this.startCollapseAnimation(visible, currentOffset);
    } else {
      super.setVisible(visible);

      // Refresh drag targets when flyout becomes visible
      if (!wasVisible && visible && !this.autoClose) {
        this.targetWorkspace.recordDragTargets();
        this.reflow();
      }
    }
  }

  /**
   * Cancel the current collapse animation if one is in progress.
   */
  cancelCollapseAnimation(): void {
    if (this.collapseAnimationId !== null) {
      cancelAnimationFrame(this.collapseAnimationId);
    }

    if (this.collapseTarget !== null) {
      this.collapseAnimationOffset = 0;
      this.position();
    }
  }

  /**
   * Start the collapse animation.
   * @param visible The target collapse state.
   * @param initialOffset The initial offset for the animation.
   */
  private startCollapseAnimation(visible: boolean, initialOffset = 0): void {
    this.collapseTarget = visible;

    // Calculate elapsed time based on initial offset.
    let elapsed = 0;
    const flyoutWidth = this.getWidth();
    if (initialOffset !== 0) {
      const fraction = visible ?
        initialOffset / -flyoutWidth :
        1 - (initialOffset / -flyoutWidth);
      if (fraction > 0 && fraction <= 1) {
        elapsed = Math.log(fraction) / Math.log(VerticalFlyout.ANIMATION_FRACTION);
      }
    }

    this.collapseStartTime = Date.now() - elapsed * 60;

    this.workspace_.scrollbar?.setVisible(false);
    if (visible) {
      super.setVisible(true);
      this.collapseAnimationOffset = initialOffset !== 0 ? initialOffset : -this.getWidth();
      this.position();

      // Refresh drag targets when flyout becomes visible
      if (!this.autoClose) {
        this.targetWorkspace.recordDragTargets();
        this.reflow();
      }
    } else {
      if (initialOffset !== 0) {
        this.collapseAnimationOffset = initialOffset;
        this.position();
      }
    }

    this.collapseAnimationId = requestAnimationFrame(this.stepCollapseAnimation.bind(this, this.getX(), this.getY()));
  }

  /**
   * Step the collapse animation by translating the flyout.
   *
   * Should NOT call directly. Use startCollapseAnimation instead.
   * @param startX The starting x position of the flyout.
   * @param startY The starting y position of the flyout.
   */
  private stepCollapseAnimation(startX: number, startY: number): void {
    this.collapseAnimationId = null;

    const elapsed = (Date.now() - this.collapseStartTime!) / 60;
    const flyoutWidth = this.getWidth();

    const offset = this.collapseTarget ?
      -flyoutWidth * Math.pow(VerticalFlyout.ANIMATION_FRACTION, elapsed) :
      -flyoutWidth * (1 - Math.pow(VerticalFlyout.ANIMATION_FRACTION, elapsed));

    if (this.collapseTarget && Math.abs(offset) < 1) {
      this.finishCollapseAnimation();
      return;
    } else if (!this.collapseTarget && Math.abs(offset + flyoutWidth) < 1) {
      this.finishCollapseAnimation();
      return;
    }

    this.collapseAnimationOffset = offset;
    const x = startX + this.collapseAnimationOffset;
    const y = startY;
    Blockly.utils.dom.setCssTransform(this.svgGroup_!, 'translate3d(' + x + 'px,' + y + 'px, 0)');
    this.collapseAnimationId = requestAnimationFrame(this.stepCollapseAnimation.bind(this, startX, startY));
  }

  /**
   * Finish the collapse animation.
   */
  private finishCollapseAnimation(): void {
    this.collapseAnimationOffset = 0;
    this.position();

    const visible = this.collapseTarget;
    this.collapseTarget = null;
    this.collapseStartTime = null;
    if (visible) {
      this.workspace_.scrollbar?.setVisible(true);
    } else {
      super.setVisible(false);
    }
  }

  /**
   * Sets the translation of the flyout to match the scrollbars.
   * Override to update the selected category.
   * @param xyRatio Contains a y property which is a float between 0 and 1
   *     specifying the degree of scrolling and a similar x property.
   */
  protected override setMetrics_(xyRatio: { x: number; y: number; }): void {
    if (!this.isVisible()) {
      return;
    }

    super.setMetrics_(xyRatio);

    // Auto select category on scrolling.
    if (this.scrollTarget) {
      // If we are currently auto-scrolling, due to selecting a category by
      // clicking on it, do not update the category selection.
      return;
    }
    const id = this.getCategoryIdByScrollPosition(-this.workspace_.scrollY);
    if (id) {
      (this.targetWorkspace.getToolbox() as Toolbox).updateSelectedCategoryById(id);
    }
  }

  /**
   * Serialize a block to JSON.
   * @param block The block to serialize.
   * @returns A serialized representation of the block.
   */
  protected override serializeBlock(block: Blockly.BlockSvg): Blockly.serialization.blocks.State {
    return Blockly.serialization.blocks.save(block, {saveIds: false})!;
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
      if (item.getType() === 'label' || item.getType() === 'status_indicator_label') {
        const button = item.getElement() as FlyoutButton;
        const position = button.getPosition();
        this.scrollPositions.set(button.getLabelId()!, position.y - this.MARGIN);
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
      this.startScrollAnimation();
    } else {
      this.workspace_.scrollbar?.setY(position * this.workspace_.scale);
    }
  }

  /**
   * Scrolls flyout to the given category.
   * @param id Category unique ID.
   * @param animation True if plays animation on scrolling.
   */
  scrollToCategoryById(id: string, animation?: boolean): void {
    const position = this.scrollPositions.get(id);
    if (position !== undefined) {
      this.scrollTo(position, animation);
    } else {
      console.warn(`Cannot scroll to category id ${id}`);
    }
  }

  /**
   * Get an item in the toolbox based on the scroll position of the flyout.
   * @param position Current scroll position of the workspace.
   * @returns The category unique ID of scroll position, null if not found.
   */
  getCategoryIdByScrollPosition(position: number): string | null {
    const scaledPosition = Math.round(position / this.workspace_.scale);
    // Traverse in reverse to find the category.
    for (const id of Array.from(this.scrollPositions.keys()).reverse()) {
      const position = this.scrollPositions.get(id)!;
      if (position <= scaledPosition) {
        return id;
      }
    }
    return null;
  }

  /**
   * Start the scrolling animation.
   */
  private startScrollAnimation(): void {
    if (this.scrollTarget === null) {
      return;
    }

    if (this.scrollAnimationId !== null) {
      cancelAnimationFrame(this.scrollAnimationId);
    }

    this.scrollStartTime = Date.now();
    this.scrollFrom = -this.workspace_.scrollY;
    this.scrollAnimationId = requestAnimationFrame(this.stepScrollAnimation.bind(this));
  }

  /**
   * Step the scrolling animation by scrolling a fraction of the way to
   * a scroll target, and request the next frame if necessary.
   * Shouldn't be called directly. Use startScrollAnimation instead.
   */
  private stepScrollAnimation(): void {
    this.scrollAnimationId = null;
    const elapsed = (Date.now() - this.scrollStartTime!) / 60;
    const totalDistance = this.scrollTarget! - this.scrollFrom!;
    const scrollPos = this.scrollTarget! - totalDistance * Math.pow(VerticalFlyout.ANIMATION_FRACTION, elapsed);
    const diff = this.scrollTarget! - scrollPos;
    if (Math.abs(diff) < 1) {
      this.workspace_.scrollbar?.setY(this.scrollTarget!);
      this.scrollTarget = null;
      return;
    }

    this.workspace_.scrollbar?.setY(scrollPos);
    this.scrollAnimationId = requestAnimationFrame(this.stepScrollAnimation.bind(this));
  }

  /**
   * Reflow flyout contents.
   */
  override reflow(): void {
    // @todo A temporary fix for Blockly#9486, we assume that the reflow internal
    // won't fire a BLOCK_CHANGE or BLOCK_FIELD_INTERMEDIATE_CHANGE event.
    // See the implementation of reflowWrapper in Blockly.FlyoutBase.
    this.reflowInternal_();
  }

  /**
   * Compute width of flyout.
   * For RTL: Lay out the blocks and buttons to be right-aligned.
   */
  protected override reflowInternal_(): void {
    this.workspace_.scale = this.getFlyoutScale();
    const flyoutWidth = VerticalFlyout.DEFAULT_WIDTH * this.workspace_.scale;

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

  /**
   * Refresh all status indicators.
   */
  refreshStatusButtons() {
    for (const item of this.contents) {
      if (item instanceof FlyoutStatusIndicatorLabel) {
        item.refreshStatus();
      }
    }
  }
}

Blockly.Css.register(styles);

Blockly.registry.register(
  Blockly.registry.Type.FLYOUTS_VERTICAL_TOOLBOX,
  Blockly.registry.DEFAULT,
  VerticalFlyout,
  true
);

Blockly.Css.register(styles);
