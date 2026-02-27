/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IInvisibleIcon {
  /**
   * True if the icon shouldn't be rendered, but it has offsetInBlock when
   * drawing. The offsetInBlock.x is the left side (right side if RTL) of the
   * first input row, and offsetInBlock.y is the centerline of that row.
   */
  invisible: boolean;
}

/**
 * Returns whether the given object is an IInvisibleIcon or not.
 * @param obj The object to decide.
 * @returns True if obj is IInvisibleIcon
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isInvisibleIcon(obj: any): obj is IInvisibleIcon {
  return obj && typeof obj.invisible === 'boolean';
}
