/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

export class ParameterModel implements Blockly.procedures.IParameterModel {
  protected workspace: Blockly.Workspace;
  protected id: string;
  protected name: string;
  protected defaultValue: string;
  protected types: string[] = [];
  protected model: Blockly.procedures.IProcedureModel | null = null;

  /**
   * @param workspace The workspace this parameter model belongs to.
   * @param name Name of parameter.
   * @param id Optional ID of paramter, or pass null to generate a random ID.
   * @param defaultValue Optional default value of paramter.
   */
  constructor(workspace: Blockly.Workspace, name: string, id?: string, defaultValue?: string) {
    this.workspace = workspace;
    this.name = name;
    this.id = id ?? Blockly.utils.idGenerator.genUid();
    if (name === 'statement') {
      // In vm, only input names starting with SUBSTACK can be correctly recognized as branch.
      this.id = 'SUBSTACK' + this.id;
    }
    this.defaultValue = defaultValue ?? '';
  }

  /**
   * Sets the name of this parameter to the given name.
   * @param name The name to set this parameter to.
   * @returns The model instance.
   */
  setName(name: string): this {
    this.name = name;
    return this;
  }

  /**
   * Sets the types of this parameter to the given type.
   * @param types The types to set this parameter to.
   * @returns The model instance.
   */
  setTypes(types: string[]): this {
    this.types = types;
    return this;
  }

  /**
   * Returns the name of this parameter.
   * @returns The name of this paramerter.
   */
  getName(): string {
    return this.name;
  }

  /**
   * Return the types of this parameter.
   * @returns The name of this parameter.
   */
  getTypes(): string[] {
    return this.types;
  }

  /**
   * Returns the unique language-neutral ID for the parameter.
   * This represents the identify of the variable model which does not change
   * over time.
   * @returns The ID of this parameter.
   */
  getId(): string {
    return this.id;
  }

  /**
   * Returns the default value of the parameter.
   * @returns The default value of this parameter.
   */
  getDefaultValue(): string {
    return this.defaultValue;
  }

  /**
   * Sets the procedure model this parameter is associated with.
   * @param model The procedure model this parameter.
   * @returns The model instance.
   */
  setProcedureModel(model: Blockly.procedures.IProcedureModel): this {
    this.model = model;
    return this;
  }

  /**
   * Serializes the state of the parameter to JSON.
   * @returns JSON serializable state of the parameter.
   */
  saveState(): Blockly.serialization.procedures.ParameterState {
    const state: Blockly.serialization.procedures.ParameterState = {
      id: this.id,
      name: this.name
    };
    if (this.getTypes().length) {
      state.types = this.getTypes();
    }
    return state;
  }
}
