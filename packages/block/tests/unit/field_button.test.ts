/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {FieldButton} from '../../src/fields/button';
import {setupSerializationTests} from '../helpers/field';

describe('FieldButton', () => {
  describe('Operations', () => {
    const callback = jest.fn((field: FieldButton) => null);
    const context = setupSerializationTests(FieldButton, 'BUTTON', ['path/to/image', callback]);

    test('Click', () => {
      callback.mockClear();
      context.block.getField('BUTTON')!.showEditor();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('Click When Disabled', () => {
      callback.mockClear();
      const field = context.block.getField('BUTTON')!;
      field.setEnabled(false);
      field.showEditor();
      expect(callback).toHaveBeenCalledTimes(0);
    });
  });

  describe('Serialization', () => {
    const context = setupSerializationTests(FieldButton, 'BUTTON');

    test('Unserializable', () => {
      context.block.setFieldValue('path/to/image', 'BUTTON');
      const json = Blockly.serialization.blocks.save(context.block);
      expect(json?.fields).toBeUndefined();
    });
  });
});
