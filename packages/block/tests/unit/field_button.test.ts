/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import {FieldButton, registerFieldButton} from '../../src/fields/button';

describe('FieldButton', () => {
  let workspace: Blockly.Workspace;
  let block: Blockly.Block;

  beforeAll(() => {
    registerFieldButton();

    Blockly.defineBlocksWithJsonArray([
      {
        type: 'test_block',
        message0: 'test',
      }
    ]);

    workspace = new Blockly.Workspace();
  });

  afterAll(() => {
    workspace.dispose();
  });

  beforeEach(() => {
    block = workspace.newBlock('test_block');
    const field = new FieldButton('', () => {
      throw 'Clicked!';
    });
    block.appendDummyInput('DUMMY_INPUT').appendField(field, 'BUTTON');
  });

  afterEach(() => {
    block.dispose();
  });

  describe('Operations', () => {
    test('Click', () => {
      const field = block.getField('BUTTON') as FieldButton;
      expect(() => {
        field.showEditor();
      }).toThrow('Clicked!');
    });
  });

  describe('Serialization', () => {
    test('Unserializable', () => {
      const json = Blockly.serialization.blocks.save(block);
      expect(json?.fields).toBeUndefined();
    });
  });
});
