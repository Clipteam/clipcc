/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import styles from '../styles/checkbox.css';

/**
 * Class for a checkbox in the flyout.
 */
export class FlyoutCheckbox implements Blockly.IBoundedElement, Blockly.IRenderedElement, Blockly.IFocusableNode {
  /** Size of a checkbox. */
  static readonly CHECKBOX_SIZE = 25;

  /** Size of the checkbox corner radius. */
  static readonly CHECKBOX_CORNER_RADIUS = 5;

  /** Space above and around the checkbox. */
  static readonly CHECKBOX_MARGIN = 12;

  /** Amount of touchable padding around reporter checkboxes. */
  static readonly CHECKBOX_TOUCH_PADDING = 12;

  /** SVG path data for checkmark in checkbox. */
  static readonly CHECKMARK_PATH =
    'M' + this.CHECKBOX_SIZE / 4 +
    ' ' + this.CHECKBOX_SIZE / 2 +
    'L' + 5 * this.CHECKBOX_SIZE / 12 +
    ' ' + 2 * this.CHECKBOX_SIZE / 3 +
    'L' + 3 * this.CHECKBOX_SIZE / 4 +
    ' ' + this.CHECKBOX_SIZE / 3;

  /** The root SVG group. */
  protected svgGroup: SVGGElement;

  /** The checkbox SVG group. */
  protected checkboxSvg: SVGGElement;

  /** State of checkbox. */
  protected checked: boolean = false;

  /** Mouse up event data. */
  protected onMouseDownWrapper: Blockly.browserEvents.Data;

  /** Position of this element. */
  protected readonly position: Blockly.utils.Coordinate = new Blockly.utils.Coordinate(0, 0);

  /** Store the last height of flyout element, used to update checkbox position. */
  private lastHeight: number = 0;

  /**
   * @param flyoutItem The flyout element associated with.
   * @param workspace The workspace in which to place this checkbox.
   * @param targetWorkspace The flyout's target workspace.
   * @param value The initial state of checkbox.
   * @param onChange Event handler when checkbox state is changeed. The first
   *      argument represents the new checkbox state and the second one refers
   *      to the checkbox instance.
   */
  constructor(
    protected readonly flyoutItem: Blockly.FlyoutItem | null,
    protected readonly workspace: Blockly.WorkspaceSvg,
    protected readonly targetWorkspace: Blockly.WorkspaceSvg,
    value: boolean = false,
    protected readonly onChange?: (newChecked: boolean, self: FlyoutCheckbox) => void
  ) {
    this.svgGroup = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.G,
      {},
      workspace.getCanvas()
    );

    // Create the checkbox.
    this.checkboxSvg = this.createCheckbox(this.svgGroup);
    this.onMouseDownWrapper = Blockly.browserEvents.conditionalBind(
      this.checkboxSvg,
      'pointerdown',
      this,
      this.onMouseDown
    );

    // Set initial state.
    this.setChecked(value, false);

