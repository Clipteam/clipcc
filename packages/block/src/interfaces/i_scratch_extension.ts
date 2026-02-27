/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IScratchExtensionBlock {
  /**
   * True if the block is a scratch extension block. The block should be
   * rendered differently.
   */
  isScratchExtension: boolean;
}

/**
 * Returns whether the given object is an IScratchExtensionBlock or not.
 * @param obj The object to decide.
 * @returns True if obj is IScratchExtensionBlock
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isScratchExtensionBlock(obj: any): obj is IScratchExtensionBlock {
  return obj && typeof obj.isScratchExtension === 'boolean';
}
