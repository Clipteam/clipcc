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
import * as Constants from '../constants';

/**
 * Block to Report if its touching a Object.
 */
Blockly.Blocks['sensing_touchingobject'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_TOUCHINGOBJECT,
      args0: [
        {
          type: 'input_value',
          name: 'TOUCHINGOBJECTMENU'
        }
      ],
      extensions: ['colours_sensing', 'output_boolean']
    });
  }
};

/**
 * 'Touching [Object]' Block Menu.
 */
Blockly.Blocks['sensing_touchingobjectmenu'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'TOUCHINGOBJECTMENU',
          options: [
            [Blockly.Msg.SENSING_TOUCHINGOBJECT_POINTER, '_mouse_'],
            [Blockly.Msg.SENSING_TOUCHINGOBJECT_EDGE, '_edge_']
          ]
        }
      ],
      extensions: ['colours_sensing', 'output_string']
    });
  }
};

/**
 * Block to Report if its touching a certain Color.
 */
Blockly.Blocks['sensing_touchingcolor'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_TOUCHINGCOLOR,
      args0: [
        {
          type: 'input_value',
          name: 'COLOR'
        }
      ],
      extensions: ['colours_sensing', 'output_boolean']
    });
  }
};

/**
 * Block to Report if a color is touching a certain Color.
 */
Blockly.Blocks['sensing_coloristouchingcolor'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_COLORISTOUCHINGCOLOR,
      args0: [
        {
          type: 'input_value',
          name: 'COLOR'
        },
        {
          type: 'input_value',
          name: 'COLOR2'
        }
      ],
      extensions: ['colours_sensing', 'output_boolean']
    });
  }
};

/**
 * Block to Report distance to another Object.
 */
Blockly.Blocks['sensing_distanceto'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_DISTANCETO,
      args0: [
        {
          type: 'input_value',
          name: 'DISTANCETOMENU'
        }
      ],
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * 'Distance to [Object]' Block Menu.
 */
Blockly.Blocks['sensing_distancetomenu'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'DISTANCETOMENU',
          options: [
            [Blockly.Msg.SENSING_DISTANCETO_POINTER, '_mouse_']
          ]
        }
      ],
      extensions: ['colours_sensing', 'output_string']
    });
  }
};

/**
 * Distance between two position.
 */
Blockly.Blocks['sensing_distancebetweenposition'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_DISTANCEBETWEENPOSITION,
      args0: [
        {
          type: 'input_value',
          name: 'X1'
        },
        {
          type: 'input_value',
          name: 'Y1'
        },
        {
          type: 'input_value',
          name: 'X2'
        },
        {
          type: 'input_value',
          name: 'Y2'
        }
      ],
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * Direction between two position.
 */
Blockly.Blocks['sensing_directionbetweenposition'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_DIRECTIONBETWEENPOSITION,
      args0: [
        {
          type: 'input_value',
          name: 'X1'
        },
        {
          type: 'input_value',
          name: 'Y1'
        },
        {
          type: 'input_value',
          name: 'X2'
        },
        {
          type: 'input_value',
          name: 'Y2'
        }
      ],
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * Block to ask a question and wait
 */
Blockly.Blocks['sensing_askandwait'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_ASKANDWAIT,
      args0: [
        {
          type: 'input_value',
          name: 'QUESTION'
        }
      ],
      extensions: ['colours_sensing', 'shape_statement']
    });
  }
};

/**
 * Block to report answer
 */
Blockly.Blocks['sensing_answer'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_ANSWER,
      checkboxInFlyout: true,
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * Block to Report if a key is pressed.
 */
Blockly.Blocks['sensing_keypressed'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_KEYPRESSED,
      args0: [
        {
          type: 'input_value',
          name: 'KEY_OPTION'
        }
      ],
      extensions: ['colours_sensing', 'output_boolean']
    });
  }
};

/**
 * Options for Keys
 */
