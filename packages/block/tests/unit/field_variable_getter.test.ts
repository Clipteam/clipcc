/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {vi, describe, expect, test, afterEach, beforeEach} from 'vitest';
import * as Blockly from 'blockly/core';
import {FieldVariableGetter} from '../../src/fields/variable_getter';
import {setupSerializationTests} from '../helpers/field';

describe('FieldVariableGetter', () => {
  const context = setupSerializationTests(FieldVariableGetter, 'VARIABLE', ['VARIABLE_NAME', '']);

  beforeEach(() => {
    context.workspace.getVariableMap().clear();

    vi.spyOn(Blockly.Variables, 'getOrCreateVariablePackage').mockImplementation((
      workspace: Blockly.Workspace,
      id: string | null,
      optName?: string,
      optType?: string
    ) => {
      return workspace.getVariableMap().createVariable(optName ?? '', optType ?? '', 'VARIABLE_ID');
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
        VARIABLE: '<field name="VARIABLE" id="VARIABLE_ID" variabletype="">VARIABLE_NAME</field>'
      });
    });
  });
});
