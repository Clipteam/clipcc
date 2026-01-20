/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {Colours} from './theme';

/**
 * Builds the SVG filter for glowing blocks.
 * @param workspace The workspace to build the filter in.
 */
export function buildGlowFilter(workspace: Blockly.WorkspaceSvg) {
  const svg = workspace.getParentSvg();
  const defs = Blockly.utils.dom.createSvgElement(
    Blockly.utils.Svg.DEFS,
    {},
    svg
  );
  // Using a dilate distorts the block shape.
  // Instead use a gaussian blur, and then set all alpha to 1 with a transfer.
  const stackGlowFilter = Blockly.utils.dom.createSvgElement(
    'filter',
    {
      id: 'blocklyStackGlowFilter',
      height: '160%',
      width: '180%',
      y: '-30%',
      x: '-40%'
    },
    defs
  );
  Blockly.utils.dom.createSvgElement(
    'feGaussianBlur',
    {
      in: 'SourceGraphic',
      stdDeviation: Colours.stackGlowSize as number
    },
    stackGlowFilter
  );
  // Set all gaussian blur pixels to 1 opacity before applying flood
  const componentTransfer = Blockly.utils.dom.createSvgElement(
    'feComponentTransfer',
    {result: 'outBlur'},
    stackGlowFilter
  );
  Blockly.utils.dom.createSvgElement(
    'feFuncA',
    {
      type: 'table',
      tableValues: '0' + ' 1'.repeat(16)
    },
    componentTransfer
  );
  // Color the highlight
  Blockly.utils.dom.createSvgElement(
    'feFlood',
    {
      'flood-color': Colours.stackGlow as string,
      'flood-opacity': Colours.stackGlowOpacity as number,
      result: 'outColor'
    },
    stackGlowFilter
  );
  Blockly.utils.dom.createSvgElement(
    'feComposite',
    {
      in: 'outColor',
      in2: 'outBlur',
      operator: 'in',
      result: 'outGlow'
    },
    stackGlowFilter
  );
  Blockly.utils.dom.createSvgElement(
    'feComposite',
    {
      in: 'SourceGraphic',
      in2: 'outGlow',
      operator: 'over'
    },
    stackGlowFilter
  );
}

/**
 * Set of currently glowing blocks.
 */
const glowingBlocks: Set<string> = new Set();

/**
 * Glow/unglow a stack in the workspace.
 * @param id ID of block which starts the stack.
 * @param isGlowingStack Whether to glow the stack.
 * @param workspace The workspace containing the stack. If not provided, the main workspace is used.
 */
export function glowStack(
  id: string,
  isGlowingStack: boolean,
  workspace?: Blockly.WorkspaceSvg
): void {
  let block: Blockly.BlockSvg | null;
  if (!workspace) {
    workspace = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
    block = workspace.getBlockById(id);
    if (!block) {
      workspace = workspace.getFlyout()?.getWorkspace();
      block = workspace?.getBlockById(id) ?? null;
    }
  } else {
    block = workspace.getBlockById(id) as Blockly.BlockSvg;
  }

  if (!block?.rendered) {
    // Scratch throw an error here; but for a visual effect, better to just log it.
    console.error(`Tried to glow stack on block ${id} that does not exist or not rendered.`);
    return;
  }

  const svgRoot = block.getSvgRoot();
  if (isGlowingStack) {
    if (glowingBlocks.has(id)) return;
    glowingBlocks.add(id);
    svgRoot!.setAttribute('filter', 'url(#blocklyStackGlowFilter)');
  } else {
    glowingBlocks.delete(id);
    svgRoot!.removeAttribute('filter');
  }
}