Blockly.Blocks['sensing_keyoptions'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'KEY_OPTION',
          options: [
            [Blockly.Msg.EVENT_WHENKEYPRESSED_SPACE, 'space'],
            [Blockly.Msg.EVENT_WHENKEYPRESSED_UP, 'up arrow'],
            [Blockly.Msg.EVENT_WHENKEYPRESSED_DOWN, 'down arrow'],
            [Blockly.Msg.EVENT_WHENKEYPRESSED_RIGHT, 'right arrow'],
            [Blockly.Msg.EVENT_WHENKEYPRESSED_LEFT, 'left arrow'],
            [Blockly.Msg.EVENT_WHENKEYPRESSED_ANY, 'any'],
            [Blockly.Msg.EVENT_WHENKEYPRESSED_ENTER, 'enter'],
            ['a', 'a'],
            ['b', 'b'],
            ['c', 'c'],
            ['d', 'd'],
            ['e', 'e'],
            ['f', 'f'],
            ['g', 'g'],
            ['h', 'h'],
            ['i', 'i'],
            ['j', 'j'],
            ['k', 'k'],
            ['l', 'l'],
            ['m', 'm'],
            ['n', 'n'],
            ['o', 'o'],
            ['p', 'p'],
            ['q', 'q'],
            ['r', 'r'],
            ['s', 's'],
            ['t', 't'],
            ['u', 'u'],
            ['v', 'v'],
            ['w', 'w'],
            ['x', 'x'],
            ['y', 'y'],
            ['z', 'z'],
            ['0', '0'],
            ['1', '1'],
            ['2', '2'],
            ['3', '3'],
            ['4', '4'],
            ['5', '5'],
            ['6', '6'],
            ['7', '7'],
            ['8', '8'],
            ['9', '9'],
            ['-', '-'],
            [',', ','],
            ['.', '.'],
            ['`', '`'],
            ['=', '='],
            ['[', '['],
            [']', ']'],
            ['\\', '\\'],
            [';', ';'],
            ['\'', '\''],
            ['/', '/'],
            ['!', '!'],
            ['@', '@'],
            ['#', '#'],
            ['$', '$'],
            ['%', '%'],
            ['^', '^'],
            ['&', '&'],
            ['*', '*'],
            ['(', '('],
            [')', ')'],
            ['_', '_'],
            ['+', '+'],
            ['{', '{'],
            ['}', '}'],
            ['|', '|'],
            [':', ':'],
            ['"', '"'],
            ['?', '?'],
            ['<', '<'],
            ['>', '>'],
            ['~', '~']
          ]
        }
      ],
      extensions: ['colours_sensing', 'output_string']
    });
  }
};

/**
 * Block to Report if the mouse is down.
 */
Blockly.Blocks['sensing_mousedown'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_MOUSEDOWN,
      extensions: ['colours_sensing', 'output_boolean']
    });
  }
};

/**
 * Block to get if the mouse is down.
 */
Blockly.Blocks['sensing_mousepressed'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_MOUSEPRESSED,
      args0: [
        {
          type: 'input_value',
          name: 'MOUSE_OPTION'
        }
      ],
      extensions: ['colours_sensing', 'output_boolean']
    });
  }
};

/**
 * Options for Keys
 */
Blockly.Blocks['sensing_mouseoptions'] = {

  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'MOUSE_OPTION',
          options: [
            [Blockly.Msg.SENSING_MOUSEPRESSED_LEFT, '0'],
            [Blockly.Msg.SENSING_MOUSEPRESSED_MIDDLE, '1'],
            [Blockly.Msg.SENSING_MOUSEPRESSED_RIGHT, '2']
          ]
        }
      ],
      extensions: ['colours_sensing', 'output_string']
    });
  }
};

/**
 * Block to report mouse's x position
 */
Blockly.Blocks['sensing_mousex'] = {

  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_MOUSEX,
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * Block to report mouse's y position
 */
Blockly.Blocks['sensing_mousey'] = {

  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_MOUSEY,
      extensions: ['colours_sensing', 'output_number']
    });
  }
};
/**
 * Block to set drag mode.
 */
Blockly.Blocks['sensing_setdragmode'] = {

  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_SETDRAGMODE,
      args0: [
        {
          type: 'field_dropdown',
          name: 'DRAG_MODE',
          options: [
            [Blockly.Msg.SENSING_SETDRAGMODE_DRAGGABLE, 'draggable'],
            [Blockly.Msg.SENSING_SETDRAGMODE_NOTDRAGGABLE, 'not draggable']
          ]
        }
      ],
      extensions: ['colours_sensing', 'shape_statement']
    });
  }
};

/**
 * Block to report loudness
 */
Blockly.Blocks['sensing_loudness'] = {

  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_LOUDNESS,
      checkboxInFlyout: true,
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * Block to report if the loudness is 'loud' (greater than 10). This is an
 * obsolete block that is implemented for compatibility with Scratch 2.0 and
 * 1.4 projects.
 */
Blockly.Blocks['sensing_loud'] = {

  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_LOUD,
      extensions: ['colours_sensing', 'output_boolean']
    });
  }
};

/**
 * Block to report timer
 */
Blockly.Blocks['sensing_timer'] = {

  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_TIMER,
      checkboxInFlyout: true,
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * Block to reset timer
 */
Blockly.Blocks['sensing_resettimer'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_RESETTIMER,
      extensions: ['colours_sensing', 'shape_statement']
    });
  }
};

