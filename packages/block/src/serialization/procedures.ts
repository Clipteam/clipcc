/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

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
