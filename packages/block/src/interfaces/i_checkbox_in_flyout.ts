/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ICheckboxInFlyout {
  /**
   * Whether a checkbox should be shown when the block is in flyout.
   */
  checkboxInFlyout: boolean;
}

/**
 * Returns whether the given object is an ICheckboxInFlyout or not.
 * @param obj The object to decide.
 * @returns True if obj is ICheckboxInFlyout
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isCheckboxInFlyout(obj: any): obj is ICheckboxInFlyout {
  return obj && typeof obj.checkboxInFlyout === 'boolean';
}
