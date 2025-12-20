/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

export interface ScratchVariableState extends Blockly.IVariableState {
  isLocal: boolean;
  isCloud: boolean;
}

export class VariableModel
  extends Blockly.VariableModel
  implements Blockly.IVariableModel<ScratchVariableState> {
  /**
   * Whether this variable is locally scoped.
   */
  protected isLocal = false;

  /**
   * Whether the variable is a cloud variable.
   */
  protected isCloud = false;

  constructor(
    workspace: Blockly.Workspace,
    name: string,
    type?: string,
    id?: string,
    isLocal = false,
    isCloud = false
  ) {
    super(workspace, name, type, id);
    this.isLocal = isLocal;
    this.isCloud = isCloud;
  }

  /**
   * Get whether this variable is locally scoped.
   * @returns Whether this variable is locally scoped.
   */
  getLocal(): boolean {
    return this.isLocal;
  }

  /**
   * Get whether this variable is a cloud variable.
   * @returns Whether this variable is a cloud variable.
   */
  getCloud(): boolean {
    return this.isCloud;
  }

  /**
   * Serializes this VariableModel.
   * @returns a JSON representation of this VariableModel.
   */
  override save(): ScratchVariableState {
    const state = super.save() as ScratchVariableState;
    state.isLocal = this.isLocal;
    state.isCloud = this.isCloud;
    return state;
  }

  /**
   * Loads the persisted state into a new variable in the given workspace.
   * @param state The serialized state of a variable model from save().
   * @param workspace The workspace to create the new variable in.
   */
  static override load(state: ScratchVariableState, workspace: Blockly.Workspace) {
    const variable = new this(
      workspace,
      state['name'],
      state['type'],
      state['id'],
      state['isLocal'],
      state['isCloud']
    );
    workspace.getVariableMap().addVariable(variable);
    Blockly.Events.fire(new (Blockly.Events.get(Blockly.Events.VAR_CREATE))(variable));
  }
}

Blockly.registry.register(
  Blockly.registry.Type.VARIABLE_MODEL,
  Blockly.registry.DEFAULT,
  VariableModel,
  true
);
