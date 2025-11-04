/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import {FieldAngle, FieldAngleFromJsonConfig, registerFieldAngle} from '../../src/fields/angle';
import {ConstructorTestCase, FromJsonTestCase, runConstructorTests, runFromJsonTests} from '../helpers/field';

const constructorTestCases: ConstructorTestCase<typeof FieldAngle>[] = [
  {
    title: 'Empty',
    args: [],
    expectedValue: 0
  },
  {
    title: 'Undefined',
    args: [undefined],
    expectedValue: 0
  },
  {
    title: 'Null',
    args: [null as any],
    expectedValue: 0
  },
  {
    title: 'NaN',
    args: [NaN],
    expectedValue: 0
  },
  {
    title: 'Non-Parsable String',
    args: ['bad-string'],
    expectedValue: 0
  },
  {
    title: 'Integer in (-180, 180)',
    args: [10],
    expectedValue: 10
  },
  {
    title: 'Integer <= -180',
    args: [-190],
    expectedValue: 170
  },
  {
    title: 'Integer > 180',
    args: [190],
    expectedValue: -170
  },
  {
    title: 'Integer 180',
    args: [180],
    expectedValue: 180
  },
  {
    title: 'Integer -180',
    args: [-180],
    expectedValue: 180
  },
  {
    title: 'Float',
    args: [20.1],
    expectedValue: 20.1
  },
  {
    title: 'Integer String',
    args: ['10'],
    expectedValue: 10
  },
  {
    title: 'Float String',
    args: ['20.1'],
    expectedValue: 20.1
  },
  {
    title: 'Infinity',
    args: [Infinity],
    expectedValue: 0
  },
  {
    title: 'Negative Infinity',
    args: [-Infinity],
    expectedValue: 0
  },
  {
    title: 'Infinity String',
    args: ['Infinity'],
    expectedValue: 0
  },
  {
    title: 'Negative Infinity String',
    args: ['-Infinity'],
    expectedValue: 0
  },
];

const fromJsonTestCases = constructorTestCases.map(({title, args, expectedValue, expectedText}) => ({
  title, expectedValue, expectedText,
  config: {
    angle: args[0]
  }
} as FromJsonTestCase<typeof FieldAngle, FieldAngleFromJsonConfig>));

describe('FieldAngle', () => {
  let workspace: Blockly.Workspace;
  let block: Blockly.Block;

  runConstructorTests(FieldAngle, constructorTestCases);
  runFromJsonTests(FieldAngle, fromJsonTestCases);

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

    test('NaN', () => {
      block.setFieldValue(NaN, 'TEST_FIELD');
      expect(block.getFieldValue('TEST_FIELD')).toBe(0);
    });

    test('Bad value', () => {
      block.setFieldValue('bad', 'TEST_FIELD');
      expect(block.getFieldValue('TEST_FIELD')).toBe(0);
    });
  });

  describe('fromJson', () => {
    test('Empty', () => {
      expect(FieldAngle.fromJson({}).getValue()).toBe(0);
    });

    test('Valid value', () => {
      expect(FieldAngle.fromJson({
        angle: 10
      }).getValue()).toBe(10);
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
