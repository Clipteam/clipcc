/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test, beforeAll, afterAll, afterEach} from 'vitest';
import * as Blockly from 'blockly/core';
import {FuncDelete} from '../../src/events/func_delete';
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

describe('Event: FuncDelete', () => {
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
      const event = new FuncDelete(model);
      event.run(false);
      expect(workspace.getProcedureMap().has('PROCEDURE')).toBeTruthy();
    });

    test('Redo', () => {
      const model = ProcedureModel.loadExtraState(workspace, procedureState);
      workspace.getProcedureMap().add(model);
      const event = new FuncDelete(model);
      event.run(true);
      expect(workspace.getProcedureMap().has('PROCEDURE')).toBeFalsy();
    });
  });

  describe('Serialization', () => {
    test('Events Round-Trip through JSON', () => {
      const model = ProcedureModel.loadExtraState(workspace, procedureState);
      const event = new FuncDelete(model);
      const json = event.toJson();
      expect(json).toEqual({
        procCode: 'PROCEDURE',
        extraState: procedureState,
        type: FuncDelete.TYPE,
        group: ''
      });

      const newEvent = FuncDelete.fromJson(json, workspace);
      expect(newEvent).toEqual(event);
    });
  });
});
