/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';

Blockly.Blocks['test_add'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: 'add %1 %2',
      args0: [{
        type: 'input_value',
        name: 'NUM1'
      }, {
        type: 'input_value',
        name: 'NUM2'
      }],
      extensions: ['colours_operators', 'output_number']
    });
  }
};
