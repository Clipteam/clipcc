/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Blockly from 'blockly/core';
import * as Constants from '../constants';

/* Colour Blocks */

/**
 * Pick a random colour.
 * @returns #RRGGBB for random colour.
 */
function randomColour(): string {
  const num = Math.floor(Math.random() * Math.pow(2, 24));
  return '#' + ('00000' + num.toString(16)).substr(-6);
}

/**
 * Block for colour picker.
 */
Blockly.Blocks['colour_picker'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_colour_slider',
        name: 'COLOUR',
        colour: randomColour()
      }],
      outputShape: Constants.OUTPUT_SHAPE_ROUND,
      output: 'Colour'
    });
  }
};

/* Math Blocks */

/**
 * Block for generic numeric value.
 */
Blockly.Blocks['math_number'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_number',
        name: 'NUM',
        value: '0'
      }],
      output: 'Number',
      outputShape: Constants.OUTPUT_SHAPE_ROUND,
      extensions: ['colours_textfield']
    });
  }
};

/**
 * Block for integer value (no decimal, + or -).
 */
Blockly.Blocks['math_integer'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_number',
        name: 'NUM',
        precision: 1
      }],
      output: 'Number',
      outputShape: Constants.OUTPUT_SHAPE_ROUND,
      extensions: ['colours_textfield']
    });
  }
};

/**
 * Block for whole number value, no negatives or decimals.
 */
Blockly.Blocks['math_whole_number'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_number',
        name: 'NUM',
        min: 0,
        precision: 1
      }],
      output: 'Number',
      outputShape: Constants.OUTPUT_SHAPE_ROUND,
      extensions: ['colours_textfield']
    });
  }
};

/**
 * Block for positive number value, with decimal.
 */
Blockly.Blocks['math_positive_number'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_number',
        name: 'NUM',
        min: 0
      }],
      output: 'Number',
      outputShape: Constants.OUTPUT_SHAPE_ROUND,
      extensions: ['colours_textfield']
    });
  }
};

/**
 * Block for angle picker.
 */
Blockly.Blocks['math_angle'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_angle',
        name: 'NUM',
        value: 90
      }],
      output: 'Number',
      outputShape: Constants.OUTPUT_SHAPE_ROUND,
      extensions: ['colours_textfield']
    });
  }
};

/* Matrix Blocks */

/**
 * Block for matrix value.
 */
Blockly.Blocks['matrix'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_matrix',
        name: 'MATRIX'
      }],
      outputShape: Constants.OUTPUT_SHAPE_ROUND,
      output: 'Number',
      extensions: ['colours_textfield']
    });
  }
};

/* Note Blocks */

/**
 * Block for musical note value.
 */
Blockly.Blocks['note'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_note',
        name: 'NOTE',
        note: 60
      }],
      outputShape: Constants.OUTPUT_SHAPE_ROUND,
      output: 'Number',
      extensions: ['colours_textfield']
    });
  }
};

/* Text Blocks */

/**
 * Block for text value.
 */
Blockly.Blocks['text'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_input',
        name: 'TEXT'
      }],
      output: 'String',
      outputShape: Constants.OUTPUT_SHAPE_ROUND,
      extensions: ['colours_textfield']
    });
  }
};

/* Special Blocks */

interface UnknownBlock extends Blockly.BlockSvg {
  blockInfo: Record<string, unknown>;
  placeholderText: string;

  updateDisplay_: () => void;
  removeAllInputs: () => void;
  updateShape_: () => void;
  setPlaceholderText_: (text: string) => void;
}

interface UnknownBlockExtraState {
  blockInfo: Record<string, unknown>;
  placeholderText: string;
}

/**
 * Placeholder block for non-existing blocks in clipcc-block.
 * It stores the unknown block info and placeholder text in extra state. its shape based on its connection status.
 * So that it won't break the renderer and users can identify the missing blocks.
 * WARNING: this block should only exists in blockly side, VM should never see this block.
 */
Blockly.Blocks['unknown'] = {
  init: function(this: UnknownBlock) {
    this.jsonInit({
      extensions: ['colours_unknown']
    });
    this.placeholderText = '';

    this.blockInfo = {};
    this.updateDisplay_();
    this.setMovable(false);
    console.log('init');
  },
  updateDisplay_: function(this: UnknownBlock) {
    this.removeAllInputs();
    this.updateShape_();
    this.setPlaceholderText_(this.placeholderText);
  },
  removeAllInputs(this: UnknownBlock) {
    // Delete inputs directly instead of with block.removeInput to avoid splicing
    // out of the input list at every index.
    for (const input of this.inputList) {
      input.dispose();
    }
    this.inputList = [];
  },
  updateShape_: function(this: UnknownBlock) {
    this.setOutputShape(Constants.OUTPUT_SHAPE_NORMAL);
    this.setOutput(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  },
  setPlaceholderText_: function(this: UnknownBlock, text: string) {
    this.appendDummyInput().appendField(text);
  },
  saveExtraState: function(this: UnknownBlock): UnknownBlockExtraState {
    return {
      blockInfo: this.blockInfo,
      placeholderText: this.placeholderText
    };
  },
  loadExtraState: function(this: UnknownBlock, state: UnknownBlockExtraState) {
    this.blockInfo = state.blockInfo;
    this.placeholderText = state.placeholderText;
    this.updateDisplay_();
  }
} as UnknownBlock;
