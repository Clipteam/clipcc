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

/**
 * Class for a variable creation event.
 */
export class VarCreate extends Blockly.Events.VarCreate {
  isCloud = false;
  isLocal = false;

  /**
   * Create a variable creation event.
   * @param variable The created variable. Undefined for a blank event.
   */
  constructor(variable?: VariableModel) {
    super(variable);
    if (!variable) return;

    this.isLocal = variable.getLocal();
    this.isCloud = variable.getCloud();
  }

  /**
   * Encode the event as JSON.
   * @returns JSON representation.
   */
  override toJson(): VarCreateJson {
    const json = super.toJson() as VarCreateJson;
    json.isLocal = this.isLocal;
    json.isCloud = this.isCloud;
    return json;
  }

  /**
   * Decode the JSON event.
   * @param json The JSON representation.
   * @param workspace The workspace to deserialize to.
   * @param event The event to append to. Undefined for a blank event.
   * @returns The created event.
   */
  static override fromJson(
    json: VarCreateJson,
    workspace: Blockly.Workspace,
    event?: Blockly.Events.Abstract
  ): VarCreate {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new VarCreate()
    ) as VarCreate;
    newEvent.isLocal = json.isLocal;
    newEvent.isCloud = json.isCloud;
    return newEvent;
  }

  /**
   * Run a variable creation event.
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
