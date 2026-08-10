/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import styles from '../styles/checkbox.css';
import {Checkbox} from './checkbox';

/**
 * Class for a group containing a checkbox and a flyout block.
 *
 * The group acts as the flyout item element and the primary focusable node:
 * focusing it highlights the whole item and pressing Enter acts on the inner
 * block (e.g. placing it on the workspace). The checkbox itself is a separate
 * focusable node reachable by navigating into the group.
 */
export class FlyoutCheckboxGroup implements Blockly.IBoundedElement, Blockly.IRenderedElement, Blockly.IFocusableNode {
  /** The root SVG group. */
  protected svgGroup: SVGGElement;

  /** The checkbox inside this group. */
  protected checkbox: Checkbox;

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
   *      to the checkbox group instance.
   */
  constructor(
    protected readonly flyoutItem: Blockly.FlyoutItem | null,
    protected readonly workspace: Blockly.WorkspaceSvg,
    protected readonly targetWorkspace: Blockly.WorkspaceSvg,
    value: boolean = false,
    protected readonly onChange?: (newChecked: boolean, self: FlyoutCheckboxGroup) => void
  ) {
    this.svgGroup = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.G,
      {id: Blockly.utils.idGenerator.getNextUniqueId()},
      workspace.getCanvas()
    );

    // Create the checkbox.
    this.checkbox = new Checkbox(
      this,
      workspace,
      (newChecked, checkbox) => {
        if (this.onChange) this.onChange(newChecked, this);
      },
      (e) => this.onMouseDown(e)
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
        (Checkbox.CHECKBOX_SIZE + Checkbox.CHECKBOX_MARGIN) * (this.workspace.RTL ? -1 : 1),
        0
      );
    }
  }

  /**
   * Dispose the checkbox group.
   */
  dispose() {
    this.checkbox.dispose();
    Blockly.utils.dom.removeNode(this.svgGroup);
  }

  /**
   * Returns the checkbox of this group.
   * @returns The checkbox node.
   */
  getCheckbox(): Checkbox {
    return this.checkbox;
  }

  toggleChecked(fireChangeEvent: boolean = true) {
    this.checkbox.toggleChecked(fireChangeEvent);
  }

  isChecked() {
    return this.checkbox.isChecked();
  }

  setChecked(newChecked: boolean, fireChangeEvent: boolean = true) {
    this.checkbox.setChecked(newChecked, fireChangeEvent);
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

    // Sync the Blockly focus state when the checkbox is clicked, the same way
    // blocks get focused on click.
    Blockly.getFocusManager().focusNode(this);

    this.toggleChecked();

    // This event has been handled.  No need to bubble up to the document.
    e.stopPropagation();
    e.preventDefault();
  }

  /**
   * Position the checkbox in middle.
   */
  protected updateCheckboxPosition() {
    const flyoutElement = this.flyoutItem?.getElement();
    if (flyoutElement) {
      const itemHeight = flyoutElement.getBoundingRectangle().getHeight();
      const offsetY = (itemHeight - Checkbox.CHECKBOX_SIZE) / 2;
      if (offsetY < 0) {
        flyoutElement.moveBy(0, offsetY);
      } else {
        this.checkbox.getFocusableElement().setAttribute('transform', `translate(0, ${offsetY})`);
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
    let height = Checkbox.CHECKBOX_SIZE;
    let width = Checkbox.CHECKBOX_SIZE;
    if (itemRect) {
      height = Math.max(height, itemRect.getHeight());
      width += Checkbox.CHECKBOX_MARGIN + itemRect.getWidth();

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

  getFocusableTree(): Blockly.WorkspaceSvg {
    return this.workspace;
  }

  onNodeFocus(): void {}

  onNodeBlur(): void {}

  canBeFocused(): boolean {
    return true;
  }

  /**
   * Handles the user acting on this group via keyboard navigation
   * (e.g. pressing Enter or Space while it has focus). In most cases people
   * wants the block rather than checkbox, so the action is delegated to the
   * inner block.
   * @param _e The event that triggered this action, if any.
   */
  performAction(_e?: Event): void {
    const flyoutElement = this.flyoutItem?.getElement();
    if (flyoutElement) {
      flyoutElement.performAction?.(_e);
    } else {
      this.toggleChecked();
    }
  }
}

Blockly.Css.register(styles);

/**
 * Set of rules controlling keyboard navigation from a flyout checkbox group
 * and its checkbox. Inter-item navigation is handled by the flyout's
 * navigator, so both only need to report their parent and navigability.
 * The checkbox shares the group's row id so that navigation can enter it
 * (and leave it) as a child of the group.
 */
export class FlyoutCheckboxGroupNavigationPolicy implements Blockly.INavigationPolicy<FlyoutCheckboxGroup | Checkbox> {
  /**
   * Returns the checkbox of the given group, or null since checkboxes have
   * no children.
   * @param current The instance to navigate from.
   * @returns The checkbox of the group, or null.
   */
  getFirstChild(current: FlyoutCheckboxGroup | Checkbox): Blockly.IFocusableNode | null {
    return current instanceof FlyoutCheckboxGroup ? current.getCheckbox() : null;
  }

  /**
   * Returns the parent workspace of the given group, or the containing group
   * of the given checkbox.
   * @param current The instance to navigate from.
   * @returns The parent node of the given instance.
   */
  getParent(current: FlyoutCheckboxGroup | Checkbox): Blockly.IFocusableNode | null {
    return current instanceof Checkbox ? current.getGroup() : current.getFocusableTree();
  }

  /**
   * Returns null since inter-item navigation is done by the flyout navigator.
   * @param _current The instance to navigate from.
   * @returns Null.
   */
  getNextSibling(_current: FlyoutCheckboxGroup | Checkbox): Blockly.IFocusableNode | null {
    return null;
  }

  /**
   * Returns null since inter-item navigation is done by the flyout navigator.
   * @param _current The instance to navigate from.
   * @returns Null.
   */
  getPreviousSibling(_current: FlyoutCheckboxGroup | Checkbox): Blockly.IFocusableNode | null {
    return null;
  }

  /**
   * Returns the row ID of the given group. The checkbox shares its group's
   * row ID so that navigation into and out of the checkbox is allowed.
   * @param current The instance to retrieve the row ID of.
   * @returns The row ID of the given instance.
   */
  getRowId(current: FlyoutCheckboxGroup | Checkbox): string {
    const group = current instanceof Checkbox ? current.getGroup() : current;
    return group.getFocusableElement().id;
  }

  /**
   * Returns whether or not the given instance can be navigated to.
   * @param current The instance to check for navigability.
   * @returns True if the given instance can be focused.
   */
  isNavigable(current: FlyoutCheckboxGroup | Checkbox): boolean {
    return current.canBeFocused();
  }

  /**
   * Returns whether the given object can be navigated from by this policy.
   * @param current The object to check if this policy applies to.
   * @returns True if the object is a group or a checkbox.
   */
  isApplicable(current: unknown): current is FlyoutCheckboxGroup | Checkbox {
    return current instanceof FlyoutCheckboxGroup || current instanceof Checkbox;
  }
}

