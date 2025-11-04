/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IShadowTemplate {
  /**
   * True if the block should be duplicated before dragging if the block is a
   * shadow block.
   */
  shadowTemplate: boolean;
}

/**
 * Returns whether the given object is an IShadowTemplate or not.
 * @param obj The object to decide.
 * @returns True if obj is IShadowTemplate
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isShadowTemplate(obj: any): obj is IShadowTemplate {
  return obj && typeof obj.shadowTemplate === 'boolean';
}
