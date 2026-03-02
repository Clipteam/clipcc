/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test} from '@jest/globals';
import * as Blockly from 'blockly/core';
import {FieldNote, FieldNoteFromJsonConfig} from '../../src/fields/note';
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

const constructorTestCases: ConstructorTestCase<typeof FieldNote>[] = [
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
    args: [60],
    expectedValue: '60'
  },
  {
    title: 'Integer Greater than MAX_NOTE',
    args: [FieldNote.MAX_NOTE + 1],
    expectedValue: '130'
  },
  {
    title: 'Negative Integer',
    args: [-60],
    expectedValue: '0'
  },
  {
    title: 'Integer String',
    args: [60],
    expectedValue: '60'
  },
  {
    title: 'Integer String Greater than MAX_NOTE',
    args: [`${FieldNote.MAX_NOTE + 1}`],
    expectedValue: '130'
  },
  {
    title: 'Negative Integer String',
    args: ['-60'],
    expectedValue: '0'
  }
];

const fromJsonTestCases = constructorTestCases.map(({title, args, expectedValue, expectedText}) => ({
  title, expectedValue, expectedText,
  config: {
    note: args[0]
  }
} as FromJsonTestCase<typeof FieldNote, FieldNoteFromJsonConfig>));

const setValueTestCases = constructorTestCases.map(({title, args, expectedValue, expectedText, invalid}) => ({
  title,
  ctorArgs: [60],
  value: args[0],
  expectedValue: invalid ? '60' : expectedValue,
  expectedText: invalid ? '60' : expectedText
} as SetValueTestCase<typeof FieldNote>));

const validatorTestCases: ValidatorTestCase<typeof FieldNote, Blockly.FieldTextInputValidator>[] = [
  {
    title: 'Null Validator',
    validator: () => null,
    value: '60',
    expectedValue: '0'
  },
  {
    title: 'Undefined Validator',
    validator: () => undefined,
    value: '60',
    expectedValue: '60'
  }
];

describe('FieldNote', () => {
  runConstructorTests(FieldNote, constructorTestCases);
  runFromJsonTests(FieldNote, fromJsonTestCases);
  runSetValueTests(FieldNote, setValueTestCases);
  runValidatorTests(FieldNote, validatorTestCases);

  describe('Serialization', () => {
    const context = setupSerializationTests(FieldNote, 'NOTE');

    test('Simple', () => {
      context.block.setFieldValue(60, 'NOTE');
      const json = Blockly.serialization.blocks.save(context.block);
      expect(json?.fields).toEqual({
        NOTE: '60'
      });
    });
  });
});
