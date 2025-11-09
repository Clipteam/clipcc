/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {setupPlayground} from '../helpers/playground';

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
      expect(state.argumentids.length).toBe(2);
    });

    test('Remove an Input', () => {
      const block = context.workspace.newBlock('operator_join_multiple');
      block.initSvg();
      block.loadExtraState!({
        argumentids: ['STRING1', 'STRING2']
      });

      context.gesture.clickField(block, 'BUTTON_MINUS');

      const state = block.saveExtraState!();
      expect(state.argumentids.length).toBe(1);
    });

    test('Minimum Inputs', () => {
      const block = context.workspace.newBlock('operator_join_multiple');
      block.initSvg();
      block.loadExtraState!({
        argumentids: ['STRING1']
      });

      context.gesture.clickField(block, 'BUTTON_MINUS');

      const state = block.saveExtraState!();
      expect(state.argumentids.length).toBe(1);
    });
  });
});
