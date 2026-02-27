/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test} from '@jest/globals';
import * as Blockly from 'blockly/core';
import {FieldNumber} from '../../src/fields/number';
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

const constructorTestCases: ConstructorTestCase<typeof FieldNumber>[] = [
  {
    title: 'Empty',
    args: [],
    expectedValue: '0',
    invalid: true
  },
  {
    title: 'Undefined',
    args: [undefined],
    expectedValue: '0',
    invalid: true
  },
  {
    title: 'Null',
    // @ts-expect-error Pass null as an argument, for test usage.
    args: [null],
    expectedValue: '0',
    invalid: true
  },
  {
    title: 'NaN',
    args: [NaN],
    expectedValue: '0',
    invalid: true
  },
  {
    title: 'Non-Parsable String',
    args: ['bad-string'],
    expectedValue: '0',
    invalid: true
  },
  {
    title: 'Integer',
    args: [1],
    expectedValue: '1'
  },
  {
    title: 'Decimal',
    args: [1.5],
    expectedValue: '1.5'
  },
  {
    title: 'Negative Integer',
    args: [-1],
    expectedValue: '-1'
  },
  {
    title: 'Integer String',
    args: ['2'],
    expectedValue: '2'
  },
  {
    title: 'Decimal String',
    args: ['2.5'],
    expectedValue: '2.5'
  },
  {
    title: 'Negative Integer String',
    args: ['-2'],
    expectedValue: '-2'
  }
];

const fromJsonTestCases = constructorTestCases.map(({title, args, expectedValue, expectedText}) => ({
  title, expectedValue, expectedText,
  config: {
    value: args[0]
  }
} as FromJsonTestCase<typeof FieldNumber, Blockly.FieldTextInputFromJsonConfig>));

const setValueTestCases = constructorTestCases.map(({title, args, expectedValue, expectedText, invalid}) => ({
  title,
  ctorArgs: [0],
  value: args[0],
  expectedValue: invalid ? '0' : expectedValue,
  expectedText: invalid ? '0' : expectedText
} as SetValueTestCase<typeof FieldNumber>));

const validatorTestCases: ValidatorTestCase<typeof FieldNumber, Blockly.FieldTextInputValidator>[] = [
  {
    title: 'Null Validator',
    validator: () => null,
    value: '1',
    expectedValue: '0'
  },
  {
    title: 'Undefined Validator',
    validator: () => undefined,
    value: '1',
    expectedValue: '1'
  }
];

describe('FieldNumber', () => {
  runConstructorTests(FieldNumber, constructorTestCases);
  runFromJsonTests(FieldNumber, fromJsonTestCases);
  runSetValueTests(FieldNumber, setValueTestCases);
  runValidatorTests(FieldNumber, validatorTestCases);

  describe('Serialization', () => {
    const context = setupSerializationTests(FieldNumber, 'NUMBER');

    test('Simple', () => {
      context.block.setFieldValue(1, 'NUMBER');
      const json = Blockly.serialization.blocks.save(context.block);
      expect(json?.fields).toEqual({
        NUMBER: '1'
      });
    });
  });
});
