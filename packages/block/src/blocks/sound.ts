/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2016 Massachusetts Institute of Technology
 * All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Blockly from 'blockly/core';

/**
 * Sound effects drop-down menu.
 */
Blockly.Blocks['sound_sounds_menu'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_dropdown',
        name: 'SOUND_MENU',
        options: [
          ['1', '0'],
          ['2', '1'],
          ['3', '2'],
          ['4', '3'],
          ['5', '4'],
          ['6', '5'],
          ['7', '6'],
          ['8', '7'],
          ['9', '8'],
          ['10', '9']
        ]
      }],
      extensions: ['colours_sounds', 'output_string']
    });
  }
};

/**
 * Block to play sound.
 */
Blockly.Blocks['sound_play'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SOUND_PLAY,
      args0: [{
        type: 'input_value',
        name: 'SOUND_MENU'
      }],
      extensions: ['colours_sounds', 'shape_statement']
    });
  }
};

/**
 * Block to play sound until done.
 */
Blockly.Blocks['sound_playuntildone'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SOUND_PLAYUNTILDONE,
      args0: [
        {
          type: 'input_value',
          name: 'SOUND_MENU'
        }
      ],
      extensions: ['colours_sounds', 'shape_statement']
    });
  }
};

/**
 * Block to stop all sounds
 */
Blockly.Blocks['sound_stopallsounds'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SOUND_STOPALLSOUNDS,
      extensions: ['colours_sounds', 'shape_statement']
    });
  }
};

/**
 * Block to set the audio effect
 */
Blockly.Blocks['sound_seteffectto'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SOUND_SETEFFECTO,
      args0: [
        {
          type: 'field_dropdown',
          name: 'EFFECT',
          options: [
            [Blockly.Msg.SOUND_EFFECTS_PITCH, 'PITCH'],
            [Blockly.Msg.SOUND_EFFECTS_PAN, 'PAN']
          ]
        },
        {
          type: 'input_value',
          name: 'VALUE'
        }
      ],
      extensions: ['colours_sounds', 'shape_statement']
    });
  }
};

/**
 * Block to change the audio effect
 */
Blockly.Blocks['sound_changeeffectby'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SOUND_CHANGEEFFECTBY,
      args0: [
        {
          type: 'field_dropdown',
          name: 'EFFECT',
          options: [
            [Blockly.Msg.SOUND_EFFECTS_PITCH, 'PITCH'],
            [Blockly.Msg.SOUND_EFFECTS_PAN, 'PAN']
          ]
        },
        {
          type: 'input_value',
          name: 'VALUE'
        }
      ],
      extensions: ['colours_sounds', 'shape_statement']
    });
  }
};

/**
 * Block to clear audio effects
 */
Blockly.Blocks['sound_cleareffects'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SOUND_CLEAREFFECTS,
      extensions: ['colours_sounds', 'shape_statement']
    });
  }
};

/**
 * Block to change the sprite's volume by a certain value
 */
Blockly.Blocks['sound_changevolumeby'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SOUND_CHANGEVOLUMEBY,
      args0: [{
        type: 'input_value',
        name: 'VOLUME'
      }],
      extensions: ['colours_sounds', 'shape_statement']
    });
  }
};

/**
 * Block to set the sprite's volume to a certain percent
 */
Blockly.Blocks['sound_setvolumeto'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SOUND_SETVOLUMETO,
      args0: [{
        type: 'input_value',
        name: 'VOLUME'
      }],
      extensions: ['colours_sounds', 'shape_statement']
    });
  }
};

/**
 * Block to report volume
 */
Blockly.Blocks['sound_volume'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SOUND_VOLUME,
      checkboxInFlyout: true,
      extensions: ['colours_sounds', 'output_number']
    });
  }
};
