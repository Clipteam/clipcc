/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2016 Google Inc.
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

/**
 * @fileoverview Blockly constants.
 * @author fenichel@google.com (Rachel Fenichel)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.constants');


/**
 * Number of pixels the mouse must move before a drag starts.
 */
export const DRAG_RADIUS = 3;

/**
 * Number of pixels the mouse must move before a drag/scroll starts from the
 * flyout.  Because the drag-intention is determined when this is reached, it is
 * larger than DRAG_RADIUS so that the drag-direction is clearer.
 */
export const FLYOUT_DRAG_RADIUS = 10;

/**
 * Maximum misalignment between connections for them to snap together.
 */
export const SNAP_RADIUS = 48;

/**
 * Maximum misalignment between connections for them to snap together,
 * when a connection is already highlighted.
 */
export const CONNECTING_SNAP_RADIUS = 68;

/**
 * How much to prefer staying connected to the current connection over moving to
 * a new connection.  The current previewed connection is considered to be this
 * much closer to the matching connection on the block than it actually is.
 */
export const CURRENT_CONNECTION_PREFERENCE = 20;

/**
 * Delay in ms between trigger and bumping unconnected block out of alignment.
 */
export const BUMP_DELAY = 0;

/**
 * Number of characters to truncate a collapsed block to.
 */
export const COLLAPSE_CHARS = 30;

/**
 * Length in ms for a touch to become a long press.
 */
export const LONGPRESS = 750;

/**
 * Distance to scroll when a mouse wheel event is received and its delta mode
 * is line (0x1) instead of pixel (0x0). In these cases, a single "scroll" has
 * a delta of 1, which makes the workspace scroll very slowly (just one pixel).
 * To compensate, that delta is multiplied by this value.
 * @const
 * @package
 */
export const LINE_SCROLL_MULTIPLIER = 15;

/**
 * Prevent a sound from playing if another sound preceded it within this many
 * milliseconds.
 */
export const SOUND_LIMIT = 100;

/**
 * When dragging a block out of a stack, split the stack in two (true), or drag
 * out the block healing the stack (false).
 */
export const DRAG_STACK = true;

/**
 * The richness of block colours, regardless of the hue.
 * Must be in the range of 0 (inclusive) to 1 (exclusive).
 */
export const HSV_SATURATION = 0.45;

/**
 * The intensity of block colours, regardless of the hue.
 * Must be in the range of 0 (inclusive) to 1 (exclusive).
 */
export const HSV_VALUE = 0.65;

/**
 * Sprited icons and images.
 */
export const SPRITE = {
  width: 96,
  height: 124,
  url: 'sprites.png'
};

// Constants below this point are not intended to be changed.

/**
 * Required name space for SVG elements.
 * @const
 */
export const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Required name space for HTML elements.
 * @const
 */
export const HTML_NS = 'http://www.w3.org/1999/xhtml';

/**
 * ENUM for a right-facing value input.  E.g. 'set item to' or 'return'.
 * @const
 */
export const INPUT_VALUE = 1;

/**
 * ENUM for a left-facing value output.  E.g. 'random fraction'.
 * @const
 */
export const OUTPUT_VALUE = 2;

/**
 * ENUM for a down-facing block stack.  E.g. 'if-do' or 'else'.
 * @const
 */
export const NEXT_STATEMENT = 3;

/**
 * ENUM for an up-facing block stack.  E.g. 'break out of loop'.
 * @const
 */
export const PREVIOUS_STATEMENT = 4;

/**
 * ENUM for an dummy input.  Used to add field(s) with no input.
 * @const
 */
export const DUMMY_INPUT = 5;

/**
 * ENUM for left alignment.
 * @const
 */
export const ALIGN_LEFT = -1;

/**
 * ENUM for centre alignment.
 * @const
 */
export const ALIGN_CENTRE = 0;

/**
 * ENUM for right alignment.
 * @const
 */
export const ALIGN_RIGHT = 1;

/**
 * ENUM for no drag operation.
 * @const
 */
export const DRAG_NONE = 0;

/**
 * ENUM for inside the sticky DRAG_RADIUS.
 * @const
 */
export const DRAG_STICKY = 1;

/**
 * ENUM for inside the non-sticky DRAG_RADIUS, for differentiating between
 * clicks and drags.
 * @const
 */
export const DRAG_BEGIN = 1;

/**
 * ENUM for freely draggable (outside the DRAG_RADIUS, if one applies).
 * @const
 */
export const DRAG_FREE = 2;

/**
 * Lookup table for determining the opposite type of a connection.
 * @const
 */
export const OPPOSITE_TYPE = [];
OPPOSITE_TYPE[INPUT_VALUE] = OUTPUT_VALUE;
OPPOSITE_TYPE[OUTPUT_VALUE] = INPUT_VALUE;
OPPOSITE_TYPE[NEXT_STATEMENT] = PREVIOUS_STATEMENT;
OPPOSITE_TYPE[PREVIOUS_STATEMENT] = NEXT_STATEMENT;

