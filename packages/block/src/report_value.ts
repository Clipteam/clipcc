
/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {Colours} from './theme';
import styles from './styles/report_value.css';

/**
 * Get the first available field in a block, or null if none exist.
 * @param block The block to search.
 * @returns The first field found, or null if none exist.
 */
function getFirstAvailableField(
  block: Blockly.BlockSvg
): Blockly.Field | null {
  for (const input of block.inputList) {
    for (const field of input.fieldRow) {
      return field;
    }
  }
  return null;
}

/**
 * Visually report a value associated with a block.
 * In Scratch, appears as a pop-up next to the block when a reporter block is clicked.
 * @param id ID of block to report associated value.
 * @param value String value to visually report.
 * @param workspace Optional workspace the block is in. Use main workspace if not provided.
 */
export function reportValue(id: string, value: string, workspace?: Blockly.WorkspaceSvg) {
  const ws = workspace ?? (Blockly.getMainWorkspace() as Blockly.WorkspaceSvg);
  let block = ws.getBlockById(id);
  if (!workspace && !block) {
    block = ws.getFlyout()?.getWorkspace().getBlockById(id) as Blockly.BlockSvg | null;
  }
  if (!block) {
    throw new Error(`Tried to report value on block ${id} that does not exist.`);
  }

  const field = getFirstAvailableField(block);
  if (!field) return;

  Blockly.DropDownDiv.hideWithoutAnimation();
  Blockly.DropDownDiv.clearContent();
  const contentDiv = Blockly.DropDownDiv.getContentDiv();
  const valueReportBox = document.createElement('div');
  valueReportBox.setAttribute('class', 'valueReportBox');
  if (value.startsWith('data:image/')) {
    const img = document.createElement('img');
    img.src = value;
    valueReportBox.appendChild(img);
  } else {
    valueReportBox.innerText = value;
  }
  contentDiv.appendChild(valueReportBox);
  Blockly.DropDownDiv.setColour(
    Colours.valueReportBackground as string,
    Colours.valueReportBorder as string
  );

  Blockly.DropDownDiv.showPositionedByBlock(field, block);
}

Blockly.Css.register(styles);
