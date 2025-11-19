/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test} from 'vitest';
import * as Blockly from 'blockly/core';
import {FieldMatrix, FieldMatrixFromJsonConfig} from '../../src/fields/matrix';
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

const TEST_MATRIX = '0000011111000001111100000';

const constructorTestCases: ConstructorTestCase<typeof FieldMatrix>[] = [
  {
    title: 'Empty',
    // @ts-expect-error Pass no arguments, for test usage.
    args: [],
    expectedValue: FieldMatrix.ZEROS,
    invalid: true
  },
  {
    title: 'Undefined',
    // @ts-expect-error Pass undefined as an argument, for test usage.
    args: [undefined],
    expectedValue: FieldMatrix.ZEROS,
    invalid: true
  },
  {
    title: 'Null',
    // @ts-expect-error Pass null as an argument, for test usage.
    args: [null],
    expectedValue: FieldMatrix.ZEROS,
    invalid: true
  },
  {
    title: 'NaN',
    // @ts-expect-error Pass NaN as an argument, for test usage.
    args: [NaN],
    expectedValue: FieldMatrix.ZEROS,
    invalid: true
  },
  {
    title: 'Non-Parsable String',
    args: ['bad-string'],
    expectedValue: FieldMatrix.ZEROS,
    invalid: true
  },
  {
    title: 'Zeros',
    args: [FieldMatrix.ZEROS],
    expectedValue: FieldMatrix.ZEROS
  },
  {
    title: 'Ones',
    args: [FieldMatrix.ONES],
    expectedValue: FieldMatrix.ONES
  },
  {
    title: 'String Shorter than 25',
    args: ['10101'],
    expectedValue: '1010100000000000000000000'
  },
  {
    title: 'String Longer than 25',
    args: ['000001111100000111110000011111'],
    expectedValue: '0000011111000001111100000'
  }
];

const fromJsonTestCases = constructorTestCases.map(({title, args, expectedValue, expectedText}) => ({
  title, expectedValue, expectedText,
  config: {
    matrix: args[0]
  }
} as FromJsonTestCase<typeof FieldMatrix, FieldMatrixFromJsonConfig>));

const setValueTestCases = constructorTestCases.map(({title, args, expectedValue, expectedText, invalid}) => ({
  title,
  ctorArgs: [TEST_MATRIX],
  value: args[0],
  expectedValue: invalid ? TEST_MATRIX : expectedValue,
  expectedText: invalid ? TEST_MATRIX : expectedText
} as SetValueTestCase<typeof FieldMatrix>));

const validatorTestCases: ValidatorTestCase<typeof FieldMatrix, Blockly.FieldValidator<string>>[] = [
  {
    title: 'Null Validator',
    validator: () => null,
    value: TEST_MATRIX,
    expectedValue: FieldMatrix.ZEROS
  },
  {
    title: 'Undefined Validator',
    validator: () => undefined,
    value: TEST_MATRIX,
    expectedValue: TEST_MATRIX
  },
  {
    title: 'Symmetric Validator (Upper Triangular)',
    validator: (newValue) => Array.from(newValue).map((v, index) => {
      const i = Math.floor(index / 5);
      const j = index % 5;
      return i <= j ? v : newValue.charAt(j * 5 + i);
    }).join(''),
    value: '0000011111000001111100000',
    expectedValue: '0000001111010000101101010'
  }
];

describe('FieldMatrix', () => {
  runConstructorTests(FieldMatrix, constructorTestCases);
  runFromJsonTests(FieldMatrix, fromJsonTestCases);
  runSetValueTests(FieldMatrix, setValueTestCases);
  runValidatorTests(FieldMatrix, validatorTestCases);

  describe('Serialization', () => {
    const context = setupSerializationTests(FieldMatrix, 'MATRIX');

    test('Simple', () => {
      context.block.setFieldValue(TEST_MATRIX, 'MATRIX');
      const json = Blockly.serialization.blocks.save(context.block);
      expect(json?.fields).toEqual({
        MATRIX: TEST_MATRIX
      });
    });
  });
});
