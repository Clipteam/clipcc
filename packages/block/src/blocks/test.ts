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
  init: function(this: Blockly.Block) {
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
  init: function(this: Blockly.Block) {
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

/**
 * Pick a random colour.
 * @return {string} #RRGGBB for random colour.
 */
function randomColour() {
  const num = Math.floor(Math.random() * Math.pow(2, 24));
  return '#' + ('00000' + num.toString(16)).substr(-6);
}

Blockly.Blocks['colour_picker'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_colour_slider',
        name: 'COLOUR',
        colour: randomColour()
      }],
      extensions: ['output_number']
    });
    this.setOutput(true, 'Colour');
  }
};

Blockly.Blocks['note'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_note',
        name: 'NOTE',
        note: 60
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
