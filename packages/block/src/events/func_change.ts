/**
 * @license
 * Copyright 2024 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {FuncBase, FuncBaseJson} from './func_base';
import {ProcedureModel} from '../procedure_model';
import {ProcedureExtraState} from '../serialization/procedures';

/**
 * Class for a procedure change event.
 */
export class FuncChange extends FuncBase {
  static readonly TYPE = 'func_change';

  /** Type of this event. */
  override type = FuncChange.TYPE;

  /** The previous extra state of the procedure. */
  protected oldExtraState?: ProcedureExtraState;

  /** The new extra state of the procedure. */
  protected newExtraState?: ProcedureExtraState;

  /**
   * @param procedure The procedure model.
   * @param newExtraState The new extra state of procedure.
   */
  constructor(
    procedure?: ProcedureModel,
    newExtraState?: ProcedureExtraState
  ) {
    super(procedure);
    if (!procedure) return;
    this.oldExtraState = procedure.saveExtraState();
    this.newExtraState = newExtraState ?? {
      proccode: '',
      warp: false,
      return: false,
      global: false,
      argumentids: []
    };
  }

  /**
   * Encode the event as JSON.
   * @returns JSON representation.
   */
  override toJson(): FuncChangeJson {
    const json = super.toJson() as FuncChangeJson;
    if (!this.oldExtraState || !this.newExtraState) {
      throw new Error('The event is incomplete. Either pass a procedure to the constructor, or call fromJson.');
    }
    json.oldExtraState = this.oldExtraState;
    json.newExtraState = this.newExtraState;
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
    json: FuncChangeJson,
    workspace: Blockly.Workspace,
    event?: Blockly.Events.Abstract
  ): FuncChange {
    const newEvent = super.fromJson(
      json, workspace,
      event ?? new FuncChange()
    ) as FuncChange;
    newEvent.oldExtraState = json.oldExtraState;
    newEvent.newExtraState = json.newExtraState;
    return newEvent;
  }

  /**
   * Run an event.
   * @param forward True if run forward, false if run backward (undo).
   */
  override run(forward: boolean): void {
    if (!this.procCode || !this.oldExtraState || !this.newExtraState) {
      throw new Error('The event is incomplete. Either pass a procedure to the constructor, or call fromJson.');
    }
    if (forward) {
      this.updateProcedure(this.procCode, this.newExtraState);
    } else {
      this.updateProcedure(this.newExtraState.proccode, this.oldExtraState);
    }
  }

  /**
   * Update extra state of the procedure with given procCode, then update the
   * procedure map with new procCode.
   * @param procCode The procCode of procedure.
   * @param extraState The new extra state of procedure.
   */
  protected updateProcedure(procCode: string, extraState: ProcedureExtraState) {
    const workspace = this.getEventWorkspace_();
    const procedureMap = workspace.getProcedureMap();
    if (!procedureMap.has(procCode)) {
      throw new Error(`The procedure ${procCode} is undefined.`);
    }
    const procedure = procedureMap.get(procCode) as ProcedureModel;
    procedure.loadExtraState(extraState);

    // Update key in procedure map if necessary.
    if (extraState.proccode !== procCode) {
      procedureMap.delete(procedure.getId());
      procedureMap.add(procedure);
    }
  }
}

export interface FuncChangeJson extends FuncBaseJson {
  oldExtraState: ProcedureExtraState;
  newExtraState: ProcedureExtraState;
}

Blockly.registry.register(Blockly.registry.Type.EVENT, FuncChange.TYPE, FuncChange);