/**
 * '* of _' object menu.
 */
Blockly.Blocks['sensing_of_object_menu'] = {

  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'OBJECT',
          options: [
            ['Sprite1', 'Sprite1'],
            ['Stage', '_stage_']
          ]
        }
      ],
      extensions: ['colours_sensing', 'output_string']
    });
  }
};


/**
 * Block to report properties of sprites.
 */
Blockly.Blocks['sensing_of'] = {

  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_OF,
      args0: [
        {
          type: 'field_dropdown',
          name: 'PROPERTY',
          options: [
            [Blockly.Msg.SENSING_OF_XPOSITION, 'x position'],
            [Blockly.Msg.SENSING_OF_YPOSITION, 'y position'],
            [Blockly.Msg.SENSING_OF_DIRECTION, 'direction'],
            [Blockly.Msg.SENSING_OF_COSTUMENUMBER, 'costume #'],
            [Blockly.Msg.SENSING_OF_COSTUMENAME, 'costume name'],
            [Blockly.Msg.SENSING_OF_SIZE, 'size'],
            [Blockly.Msg.SENSING_OF_VOLUME, 'volume'],
            [Blockly.Msg.SENSING_OF_BACKDROPNUMBER, 'backdrop #'],
            [Blockly.Msg.SENSING_OF_BACKDROPNAME, 'backdrop name']
          ]
        },
        {
          type: 'input_value',
          name: 'OBJECT'
        }
      ],
      output: true,
      outputShape: Constants.OUTPUT_SHAPE_ROUND,
      extensions: ['colours_sensing']
    });
  }
};

/**
 * Block to Report the current option.
 */
Blockly.Blocks['sensing_current'] = {

  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_CURRENT,
      args0: [
        {
          type: 'field_dropdown',
          name: 'CURRENTMENU',
          options: [
            [Blockly.Msg.SENSING_CURRENT_YEAR, 'YEAR'],
            [Blockly.Msg.SENSING_CURRENT_MONTH, 'MONTH'],
            [Blockly.Msg.SENSING_CURRENT_DATE, 'DATE'],
            [Blockly.Msg.SENSING_CURRENT_DAYOFWEEK, 'DAYOFWEEK'],
            [Blockly.Msg.SENSING_CURRENT_HOUR, 'HOUR'],
            [Blockly.Msg.SENSING_CURRENT_MINUTE, 'MINUTE'],
            [Blockly.Msg.SENSING_CURRENT_SECOND, 'SECOND']
          ]
        }
      ],
      checkboxInFlyout: true,
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * Block to report days since 2000
 */
Blockly.Blocks['sensing_dayssince2000'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_DAYSSINCE2000,
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * Block to report user's username
 */
Blockly.Blocks['sensing_username'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_USERNAME,
      checkboxInFlyout: true,
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * Block to report user's ID. Does not actually do anything. This is an
 * obsolete block that is implemented for compatibility with Scratch 2.0
 * projects.
 */
Blockly.Blocks['sensing_userid'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_USERID,
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * Block to report user's operating system
 */
Blockly.Blocks['sensing_operatingsystem'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_OPERATINGSYSTEM,
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * Block to return clipcc version
 */
Blockly.Blocks['sensing_clipcc_version'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_CLIPCC_VERSION,
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * Block to report joystick's x position
 */
Blockly.Blocks['sensing_joystickx'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_JOYSTICKX,
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * Block to report joystick's y position
 */
Blockly.Blocks['sensing_joysticky'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_JOYSTICKY,
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * Block to report joystick's distance
 */
Blockly.Blocks['sensing_joystick_distance'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_JOYSTICK_DISTANCE,
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * Color at specific position.
 */
Blockly.Blocks['sensing_colorat'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_COLORAT,
      args0: [
        {
          type: 'input_value',
          name: 'X'
        },
        {
          type: 'input_value',
          name: 'Y'
        }
      ],
      extensions: ['colours_sensing', 'output_number']
    });
  }
};

/**
 * Block to report whether it is in turbo mode
 */
Blockly.Blocks['sensing_isturbomode'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_ISTURBOMODE,
      extensions: ['colours_sensing', 'output_boolean']
    });
  }
};

/**
 * Block to turn on turbo mode
 */
Blockly.Blocks['sensing_turnonturbomode'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_TURNONTURBOMODE,
      extensions: ['colours_sensing', 'shape_statement']
    });
  }
};

/**
 * Block to turn off turbo mode
 */
Blockly.Blocks['sensing_turnoffturbomode'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.SENSING_TURNOFFTURBOMODE,
      extensions: ['colours_sensing', 'shape_statement']
    });
  }
};
