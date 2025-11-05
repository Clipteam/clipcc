/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * Define a test block with an input.
 * @param name Name for block prototype.
 */
export function defineTestBlockInput(name: string = 'test_block_input') {
  Blockly.defineBlocksWithJsonArray([
    {
      'type': name,
      'message0': '%1',
      'args0': [
        {
          'type': 'input_value',
          'name': 'INPUT',
        },
      ],
      'output': null,
    },
  ]);
}
