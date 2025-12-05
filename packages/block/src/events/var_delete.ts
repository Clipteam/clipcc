/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {VariableModel} from '../variable_model';
import type {VariableMap} from '../variable_map';

interface VarDeleteJson extends Blockly.Events.VarDeleteJson {
  isCloud: boolean;
  isLocal: boolean;
}

export class VarDelete extends Blockly.Events.VarDelete {
  isCloud = false;
  isLocal = false;

  constructor(variable?: VariableModel) {
    super(variable);
    if (!variable) return;

    this.isLocal = variable.getIsLocal();
    this.isCloud = variable.getIsCloud();
  }

  override toJson(): VarDeleteJson {
    const json = super.toJson() as VarDeleteJson;
    json.isLocal = this.isLocal;
    json.isCloud = this.isCloud;
    return json;
  }

  static override fromJson(
    json: VarDeleteJson,
    workspace: Blockly.Workspace,
    event?: Blockly.Events.VarCreate
  ): VarDelete {
    const varDelete = super.fromJson(
      json,
      workspace,
      event
    ) as VarDelete;
    varDelete.isLocal = json.isLocal;
    varDelete.isCloud = json.isCloud;
    return varDelete;
  }

  /**
   * Run a variable deletion event.
   * @param forward True if run forward, false if run backward (undo).
   */
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
      const variable = variableMap.getVariableById(this.varId);
      if (variable) variableMap.deleteVariable(variable);
    } else {
      variableMap.createVariable(this.varName, this.varType, this.varId, this.isLocal, this.isCloud);
    }
  }
};

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  Blockly.Events.VAR_DELETE,
  VarDelete,
  true
);
