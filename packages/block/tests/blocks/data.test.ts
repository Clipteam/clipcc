/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {jest, describe, expect, test, beforeEach, afterEach} from '@jest/globals';
import * as Blockly from 'blockly/core';
import type {VariableModel} from '../../src/variable_model';
import type {VariableMap} from '../../src/variable_map';
import {PlaygroundTestContext, setupPlayground} from '../helpers/playground';
import {getContextMenuItemLabel} from '../helpers/gesture';

interface Context extends PlaygroundTestContext {
  variable: VariableModel;
}

/**
 * Custom prompt function to return a constant value 'PROMPT_VALUE'.
 * @param message The message to display to the user.
 * @param defaultValue The value to initialize the prompt with.
 * @param callback The callback for handling user response.
 */
function customPrompt(
  message: string,
  defaultValue: string,
  callback: (result: string | null) => void
) {
  callback('PROMPT_VALUE');
}

describe('Blocks: Data', () => {
  const context = setupPlayground() as Context;
  Blockly.dialog.setPrompt(customPrompt);

  describe('data_variable', () => {
    const json: Blockly.serialization.blocks.State = {
      type: 'data_variable',
      fields: {
        VARIABLE: {
          id: 'TEST_ID',
          name: 'TEST_VARIABLE',
          variabletype: ''
        }
      }
    };

    beforeEach(() => {
      const variableMap = context.workspace.getVariableMap() as VariableMap;
      context.variable = variableMap.createVariable('TEST_VARIABLE', '', 'TEST_ID');
    });

    afterEach(() => {
      context.workspace.getVariableMap().deleteVariable(context.variable);
    });

    test('Context Menu', () => {
      jest.useFakeTimers();

      const anotherVariable = context.workspace.getVariableMap()
        .createVariable('TEST_VARIABLE_2', '', 'TEST_ID_2');
      const anotherList = context.workspace.getVariableMap()
        .createVariable('TEST_LIST_2', 'list', 'TEST_ID_3');

      const block = Blockly.serialization.blocks.append(json, context.workspace) as Blockly.BlockSvg;
      block.initSvg();

      // Context Menu in Workspace
      context.gesture.rightClickBlock(block);
      const menu = context.gesture.getContextMenuDom();
      const items = Array.from(menu.children).map(getContextMenuItemLabel);
      expect(items).toStrictEqual([
        Blockly.Msg.DUPLICATE_BLOCK,
        Blockly.Msg.ADD_COMMENT,
        Blockly.Msg.COPY,
        Blockly.Msg.DELETE_BLOCK,
        'TEST_VARIABLE_2'
      ]);
      context.gesture.clickWorkspace();

      // Context Menu in Flyout
      block.isInFlyout = true;
      context.gesture.rightClickBlock(block);
      const flyoutMenu = context.gesture.getContextMenuDom();
      const flyoutItems = Array.from(flyoutMenu.children).map(getContextMenuItemLabel);
      expect(flyoutItems).toStrictEqual([
        Blockly.Msg.RENAME_VARIABLE,
        Blockly.Msg.DELETE_VARIABLE.replace('%1', 'TEST_VARIABLE')
      ]);
      context.gesture.clickWorkspace();

      context.workspace.getVariableMap().deleteVariable(anotherVariable);
      context.workspace.getVariableMap().deleteVariable(anotherList);
    });

    test('Rename Variable', () => {
      jest.useFakeTimers();

      const block = Blockly.serialization.blocks.append(json, context.workspace) as Blockly.BlockSvg;
      block.initSvg();

      block.isInFlyout = true;
      context.gesture.selectContextMenu(block, Blockly.Msg.RENAME_VARIABLE);

      expect(block.getField('VARIABLE')!.getText()).toBe('PROMPT_VALUE');
    });

    test('Change Referenced Variable', () => {
      jest.useFakeTimers();

      const anotherVariable = context.workspace.getVariableMap()
        .createVariable('TEST_VARIABLE_2', '', 'TEST_ID_2');

      const block = Blockly.serialization.blocks.append(json, context.workspace) as Blockly.BlockSvg;
      block.initSvg();

      context.gesture.selectContextMenu(block, 'TEST_VARIABLE_2');

      expect(block.getField('VARIABLE')!.getText()).toBe('TEST_VARIABLE_2');

      context.workspace.getVariableMap().deleteVariable(anotherVariable);
    });

    test('Delete Variable', () => {
      jest.useFakeTimers();

      const block = Blockly.serialization.blocks.append(json, context.workspace) as Blockly.BlockSvg;
      block.initSvg();

      block.isInFlyout = true;
      context.gesture.selectContextMenu(block, Blockly.Msg.DELETE_VARIABLE.replace('%1', 'TEST_VARIABLE'));

      expect(context.workspace.getVariableMap().getVariableById('TEST_VARIABLE')).toBeNull();
    });
  });

  describe('data_listcontents', () => {
    const json: Blockly.serialization.blocks.State = {
      type: 'data_listcontents',
      fields: {
        LIST: {
          id: 'TEST_ID',
          name: 'TEST_LIST',
          variabletype: 'list'
        }
      }
    };

    beforeEach(() => {
      const variableMap = context.workspace.getVariableMap() as VariableMap;
      context.variable = variableMap.createVariable('TEST_LIST', 'list', 'TEST_ID');
    });

    afterEach(() => {
      context.workspace.getVariableMap().deleteVariable(context.variable);
    });

    test('Context Menu', () => {
      jest.useFakeTimers();

      const anotherVariable = context.workspace.getVariableMap()
        .createVariable('TEST_VARIABLE_2', '', 'TEST_ID_2');
      const anotherList = context.workspace.getVariableMap()
        .createVariable('TEST_LIST_2', 'list', 'TEST_ID_3');

      const block = Blockly.serialization.blocks.append(json, context.workspace) as Blockly.BlockSvg;
      block.initSvg();

      // Context Menu in Workspace
      context.gesture.rightClickBlock(block);
      const menu = context.gesture.getContextMenuDom();
      const items = Array.from(menu.children).map(getContextMenuItemLabel);
      expect(items).toStrictEqual([
        Blockly.Msg.DUPLICATE_BLOCK,
        Blockly.Msg.ADD_COMMENT,
        Blockly.Msg.COPY,
        Blockly.Msg.DELETE_BLOCK,
        'TEST_LIST_2'
      ]);
      context.gesture.clickWorkspace();

      // Context Menu in Flyout
      block.isInFlyout = true;
      context.gesture.rightClickBlock(block);
      const flyoutMenu = context.gesture.getContextMenuDom();
      const flyoutItems = Array.from(flyoutMenu.children).map(getContextMenuItemLabel);
      expect(flyoutItems).toStrictEqual([
        Blockly.Msg.RENAME_LIST,
        Blockly.Msg.DELETE_LIST.replace('%1', 'TEST_LIST')
      ]);
      context.gesture.clickWorkspace();

      context.workspace.getVariableMap().deleteVariable(anotherVariable);
      context.workspace.getVariableMap().deleteVariable(anotherList);
    });

    test('Rename List', () => {
      jest.useFakeTimers();

      const block = Blockly.serialization.blocks.append(json, context.workspace) as Blockly.BlockSvg;
      block.initSvg();

      block.isInFlyout = true;
      context.gesture.selectContextMenu(block, Blockly.Msg.RENAME_LIST);

      expect(block.getField('LIST')!.getText()).toBe('PROMPT_VALUE');
    });

    test('Change Referenced List', () => {
      jest.useFakeTimers();

      const anotherList = context.workspace.getVariableMap()
        .createVariable('TEST_LIST_2', 'list', 'TEST_ID_3');

      const block = Blockly.serialization.blocks.append(json, context.workspace) as Blockly.BlockSvg;
      block.initSvg();

      context.gesture.selectContextMenu(block, 'TEST_LIST_2');

      expect(block.getField('LIST')!.getText()).toBe('TEST_LIST_2');

      context.workspace.getVariableMap().deleteVariable(anotherList);
    });

    test('Delete List', () => {
      jest.useFakeTimers();

      const block = Blockly.serialization.blocks.append(json, context.workspace) as Blockly.BlockSvg;
      block.initSvg();

      block.isInFlyout = true;
      context.gesture.selectContextMenu(block, Blockly.Msg.DELETE_LIST.replace('%1', 'TEST_LIST'));

      expect(context.workspace.getVariableMap().getVariableById('TEST_LIST')).toBeNull();
    });
  });
});
