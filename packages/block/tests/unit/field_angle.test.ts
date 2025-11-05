/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import {FieldAngle, FieldAngleFromJsonConfig} from '../../src/fields/angle';
import {
  ConstructorTestCase,
  FromJsonTestCase,
  runConstructorTests,
  runFromJsonTests,
  runSetValueTests,
  SetValueTestCase
} from '../helpers/field';

const constructorTestCases: ConstructorTestCase<typeof FieldAngle>[] = [
  {
    title: 'Empty',
    args: [],
    expectedValue: 0,
    invalid: true
  },
  {
    title: 'Undefined',
    args: [undefined],
    expectedValue: 0,
    invalid: true
  },
  {
    title: 'Null',
    args: [null as any],
    expectedValue: 0,
    invalid: true
  },
  {
    title: 'NaN',
    args: [NaN],
    expectedValue: 0,
    invalid: true
  },
  {
    title: 'Non-Parsable String',
    args: ['bad-string'],
    expectedValue: 0,
    invalid: true
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
    expectedValue: 0,
    invalid: true
  },
  {
    title: 'Negative Infinity',
    args: [-Infinity],
    expectedValue: 0,
    invalid: true
  },
  {
    title: 'Infinity String',
    args: ['Infinity'],
    expectedValue: 0,
    invalid: true
  },
  {
    title: 'Negative Infinity String',
    args: ['-Infinity'],
    expectedValue: 0,
    invalid: true
  },
];

const fromJsonTestCases = constructorTestCases.map(({title, args, expectedValue, expectedText}) => ({
  title, expectedValue, expectedText,
  config: {
    angle: args[0]
  }
} as FromJsonTestCase<typeof FieldAngle, FieldAngleFromJsonConfig>));

const setValueTestCases = constructorTestCases.map(({title, args, expectedValue, expectedText, invalid}) => ({
  title,
  ctorArgs: [42],
  value: args[0],
  expectedValue: invalid ? 42 : expectedValue,
  expectedText: invalid ? '42' : expectedText
} as SetValueTestCase<typeof FieldAngle>));

describe('FieldAngle', () => {
  let workspace: Blockly.Workspace;
  let block: Blockly.Block;

  runConstructorTests(FieldAngle, constructorTestCases);
  runFromJsonTests(FieldAngle, fromJsonTestCases);
  runSetValueTests(FieldAngle, setValueTestCases);

  // describe('Serialization', () => {
  //   test('Simple', () => {
  //     block.setFieldValue(90, 'TEST_FIELD');
  //     const json = Blockly.serialization.blocks.save(block);
  //     expect(json?.fields).toEqual({
  //       TEST_FIELD: 90
  //     });
  //   });
  // });
});
