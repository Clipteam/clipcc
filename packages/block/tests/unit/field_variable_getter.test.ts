/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {jest, describe, expect, test, afterEach} from '@jest/globals';
import * as Blockly from 'blockly/core';
import {FieldVariableGetter} from '../../src/fields/variable_getter';
import {setupSerializationTests} from '../helpers/field';

jest.mock('blockly/core', () => {
  const actualModule = jest.requireActual('blockly/core') as typeof Blockly;
  return {
    __esModule: true,
    ...actualModule,
    Variables: {
      ...actualModule.Variables,
      getOrCreateVariablePackage: jest.fn((
        workspace: Blockly.Workspace,
        id: string | null, name: string, type: string
      ) => {
        return workspace.getVariableMap().createVariable(name, type, 'VARIABLE_ID');
      })
    }
  };
});

describe('FieldVariableGetter', () => {
  const context = setupSerializationTests(FieldVariableGetter, 'VARIABLE', ['VARIABLE_NAME', '']);

  afterEach(() => {
    context.workspace.getVariableMap().clear();
  });

  describe('Constructor', () => {
    test('Unattached Field', () => {
      expect(() => {
        const field = new FieldVariableGetter('VARIABLE_NAME_TEST', '');
        field.initModel();
      }).toThrow(Blockly.UnattachedFieldError);
    });

    test('Simple', () => {
      const field = context.block.getField('VARIABLE') as FieldVariableGetter;
      context.block.initModel();
      expect(field.getValue()).toStrictEqual('VARIABLE_ID');
      expect(field.getText()).toStrictEqual('VARIABLE_NAME');
    });
  });

  describe('Serialization', () => {
    test('Simple', () => {
      context.block.initModel();
      const json = Blockly.serialization.blocks.save(context.block);
      expect(json?.fields).toEqual({
        VARIABLE: {
          id: 'VARIABLE_ID',
          variabletype: '',
          name: 'VARIABLE_NAME'
        }
      });
    });
  });
});
