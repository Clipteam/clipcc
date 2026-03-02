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
import {getWorkspaceOptionsFromBlock} from '../utils';

/**
 * Block to move steps.
 */
Blockly.Blocks['motion_movesteps'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_MOVESTEPS,
      args0: [
        {
          type: 'input_value',
          name: 'STEPS'
        }
      ],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Block to turn right.
 */
Blockly.Blocks['motion_turnright'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_TURNRIGHT,
      args0: [
        {
          type: 'field_image',
          src: getWorkspaceOptionsFromBlock(this).pathToMedia + 'rotate-right.svg',
          width: 24,
          height: 24
        },
        {
          type: 'input_value',
          name: 'DEGREES'
        }
      ],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Block to turn left.
 */
Blockly.Blocks['motion_turnleft'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_TURNLEFT,
      args0: [
        {
          type: 'field_image',
          src: getWorkspaceOptionsFromBlock(this).pathToMedia + 'rotate-left.svg',
          width: 24,
          height: 24
        },
        {
          type: 'input_value',
          name: 'DEGREES'
        }
      ],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Block to point in direction.
 */
Blockly.Blocks['motion_pointindirection'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_POINTINDIRECTION,
      args0: [
        {
          type: 'input_value',
          name: 'DIRECTION'
        }
      ],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Point towards drop-down menu.
 */
Blockly.Blocks['motion_pointtowards_menu'] = {
  init: function() {
    this.jsonInit({
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'TOWARDS',
          options: [
            [Blockly.Msg.MOTION_POINTTOWARDS_POINTER, '_mouse_'],
            [Blockly.Msg.MOTION_POINTTOWARDS_RANDOM, '_random_']
          ]
        }
      ],
      extensions: ['colours_motion', 'output_string']
    });
  }
};

/**
 * Block to point in direction.
 */
Blockly.Blocks['motion_pointtowards'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_POINTTOWARDS,
      args0: [
        {
          type: 'input_value',
          name: 'TOWARDS'
        }
      ],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Go to drop-down menu.
 */
Blockly.Blocks['motion_goto_menu'] = {
  init: function() {
    this.jsonInit({
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'TO',
          options: [
            [Blockly.Msg.MOTION_GOTO_POINTER, '_mouse_'],
            [Blockly.Msg.MOTION_GOTO_RANDOM, '_random_']
          ]
        }
      ],
      extensions: ['colours_motion', 'output_string']
    });
  }
};

/**
 * Block to go to X, Y.
 */
Blockly.Blocks['motion_gotoxy'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_GOTOXY,
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
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Block to go to a menu item.
 */
Blockly.Blocks['motion_goto'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_GOTO,
      args0: [
        {
          type: 'input_value',
          name: 'TO'
        }
      ],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Block to glide for a specified time.
 */
Blockly.Blocks['motion_glidesecstoxy'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_GLIDESECSTOXY,
      args0: [
        {
          type: 'input_value',
          name: 'SECS'
        },
        {
          type: 'input_value',
          name: 'X'
        },
        {
          type: 'input_value',
          name: 'Y'
        }
      ],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Glide to drop-down menu
 */
Blockly.Blocks['motion_glideto_menu'] = {
  init: function() {
    this.jsonInit({
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'TO',
          options: [
            [Blockly.Msg.MOTION_GLIDETO_POINTER, '_mouse_'],
            [Blockly.Msg.MOTION_GLIDETO_RANDOM, '_random_']
          ]
        }
      ],
      extensions: ['colours_motion', 'output_string']
    });
  }
};

/**
 * Block to glide to a menu item
 */
Blockly.Blocks['motion_glideto'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_GLIDETO,
      args0: [
        {
          type: 'input_value',
          name: 'SECS'
        },
        {
          type: 'input_value',
          name: 'TO'
        }
      ],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Block to change X.
 */
Blockly.Blocks['motion_changexby'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_CHANGEXBY,
      args0: [
        {
          type: 'input_value',
          name: 'DX'
        }
      ],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Block to set X.
 */
Blockly.Blocks['motion_setx'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_SETX,
      args0: [
        {
          type: 'input_value',
          name: 'X'
        }
      ],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Block to change Y.
 */
Blockly.Blocks['motion_changeyby'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_CHANGEYBY,
      args0: [
        {
          type: 'input_value',
          name: 'DY'
        }
      ],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Block to set Y.
 */
Blockly.Blocks['motion_sety'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_SETY,
      args0: [
        {
          type: 'input_value',
          name: 'Y'
        }
      ],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Block to bounce on edge.
 */
Blockly.Blocks['motion_ifonedgebounce'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_IFONEDGEBOUNCE,
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Block to set rotation style.
 */
Blockly.Blocks['motion_setrotationstyle'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_SETROTATIONSTYLE,
      args0: [
        {
          type: 'field_dropdown',
          name: 'STYLE',
          options: [
            [Blockly.Msg.MOTION_SETROTATIONSTYLE_LEFTRIGHT, 'left-right'],
            [Blockly.Msg.MOTION_SETROTATIONSTYLE_DONTROTATE, 'don\'t rotate'],
            [Blockly.Msg.MOTION_SETROTATIONSTYLE_ALLAROUND, 'all around']
          ]
        }
      ],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Block to report X.
 */
Blockly.Blocks['motion_xposition'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_XPOSITION,
      extensions: ['colours_motion', 'output_number', 'monitor_block']
    });
  }
};

/**
 * Block to report Y.
 */
Blockly.Blocks['motion_yposition'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_YPOSITION,
      extensions: ['colours_motion', 'output_number', 'monitor_block']
    });
  }
};

/**
 * Block to report direction.
 */
Blockly.Blocks['motion_direction'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_DIRECTION,
      extensions: ['colours_motion', 'output_number', 'monitor_block']
    });
  }
};

