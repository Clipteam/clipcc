/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { FieldButton } from '../fields/button';

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
      extensions: ['colours_operators', 'shape_statement']
    });
  }
};

Blockly.Blocks['test_str'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: 'text %1 %2',
      args0: [{
        type: 'input_value',
        name: 'NUM1'
      }, {
        type: 'input_value',
        name: 'NUM2'
      }],
      extensions: ['colours_operators', 'shape_statement']
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

Blockly.Blocks['test_field_colour_slider'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: 'color %1',
      args0: [{
        type: 'input_value',
        name: 'COLOR'
      }],
      extensions: ['colours_sensing', 'shape_statement']
    });
  }
};

Blockly.Blocks['test_field_note'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: 'note %1',
      args0: [{
        type: 'input_value',
        name: 'NOTE'
      }],
      extensions: ['colours_sounds', 'shape_statement']
    });
  }
};

Blockly.Blocks['test_field_button'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: 'button',
      extensions: ['colours_looks', 'shape_statement']
    });
    this.appendDummyInput('DUMMY_INPUT').appendField(new FieldButton(
      '/media/icons/plus.svg',
      (field: FieldButton) => {
        console.log('onclick plus');
        this.getInput('DUMMY_INPUT')?.removeField('BUTTON_PLUS');
      }
    ), 'BUTTON_PLUS').appendField(new FieldButton(
      '/media/icons/minus.svg',
      (field: FieldButton) => {
        console.log('onclick minus');
      }
    ), 'BUTTON_MINUS');
  }
};
