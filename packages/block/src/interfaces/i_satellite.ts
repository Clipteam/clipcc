/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ISatellite {
  /**
   * True if the block is a visual part owned by its parent block.
   */
  satellite: boolean;
}

/**
 * Returns whether the given object is an ISatellite.
 * @param obj The object to decide.
 * @returns True if obj is an ISatellite.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isSatellite(obj: any): obj is ISatellite {
  return obj && typeof obj.satellite === 'boolean';
}
