/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test, beforeAll, afterAll} from 'vitest';
import * as Blockly from 'blockly/core';
import {ProcedureModel} from '../../src/procedure_model';
import {ProcedureExtraState} from '../../src/serialization/procedures';
import '../../src/serialization/procedures';

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

describe('Serialization: Procedures', () => {
  let workspace: Blockly.Workspace;

  beforeAll(() => {
    workspace = new Blockly.Workspace();
  });

  afterAll(() => {
    workspace.dispose();
  });

  test('Save', () => {
    const procedureMap = workspace.getProcedureMap();
    procedureMap.add(ProcedureModel.loadExtraState(workspace, procedureState));
    procedureMap.add(ProcedureModel.loadExtraState(workspace, anotherProcedureState));

    const save = Blockly.serialization.workspaces.save(workspace);
    workspace.clear();
    procedureMap.clear();

    expect((save['procedures'] as Array<ProcedureExtraState>).sort()).toEqual([
      procedureState,
      anotherProcedureState
    ].sort());
  });

  test('Load', () => {
    const save = {
      procedures: [procedureState, anotherProcedureState]
    };
    Blockly.serialization.workspaces.load(save, workspace);

    const procedureMap = workspace.getProcedureMap();
    expect(procedureMap.has('PROCEDURE')).toBeTruthy();
    expect(procedureMap.has('PROCEDURE %s')).toBeTruthy();
  });

  test('Save and Load', () => {
    const procedureMap = workspace.getProcedureMap();
    procedureMap.add(ProcedureModel.loadExtraState(workspace, procedureState));
    procedureMap.add(ProcedureModel.loadExtraState(workspace, anotherProcedureState));

    const save = Blockly.serialization.workspaces.save(workspace);
    workspace.clear();
    procedureMap.clear();
    Blockly.serialization.workspaces.load(save, workspace);

    const newSave = Blockly.serialization.workspaces.save(workspace);

    expect(save).toEqual(newSave);
  });
});
