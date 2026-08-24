/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test} from '@jest/globals';
import * as Blockly from 'blockly/core';
import {FieldDropdown, registerFieldDropdown} from '../../src/fields/dropdown';
import {setupSerializationTests} from '../helpers/field';

const options: Blockly.MenuOption[] = [
  ['First option', 'FIRST'],
  ['Second value', 'SECOND']
];

describe('FieldDropdown', () => {
  test('Preserves unknown values and displays them', () => {
    const field = new FieldDropdown(options);

    field.setValue('UNKNOWN');

    expect(field.getValue()).toBe('UNKNOWN');
    expect(field.getText()).toBe('UNKNOWN');
  });

  test('Uses the option label for valid values', () => {
    const field = new FieldDropdown(options);

    field.setValue('SECOND');

    expect(field.getValue()).toBe('SECOND');
    expect(field.getText()).toBe('Second value');
  });

  test('Delegates rendering of image option labels', () => {
    const field = new FieldDropdown([
      [{
        src: 'image.svg',
        alt: 'Image label',
        width: 10,
        height: 10
      }, 'IMAGE']
    ]);

    expect(field.getText()).toBe('Image label');
  });

  test('Registers as field_dropdown', () => {
    registerFieldDropdown();

    const field = Blockly.fieldRegistry.fromJson({
      type: 'field_dropdown',
      options
    });

    expect(field).toBeInstanceOf(FieldDropdown);
  });

  describe('Serialization', () => {
    const context = setupSerializationTests(
      FieldDropdown,
      'TARGET',
      [options] as unknown as ConstructorParameters<typeof FieldDropdown>
    );

    test('Preserves unknown value', () => {
      context.block.setFieldValue('UNKNOWN', 'TARGET');

      const json = Blockly.serialization.blocks.save(context.block);

      expect(json?.fields).toEqual({
        TARGET: 'UNKNOWN'
      });
    });

    test('Preserves valid value', () => {
      context.block.setFieldValue('SECOND', 'TARGET');

      const json = Blockly.serialization.blocks.save(context.block);

      expect(json?.fields).toEqual({
        TARGET: 'SECOND'
      });
    });
  });
});
