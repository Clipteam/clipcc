/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

const toolbox = require('../toolbox.json');

describe('Blocks: Operators', () => {
  beforeAll(() => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    window.ScratchBlocks = require('../../dist/web/main');

    window.Blockly.Msg = window.Blockly.Msg.Msg;
    require('../../msg/messages');

    this.workspace = ScratchBlocks.inject(container, {
      media: '../media/',
      collapse: false,
      disable: false,
      toolbox: toolbox,
      horizontalLayout: false,
      toolboxPosition: 'left',
      move: {
        scrollbars: true,
        wheel: true
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.675,
        maxScale: 4,
        minScale: 0.25,
        scaleSpeed: 1.1
      }
    });
  });

  afterAll(() => {
    this.workspace.dispose();
    this.workspace = null;
  });

  describe('operator_join_multiple', () => {
    test('append an input', () => {
      const block = this.workspace.newBlock('operator_join_multiple');
      block.loadExtraState({
        argumentids: ['STRING1']
      });

      const field = block.getField('BUTTON_PLUS');
      field.showEditor();

      const state = block.saveExtraState();
      expect(state.argumentids.length).toBe(2);
    });

    test('should have at least one input', () => {
      const block = this.workspace.newBlock('operator_join_multiple');
      block.loadExtraState({
        argumentids: ['STRING1']
      });

      const field = block.getField('BUTTON_MINUS');
      field.showEditor();

      const state = block.saveExtraState();
      expect(state.argumentids.length).toBe(1);
    });
  });
});
