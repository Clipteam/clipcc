/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {VariableModel} from './variable_model';

/**
 * Class that provides storage for variables.
 */
export class VariableMap extends Blockly.VariableMap {
  /**
   * Create a variable with a given name, optional type, and optional ID.
   * @param name The name of the variable. This must be unique across variables
   *     and procedures.
   * @param varType The type of the variable like 'int' or 'string'.
   *     Does not need to be unique. Field_variable can filter variables based
   * on their type. This will default to '' which is a specific type.
   * @param varId The unique ID of the variable. This will default to a UUID.
   * @param isLocal Whether this variable is locally scoped.
   * @param isCloud Whether this variable is a cloud variable.
   * @returns The newly created variable.
   */
  override createVariable(
    name: string,
    varType?: string,
    varId?: string,
    isLocal?: boolean,
    isCloud?: boolean
  ): VariableModel {
    let variable = this.getVariable(name, varType);
    if (variable) {
      if (varId && variable.getId() !== varId) {
        // There is a variable conflict. Variable conflicts should be eliminated
        // in the scratch-vm, or before we get to this point,
        // so log a warning, because throwing an error crashes projects.
        console.warn(
          'Variable "' +
            name +
            '" is already in use and its id is "' +
            variable.getId() +
            '" which conflicts with the passed in ' +
            'id, "' +
            varId +
            '".'
        );
        // The variable already exists and has the same ID.
        return variable;
      }
    }

    if (varId) {
      variable = this.getVariableById(varId) as VariableModel | null;
      if (variable) {
        console.warn('Variable id, "' + varId + '", is already in use.');
        return variable;
      }
    }
    const id = varId ?? Blockly.utils.idGenerator.genUid();
    const type = varType ?? '';
    const ScratchVariableModel = Blockly.registry.getClassFromOptions(
      Blockly.registry.Type.VARIABLE_MODEL,
      this.workspace.options,
      true
    ) as typeof VariableModel | null;
    if (!ScratchVariableModel) {
      throw new Error('No variable model is registered.');
    }
    variable = new ScratchVariableModel(this.workspace, name, type, id, isLocal, isCloud);

    const variables =
      this['variableMap'].get(type) ??
      new Map<string, VariableModel>();
    variables.set(variable.getId(), variable);
    if (!this['variableMap'].has(type)) {
      this['variableMap'].set(type, variables);
    }
    if (!this.potentialMap) {
      Blockly.Events.fire(new (Blockly.Events.get(Blockly.Events.VAR_CREATE))(variable));
    }
    return variable;
  }

  /* End functions for variable deletion. */
  /**
   * Find the variable by the given name and type and return it.  Return null if
   * it is not found.
   * @param name The name to check for.
   * @param type The type of the variable.  If not provided it defaults to
   *     the empty string, which is a specific type.
   * @returns The variable with the given name, or null if it was not found.
   */
  override getVariable(name: string, type = ''): VariableModel | null {
    // Variable names in Blockly are case-insensitive, but case sensitive in
    // Scratch. Override the implementation to only return a variable whose name
    // is identical to the one requested.
    const variables = this.getVariablesOfType(type);
    if (!variables.length) return null;
    return (variables.find((v) => v.getName() === name) as VariableModel) ?? null;
  }
}

Blockly.registry.register(
  Blockly.registry.Type.VARIABLE_MAP,
  Blockly.registry.DEFAULT,
  VariableMap,
  true
);
