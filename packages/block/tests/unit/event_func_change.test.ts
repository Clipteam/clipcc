/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test, beforeAll, afterAll, afterEach} from 'vitest';
import * as Blockly from 'blockly/core';
import {FuncChange} from '../../src/events/func_change';
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

const anotherProcedureState: ProcedureExtraState = {
  proccode: 'PROCEDURE %s',
  argumentids: ['PARAM_ID'],
  argumentdefaults: [''],
  argumentnames: ['PARAM_NAME'],
  warp: true,
  return: true,
  global: false
};

describe('Event: FuncChange', () => {
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
      const model = ProcedureModel.loadExtraState(workspace, anotherProcedureState);
      workspace.getProcedureMap().add(model);
      const event = new FuncChange(model, procedureState, anotherProcedureState);
      event.run(false);
      expect(workspace.getProcedureMap().has('PROCEDURE %s')).toBeFalsy();
      expect(workspace.getProcedureMap().has('PROCEDURE')).toBeTruthy();
    });

    test('Redo', () => {
      const model = ProcedureModel.loadExtraState(workspace, procedureState);
      workspace.getProcedureMap().add(model);
      const event = new FuncChange(model, procedureState, anotherProcedureState);
      event.run(true);
      expect(workspace.getProcedureMap().has('PROCEDURE %s')).toBeTruthy();
      expect(workspace.getProcedureMap().has('PROCEDURE')).toBeFalsy();
    });
  });

  describe('Serialization', () => {
    test('Events Round-Trip through JSON', () => {
      const model = ProcedureModel.loadExtraState(workspace, procedureState);
      const event = new FuncChange(model, procedureState, anotherProcedureState);
      const json = event.toJson();
      expect(json).toEqual({
        procCode: 'PROCEDURE',
        oldExtraState: procedureState,
        newExtraState: anotherProcedureState,
        type: FuncChange.TYPE,
        group: ''
      });

      const newEvent = FuncChange.fromJson(json, workspace);
      expect(newEvent).toEqual(event);
    });
  });
});
