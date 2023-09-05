/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2023 Clip Team
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

'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.renderer.constants');


/**
 * Grid unit to pixels conversion
 * @const
 */
export const GRID_UNIT = 4;

/**
 * Horizontal space between elements.
 * @const
 */
export const SEP_SPACE_X = 2 * GRID_UNIT;

/**
 * Vertical space between elements.
 * @const
 */
export const SEP_SPACE_Y = 2 * GRID_UNIT;

/**
 * Minimum width of a block.
 * @const
 */
export const MIN_BLOCK_X = 16 * GRID_UNIT;

/**
 * Minimum width of a block with output (reporters).
 * @const
 */
export const MIN_BLOCK_X_OUTPUT = 12 * GRID_UNIT;

/**
 * Minimum width of a shadow block with output (single fields).
 * @const
 */
export const MIN_BLOCK_X_SHADOW_OUTPUT = 10 * GRID_UNIT;

/**
 * Minimum height of a block.
 * @const
 */
export const MIN_BLOCK_Y = 12 * GRID_UNIT;

/**
 * Width of horizontal puzzle tab.
 * @const
 */
export const TAB_WIDTH = 2 * GRID_UNIT;

/**
 * Height of extra row after a statement input.
 * @const
 */
export const EXTRA_STATEMENT_ROW_Y = 8 * GRID_UNIT;

/**
 * Minimum width of a C- or E-shaped block.
 * @const
 */
export const MIN_BLOCK_X_WITH_STATEMENT = 40 * GRID_UNIT;

/**
 * Minimum height of a shadow block with output and a single field.
 * This is used for shadow blocks that only contain a field - which are smaller than even reporters.
 * @const
 */
export const MIN_BLOCK_Y_SINGLE_FIELD_OUTPUT = 8 * GRID_UNIT;

/**
 * Minimum height of a non-shadow block with output, i.e. a reporter.
 * @const
 */
export const MIN_BLOCK_Y_REPORTER = 10 * GRID_UNIT;

/**
 * Minimum space for a statement input height.
 * @const
 */
export const MIN_STATEMENT_INPUT_HEIGHT = 6 * GRID_UNIT;

/**
 * Width of vertical notch.
 * @const
 */
export const NOTCH_WIDTH = 8 * GRID_UNIT;

/**
 * Height of vertical notch.
 * @const
 */
export const NOTCH_HEIGHT = 2 * GRID_UNIT;

/**
 * Rounded corner radius.
 * @const
 */
export const CORNER_RADIUS = 1 * GRID_UNIT;

/**
 * Minimum width of statement input edge on the left, in px.
 * @const
 */
export const STATEMENT_INPUT_EDGE_WIDTH = 4 * GRID_UNIT;

/**
 * Inner space between edge of statement input and notch.
 * @const
 */
export const STATEMENT_INPUT_INNER_SPACE = 2 * GRID_UNIT;

/**
 * Height of the top hat.
 * @const
 */
export const START_HAT_HEIGHT = 16;

/**
 * Height of the vertical separator line for icons that appear at the left edge
 * of a block, such as extension icons.
 * @const
 */
export const ICON_SEPARATOR_HEIGHT = 10 * GRID_UNIT;

/**
 * Path of the top hat's curve.
 * @const
 */
export const START_HAT_PATH = 'c 25,-22 71,-22 96,0';

/**
 * SVG path for drawing next/previous notch from left to right.
 * @const
 */
export const NOTCH_PATH_LEFT = (
  'c 2,0 3,1 4,2 ' +
  'l 4,4 ' +
  'c 1,1 2,2 4,2 ' +
  'h 12 ' +
  'c 2,0 3,-1 4,-2 ' +
  'l 4,-4 ' +
  'c 1,-1 2,-2 4,-2'
);

/**
 * SVG path for drawing next/previous notch from right to left.
 * @const
 */
export const NOTCH_PATH_RIGHT = (
  'c -2,0 -3,1 -4,2 ' +
  'l -4,4 ' +
  'c -1,1 -2,2 -4,2 ' +
  'h -12 ' +
  'c -2,0 -3,-1 -4,-2 ' +
  'l -4,-4 ' +
  'c -1,-1 -2,-2 -4,-2'
);

/**
 * Amount of padding before the notch.
 * @const
 */
export const NOTCH_START_PADDING = 3 * GRID_UNIT;

/**
 * SVG start point for drawing the top-left corner.
 * @const
 */
export const TOP_LEFT_CORNER_START =
    'm 0,' + CORNER_RADIUS;

/**
 * SVG path for drawing the rounded top-left corner.
 * @const
 */
export const TOP_LEFT_CORNER =
    'A ' + CORNER_RADIUS + ',' +
    CORNER_RADIUS + ' 0 0,1 ' +
    CORNER_RADIUS + ',0';

/**
 * SVG path for drawing the rounded top-right corner.
 * @const
 */