    const flyoutElement = this.flyoutItem?.getElement();
    if (flyoutElement) {
      // Append the flyout item.
      if (flyoutElement && Blockly.isRenderedElement(flyoutElement)) {
        this.svgGroup.appendChild(flyoutElement.getSvgRoot());
      }

      // Move the item for placing checkbox.
      flyoutElement.moveBy(
        (FlyoutCheckbox.CHECKBOX_SIZE + FlyoutCheckbox.CHECKBOX_MARGIN) * (this.workspace.RTL ? -1 : 1),
        0
      );
    }
  }

  /**
   * Dispose the checkbox.
   */
  dispose() {
    Blockly.browserEvents.unbind(this.onMouseDownWrapper);
    Blockly.utils.dom.removeNode(this.svgGroup);
  }

  toggleChecked(fireChangeEvent: boolean = true) {
    this.setChecked(!this.checked, fireChangeEvent);
  }

  isChecked() {
    return this.checked;
  }

  setChecked(newChecked: boolean, fireChangeEvent: boolean = true) {
    if (this.checked === newChecked) return;
    this.checked = newChecked;

    if (newChecked) {
      Blockly.utils.dom.addClass(this.checkboxSvg, 'checked');
    } else {
      Blockly.utils.dom.removeClass(this.checkboxSvg, 'checked');
    }

    if (fireChangeEvent && this.onChange) {
      this.onChange(newChecked, this);
    }
  }

  /**
   * Get the flyout item which the checkbox is associated with.
   * @returns The flyout item or a null value.
   */
  getChildItem() {
    return this.flyoutItem;
  }

  protected onMouseDown(e: PointerEvent) {
    const gesture = this.targetWorkspace.getGesture(e);
    const flyout = this.targetWorkspace.getFlyout();
    if (gesture && flyout) {
      gesture.handleFlyoutStart(e, flyout);
      gesture.cancel();
    }

    this.toggleChecked();

    // This event has been handled.  No need to bubble up to the document.
    e.stopPropagation();
    e.preventDefault();
  }

  /**
   * Create a checkbox SVG element.
   * @param svgRoot The SVG root to create the checkbox.
   * @returns The checkbox element.
   */
  protected createCheckbox(svgRoot: SVGElement): SVGGElement {
    const svgGroup = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.G,
      {},
      svgRoot
    );

    Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.RECT,
      {
        class: 'blocklyFlyoutCheckbox',
        height: FlyoutCheckbox.CHECKBOX_SIZE,
        width: FlyoutCheckbox.CHECKBOX_SIZE,
        rx: FlyoutCheckbox.CHECKBOX_CORNER_RADIUS,
        ry: FlyoutCheckbox.CHECKBOX_CORNER_RADIUS
      },
      svgGroup
    );

    Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.PATH,
      {
        class: 'blocklyFlyoutCheckboxPath',
        d: FlyoutCheckbox.CHECKMARK_PATH
      },
      svgGroup
    );

    Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.RECT,
      {
        class: 'blocklyTouchTargetBackground',
        x: `${-FlyoutCheckbox.CHECKBOX_TOUCH_PADDING}px`,
        y: `${-FlyoutCheckbox.CHECKBOX_TOUCH_PADDING}px`,
        height: FlyoutCheckbox.CHECKBOX_SIZE + 2 * FlyoutCheckbox.CHECKBOX_TOUCH_PADDING,
        width: FlyoutCheckbox.CHECKBOX_SIZE + 2 * FlyoutCheckbox.CHECKBOX_TOUCH_PADDING
      },
      svgGroup
    );

    return svgGroup;
  }

  /**
   * Position the checkbox in middle.
   */
  protected updateCheckboxPosition() {
    const flyoutElement = this.flyoutItem?.getElement();
    if (flyoutElement) {
      const itemHeight = flyoutElement.getBoundingRectangle().getHeight();
      const offsetY = (itemHeight - FlyoutCheckbox.CHECKBOX_SIZE) / 2;
      if (offsetY < 0) {
        flyoutElement.moveBy(0, offsetY);
      } else {
        this.checkboxSvg.setAttribute('transform', `translate(0, ${offsetY})`);
      }
    }
  }

  /**
   * Move the button to the given x, y coordinates.
   * @param x The new x coordinate.
   * @param y The new y coordinate.
   */
  moveTo(x: number, y: number) {
    this.position.x = x;
    this.position.y = y;
    this.svgGroup.setAttribute('transform', `translate(${x}, ${y})`);
  }

  getRelativeToSurfaceXY(): Blockly.utils.Coordinate {
    return this.position;
  }

  /** Implementation of Blockly.IRenderedElement */

  getSvgRoot(): SVGElement {
    return this.svgGroup;
  }

  /** Implementation of Blockly.IBoundedElement */

  getBoundingRectangle(): Blockly.utils.Rect {
    const itemRect = this.flyoutItem?.getElement().getBoundingRectangle();
    let height = FlyoutCheckbox.CHECKBOX_SIZE;
    let width = FlyoutCheckbox.CHECKBOX_SIZE;
    if (itemRect) {
      height = Math.max(height, itemRect.getHeight());
      width += FlyoutCheckbox.CHECKBOX_MARGIN + itemRect.getWidth();

      // Update position here if necessary.
      // @todo A better way should be considered.
      if (this.lastHeight !== height) {
        this.updateCheckboxPosition();
        this.lastHeight = height;
      }
    }

    return new Blockly.utils.Rect(
      this.position.y,
      this.position.y + height,
      this.position.x,
      this.position.x + width
    );
  }

  moveBy(dx: number, dy: number, reason?: string[]): void {
    this.moveTo(this.position.x + dx, this.position.y + dy);
  }

  /** Implementation of Blockly.IFocusableNode */

  getFocusableElement(): HTMLElement | SVGElement {
    return this.svgGroup;
  }

  getFocusableTree(): Blockly.IFocusableTree {
    return this.workspace;
  }

  onNodeFocus(): void {}

  onNodeBlur(): void {}

  canBeFocused(): boolean {
    return true;
  }
}

Blockly.Css.register(styles);
