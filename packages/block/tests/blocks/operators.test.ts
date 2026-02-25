/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {jest, describe, expect, test} from '@jest/globals';
import * as Blockly from 'blockly/core';
import {setupPlayground} from '../helpers/playground';
import {BLOCK_EVENTS, EventHelper} from '../helpers/event';

jest.mock('blockly/core', () => {
  const actualModule = jest.requireActual('blockly/core') as typeof Blockly;
  return {
    __esModule: true,
    ...actualModule,
    utils: {
      ...actualModule.utils,
      idGenerator: {
        ...actualModule.utils.idGenerator,
        genUid: jest.fn().mockReturnValue('CUSTOM_ID')
      }
    }
  };
});

describe('Blocks: Operators', () => {
  const context = setupPlayground();

  describe('operator_join_multiple', () => {
    test('Append an Input', () => {
      const block = context.workspace.newBlock('operator_join_multiple');
      block.initSvg();
      block.loadExtraState!({
        argumentids: ['STRING1']
      });

      context.gesture.clickField(block, 'BUTTON_PLUS');

      const state = block.saveExtraState!();
      expect(state.argumentids).toStrictEqual(['STRING1', 'CUSTOM_ID']);
    });

    test('Remove an Input', () => {
      const block = context.workspace.newBlock('operator_join_multiple');
      block.initSvg();
      block.loadExtraState!({
        argumentids: ['STRING1', 'STRING2']
      });

      context.gesture.clickField(block, 'BUTTON_MINUS');

      const state = block.saveExtraState!();
      expect(state.argumentids).toStrictEqual(['STRING1']);
    });

    test('Insert an Input', () => {
      jest.useFakeTimers();

      const block = context.workspace.newBlock('operator_join_multiple');
      block.initSvg();
      block.loadExtraState!({
        argumentids: ['STRING1', 'STRING2']
      });

      context.gesture.selectContextMenu(
        block.getInputTargetBlock('STRING2') as Blockly.BlockSvg,
        Blockly.Msg.INSERT_INPUT
      );

      const state = block.saveExtraState!();
      expect(state.argumentids).toStrictEqual(['STRING1', 'CUSTOM_ID', 'STRING2']);
    });

    test('Remove an Input From Context Menu', () => {
      jest.useFakeTimers();

      const block = context.workspace.newBlock('operator_join_multiple');
      block.initSvg();
      block.loadExtraState!({
        argumentids: ['STRING1', 'STRING2']
      });

      context.gesture.selectContextMenu(
        block.getInputTargetBlock('STRING2') as Blockly.BlockSvg,
        Blockly.Msg.DELETE_INPUT
      );

      const state = block.saveExtraState!();
      expect(state.argumentids).toStrictEqual(['STRING1']);
    });

    test('Minimum Inputs', () => {
      const block = context.workspace.newBlock('operator_join_multiple');
      block.initSvg();
      block.loadExtraState!({
        argumentids: ['STRING1']
      });

      context.gesture.clickField(block, 'BUTTON_MINUS');

      const state = block.saveExtraState!();
      expect(state.argumentids).toStrictEqual(['STRING1']);
    });

    test('Shadow Blocks Update', async () => {
      jest.useFakeTimers();

      const block = context.workspace.newBlock('operator_join_multiple');
      block.initSvg();
      block.loadExtraState!({
        argumentids: ['STRING1']
      });

      const helper = new EventHelper(context.workspace);

      await jest.advanceTimersByTimeAsync(50);
      helper.startRecord(BLOCK_EVENTS);
      context.gesture.clickField(block, 'BUTTON_PLUS');
      await jest.advanceTimersByTimeAsync(50);
      helper.stopRecord();

      helper.toEqual([
        Blockly.Events.BLOCK_MOVE, // move out STRING1
        Blockly.Events.BLOCK_MOVE, // move back STRING1
        Blockly.Events.BLOCK_CREATE, // new CUSTOM_ID
        Blockly.Events.BLOCK_MOVE, // move CUSTOM_ID
        Blockly.Events.BLOCK_CHANGE // update extra state
      ]);

      await jest.advanceTimersByTimeAsync(50);
      helper.startRecord(BLOCK_EVENTS);
      context.gesture.clickField(block, 'BUTTON_MINUS');
      await jest.advanceTimersByTimeAsync(50);
      helper.stopRecord();

      helper.toEqual([
        Blockly.Events.BLOCK_MOVE, // move out STRING1
        Blockly.Events.BLOCK_MOVE, // move out CUSTOM_ID
        Blockly.Events.BLOCK_MOVE, // move back STRING1
        Blockly.Events.BLOCK_DELETE, // delete CUSTOM_ID
        Blockly.Events.BLOCK_CHANGE // update extra state
      ]);
    });
  });
});
