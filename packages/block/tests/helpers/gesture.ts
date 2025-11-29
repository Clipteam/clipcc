/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {jest, expect} from '@jest/globals';
import * as Blockly from 'blockly/core';

/**
 * Helper for UI testing.
 */
export class Gesture {
  constructor(
    protected workspace: Blockly.WorkspaceSvg
  ) {}

  /**
   * Get element of context menu.
   * @returns HTML element of context menu.
   */
  getContextMenuDom(): Element {
    const container = Blockly.common.getParentContainer() || document.body;
    if (!container) {
      throw new Error('workspace not injected');
    }

    const div = container.querySelector('.blocklyWidgetDiv > .blocklyContextMenu');
    if (!div) {
      throw new Error('context menu div not found');
    }

    return div;
  }

  /**
   * Find block from current workspace with given id.
   * @param id The block id.
   * @returns The block.
   */
  protected findBlockById(id: string): Blockly.BlockSvg {
    const block = this.workspace.getBlockById(id);
    if (!block) {
      throw new Error(`block ${id} not found`);
    }
    return block;
  }

  /**
   * Find field from given block with name.
   * @param block Block where the field is in.
   * @param name Name of the field.
   * @returns The field.
   */
  protected findFieldByName(block: Blockly.BlockSvg | string, name: string): Blockly.Field {
    if (typeof block === 'string') {
      block = this.findBlockById(block);
    }

    const field = block.getField(name);
    if (!field) {
      throw new Error(`field ${name} not found in ${block.id}`);
    }
    return field;
  }

  /**
   * Get click target element of given block.
   * @param block The block.
   * @returns Element that handles pointer events.
   */
  protected getBlockClickTarget(block: Blockly.BlockSvg): Element {
    return block.getSvgRoot();
  }

  /**
   * Get click target element of given field.
   * @param field The field.
   * @returns Element that handles pointer events.
   */
  protected getFieldClickTarget(field: Blockly.Field): Element {
    // @ts-expect-error Accessing protected getClickTarget_
    const target = field.getClickTarget_();
    if (!target) {
      throw new Error('field doesn\'t have a click target');
    }
    return target;
  }

  /**
   * Simulate click on target.
   * @param target The element.
   * @param options Additional options to construct PointerEvent.
   */
  protected dispatchClick(target: Element, options?: PointerEventInit) {
    expect(this.workspace.currentGesture_).toBeNull();

    target.dispatchEvent(new PointerEvent('pointerdown', Object.assign({
      bubbles: true,
      button: 0,
      pointerType: 'mouse',
      view: window
    }, options)));

    target.dispatchEvent(new PointerEvent('pointerup', Object.assign({
      bubbles: true,
      button: 0,
      pointerType: 'mouse',
      view: window
    }, options)));

    expect(this.workspace.currentGesture_).toBeNull();
  }

  /**
   * Simulate right click on target.
   * @param target The element.
   * @param options Additional options to construct PointerEvent.
   */
  protected dispatchRightClick(target: Element, options?: PointerEventInit) {
    expect(this.workspace.currentGesture_).toBeNull();

    target.dispatchEvent(new PointerEvent('pointerdown', Object.assign({
      bubbles: true,
      button: 2,
      pointerType: 'mouse',
      view: window
    }, options)));

    target.dispatchEvent(new PointerEvent('pointerup', Object.assign({
      bubbles: true,
      button: 2,
      pointerType: 'mouse',
      view: window
    }, options)));

    expect(this.workspace.currentGesture_).toBeNull();
  }

  /**
   * Click the block.
   * @param block The block to click.
   */
  clickBlock(block: Blockly.BlockSvg | string) {
    if (typeof block === 'string') {
      block = this.findBlockById(block);
    }

    this.dispatchClick(this.getBlockClickTarget(block));
  }

  /**
   * Right click the block.
   * @param block The block to click.
   */
  rightClickBlock(block: Blockly.BlockSvg | string) {
    if (typeof block === 'string') {
      block = this.findBlockById(block);
    }

    this.dispatchRightClick(this.getBlockClickTarget(block));
  }

  /**
   * Click the field.
   * @param block Block where the field is in.
   * @param field The field to click.
   */
  clickField(block: Blockly.BlockSvg | string | null, field: Blockly.Field | string) {
    if (typeof field === 'string') {
      if (block === null) {
        throw new Error('block shouldn\'t be null when calling with field name');
      }
      field = this.findFieldByName(block, field);
    }

    this.dispatchClick(this.getFieldClickTarget(field));
  }

  /**
   * Click the context menu item of given block.
   * @param block The block to right click.
   * @param name Name of the context menu item.
   * @param noThrow True if not to throw an error when context menu item is
   *      not found.
   */
  selectContextMenu(block: Blockly.BlockSvg | string, name: string, noThrow?: boolean) {
    if (typeof block === 'string') {
      block = this.findBlockById(block);
    }

    const xy = block.getSvgRoot().getBoundingClientRect();
    this.dispatchRightClick(this.getBlockClickTarget(block), {
      clientX: xy.x,
      clientY: xy.y
    });

    const menu = this.getContextMenuDom();
    for (const menuItem of menu.children) {
      const text = menuItem.firstElementChild?.innerHTML;
      if (text === name) {
        // Add offset to clientXY, checked by Blockly.
        this.dispatchClick(menuItem, {
          clientX: xy.x + 1,
          clientY: xy.y + 1
        });
        jest.advanceTimersToNextFrame();
        jest.runOnlyPendingTimers();
        return;
      }
    }

    if (!noThrow) {
      throw new Error(`context menu ${name} not found`);
    }
  }

  /**
   * Click the workspace, used for closing all opened widgets.
   */
  clickWorkspace() {
    this.dispatchClick(this.workspace.svgGroup_);
  }
}
