/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/** Represents the state of a procedure model. */
export interface ProcedureState {
  proccode: string;
  argumentids: string[];
  argumentnames?: string[];
  argumentdefaults?: string[];
  generateshadows?: boolean;
  warp: boolean;
  return: boolean;
  global: boolean;
}
