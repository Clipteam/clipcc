/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {VariableModel} from '../variable_model';
import type {VariableMap} from '../variable_map';

interface VarCreateJson extends Blockly.Events.VarCreateJson {
  isCloud: boolean;
  isLocal: boolean;
}

export class VarCreate extends Blockly.Events.VarCreate {
  isCloud = false;
  isLocal = false;

  constructor(variable?: VariableModel) {
    super(variable);
    if (!variable) return;

    this.isLocal = variable.getIsLocal();
    this.isCloud = variable.getIsCloud();
  }

  override toJson(): VarCreateJson {
    const json = super.toJson() as VarCreateJson;
    json.isLocal = this.isLocal;
    json.isCloud = this.isCloud;
    return json;
  }

  static override fromJson(
    json: VarCreateJson,
    workspace: Blockly.Workspace,
    event?: Blockly.Events.VarCreate
  ): VarCreate {
    const varCreate = super.fromJson(
      json,
      workspace,
      event
    ) as VarCreate;
    varCreate.isLocal = json.isLocal;
    varCreate.isCloud = json.isCloud;
    return varCreate;
  }

  override run(forward: boolean) {
    const workspace = this.getEventWorkspace_();
    if (!this.varId) {
      throw new Error(
        'The var ID is undefined. Either pass a variable to ' +
        'the constructor, or call fromJson'
      );
    }
    if (!this.varName) {
      throw new Error(
        'The var name is undefined. Either pass a variable to ' +
        'the constructor, or call fromJson'
      );
    }
    const variableMap = workspace.getVariableMap() as VariableMap;
    if (forward) {
      variableMap.createVariable(this.varName, this.varType, this.varId, this.isLocal, this.isCloud);
    } else {
      const variable = variableMap.getVariableById(this.varId);
      if (variable) variableMap.deleteVariable(variable);
    }
  }
};

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  Blockly.Events.VAR_CREATE,
  VarCreate,
  true
);
