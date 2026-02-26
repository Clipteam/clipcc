/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals';
import * as Blockly from 'blockly/core';
import {setupPlayground} from '../helpers/playground';
import type {Toolbox} from '../../src/toolbox/toolbox';
import type {VerticalFlyout} from '../../src/toolbox/flyout';

const toolboxDefinition: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Category 1',
      contents: []
    },
    {
      kind: 'category',
      name: 'Category 2',
      contents: [
        {
          kind: 'category',
          name: 'Category 2.1',
          contents: []
        },
        {
          kind: 'category',
          name: 'Category 2.2',
          contents: [
            {
              kind: 'category',
              name: 'Category 2.2.1',
              contents: []
            },
            {
              kind: 'category',
              name: 'Category 2.2.2',
              contents: []
            }
          ]
        }
      ]
    },
    {
      kind: 'category',
      name: 'Category 3',
      contents: [
        {
          kind: 'category',
          name: 'Category 3.1',
          contents: []
        },
        {
          kind: 'category',
          name: 'Category 3.2',
          contents: []
        }
      ]
    }
  ]
};

/**
 * Check whether a category is parent of another.
 * @param category The child category to check.
 * @param potentialParent The parent category to check.
 * @returns True if potentialParent is parent.
 */
function isParentCategory(category: Blockly.IToolboxItem, potentialParent: Blockly.IToolboxItem) {
  let currentCategory: Blockly.IToolboxItem | null = category;
  while (currentCategory) {
    if (potentialParent === currentCategory) {
      return true;
    }
    currentCategory = currentCategory.getParent();
  }
  return false;
}

/**
 * Helper to test selected category and other categories are expanded or collapsed.
 * @param toolbox The toolbox.
 * @param name Name of selected category.
 */
function checkToolboxCategories(toolbox: Toolbox, name: string) {
  const selected = toolbox.getSelectedItem() as Blockly.ToolboxCategory;
  expect(selected.getName()).toBe(name);

  const allItems: Blockly.IToolboxItem[] = toolbox.getToolboxItems()
    .filter((item) => item instanceof Blockly.ToolboxCategory);
  for (const item of allItems) {
    if (item.isCollapsible()) {
      if (isParentCategory(selected, item)) {
        expect((item as Blockly.ICollapsibleToolboxItem).isExpanded()).toBeTruthy();
      } else {
        expect((item as Blockly.ICollapsibleToolboxItem).isExpanded()).toBeFalsy();
      }
    }
  }
}

describe('Toolbox', () => {
  const context = setupPlayground({
    toolbox: toolboxDefinition
  });
  let spy: jest.SpiedFunction<(id: string) => void>;

  beforeEach(() => {
    const toolbox = context.workspace.getToolbox() as Toolbox;
    const flyout = toolbox.getFlyout() as VerticalFlyout;
    flyout.setCollapseAnimationEnabled(false);
    // Spy updateSelectedCategoryById to prevent category selection based on
    // position, since we don't have any contents.
    spy = jest.spyOn(toolbox, 'updateSelectedCategoryById').mockImplementation(() => {});
    toolbox.clearSelection();
  });

  afterEach(() => {
    spy.mockRestore();
  });

  describe('Click', () => {
    test('Select a Category', () => {
      const toolbox = context.workspace.getToolbox()!;
      toolbox.selectItemByPosition(0);
      const selected = toolbox.getSelectedItem() as Blockly.ToolboxCategory;
      expect(selected.getName()).toBe('Category 1');
      expect(toolbox.getFlyout()!.isVisible()).toBeTruthy();
    });

    test('Hide Flyout when Clicking Same Category', () => {
      const toolbox = context.workspace.getToolbox()!;
      toolbox.selectItemByPosition(0);
      toolbox.selectItemByPosition(0);
      expect(toolbox.getSelectedItem()).toBeNull();
      expect(toolbox.getFlyout()!.isVisible()).toBeFalsy();
    });
  });

  describe('Nested Categories', () => {
    test('Select a Inner Category', () => {
      const toolbox = context.workspace.getToolbox() as Toolbox;
      toolbox.selectItemByPosition(3);
      checkToolboxCategories(toolbox, 'Category 2.2');
    });

    test('Select a Inner Category when Flyout Hidden', () => {
      const toolbox = context.workspace.getToolbox() as Toolbox;
      toolbox.selectItemByPosition(3);
      toolbox.selectItemByPosition(3);
      expect(toolbox.getFlyout()!.isVisible()).toBeFalsy();
      toolbox.selectItemByPosition(8);
      checkToolboxCategories(toolbox, 'Category 3.2');
      expect(toolbox.getFlyout()!.isVisible()).toBeTruthy();
    });

    test('Change Category', () => {
      const toolbox = context.workspace.getToolbox() as Toolbox;
      toolbox.selectItemByPosition(3);
      toolbox.selectItemByPosition(0);
      checkToolboxCategories(toolbox, 'Category 1');
    });

    test('Change Category with Same Parent', () => {
      const toolbox = context.workspace.getToolbox() as Toolbox;
      toolbox.selectItemByPosition(4);
      toolbox.selectItemByPosition(2);
      checkToolboxCategories(toolbox, 'Category 2.1');
    });
  });
});