/**
 * Block to scroll the stage right. Does not actually do anything. This is
 * an obsolete block that is implemented for compatibility with Scratch 2.0
 * projects.
 */
Blockly.Blocks['motion_scroll_right'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_SCROLLRIGHT,
      args0: [
        {
          type: 'input_value',
          name: 'DISTANCE'
        }
      ],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Block to scroll the stage up. Does not actually do anything. This is an
 * obsolete block that is implemented for compatibility with Scratch 2.0
 * projects.
 */
Blockly.Blocks['motion_scroll_up'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_SCROLLUP,
      args0: [
        {
          type: 'input_value',
          name: 'DISTANCE'
        }
      ],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Block to change the stage's scrolling alignment. Does not actually do
 * anything. This is an obsolete block that is implemented for compatibility
 * with Scratch 2.0 projects.
 */
Blockly.Blocks['motion_align_scene'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_ALIGNSCENE,
      args0: [
        {
          type: 'field_dropdown',
          name: 'ALIGNMENT',
          options: [
            [Blockly.Msg.MOTION_ALIGNSCENE_BOTTOMLEFT, 'bottom-left'],
            [Blockly.Msg.MOTION_ALIGNSCENE_BOTTOMRIGHT, 'bottom-right'],
            [Blockly.Msg.MOTION_ALIGNSCENE_MIDDLE, 'middle'],
            [Blockly.Msg.MOTION_ALIGNSCENE_TOPLEFT, 'top-left'],
            [Blockly.Msg.MOTION_ALIGNSCENE_TOPRIGHT, 'top-right']
          ]
        }
      ],
      extensions: ['colours_motion', 'shape_statement']
    });
  }
};

/**
 * Block to report the stage's scroll position's X value. Does not actually
 * do anything. This is an obsolete block that is implemented for
 * compatibility with Scratch 2.0 projects.
 */
Blockly.Blocks['motion_xscroll'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_XSCROLL,
      extensions: ['colours_motion', 'output_number']
    });
  }
};

/**
 * Block to report the stage's scroll position's Y value. Does not actually
 * do anything. This is an obsolete block that is implemented for
 * compatibility with Scratch 2.0 projects.
 */
Blockly.Blocks['motion_yscroll'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.MOTION_YSCROLL,
      extensions: ['colours_motion', 'output_number']
    });
  }
};
