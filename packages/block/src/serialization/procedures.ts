/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

export interface ProcedureExtraState {
  proccode: string;
  argumentids: string[];
  argumentnames?: string[]; // procedure_definition only
  argumentdefaults?: string[]; // procedure_definition only
  generateshadows?: boolean; // procedure_call only
  warp: boolean;
  return: boolean;
  global: boolean;
}
