/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test, beforeAll, afterAll, afterEach} from 'vitest';
import * as Blockly from 'blockly/core';
import {FuncCreate} from '../../src/events/func_create';
import {ProcedureModel} from '../../src/procedure_model';
import {ProcedureExtraState} from '../../src/serialization/procedures';

const procedureState: ProcedureExtraState = {
  proccode: 'PROCEDURE',
  argumentids: [],
  argumentdefaults: [],
  argumentnames: [],
  warp: false,
  return: false,
  global: false
};

describe('Event: FuncCreate', () => {
  let workspace: Blockly.Workspace;

  beforeAll(() => {
    workspace = new Blockly.Workspace();
    Blockly.Events.disable();
  });

  afterAll(() => {
    workspace.dispose();
  });

  describe('Undo and Redo', () => {
    afterEach(() => {
      workspace.getProcedureMap().clear();
    });

    test('Undo', () => {
      const model = ProcedureModel.loadExtraState(workspace, procedureState);
      workspace.getProcedureMap().add(model);
      const event = new FuncCreate(model);
      event.run(false);
      expect(workspace.getProcedureMap().has('PROCEDURE')).toBeFalsy();
    });

    test('Redo', () => {
      const model = ProcedureModel.loadExtraState(workspace, procedureState);
      const event = new FuncCreate(model);
      event.run(true);
      expect(workspace.getProcedureMap().has('PROCEDURE')).toBeTruthy();
    });
  });

  describe('Serialization', () => {
    test('Events Round-Trip through JSON', () => {
      const model = ProcedureModel.loadExtraState(workspace, procedureState);
      const event = new FuncCreate(model);
      const json = event.toJson();
      expect(json).toEqual({
        procCode: 'PROCEDURE',
        extraState: procedureState,
        type: FuncCreate.TYPE,
        group: ''
      });

      const newEvent = FuncCreate.fromJson(json, workspace);
      expect(newEvent).toEqual(event);
    });
  });
});
