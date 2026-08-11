/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IBlockTemplate {
  /**
   * True if the block should be duplicated before dragging while it is used as
   * a template.
   */
  blockTemplate: boolean;
}

/**
 * Returns whether the given object is an IBlockTemplate.
 * @param obj The object to decide.
 * @returns True if obj is an IBlockTemplate.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isBlockTemplate(obj: any): obj is IBlockTemplate {
  return obj && typeof obj.blockTemplate === 'boolean';
}
