/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import {registerFieldAngle} from '../../src/fields/angle';

describe('FieldAngle', () => {
  let workspace: Blockly.Workspace;
  let block: Blockly.Block;

  beforeAll(() => {
    registerFieldAngle();

    Blockly.defineBlocksWithJsonArray([
      {
        type: 'test_block',
        message0: '%1',
        args0: [
          {
            type: 'field_angle',
            name: 'TEST_FIELD',
            value: 90
          }
        ]
      }
    ]);

    workspace = new Blockly.Workspace();
  });

  afterAll(() => {
    workspace.dispose();
  });

  beforeEach(() => {
    block = workspace.newBlock('test_block');
  });

  afterEach(() => {
    block.dispose();
  });

  describe('setValue', () => {
    test('Valid value', () => {
      block.setFieldValue(90, 'TEST_FIELD');
      expect(block.getFieldValue('TEST_FIELD')).toBe(90);
    });

    test('Value greater than 180', () => {
      block.setFieldValue(190, 'TEST_FIELD');
      expect(block.getFieldValue('TEST_FIELD')).toBe(-170);
    });

    test('Value lower than -180', () => {
      block.setFieldValue(-190, 'TEST_FIELD');
      expect(block.getFieldValue('TEST_FIELD')).toBe(170);
    });

    test('Value lower than -180', () => {
      block.setFieldValue(-190, 'TEST_FIELD');
      expect(block.getFieldValue('TEST_FIELD')).toBe(170);
    });
  });

  describe('Serialization', () => {
    test('Simple', () => {
      block.setFieldValue(90, 'TEST_FIELD');
      const json = Blockly.serialization.blocks.save(block);
      expect(json?.fields).toEqual({
        TEST_FIELD: 90
      });
    });
  });
});