export const TOP_RIGHT_CORNER =
    'a ' + CORNER_RADIUS + ',' +
    CORNER_RADIUS + ' 0 0,1 ' +
    CORNER_RADIUS + ',' +
    CORNER_RADIUS;

/**
 * SVG path for drawing the rounded bottom-right corner.
 * @const
 */
export const BOTTOM_RIGHT_CORNER =
    ' a ' + CORNER_RADIUS + ',' +
    CORNER_RADIUS + ' 0 0,1 -' +
    CORNER_RADIUS + ',' +
    CORNER_RADIUS;

/**
 * SVG path for drawing the rounded bottom-left corner.
 * @const
 */
export const BOTTOM_LEFT_CORNER =
    'a ' + CORNER_RADIUS + ',' +
     CORNER_RADIUS + ' 0 0,1 -' +
     CORNER_RADIUS + ',-' +
     CORNER_RADIUS;

/**
 * SVG path for drawing the top-left corner of a statement input.
 * @const
 */
export const INNER_TOP_LEFT_CORNER =
    ' a ' + CORNER_RADIUS + ',' +
    CORNER_RADIUS + ' 0 0,0 -' +
    CORNER_RADIUS + ',' +
    CORNER_RADIUS;

/**
 * SVG path for drawing the bottom-left corner of a statement input.
 * Includes the rounded inside corner.
 * @const
 */
export const INNER_BOTTOM_LEFT_CORNER =
    'a ' + CORNER_RADIUS + ',' +
    CORNER_RADIUS + ' 0 0,0 ' +
    CORNER_RADIUS + ',' +
    CORNER_RADIUS;

/**
 * SVG path for an empty hexagonal input shape.
 * @const
 */
export const INPUT_SHAPE_HEXAGONAL =
    'M ' + 4 * GRID_UNIT + ',0 ' +
    ' h ' + 4 * GRID_UNIT +
    ' l ' + 4 * GRID_UNIT + ',' + 4 * GRID_UNIT +
    ' l ' + -4 * GRID_UNIT + ',' + 4 * GRID_UNIT +
    ' h ' + -4 * GRID_UNIT +
    ' l ' + -4 * GRID_UNIT + ',' + -4 * GRID_UNIT +
    ' l ' + 4 * GRID_UNIT + ',' + -4 * GRID_UNIT +
    ' z';

/**
 * Width of empty boolean input shape.
 * @const
 */
export const INPUT_SHAPE_HEXAGONAL_WIDTH = 12 * GRID_UNIT;

/**
 * SVG path for an empty square input shape.
 * @const
 */
export const INPUT_SHAPE_SQUARE =
    TOP_LEFT_CORNER_START +
    TOP_LEFT_CORNER +
    ' h ' + (12 * GRID_UNIT - 2 * CORNER_RADIUS) +
    TOP_RIGHT_CORNER +
    ' v ' + (8 * GRID_UNIT - 2 * CORNER_RADIUS) +
    BOTTOM_RIGHT_CORNER +
    ' h ' + (-12 * GRID_UNIT + 2 * CORNER_RADIUS) +
    BOTTOM_LEFT_CORNER +
    ' z';

/**
 * Width of empty square input shape.
 * @const
 */
export const INPUT_SHAPE_SQUARE_WIDTH = 10 * GRID_UNIT;

/**
 * SVG path for an empty round input shape.
 * @const
 */
export const INPUT_SHAPE_ROUND =
  'M ' + (4 * GRID_UNIT) + ',0' +
  ' h ' + (4 * GRID_UNIT) +
  ' a ' + (4 * GRID_UNIT) + ' ' +
      (4 * GRID_UNIT) + ' 0 0 1 0 ' + (8 * GRID_UNIT) +
  ' h ' + (-4 * GRID_UNIT) +
  ' a ' + (4 * GRID_UNIT) + ' ' +
      (4 * GRID_UNIT) + ' 0 0 1 0 -' + (8 * GRID_UNIT) +
  ' z';

/**
 * Width of empty round input shape.
 * @const
 */
export const INPUT_SHAPE_ROUND_WIDTH = 12 * GRID_UNIT;

/**
 * Height of empty input shape.
 * @const
 */
export const INPUT_SHAPE_HEIGHT = 8 * GRID_UNIT;

/**
 * Height of user inputs
 * @const
 */
export const FIELD_HEIGHT = 8 * GRID_UNIT;

/**
 * Width of user inputs
 * @const
 */
export const FIELD_WIDTH = 6 * GRID_UNIT;

/**
 * Editable field padding (left/right of the text).
 * @const
 */
export const EDITABLE_FIELD_PADDING = 6;

/**
 * Square box field padding (left/right of the text).
 * @const
 */
export const BOX_FIELD_PADDING = 2 * GRID_UNIT;

/**
 * Drop-down arrow padding.
 * @const
 */
