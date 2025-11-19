/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test} from 'vitest';
import * as Blockly from 'blockly/core';
import {FieldAngle, FieldAngleFromJsonConfig} from '../../src/fields/angle';
import {
  type ConstructorTestCase,
  type FromJsonTestCase,
  type SetValueTestCase,
  type ValidatorTestCase,
  runConstructorTests,
  runFromJsonTests,
  runSetValueTests,
  runValidatorTests,
  setupSerializationTests
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
    // @ts-expect-error Pass null as an argument, for test usage.
    args: [null],
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
  }
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

const validatorTestCases: ValidatorTestCase<typeof FieldAngle, Blockly.FieldNumberValidator>[] = [
  {
    title: 'Null Validator',
    validator: () => null,
    value: 60,
    expectedValue: 0
  },
  {
    title: 'Undefined Validator',
    validator: () => undefined,
    value: 60,
    expectedValue: 60
  },
  {
    title: 'Force Multiple of 90 Validator',
    validator: (newValue) => Math.round((newValue as number) / 90) * 90,
    value: 60,
    expectedValue: 90
  }
];

describe('FieldAngle', () => {
  runConstructorTests(FieldAngle, constructorTestCases);
  runFromJsonTests(FieldAngle, fromJsonTestCases);
  runSetValueTests(FieldAngle, setValueTestCases);
  runValidatorTests(FieldAngle, validatorTestCases);

  describe('Serialization', () => {
    const context = setupSerializationTests(FieldAngle, 'ANGLE');

    test('Simple', () => {
      context.block.setFieldValue(90, 'ANGLE');
      const json = Blockly.serialization.blocks.save(context.block);
      expect(json?.fields).toEqual({
        ANGLE: 90
      });
    });
  });
});
