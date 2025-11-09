/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {jest, expect} from '@jest/globals';
import * as Blockly from 'blockly/core';

export class Gesture {
  constructor(
    protected workspace: Blockly.WorkspaceSvg
  ) {}

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

  protected findBlockById(id: string): Blockly.BlockSvg {
    const block = this.workspace.getBlockById(id);
    if (!block) {
      throw new Error(`block ${id} not found`);
    }
    return block;
  }

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

  protected getBlockClickTarget(block: Blockly.BlockSvg): Element {
    return block.getSvgRoot();
  }

  protected getFieldClickTarget(field: Blockly.Field): Element {
    // @ts-expect-error Accessing protected getClickTarget_
    const target = field.getClickTarget_();
    if (!target) {
      throw new Error('field doesn\'t have a click target');
    }
    return target;
  }

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

  clickBlock(block: Blockly.BlockSvg | string) {
    if (typeof block === 'string') {
      block = this.findBlockById(block);
    }

    this.dispatchClick(this.getBlockClickTarget(block));
  }

  rightClickBlock(block: Blockly.BlockSvg | string) {
    if (typeof block === 'string') {
      block = this.findBlockById(block);
    }

    this.dispatchRightClick(this.getBlockClickTarget(block));
  }

  clickField(block: Blockly.BlockSvg | string | null, field: Blockly.Field | string) {
    if (typeof field === 'string') {
      if (block === null) {
        throw new Error('block shouldn\'t be null when calling with field name');
      }
      field = this.findFieldByName(block, field);
    }

    this.dispatchClick(this.getFieldClickTarget(field));
  }

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

  clickWorkspace() {
    this.dispatchClick(this.workspace.svgGroup_);
  }
}
