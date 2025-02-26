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

Blockly.Blocks['math_angle'] = {
  init: function() {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_angle',
        name: 'NUM',
        value: 90
      }],
      extensions: ['output_number']
    });
  }
};

Blockly.Blocks['matrix'] = {
  init: function() {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_matrix',
        name: 'MATRIX'
      }],
      extensions: ['output_number']
    });
  }
};

Blockly.Blocks['test_field_angle'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: 'angle %1',
      args0: [{
        type: 'input_value',
        name: 'DEGREES'
      }],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

Blockly.Blocks['test_field_matrix'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: 'matrix %1',
      args0: [{
        type: 'input_value',
        name: 'MATRIX'
      }],
      extensions: ['colours_pen', 'shape_statement']
    });
  }
};
