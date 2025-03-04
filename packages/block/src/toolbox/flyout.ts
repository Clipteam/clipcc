/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ContinuousToolBox} from './toolbox';

/**
 * Class for continuous flyout.
 */
export class ContinuousVerticalFlyout extends Blockly.VerticalFlyout {
  /**
   * The percentage of the distance to the scrollTarget that should be
   * scrolled at a time. Lower values will produce a smoother, slower scroll.
   */
  static readonly SCROLL_ANIMATION_FRACTION = 0.3;

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
      this.scrollTarget = position * this.workspace_.scale;
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

  protected override wheel_(e: WheelEvent): void {
    super.wheel_(e);

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
}
