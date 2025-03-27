/**
 * @license
 * Copyright 2024 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ProcedureModel} from '../procedure_model';

/**
 * Abstract class for a procedure event.
 */
export class FuncBase extends Blockly.Events.Abstract {
  /** Whether or not the event was constructed without necessary parameters. */
  override isBlank: boolean = false;

  /** The procCode of procedure. */
  protected procCode?: string;

  /**
   * @param procedure The procedure model.
   */
  constructor(procedure?: ProcedureModel) {
    super();
    this.isBlank = !procedure;
    if (this.isBlank) return;
    this.procCode = procedure!.getProcCode();
  }

  /**
   * Encode the event as JSON.
   * @returns JSON representation.
   */
  override toJson(): FuncBaseJson {
    const json = super.toJson() as FuncBaseJson;
    if (!this.procCode) {
      throw new Error('The procCode is undefined. Either pass a procedure to the constructor, or call fromJson.');
    }
    json.procCode = this.procCode;
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
    json: FuncBaseJson,
    workspace: Blockly.Workspace,
    event?: Blockly.Events.Abstract
  ): FuncBase {
    const newEvent = super.fromJson(
      json, workspace,
      event ?? new FuncBase()
    ) as FuncBase;
    newEvent.procCode = json.procCode;
    return newEvent;
  }
}

export interface FuncBaseJson extends Blockly.Events.AbstractEventJson {
  procCode: string;
}
