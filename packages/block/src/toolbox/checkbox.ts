/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {FlyoutCheckboxGroup} from './flyout_checkbox_group';

/**
 * Class for a checkbox in the checkout group.
 */
export class Checkbox implements Blockly.IFocusableNode {
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

  /** The unique id of the checkbox, used for both the focusable element and the component registration. */
  readonly id: string;

  /** The checkbox SVG group. */
  protected svgGroup: SVGGElement;

  /** State of checkbox. */
  protected checked: boolean = false;

  /** Mouse up event data. */
  protected onMouseDownWrapper: Blockly.browserEvents.Data;

  /**
   * @param group The group this checkbox belongs to.
   * @param workspace The workspace in which to place this checkbox.
   * @param onChange Event handler when checkbox state is changed.
   * @param onMouseDown Event handler for pointer down on the checkbox.
   */
  constructor(
    protected readonly group: FlyoutCheckboxGroup,
    protected readonly workspace: Blockly.WorkspaceSvg,
    protected readonly onChange?: (newChecked: boolean, self: Checkbox) => void,
    onMouseDown?: (e: PointerEvent) => void
  ) {
    this.id = Blockly.utils.idGenerator.getNextUniqueId();
    this.svgGroup = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.G,
      {id: this.id},
      group.getSvgRoot()
    );

    this.createCheckbox(this.svgGroup);

    this.onMouseDownWrapper = Blockly.browserEvents.conditionalBind(
      this.svgGroup,
      'pointerdown',
      this,
      (e: PointerEvent) => {
        if (onMouseDown) onMouseDown(e);
      }
    );

    workspace.getComponentManager().addComponent({
      component: this,
      capabilities: [Blockly.ComponentManager.Capability.FOCUSABLE],
      weight: 0
    });
  }

  /**
   * Dispose the checkbox.
   */
  dispose() {
    Blockly.browserEvents.unbind(this.onMouseDownWrapper);
    Blockly.utils.dom.removeNode(this.svgGroup);
    this.workspace.getComponentManager().removeComponent(this.id);
  }

  /**
   * Returns the group this checkbox belongs to.
   * @returns The containing group.
   */
  getGroup(): FlyoutCheckboxGroup {
    return this.group;
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
      Blockly.utils.dom.addClass(this.svgGroup, 'checked');
    } else {
      Blockly.utils.dom.removeClass(this.svgGroup, 'checked');
    }

    if (fireChangeEvent && this.onChange) {
      this.onChange(newChecked, this);
    }
  }

  /**
   * Create a checkbox SVG element.
   * @param svgRoot The SVG root to create the checkbox.
   */
  protected createCheckbox(svgRoot: SVGElement) {
    Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.RECT,
      {
        class: 'blocklyFlyoutCheckbox',
        height: Checkbox.CHECKBOX_SIZE,
        width: Checkbox.CHECKBOX_SIZE,
        rx: Checkbox.CHECKBOX_CORNER_RADIUS,
        ry: Checkbox.CHECKBOX_CORNER_RADIUS
      },
      svgRoot
    );

    Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.PATH,
      {
        class: 'blocklyFlyoutCheckboxPath',
        d: Checkbox.CHECKMARK_PATH
      },
      svgRoot
    );

    Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.RECT,
      {
        class: 'blocklyTouchTargetBackground',
        x: `${-Checkbox.CHECKBOX_TOUCH_PADDING}px`,
        y: `${-Checkbox.CHECKBOX_TOUCH_PADDING}px`,
        height: Checkbox.CHECKBOX_SIZE + 2 * Checkbox.CHECKBOX_TOUCH_PADDING,
        width: Checkbox.CHECKBOX_SIZE + 2 * Checkbox.CHECKBOX_TOUCH_PADDING
      },
      svgRoot
    );
  }

  /** Implementation of Blockly.IFocusableNode */

  getFocusableElement(): HTMLElement | SVGElement {
    return this.svgGroup;
  }

  getFocusableTree(): Blockly.WorkspaceSvg {
    return this.group.getFocusableTree();
  }

  onNodeFocus(): void {}

  onNodeBlur(): void {}

  canBeFocused(): boolean {
    return true;
  }

  /**
   * Handles the user acting on this checkbox via keyboard navigation
   * (e.g. pressing Enter or Space while it has focus) by toggling it.
   * @param _e The event that triggered this action, if any.
   */
  performAction(_e?: Event): void {
    this.toggleChecked();
  }
}
