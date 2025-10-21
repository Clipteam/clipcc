/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ParameterModel} from './parameter_model';
import {ProcedureExtraState} from './serialization/procedures';

export class ProcedureModel implements Blockly.procedures.IProcedureModel {
  protected workspace: Blockly.Workspace;
  protected procCode: string;
  protected parameters: ParameterModel[] = [];
  protected returnTypes: string[] | null = null;
  protected enabled: boolean = true;
  protected global: boolean = false;
  protected warp: boolean = false;

  /**
   * @param workspace The workspace this parameter model belongs to.
   * @param procCode Proccode of procedure.
   */
  constructor(workspace: Blockly.Workspace, procCode: string) {
    this.workspace = workspace;
    this.procCode = procCode;
  }

  /**
   * Sets the procedure procCode of the procedure.
   * The procedure map should also be updated when procCode is updated.
   * @param name Procedure procCode.
   * @returns The model instance.
   */
  setName(name: string): this {
    return this.setProcCode(name);
  }

  /**
   * Sets the procedure procCode of the procedure.
   * The procedure map should also be updated when procCode is updated.
   * @param procCode Procedure procCode.
   * @returns The model instance.
   */
  setProcCode(procCode: string): this {
    this.procCode = procCode;
    return this;
  }

  /**
   * Inserts a parameter into the list of parameters.
   * To move a parameter, first delete it, and then re-insert.
   * @param parameterModel Model of parameter.
   * @param index Index of parameter.
   * @returns The model instance.
   */
  insertParameter(parameterModel: ParameterModel, index: number): this {
    if (
      this.parameters[index] &&
      this.parameters[index].getId() === parameterModel.getId()
    ) {
      return this; // Do nothing.
    }

    this.parameters.splice(index, 0, parameterModel);
    parameterModel.setProcedureModel(this);

    if (Blockly.isObservable(parameterModel)) {
      parameterModel.startPublishing();
    }

    return this;
  }

  /**
   * Removes the parameter at the given index from the parameter list.
   * @param index Index to remove.
   * @returns The model instance.
   */
  deleteParameter(index: number): this {
    if (!this.parameters[index]) {
      return this;
    }

    const [parameterModel] = this.parameters.splice(index, 1);
    if (Blockly.isObservable(parameterModel)) {
      parameterModel.stopPublishing();
    }

    return this;
  }

  /**
   * Append a parameter into the list of parameters.
   * @param parameterModel Model of parameter.
   * @returns The model instance.
   */
  appendParameter(parameterModel: ParameterModel): this {
    this.parameters.push(parameterModel);
    parameterModel.setProcedureModel(this);
    if (Blockly.isObservable(parameterModel)) {
      parameterModel.startPublishing();
    }
    return this;
  }

  /**
   * Sets the return type(s) of the procedure.
   * Pass null to represent a procedure that does not return.
   * Set types to [] (empty list) to return any types.
   * @param types Return types or null.
   * @returns The model instance.
   */
  setReturnTypes(types: string[] | null): this {
    this.returnTypes = types;
    return this;
  }

  /**
   * Sets whether this procedure is enabled/disabled. If a procedure is disabled
   * all procedure caller blocks should be disabled as well.
   * @param enabled Whether this procedure is enabled.
   * @returns The model instance.
   */
  setEnabled(enabled: boolean): this {
    if (this.enabled === enabled) {
      return this;
    }

    this.enabled = enabled;
    return this;
  }

  /**
   * Set whether this procedure should run in warp mode.
   * @param warp New value to be set.
   * @returns The model instance.
   */
  setWarp(warp: boolean): this {
    this.warp = warp;
    return this;
  }

  /**
   * Set whether this procedure is global.
   * @param global New value to be set.
   * @returns The model instance.
   */
  setGlobal(global: boolean): this {
    this.global = global;
    return this;
  }

  /**
   * Returns the unique language-neutral ID for the procedure.
   * @returns Procedure procCode.
   */
  getId(): string {
    return this.procCode;
  }

  /**
   * Returns the human-readable name of the procedure.
   * @returns Procedure procCode.
   */
  getName(): string {
    return this.procCode;
  }

  /**
   * Returns the procCode of the procedure.
   * @returns Procedure procCode.
   */
  getProcCode(): string {
    return this.procCode;
  }

  /**
   * Returns whether the procedure should run in warp mode.
   * @returns True iff the procedure should run in warp mode.
   */
  getWarp(): boolean {
    return this.warp;
  }

  /**
   * Returns whether the procedure is global.
   * @returns True iff the procedure is global.
   */
  getGlobal(): boolean {
    return this.global;
  }

  /**
   * Returns whether the procedure returns a value.
   * @returns True iff the procedure returns a value.
   */
  getReturn(): boolean {
    return !!this.returnTypes;
  }

  /**
   * Returns the parameter at the given index in the parameter list.
   * @param index Index of parameter.
   * @returns Parameter of given index.
   */
  getParameter(index: number): Blockly.procedures.IParameterModel {
    return this.parameters[index];
  }

  /**
   * Returns an array of all of the parameters in the parameter list.
   * @returns Array of parameters.
   */
  getParameters(): Blockly.procedures.IParameterModel[] {
    return this.parameters;
  }

  /**
   * Returns the return type(s) of the procedure.
   * Null represents a procedure that does not return a value.
   * @returns Array of return types or null.
   */
  getReturnTypes(): string[] | null {
    return this.returnTypes;
  }

  /**
   * Returns whether the procedure is enabled/disabled. If a procedure is
   * disabled, all procedure caller blocks should be disabled as well.
   * @returns Whether this procedure is enabled.
   */
  getEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Serializes the state of the procedure to JSON.
   * @returns JSON serializable state of the procedure.
   */
  saveState(): Blockly.serialization.procedures.State {
    return {
      id: this.procCode,
      name: this.procCode,
      returnTypes: this.returnTypes,
      parameters: this.parameters.map((param) => param.saveState())
    };
  }

  /**
   * Serializes the state of the procedure to JSON which is used in Scratch.
   * @returns JSON serializable state of the procedure.
   */
  saveExtraState(): ProcedureExtraState {
    return {
      proccode: this.procCode,
      argumentids: this.parameters.map((param) => param.getId()),
      argumentnames: this.parameters.map((param) => param.getName()),
      argumentdefaults: this.parameters.map((param) => param.getDefaultValue()),
      warp: this.warp,
      return: this.getReturn(),
      global: this.global
    };
  }

  /**
   * Deserializes the state of the procedure.
   * @param state Extra state of procedure definition.
   */
  loadExtraState(state: ProcedureExtraState): void {
    this.procCode = state.proccode;
    this.warp = state.warp;
    this.global = state.global;
    this.returnTypes = state.return ? [] : null;
    this.parameters = [];
    if (state.argumentnames && state.argumentids) {
      for (let i = 0; i < state.argumentids.length; ++i) {
        this.parameters.push(new ParameterModel(
          this.workspace,
          state.argumentnames[i],
          state.argumentids[i],
          state.argumentdefaults[i]
        ));
      }
    }
  }

  /**
   * Create a procedure model from extra state.
   * @param workspace The workspace of procedure.
   * @param state The extra state of procedure.
   * @returns The procedure model.
   */
  static loadExtraState(workspace: Blockly.Workspace, state: ProcedureExtraState): ProcedureModel {
    const model = new ProcedureModel(workspace, state.proccode);
    model.loadExtraState(state);
    return model;
  }
}