/**
 * ENUM for toolbox and flyout at top of screen.
 * @const
 */
export const TOOLBOX_AT_TOP = 0;

/**
 * ENUM for toolbox and flyout at bottom of screen.
 * @const
 */
export const TOOLBOX_AT_BOTTOM = 1;

/**
 * ENUM for toolbox and flyout at left of screen.
 * @const
 */
export const TOOLBOX_AT_LEFT = 2;

/**
 * ENUM for toolbox and flyout at right of screen.
 * @const
 */
export const TOOLBOX_AT_RIGHT = 3;

/**
 * ENUM for output shape: normal (command block).
 */
export const OUTPUT_SHAPE_NORMAL = null;

/**
 * ENUM for output shape: hexagonal (booleans/predicates).
 * @const
 */
export const OUTPUT_SHAPE_HEXAGONAL = 1;

/**
 * ENUM for output shape: rounded (numbers).
 * @const
 */
export const OUTPUT_SHAPE_ROUND = 2;

/**
 * ENUM for output shape: squared (any/all values; strings).
 * @const
 */
export const OUTPUT_SHAPE_SQUARE = 3;

/**
 * ENUM for categories.
 * @const
 */
export const Categories = {
  "motion": "motion",
  "looks": "looks",
  "sound": "sounds",
  "pen": "pen",
  "data": "data",
  "dataLists": "data-lists",
  "event": "events",
  "control": "control",
  "sensing": "sensing",
  "operators": "operators",
  "more": "more"
};

/**
 * ENUM representing that an event is not in any delete areas.
 * Null for backwards compatibility reasons.
 * @const
 */
export const DELETE_AREA_NONE = null;

/**
 * ENUM representing that an event is in the delete area of the trash can.
 * @const
 */
export const DELETE_AREA_TRASH = 1;

/**
 * ENUM representing that an event is in the delete area of the toolbox or
 * flyout.
 * @const
 */
export const DELETE_AREA_TOOLBOX = 2;

/**
 * String for use in the "custom" attribute of a category in toolbox xml.
 * This string indicates that the category should be dynamically populated with
 * variable blocks.
 * @const {string}
 */
export const VARIABLE_CATEGORY_NAME = 'VARIABLE';

/**
 * String for use in the "custom" attribute of a category in toolbox xml.
 * This string indicates that the category should be dynamically populated with
 * procedure blocks.
 * @const {string}
 */
export const PROCEDURE_CATEGORY_NAME = 'PROCEDURE';

/**
 * String for use in the dropdown created in field_variable.
 * This string indicates that this option in the dropdown is 'Rename
 * variable...' and if selected, should trigger the prompt to rename a variable.
 * @const {string}
 */
export const RENAME_VARIABLE_ID = 'RENAME_VARIABLE_ID';

/**
 * String for use in the dropdown created in field_variable.
 * This string indicates that this option in the dropdown is 'Delete the "%1"
 * variable' and if selected, should trigger the prompt to delete a variable.
 * @const {string}
 */
export const DELETE_VARIABLE_ID = 'DELETE_VARIABLE_ID';

/**
 * String for use in the dropdown created in field_variable,
 * specifically for broadcast messages.
 * This string indicates that this option in the dropdown is 'New message...'
 * and if selected, should trigger the prompt to create a new message.
 * @const {string}
 */
export const NEW_BROADCAST_MESSAGE_ID = 'NEW_BROADCAST_MESSAGE_ID';

/**
 * String representing the variable type of broadcast message blocks.
 * This string, for use in differentiating between types of variables,
 * indicates that the current variable is a broadcast message.
 * @const {string}
 */
export const BROADCAST_MESSAGE_VARIABLE_TYPE = 'broadcast_msg';

/**
 * String representing the variable type of list blocks.
 * This string, for use in differentiating between types of variables,
 * indicates that the current variable is a list.
 * @const {string}
 */
export const LIST_VARIABLE_TYPE = 'list';

// TODO (#1251) Replace '' below with 'scalar', and start using this constant
// everywhere.
/**
 * String representing the variable type of scalar variables.
 * This string, for use in differentiating between types of variables,
 * indicates that the current variable is a scalar variable.
 * @const {string}
 */
export const SCALAR_VARIABLE_TYPE = '';

/**
 * The type of all procedure definition blocks.
 * @const {string}
 */
export const PROCEDURES_DEFINITION_BLOCK_TYPE = 'procedures_definition';

/**
 * The type of all procedure prototype blocks.
 * @const {string}
 */
export const PROCEDURES_PROTOTYPE_BLOCK_TYPE = 'procedures_prototype';

/**
 * The type of all procedure declaration blocks.
 * @const {string}
 */
export const PROCEDURES_DECLARATION_BLOCK_TYPE = 'procedures_declaration';

/**
 * The type of all procedure call blocks.
 * @const {string}
 */
export const PROCEDURES_CALL_BLOCK_TYPE = 'procedures_call';

/**
 * ENUM for flyout status button states.
 * @const
 */
export const StatusButtonState = {
  "READY": "ready",
  "NOT_READY": "not ready",
};