export const DROPDOWN_ARROW_PADDING = 2 * GRID_UNIT;

/**
 * Minimum width of user inputs during editing
 * @const
 */
export const FIELD_WIDTH_MIN_EDIT = 8 * GRID_UNIT;

/**
 * Maximum width of user inputs during editing
 * @const
 */
export const FIELD_WIDTH_MAX_EDIT = Infinity;

/**
 * Maximum height of user inputs during editing
 * @const
 */
export const FIELD_HEIGHT_MAX_EDIT = FIELD_HEIGHT;

/**
 * Top padding of user inputs
 * @const
 */
export const FIELD_TOP_PADDING = 0.5 * GRID_UNIT;

/**
 * Corner radius of number inputs
 * @const
 */
export const NUMBER_FIELD_CORNER_RADIUS = 4 * GRID_UNIT;

/**
 * Corner radius of text inputs
 * @const
 */
export const TEXT_FIELD_CORNER_RADIUS = 1 * GRID_UNIT;

/**
 * Default radius for a field, in px.
 * @const
 */
export const FIELD_DEFAULT_CORNER_RADIUS = 4 * GRID_UNIT;

/**
 * Max text display length for a field (per-horizontal/vertical)
 * @const
 */
export const MAX_DISPLAY_LENGTH = Infinity;

/**
 * Minimum X of inputs and fields for blocks with a previous connection.
 * Ensures that inputs will not overlap with the top notch of blocks.
 * @const
 */
export const INPUT_AND_FIELD_MIN_X = 12 * GRID_UNIT;

/**
 * Vertical padding around inline elements.
 * @const
 */
export const INLINE_PADDING_Y = 1 * GRID_UNIT;

/**
 * Point size of text field before animation. Must match size in CSS.
 * See implementation in field_textinput.
 */
export const FIELD_TEXTINPUT_FONTSIZE_INITIAL = 12;

/**
 * Point size of text field after animation.
 * See implementation in field_textinput.
 */
export const FIELD_TEXTINPUT_FONTSIZE_FINAL = 12;

/**
 * Whether text fields are allowed to expand past their truncated block size.
 * @const{boolean}
 */
export const FIELD_TEXTINPUT_EXPAND_PAST_TRUNCATION = false;

/**
 * Whether text fields should animate their positioning.
 * @const{boolean}
 */
export const FIELD_TEXTINPUT_ANIMATE_POSITIONING = false;

/**
 * Map of output/input shapes and the amount they should cause a block to be padded.
 * Outer key is the outer shape, inner key is the inner shape.
 * When a block with the outer shape contains an input block with the inner shape
 * on its left or right edge, that side is extended by the padding specified.
 * See also: `Blockly.BlockSvg.computeOutputPadding_`.
 */
export const SHAPE_IN_SHAPE_PADDING = {
  1: { // Outer shape: hexagon.
    0: 5 * GRID_UNIT, // Field in hexagon.
    1: 2 * GRID_UNIT, // Hexagon in hexagon.
    2: 5 * GRID_UNIT, // Round in hexagon.
    3: 5 * GRID_UNIT // Square in hexagon.
  },
  2: { // Outer shape: round.
    0: 3 * GRID_UNIT, // Field in round.
    1: 3 * GRID_UNIT, // Hexagon in round.
    2: 1 * GRID_UNIT, // Round in round.
    3: 2 * GRID_UNIT // Square in round.
  },
  3: { // Outer shape: square.
    0: 2 * GRID_UNIT, // Field in square.
    1: 2 * GRID_UNIT, // Hexagon in square.
    2: 2 * GRID_UNIT, // Round in square.
    3: 2 * GRID_UNIT // Square in square.
  }
};

/**
 * Corner radius of the hat on the define block.
 * @const
 */
export const DEFINE_HAT_CORNER_RADIUS = 5 * GRID_UNIT;

/**
 * SVG path for drawing the rounded top-left corner.
 * @const
 */
export const TOP_LEFT_CORNER_DEFINE_HAT =
    'a ' + DEFINE_HAT_CORNER_RADIUS + ',' +
    DEFINE_HAT_CORNER_RADIUS + ' 0 0,1 ' +
    DEFINE_HAT_CORNER_RADIUS + ',-' +
    DEFINE_HAT_CORNER_RADIUS;

/**
 * SVG path for drawing the rounded top-left corner.
 * @const
 */
export const TOP_RIGHT_CORNER_DEFINE_HAT =
    'a ' + DEFINE_HAT_CORNER_RADIUS + ',' +
    DEFINE_HAT_CORNER_RADIUS + ' 0 0,1 ' +
    DEFINE_HAT_CORNER_RADIUS + ',' +
    DEFINE_HAT_CORNER_RADIUS;

/**
 * Padding on the right side of the internal block on the define block.
 * @const
 */
export const DEFINE_BLOCK_PADDING_RIGHT = 2 * GRID_UNIT;
