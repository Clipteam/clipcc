/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ProcedureModel} from '../procedure_model';

/** The procedure extra state without argumentnames and argumentdefaults. */
export interface ProcedureCallerExtraState {
  proccode: string;
  argumentids: string[];
  warp: boolean;
  return: boolean;
  global: boolean;
  generateshadows?: boolean;
}

/** The full procedure extra state for definition and prototypes. */
export interface ProcedureExtraState extends ProcedureCallerExtraState {
  argumentnames: string[];
  argumentdefaults: string[];
}

/**
 * Serializer for saving and loading procedure state.
 */
export class ProcedureSerializer implements Blockly.serialization.ISerializer {
  public priority = Blockly.serialization.priorities.PROCEDURES;

  /**
   * Saves the state of the procedures in given workspace.
   * @param workspace The workspace the system to serialize is associated with.
   * @returns A JS object containing the system's state, or null if there is no
   *     state to record.
   */
  save(workspace: Blockly.Workspace): ProcedureExtraState[] | null {
    const save = workspace.getProcedureMap().getProcedures().map((model) => {
      return (model as ProcedureModel).saveExtraState();
    });
    return save.length ? save : null;
  }

  /**
   * Deserializes the procedures models defined by the given state into the
   * workspace.
   * @param state The state of the system to deserialize. This will always be
   *     non-null.
   * @param workspace The workspace the system to deserialize is associated
   *     with.
   */
  load(state: ProcedureExtraState[], workspace: Blockly.Workspace) {
    const map = workspace.getProcedureMap();
    for (const procState of state) {
      map.add(ProcedureModel.loadExtraState(workspace, procState));
    }
  }

  /**
   * Disposes of any procedure models that exist on the workspace.
   * @param workspace The workspace the system to clear the state of is
   *     associated with.
   */
  clear(workspace: Blockly.Workspace) {
    workspace.getProcedureMap().clear();
  }
}

// Register the procedure serializer.
Blockly.serialization.registry.register('procedures', new ProcedureSerializer());
