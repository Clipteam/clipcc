/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Blockly from 'blockly/core';

export interface IBlockTemplate {
  /**
   * The type of the owning block. The block behaves like a template block
   * while it is a direct child of that type of block.
   */
  templateOf: string;
}

/**
 * Returns whether the given object is an IBlockTemplate.
 * @param obj The object to decide.
 * @returns True if obj is an IBlockTemplate.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isBlockTemplate(obj: any): obj is IBlockTemplate {
  return obj && typeof obj.templateOf === 'string';
}

/**
 * Returns whether the given block is currently acting as a template, i.e. it
 * is a template block that is still attached to its owning block.
 * @param block The block to decide.
 * @returns True if the block is an active template.
 */
export function isActiveTemplateBlock(
  block: Blockly.Block & Partial<IBlockTemplate>
): block is Blockly.Block & IBlockTemplate {
  return isBlockTemplate(block) && block.getParent()?.type === block.templateOf;
}
