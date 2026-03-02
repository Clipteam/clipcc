/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {FuncBase, FuncBaseJson} from './func_base';
import {ProcedureExtraState} from '../serialization/procedures';
import {ProcedureModel} from '../procedure_model';

/**
 * Class for a procedure create event.
 */
export class FuncCreate extends FuncBase {
  static readonly TYPE = 'func_create';

  /** Type of this event. */
  override type = FuncCreate.TYPE;

  /** The previous extra state of the procedure. */
  protected extraState?: ProcedureExtraState;

  /**
   * @param procedure The procedure model.
   */
  constructor(procedure?: ProcedureModel) {
    super(procedure);
    if (!procedure) return;
    this.extraState = procedure.saveExtraState();
  }

  /**
   * Encode the event as JSON.
   * @returns JSON representation.
   */
  override toJson(): FuncCreateJson {
    const json = super.toJson() as FuncCreateJson;
    if (!this.extraState) {
      throw new Error('The event is incomplete. Either pass a procedure to the constructor, or call fromJson.');
    }
    json.extraState = this.extraState;
    return json;
  }

  /**
   * Deserializes the JSON event.
   * @param json The JSON object that describes the event.
   * @param workspace The workspace of the event belong to.
   * @param event The event to append new properties to. Should be a subclass
   *     of Abstract (like all events), but we can't specify that due to the
   *     fact that parameters to static methods in subclasses must be
   *     supertypes of parameters to static methods in superclasses.
   * @returns The newly created event instance.
   */
  static override fromJson(
    json: FuncCreateJson,
    workspace: Blockly.Workspace,
    event?: Blockly.Events.Abstract
  ): FuncCreate {
    const newEvent = super.fromJson(
      json, workspace,
      event ?? new FuncCreate()
    ) as FuncCreate;
    newEvent.extraState = json.extraState;
    return newEvent;
  }

  /**
   * Run an event.
   * @param forward True if run forward, false if run backward (undo).
   */
  override run(forward: boolean): void {
    if (!this.procCode || !this.extraState) {
      throw new Error('The event is incomplete. Either pass a procedure to the constructor, or call fromJson.');
    }
    const workspace = this.getEventWorkspace_();
    const procedureMap = workspace.getProcedureMap();
    if (forward) {
      if (procedureMap.has(this.procCode)) {
        throw new Error(`The procedure ${this.procCode} is already defined.`);
      }
      const procedure = ProcedureModel.loadExtraState(this.getEventWorkspace_(), this.extraState);
      procedureMap.add(procedure);
    } else {
      if (!procedureMap.has(this.procCode)) {
        console.warn(`Trying to delete an undefined procedure ${this.procCode}`);
      }
      procedureMap.delete(this.procCode);
    }
  }
}

export interface FuncCreateJson extends FuncBaseJson {
  extraState: ProcedureExtraState;
}

Blockly.registry.register(Blockly.registry.Type.EVENT, FuncCreate.TYPE, FuncCreate);
