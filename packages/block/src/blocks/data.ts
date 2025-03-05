/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2016 Massachusetts Institute of Technology
 * All rights reserved.
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

/**
 * Block of Variables
 */
Blockly.Blocks['data_variable'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      lastDummyAlign0: 'CENTRE',
      args0: [{
        type: 'field_variable_getter',
        text: '',
        name: 'VARIABLE',
        variableType: ''
      }],
      checkboxInFlyout: true,
      extensions: ['colours_data', 'output_string']
    });
  }
};

/**
 * Block to set variable to a certain value
 */
Blockly.Blocks['data_setvariableto'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_SETVARIABLETO,
      args0: [{
        type: 'field_variable',
        name: 'VARIABLE'
      }, {
        type: 'input_value',
        name: 'VALUE'
      }],
      extensions: ['colours_data', 'shape_statement']
    });
  }
};

/**
 * Block to change variable by a certain value
 */
Blockly.Blocks['data_changevariableby'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_CHANGEVARIABLEBY,
      args0: [{
        type: 'field_variable',
        name: 'VARIABLE'
      }, {
        type: 'input_value',
        name: 'VALUE'
      }],
      extensions: ['colours_data', 'shape_statement']
    });
  }
};

/**
 * Block to show a variable
 */
Blockly.Blocks['data_showvariable'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_SHOWVARIABLE,
      args0: [{
        type: 'field_variable',
        name: 'VARIABLE'
      }],
      previousStatement: null,
      nextStatement: null,
      extensions: ['colours_data']
    });
  }
};

/**
 * Block to hide a variable
 */
Blockly.Blocks['data_hidevariable'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_HIDEVARIABLE,
      args0: [{
        type: 'field_variable',
        name: 'VARIABLE'
      }],
      previousStatement: null,
      nextStatement: null,
      extensions: ['colours_data']
    });
  }
};
