/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IDynamicDeletable {
  /**
   * Check whether the block is deletable currently, which might be useful for
   * alerting users when deleting the block.
   * @param quiet True to not make any observable effects.
   * @returns True if the block is deletable.
   */
  checkDeletable(quiet: boolean): boolean;
}

/**
 * Returns whether the given object is an IDynamicDeletable or not.
 * @param obj The object to decide.
 * @returns True if obj is IDynamicDeletable
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isDynamicDeletable(obj: any): obj is IDynamicDeletable {
  return obj && typeof obj.checkDeletable === 'function';
}
