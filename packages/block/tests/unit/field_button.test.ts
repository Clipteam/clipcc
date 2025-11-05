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
    const callback = (field: FieldButton) => {
      throw `${field.name} clicked`;
    };
    const context = setupSerializationTests(FieldButton, 'BUTTON', ['path/to/image', callback]);

    test('Click', () => {
      expect(() => {
        context.block.getField('BUTTON')!.showEditor();
      }).toThrow('BUTTON clicked');
    });

    test('Click When Disabled', () => {
      const field = context.block.getField('BUTTON')!;
      field.setEnabled(false);
      expect(() => {
        field.showEditor();
      }).not.toThrow('BUTTON clicked');
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
