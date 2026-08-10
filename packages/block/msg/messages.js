/**
 * @license
 * Visual Blocks Language
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

/**
 * @fileoverview English strings.
 * @author ascii@media.mit.edu (Andrew Sliwinski)
 *
 * After modifying this file, run `npm run translate` from the root directory
 * to regenerate `./msg/json/en.json`.
 * IMPORTANT:
 * All message strings must use single quotes for the scripts to work properly
 */

'use strict';

// Control blocks
Blockly.Msg.CONTROL_FOREVER = 'forever';
Blockly.Msg.CONTROL_REPEAT = 'repeat %1';
Blockly.Msg.CONTROL_IF = 'if %1 then';
Blockly.Msg.CONTROL_ELSE = 'else';
Blockly.Msg.CONTROL_STOP = 'stop';
Blockly.Msg.CONTROL_STOP_ALL = 'all';
Blockly.Msg.CONTROL_STOP_THIS = 'this script';
Blockly.Msg.CONTROL_STOP_OTHER = 'other scripts in sprite';
Blockly.Msg.CONTROL_WAIT = 'wait %1 seconds';
Blockly.Msg.CONTROL_WAITUNTIL = 'wait until %1';
Blockly.Msg.CONTROL_REPEATUNTIL = 'repeat until %1';
Blockly.Msg.CONTROL_WHILE = 'while %1';
Blockly.Msg.CONTROL_FOREACH = 'for each %1 in %2';
Blockly.Msg.CONTROL_STARTASCLONE = 'when I start as a clone';
Blockly.Msg.CONTROL_CREATECLONEOF = 'create clone of %1';
Blockly.Msg.CONTROL_CREATECLONEOF_MYSELF = 'myself';
Blockly.Msg.CONTROL_DELETETHISCLONE = 'delete this clone';
Blockly.Msg.CONTROL_COUNTER = 'counter';
Blockly.Msg.CONTROL_INCRCOUNTER = 'increment counter';
Blockly.Msg.CONTROL_CLEARCOUNTER = 'clear counter';
Blockly.Msg.CONTROL_ALLATONCE = 'all at once';

// Data blocks
Blockly.Msg.DATA_SETVARIABLETO = 'set %1 to %2';
Blockly.Msg.DATA_CHANGEVARIABLEBY = 'change %1 by %2';
Blockly.Msg.DATA_SHOWVARIABLE = 'show variable %1';
Blockly.Msg.DATA_HIDEVARIABLE = 'hide variable %1';
Blockly.Msg.DATA_ADDTOLIST = 'add %1 to %2';
Blockly.Msg.DATA_DELETEOFLIST = 'delete %1 of %2';
Blockly.Msg.DATA_DELETEALLOFLIST = 'delete all of %1';
Blockly.Msg.DATA_INSERTATLIST = 'insert %1 at %2 of %3';
Blockly.Msg.DATA_REPLACEITEMOFLIST = 'replace item %1 of %2 with %3';
Blockly.Msg.DATA_ITEMOFLIST = 'item %1 of %2';
Blockly.Msg.DATA_ITEMNUMOFLIST = 'item # of %1 in %2';
Blockly.Msg.DATA_LENGTHOFLIST = 'length of %1';
Blockly.Msg.DATA_LISTCONTAINSITEM = '%1 contains %2?';
Blockly.Msg.DATA_SHOWLIST = 'show list %1';
Blockly.Msg.DATA_HIDELIST = 'hide list %1';
Blockly.Msg.DATA_INDEX_ALL = 'all';
Blockly.Msg.DATA_INDEX_LAST = 'last';
Blockly.Msg.DATA_INDEX_RANDOM = 'random';

// Event blocks
Blockly.Msg.EVENT_WHENFLAGCLICKED = 'when %1 clicked';
Blockly.Msg.EVENT_WHENTHISSPRITECLICKED = 'when this sprite clicked';
Blockly.Msg.EVENT_WHENSTAGECLICKED = 'when stage clicked';
Blockly.Msg.EVENT_WHENTOUCHINGOBJECT = 'when this sprite touches %1';
Blockly.Msg.EVENT_WHENBROADCASTRECEIVED = 'when I receive %1';
Blockly.Msg.EVENT_WHENBACKDROPSWITCHESTO = 'when backdrop switches to %1';
Blockly.Msg.EVENT_WHENGREATERTHAN = 'when %1 > %2';
Blockly.Msg.EVENT_WHENGREATERTHAN_TIMER = 'timer';
Blockly.Msg.EVENT_WHENGREATERTHAN_LOUDNESS = 'loudness';
Blockly.Msg.EVENT_BROADCAST = 'broadcast %1';
Blockly.Msg.EVENT_BROADCASTANDWAIT = 'broadcast %1 and wait';
Blockly.Msg.EVENT_WHENKEYPRESSED = 'when %1 key pressed';
Blockly.Msg.EVENT_WHENKEYPRESSED_SPACE = 'space';
Blockly.Msg.EVENT_WHENKEYPRESSED_LEFT = 'left arrow';
Blockly.Msg.EVENT_WHENKEYPRESSED_RIGHT = 'right arrow';
Blockly.Msg.EVENT_WHENKEYPRESSED_DOWN = 'down arrow';
Blockly.Msg.EVENT_WHENKEYPRESSED_UP = 'up arrow';
Blockly.Msg.EVENT_WHENKEYPRESSED_ANY = 'any';
Blockly.Msg.EVENT_WHENKEYPRESSED_ENTER = 'enter';

// Looks blocks
Blockly.Msg.LOOKS_SAYFORSECS = 'say %1 for %2 seconds';
Blockly.Msg.LOOKS_SAY = 'say %1';
Blockly.Msg.LOOKS_HELLO = 'Hello!';
Blockly.Msg.LOOKS_THINKFORSECS = 'think %1 for %2 seconds';
Blockly.Msg.LOOKS_THINK = 'think %1';
Blockly.Msg.LOOKS_HMM = 'Hmm...';
Blockly.Msg.LOOKS_SHOW = 'show';
Blockly.Msg.LOOKS_HIDE = 'hide';
Blockly.Msg.LOOKS_HIDEALLSPRITES = 'hide all sprites';
Blockly.Msg.LOOKS_EFFECT_COLOR = 'color';
Blockly.Msg.LOOKS_EFFECT_FISHEYE = 'fisheye';
Blockly.Msg.LOOKS_EFFECT_WHIRL = 'whirl';
Blockly.Msg.LOOKS_EFFECT_PIXELATE = 'pixelate';
Blockly.Msg.LOOKS_EFFECT_MOSAIC = 'mosaic';
Blockly.Msg.LOOKS_EFFECT_BRIGHTNESS = 'brightness';
Blockly.Msg.LOOKS_EFFECT_GHOST = 'ghost';
Blockly.Msg.LOOKS_CHANGEEFFECTBY = 'change %1 effect by %2';
Blockly.Msg.LOOKS_SETEFFECTTO = 'set %1 effect to %2';
Blockly.Msg.LOOKS_CLEARGRAPHICEFFECTS = 'clear graphic effects';
Blockly.Msg.LOOKS_CHANGESIZEBY = 'change size by %1';
Blockly.Msg.LOOKS_SETSIZETO = 'set size to %1 %';
Blockly.Msg.LOOKS_SIZE = 'size';
Blockly.Msg.LOOKS_CHANGESTRETCHBY = 'change stretch by %1';
Blockly.Msg.LOOKS_SETSTRETCHTO = 'set stretch to %1 %';
Blockly.Msg.LOOKS_SWITCHCOSTUMETO = 'switch costume to %1';
Blockly.Msg.LOOKS_NEXTCOSTUME = 'next costume';
Blockly.Msg.LOOKS_SWITCHBACKDROPTO = 'switch backdrop to %1';
Blockly.Msg.LOOKS_GOTOFRONTBACK = 'go to %1 layer';
Blockly.Msg.LOOKS_GOTOFRONTBACK_FRONT = 'front';
Blockly.Msg.LOOKS_GOTOFRONTBACK_BACK = 'back';
Blockly.Msg.LOOKS_GOFORWARDBACKWARDLAYERS = 'go %1 %2 layers';
Blockly.Msg.LOOKS_GOFORWARDBACKWARDLAYERS_FORWARD = 'forward';
Blockly.Msg.LOOKS_GOFORWARDBACKWARDLAYERS_BACKWARD = 'backward';
Blockly.Msg.LOOKS_BACKDROPNUMBERNAME = 'backdrop %1';
Blockly.Msg.LOOKS_COSTUMENUMBERNAME = 'costume %1';
Blockly.Msg.LOOKS_NUMBERNAME_NUMBER = 'number';
Blockly.Msg.LOOKS_NUMBERNAME_NAME = 'name';
Blockly.Msg.LOOKS_SWITCHBACKDROPTOANDWAIT = 'switch backdrop to %1 and wait';
Blockly.Msg.LOOKS_NEXTBACKDROP_BLOCK = 'next backdrop';
Blockly.Msg.LOOKS_NEXTBACKDROP = 'next backdrop';
Blockly.Msg.LOOKS_PREVIOUSBACKDROP = 'previous backdrop';
Blockly.Msg.LOOKS_RANDOMBACKDROP = 'random backdrop';

// Motion blocks
Blockly.Msg.MOTION_MOVESTEPS = 'move %1 steps';
Blockly.Msg.MOTION_TURNLEFT = 'turn %1 %2 degrees';
Blockly.Msg.MOTION_TURNRIGHT = 'turn %1 %2 degrees';
Blockly.Msg.MOTION_POINTINDIRECTION = 'point in direction %1';
Blockly.Msg.MOTION_POINTTOWARDS = 'point towards %1';
Blockly.Msg.MOTION_POINTTOWARDS_POINTER = 'mouse-pointer';
Blockly.Msg.MOTION_POINTTOWARDS_RANDOM = 'random direction';
Blockly.Msg.MOTION_GOTO = 'go to %1';
Blockly.Msg.MOTION_GOTO_POINTER = 'mouse-pointer';
Blockly.Msg.MOTION_GOTO_RANDOM = 'random position';
Blockly.Msg.MOTION_GOTOXY = 'go to x: %1 y: %2';
Blockly.Msg.MOTION_GLIDESECSTOXY = 'glide %1 secs to x: %2 y: %3';
Blockly.Msg.MOTION_GLIDETO = 'glide %1 secs to %2';
Blockly.Msg.MOTION_GLIDETO_POINTER = 'mouse-pointer';
Blockly.Msg.MOTION_GLIDETO_RANDOM = 'random position';
Blockly.Msg.MOTION_CHANGEXBY = 'change x by %1';
Blockly.Msg.MOTION_SETX = 'set x to %1';
Blockly.Msg.MOTION_CHANGEYBY = 'change y by %1';
Blockly.Msg.MOTION_SETY = 'set y to %1';
Blockly.Msg.MOTION_IFONEDGEBOUNCE = 'if on edge, bounce';
Blockly.Msg.MOTION_SETROTATIONSTYLE = 'set rotation style %1';
Blockly.Msg.MOTION_SETROTATIONSTYLE_LEFTRIGHT = 'left-right';
Blockly.Msg.MOTION_SETROTATIONSTYLE_DONTROTATE = 'don\'t rotate';
Blockly.Msg.MOTION_SETROTATIONSTYLE_ALLAROUND = 'all around';
Blockly.Msg.MOTION_XPOSITION = 'x position';
Blockly.Msg.MOTION_YPOSITION = 'y position';
Blockly.Msg.MOTION_DIRECTION = 'direction';
Blockly.Msg.MOTION_SCROLLRIGHT = 'scroll right %1';
Blockly.Msg.MOTION_SCROLLUP = 'scroll up %1';
Blockly.Msg.MOTION_ALIGNSCENE = 'align scene %1';
Blockly.Msg.MOTION_ALIGNSCENE_BOTTOMLEFT = 'bottom-left';
Blockly.Msg.MOTION_ALIGNSCENE_BOTTOMRIGHT = 'bottom-right';
Blockly.Msg.MOTION_ALIGNSCENE_MIDDLE = 'middle';
Blockly.Msg.MOTION_ALIGNSCENE_TOPLEFT = 'top-left';
Blockly.Msg.MOTION_ALIGNSCENE_TOPRIGHT = 'top-right';
Blockly.Msg.MOTION_XSCROLL = 'x scroll';
Blockly.Msg.MOTION_YSCROLL = 'y scroll';
Blockly.Msg.MOTION_STAGE_SELECTED = 'Stage selected: no motion blocks';

// Operators blocks
Blockly.Msg.OPERATORS_ADD = '%1 + %2';
Blockly.Msg.OPERATORS_SUBTRACT = '%1 - %2';
Blockly.Msg.OPERATORS_MULTIPLY = '%1 * %2';
Blockly.Msg.OPERATORS_DIVIDE = '%1 / %2';
Blockly.Msg.OPERATORS_RANDOM = 'pick random %1 to %2';
Blockly.Msg.OPERATORS_GT = '%1 > %2';
Blockly.Msg.OPERATORS_LT = '%1 < %2';
Blockly.Msg.OPERATORS_EQUALS = '%1 = %2';
Blockly.Msg.OPERATORS_AND = '%1 and %2';
Blockly.Msg.OPERATORS_OR = '%1 or %2';
Blockly.Msg.OPERATORS_NOT = 'not %1';
Blockly.Msg.OPERATORS_JOIN = 'join %1 %2';
Blockly.Msg.OPERATORS_JOIN_APPLE = 'apple';
Blockly.Msg.OPERATORS_JOIN_BANANA = 'banana';
Blockly.Msg.OPERATORS_JOIN_MULTIPLE = 'join';
Blockly.Msg.OPERATORS_LETTEROF = 'letter %1 of %2';
Blockly.Msg.OPERATORS_LETTEROF_APPLE = 'a';
Blockly.Msg.OPERATORS_LENGTH = 'length of %1';
Blockly.Msg.OPERATORS_CONTAINS = '%1 contains %2?';
Blockly.Msg.OPERATORS_MOD = '%1 mod %2';
Blockly.Msg.OPERATORS_ROUND = 'round %1';
Blockly.Msg.OPERATORS_MATHOP = '%1 of %2';
Blockly.Msg.OPERATORS_MATHOP_ABS = 'abs';
Blockly.Msg.OPERATORS_MATHOP_FLOOR = 'floor';
Blockly.Msg.OPERATORS_MATHOP_CEILING = 'ceiling';
Blockly.Msg.OPERATORS_MATHOP_SQRT = 'sqrt';
Blockly.Msg.OPERATORS_MATHOP_SIN = 'sin';
Blockly.Msg.OPERATORS_MATHOP_COS = 'cos';
Blockly.Msg.OPERATORS_MATHOP_TAN = 'tan';
Blockly.Msg.OPERATORS_MATHOP_ASIN = 'asin';
Blockly.Msg.OPERATORS_MATHOP_ACOS = 'acos';
Blockly.Msg.OPERATORS_MATHOP_ATAN = 'atan';
Blockly.Msg.OPERATORS_MATHOP_LN = 'ln';
Blockly.Msg.OPERATORS_MATHOP_LOG = 'log';
Blockly.Msg.OPERATORS_MATHOP_EEXP = 'e ^';
Blockly.Msg.OPERATORS_MATHOP_10EXP = '10 ^';
Blockly.Msg.OPERATORS_POWER = '%1 ^ %2';
Blockly.Msg.OPERATORS_BITAND = '%1 & %2';
Blockly.Msg.OPERATORS_BITOR = '%1 | %2';
Blockly.Msg.OPERATORS_BITXOR = '%1 xor %2';
Blockly.Msg.OPERATORS_BITNOT = '~ %1';
Blockly.Msg.OPERATORS_BITLSH = '%1 << %2';
Blockly.Msg.OPERATORS_BITRSH = '%1 >> %2';
Blockly.Msg.OPERATORS_BITURSH = '%1 >>> %2';
Blockly.Msg.OPERATORS_GE = '%1 ≥ %2';
Blockly.Msg.OPERATORS_LE = '%1 ≤ %2';
Blockly.Msg.OPERATORS_NEQUALS = '%1 ≠ %2';
Blockly.Msg.OPERATORS_INDEXOF = 'position %1 of %2 contain %3';

// Procedures blocks
Blockly.Msg.PROCEDURES_DEFINITION = 'define %1';
Blockly.Msg.PROCEDURES_RETURN = 'return %1';

// Sensing blocks
Blockly.Msg.SENSING_TOUCHINGOBJECT = 'touching %1?';
Blockly.Msg.SENSING_TOUCHINGOBJECT_POINTER = 'mouse-pointer';
Blockly.Msg.SENSING_TOUCHINGOBJECT_EDGE = 'edge';
Blockly.Msg.SENSING_TOUCHINGCOLOR = 'touching color %1?';
Blockly.Msg.SENSING_COLORISTOUCHINGCOLOR = 'color %1 is touching %2?';
Blockly.Msg.SENSING_DISTANCETO = 'distance to %1';
Blockly.Msg.SENSING_DISTANCETO_POINTER = 'mouse-pointer';
Blockly.Msg.SENSING_DISTANCEBETWEENPOSITION = 'distance from (x: %1, y: %2 ) to (x: %3 , y: %4 )';
Blockly.Msg.SENSING_DIRECTIONBETWEENPOSITION = 'direction from (x: %1, y: %2 ) to (x: %3 , y: %4 )';
Blockly.Msg.SENSING_ASKANDWAIT = 'ask %1 and wait';
Blockly.Msg.SENSING_ASK_TEXT = 'What\'s your name?';
Blockly.Msg.SENSING_ANSWER = 'answer';
Blockly.Msg.SENSING_KEYPRESSED = 'key %1 pressed?';
Blockly.Msg.SENSING_MOUSEDOWN = 'mouse down?';
Blockly.Msg.SENSING_MOUSEPRESSED = 'mouse %1 pressed?';
Blockly.Msg.SENSING_MOUSEPRESSED_LEFT = 'left';
Blockly.Msg.SENSING_MOUSEPRESSED_MIDDLE = 'middle';
Blockly.Msg.SENSING_MOUSEPRESSED_RIGHT = 'right';
Blockly.Msg.SENSING_MOUSEX = 'mouse x';
Blockly.Msg.SENSING_MOUSEY = 'mouse y';
Blockly.Msg.SENSING_SETDRAGMODE = 'set drag mode %1';
Blockly.Msg.SENSING_SETDRAGMODE_DRAGGABLE = 'draggable';
Blockly.Msg.SENSING_SETDRAGMODE_NOTDRAGGABLE = 'not draggable';
Blockly.Msg.SENSING_LOUDNESS = 'loudness';
Blockly.Msg.SENSING_LOUD = 'loud?';
Blockly.Msg.SENSING_TIMER = 'timer';
Blockly.Msg.SENSING_RESETTIMER = 'reset timer';
Blockly.Msg.SENSING_OF = '%1 of %2';
Blockly.Msg.SENSING_OF_XPOSITION = 'x position';
Blockly.Msg.SENSING_OF_YPOSITION = 'y position';
Blockly.Msg.SENSING_OF_DIRECTION = 'direction';
Blockly.Msg.SENSING_OF_COSTUMENUMBER = 'costume #';
Blockly.Msg.SENSING_OF_COSTUMENAME = 'costume name';
Blockly.Msg.SENSING_OF_SIZE = 'size';
Blockly.Msg.SENSING_OF_VOLUME = 'volume';
Blockly.Msg.SENSING_OF_BACKDROPNUMBER = 'backdrop #';
Blockly.Msg.SENSING_OF_BACKDROPNAME = 'backdrop name';
Blockly.Msg.SENSING_OF_STAGE = 'Stage';
Blockly.Msg.SENSING_CURRENT = 'current %1';
Blockly.Msg.SENSING_CURRENT_YEAR = 'year';
Blockly.Msg.SENSING_CURRENT_MONTH = 'month';
Blockly.Msg.SENSING_CURRENT_DATE = 'date';
Blockly.Msg.SENSING_CURRENT_DAYOFWEEK = 'day of week';
Blockly.Msg.SENSING_CURRENT_HOUR = 'hour';
Blockly.Msg.SENSING_CURRENT_MINUTE = 'minute';
Blockly.Msg.SENSING_CURRENT_SECOND = 'second';
Blockly.Msg.SENSING_DAYSSINCE2000 = 'days since 2000';
Blockly.Msg.SENSING_USERNAME = 'username';
Blockly.Msg.SENSING_USERID = 'user id';
Blockly.Msg.SENSING_COLORAT = 'get the color at (x: %1, y: %2)';
Blockly.Msg.SENSING_OPERATINGSYSTEM = 'operating system';
Blockly.Msg.SENSING_CLIPCC_VERSION = 'ClipCC version';
Blockly.Msg.SENSING_JOYSTICKX = 'joystick x axis';
Blockly.Msg.SENSING_JOYSTICKY = 'joystick y axis';
Blockly.Msg.SENSING_JOYSTICK_DISTANCE = 'joystick distance';
Blockly.Msg.SENSING_TURNONTURBOMODE = 'turn on turbo mode';
Blockly.Msg.SENSING_TURNOFFTURBOMODE = 'turn off turbo mode';
Blockly.Msg.SENSING_ISTURBOMODE = 'turbo mode?';

// Sound blocks
Blockly.Msg.SOUND_PLAY = 'start sound %1';
Blockly.Msg.SOUND_PLAYUNTILDONE = 'play sound %1 until done';
Blockly.Msg.SOUND_STOPALLSOUNDS = 'stop all sounds';
Blockly.Msg.SOUND_SETEFFECTO = 'set %1 effect to %2';
Blockly.Msg.SOUND_CHANGEEFFECTBY = 'change %1 effect by %2';
Blockly.Msg.SOUND_CLEAREFFECTS = 'clear sound effects';
Blockly.Msg.SOUND_EFFECTS_PITCH = 'pitch';
Blockly.Msg.SOUND_EFFECTS_PAN = 'pan left/right';
Blockly.Msg.SOUND_CHANGEVOLUMEBY = 'change volume by %1';
Blockly.Msg.SOUND_SETVOLUMETO = 'set volume to %1%';
Blockly.Msg.SOUND_VOLUME = 'volume';
Blockly.Msg.SOUND_RECORD = 'record...';

// Category labels
Blockly.Msg.CATEGORY_MOTION = 'Motion';
Blockly.Msg.CATEGORY_LOOKS = 'Looks';
Blockly.Msg.CATEGORY_SOUND = 'Sound';
Blockly.Msg.CATEGORY_EVENTS = 'Events';
Blockly.Msg.CATEGORY_CONTROL = 'Control';
Blockly.Msg.CATEGORY_SENSING = 'Sensing';
Blockly.Msg.CATEGORY_OPERATORS = 'Operators';
Blockly.Msg.CATEGORY_VARIABLES = 'Variables';
Blockly.Msg.CATEGORY_MYBLOCKS = 'Functions';

// Context menus
Blockly.Msg.DUPLICATE_BLOCK = 'Duplicate';
Blockly.Msg.DELETE = 'Delete';
Blockly.Msg.ADD_COMMENT = 'Add Comment';
Blockly.Msg.DUPLICATE_COMMENT = 'Duplicate Comment';
Blockly.Msg.REMOVE_COMMENT = 'Remove Comment';
Blockly.Msg.DELETE_BLOCK = 'Delete Block';
Blockly.Msg.DELETE_X_BLOCKS = 'Delete %1 Blocks';
Blockly.Msg.DELETE_ALL_BLOCKS = 'Delete all %1 blocks?';
Blockly.Msg.CLEAN_UP = 'Clean up Blocks';
Blockly.Msg.HELP = 'Help';
Blockly.Msg.UNDO = 'Undo';
Blockly.Msg.REDO = 'Redo';
Blockly.Msg.EDIT_PROCEDURE = 'Edit';
Blockly.Msg.FORCE_DELETE = 'Force Delete';
Blockly.Msg.FORCE_DELETE_INFO = 'You are going to forcibly delete the definition, which may cause undefined function. Press OK to continue.';
Blockly.Msg.CHANGE_PROCEDURE_SHAPE = 'Change Shape';
Blockly.Msg.SHOW_PROCEDURE_DEFINITION = 'Go to definition';
Blockly.Msg.WORKSPACE_COMMENT_DEFAULT_TEXT = 'Say something...';
Blockly.Msg.COPY = 'Copy to Clipboard';
Blockly.Msg.PASTE = 'Paste';
Blockly.Msg.PASTE_ERROR = 'Clipboard content is not valid block data and cannot be pasted.';
Blockly.Msg.INSERT_INPUT = 'Insert an Input';
Blockly.Msg.DELETE_INPUT = 'Delete the Input';

// Color
Blockly.Msg.COLOUR_HUE_LABEL = 'Color';
Blockly.Msg.COLOUR_SATURATION_LABEL = 'Saturation';
Blockly.Msg.COLOUR_BRIGHTNESS_LABEL = 'Brightness';

// Variables
// @todo Remove these once fully managed by Scratch VM / Scratch GUI
Blockly.Msg.CHANGE_VALUE_TITLE = 'Change value:';
Blockly.Msg.RENAME_VARIABLE = 'Rename variable';
Blockly.Msg.RENAME_VARIABLE_TITLE = 'Rename all "%1" variables to:';
Blockly.Msg.RENAME_VARIABLE_MODAL_TITLE = 'Rename Variable';
Blockly.Msg.NEW_VARIABLE = 'Make a Variable';
Blockly.Msg.NEW_VARIABLE_TITLE = 'New variable name:';
Blockly.Msg.VARIABLE_MODAL_TITLE = 'New Variable';
Blockly.Msg.VARIABLE_ALREADY_EXISTS = 'A variable named "%1" already exists.';
Blockly.Msg.VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE = 'A variable named "%1" already exists for another variable of type "%2".';
Blockly.Msg.DELETE_VARIABLE_CONFIRMATION = 'Delete %1 uses of the "%2" variable?';
Blockly.Msg.CANNOT_DELETE_VARIABLE_PROCEDURE = 'Can\'t delete the variable "%1" because it\'s part of the definition of the function "%2"';
Blockly.Msg.DELETE_VARIABLE = 'Delete the "%1" variable';

// Custom Procedures (Functions)
// @todo Remove these once fully managed by Scratch VM / Scratch GUI
Blockly.Msg.NEW_PROCEDURE = 'Make a Function';
Blockly.Msg.PROCEDURE_ALREADY_EXISTS = 'A function named "%1" already exists.';
Blockly.Msg.PROCEDURE_DEFAULT_NAME = 'function name';
Blockly.Msg.PROCEDURE_USED = 'To delete a function definition, first remove all uses of the function';

// Lists
// @todo Remove these once fully managed by Scratch VM / Scratch GUI
Blockly.Msg.NEW_LIST = 'Make a List';
Blockly.Msg.NEW_LIST_TITLE = 'New list name:';
Blockly.Msg.LIST_MODAL_TITLE = 'New List';
Blockly.Msg.LIST_ALREADY_EXISTS = 'A list named "%1" already exists.';
Blockly.Msg.RENAME_LIST_TITLE = 'Rename all "%1" lists to:';
Blockly.Msg.RENAME_LIST_MODAL_TITLE = 'Rename List';
Blockly.Msg.DEFAULT_LIST_ITEM = 'thing';
Blockly.Msg.DELETE_LIST = 'Delete the "%1" list';
Blockly.Msg.RENAME_LIST = 'Rename list';

// Broadcast Messages
// @todo Remove these once fully managed by Scratch VM / Scratch GUI
Blockly.Msg.NEW_BROADCAST_MESSAGE = 'New message';
Blockly.Msg.NEW_BROADCAST_MESSAGE_TITLE = 'New message name:';
Blockly.Msg.BROADCAST_MODAL_TITLE = 'New Message';
Blockly.Msg.DEFAULT_BROADCAST_MESSAGE_NAME = 'message1';

// Shortcuts & Keyboard navigation
Blockly.Msg.DIALOG_OK = 'OK';
Blockly.Msg.DIALOG_CANCEL = 'Cancel';
Blockly.Msg.SHORTCUTS_ESCAPE = 'Exit';
Blockly.Msg.SHORTCUTS_DELETE = 'Delete';
Blockly.Msg.SHORTCUTS_START_MOVE = 'Start move';
Blockly.Msg.SHORTCUTS_START_MOVE_STACK = 'Start move stack';
Blockly.Msg.SHORTCUTS_MOVE_LEFT = 'Move left';
Blockly.Msg.SHORTCUTS_MOVE_RIGHT = 'Move right';
Blockly.Msg.SHORTCUTS_MOVE_UP = 'Move up';
Blockly.Msg.SHORTCUTS_MOVE_DOWN = 'Move down';
Blockly.Msg.SHORTCUTS_FINISH_MOVE = 'Finish move';
Blockly.Msg.SHORTCUTS_ABORT_MOVE = 'Abort move';
Blockly.Msg.SHORTCUTS_SHOW_CONTEXT_MENU = 'Show menu';
Blockly.Msg.SHORTCUTS_FOCUS_WORKSPACE = 'Focus workspace';
Blockly.Msg.SHORTCUTS_FOCUS_TOOLBOX = 'Focus toolbox';
Blockly.Msg.SHORTCUTS_INFORMATION = 'Announce information';
Blockly.Msg.SHORTCUTS_EXTENDED_INFORMATION = 'Announce detailed information';
Blockly.Msg.SHORTCUTS_DISCONNECT = 'Disconnect block';
Blockly.Msg.SHORTCUTS_NEXT_STACK = 'Next stack';
Blockly.Msg.SHORTCUTS_PREVIOUS_STACK = 'Previous stack';
Blockly.Msg.SHORTCUTS_NEXT_HEADING = 'Next heading';
Blockly.Msg.SHORTCUTS_PREVIOUS_HEADING = 'Previous heading';
Blockly.Msg.SHORTCUTS_PERFORM_ACTION = 'Edit or confirm';
Blockly.Msg.SHORTCUTS_DUPLICATE = 'Duplicate';
Blockly.Msg.SHORTCUTS_CLEANUP = 'Clean up workspace';
Blockly.Msg.SHORTCUTS_SHOW_TOOLTIP = 'Show tooltip';
Blockly.Msg.SHORTCUTS_TOGGLE_SCREENREADER_MODE = 'Toggle screenreader mode';
Blockly.Msg.SHORTCUTS_JUMP_BLOCK_START = 'Jump to block start';
Blockly.Msg.SHORTCUTS_JUMP_BLOCK_END = 'Jump to block end';
Blockly.Msg.SHORTCUTS_JUMP_TOP_STACK = 'Jump to top of stack';
Blockly.Msg.SHORTCUTS_JUMP_BOTTOM_STACK = 'Jump to bottom of stack';
Blockly.Msg.SHORTCUTS_JUMP_FIRST_BLOCK = 'Jump to first block';
Blockly.Msg.SHORTCUTS_JUMP_LAST_BLOCK = 'Jump to last block';
Blockly.Msg.KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT = 'Hold %1 and use arrow keys to move freely, then %2 to accept the position.';
Blockly.Msg.EDIT_BLOCK_CONTENTS = 'Edit Block contents';
Blockly.Msg.MOVE_BLOCK = 'Move Block';
Blockly.Msg.WINDOWS = 'Windows';
Blockly.Msg.MAC_OS = 'macOS';
Blockly.Msg.CHROME_OS = 'ChromeOS';
Blockly.Msg.LINUX = 'Linux';
Blockly.Msg.UNKNOWN = 'Unknown';
Blockly.Msg.CONTROL_KEY = 'Control';
Blockly.Msg.COMMAND_KEY = 'Command';
Blockly.Msg.OPTION_KEY = 'Option';
Blockly.Msg.ALT_KEY = 'Alt';
Blockly.Msg.ENTER_KEY = 'Enter';
Blockly.Msg.BACKSPACE_KEY = 'Backspace';
Blockly.Msg.DELETE_KEY = 'Delete';
Blockly.Msg.ESCAPE = 'Escape';
Blockly.Msg.TAB_KEY = 'Tab';
Blockly.Msg.SHIFT_KEY = 'Shift';
Blockly.Msg.CAPS_LOCK_KEY = 'Caps Lock';
Blockly.Msg.SPACE_KEY = 'Space';
Blockly.Msg.PAGE_UP_KEY = 'Page Up';
Blockly.Msg.PAGE_DOWN_KEY = 'Page Down';
Blockly.Msg.END_KEY = 'End';
Blockly.Msg.HOME_KEY = 'Home';
Blockly.Msg.INSERT_KEY = 'Insert';
Blockly.Msg.PAUSE_KEY = 'Pause';
Blockly.Msg.CONTEXT_MENU_KEY = '≣ Menu';
Blockly.Msg.CUT_SHORTCUT = 'Cut';
Blockly.Msg.COPY_SHORTCUT = 'Copy';
Blockly.Msg.PASTE_SHORTCUT = 'Paste';
Blockly.Msg.HELP_PROMPT = 'Press %1 for help on keyboard controls.';
Blockly.Msg.SHORTCUTS_GENERAL = 'General';
Blockly.Msg.SHORTCUTS_EDITING = 'Editing';
Blockly.Msg.SHORTCUTS_CODE_NAVIGATION = 'Code navigation';
Blockly.Msg.KEYBOARD_NAV_CONSTRAINED_MOVE_HINT = 'Use the arrow keys to move, then %1 to accept the position.';
Blockly.Msg.WORKSPACE_LABEL_PLAIN = 'Blocks workspace.';
Blockly.Msg.WORKSPACE_ROLEDESCRIPTION = 'workspace';
Blockly.Msg.WORKSPACE_LABEL_1_STACK = '1 stack of blocks';
Blockly.Msg.WORKSPACE_LABEL_MANY_STACKS = '%1 stacks of blocks';
Blockly.Msg.WORKSPACE_LABEL_MUTATOR_WORKSPACE = 'Block editor workspace';
Blockly.Msg.WORKSPACE_LABEL_FLYOUT_WORKSPACE = '%1 blocks';
Blockly.Msg.WORKSPACE_CONTENTS_BLOCKS_MANY = '%1 stacks of blocks%2 in workspace.';
Blockly.Msg.WORKSPACE_CONTENTS_BLOCKS_ONE = 'One stack of blocks%2 in workspace.';
Blockly.Msg.WORKSPACE_CONTENTS_BLOCKS_ZERO = 'No blocks%2 in workspace.';
Blockly.Msg.WORKSPACE_CONTENTS_COMMENTS_MANY = ' and %1 comments';
Blockly.Msg.WORKSPACE_CONTENTS_COMMENTS_ONE = ' and one comment';
Blockly.Msg.KEYBOARD_NAV_BLOCK_NAVIGATION_HINT = 'Use %1 to navigate inside of blocks.';
Blockly.Msg.KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT = 'Use the arrow keys to navigate.';
Blockly.Msg.KEYBOARD_NAV_FLYOUT_LABEL_HINT = 'Use the arrow keys to navigate to a block, or press %1 to go to the next heading.';
Blockly.Msg.BLOCK_LABEL_BEGIN_STACK = 'Begin stack';
Blockly.Msg.BLOCK_LABEL_BEGIN_PREFIX = 'Begin %1';
Blockly.Msg.BLOCK_LABEL_TOOLBOX_CATEGORY = '%1 category';
Blockly.Msg.BLOCK_LABEL_DISABLED = 'disabled';
Blockly.Msg.BLOCK_LABEL_COLLAPSED = 'collapsed';
Blockly.Msg.BLOCK_LABEL_REPLACEABLE = 'replaceable';
Blockly.Msg.BLOCK_LABEL_HAS_INPUT = 'has input';
Blockly.Msg.BLOCK_LABEL_HAS_INPUTS = 'has inputs';
Blockly.Msg.BLOCK_LABEL_HAS_BRANCHES = 'has %1 branches';
Blockly.Msg.BLOCK_LABEL_STATEMENT = 'statement';
Blockly.Msg.BLOCK_LABEL_CONTAINER = 'container';
Blockly.Msg.BLOCK_LABEL_VALUE = 'value';
Blockly.Msg.BLOCK_LABEL_STACK_BLOCKS = '%1 stack blocks';
Blockly.Msg.INPUT_LABEL_INDEX = 'input %1';
Blockly.Msg.INPUT_LABEL_VALUE = 'value position';
Blockly.Msg.INPUT_LABEL_STATEMENT = 'statement position';
Blockly.Msg.INPUT_LABEL_END_STATEMENT = 'End %1';
Blockly.Msg.INPUT_LABEL_EMPTY = 'Empty';
Blockly.Msg.INPUT_LABEL_CONDITION = 'condition';
Blockly.Msg.INPUT_LABEL_CONDITION_A = 'first condition';
Blockly.Msg.INPUT_LABEL_CONDITION_B = 'second condition';
Blockly.Msg.INPUT_LABEL_VALUE_A = 'first value';
Blockly.Msg.INPUT_LABEL_VALUE_B = 'second value';
Blockly.Msg.INPUT_LABEL_NUMBER = 'number';
Blockly.Msg.INPUT_LABEL_NUMBER_A = 'first number';
Blockly.Msg.INPUT_LABEL_NUMBER_B = 'second number';
Blockly.Msg.INPUT_LABEL_NUMBER_TO_CHECK = 'number to check';
Blockly.Msg.INPUT_LABEL_NUMBER_LIST = 'list of numbers';
Blockly.Msg.INPUT_LABEL_MATH_DIVIDEND = 'dividend';
Blockly.Msg.INPUT_LABEL_MATH_DIVISOR = 'divisor';
Blockly.Msg.INPUT_LABEL_MATH_CHANGE_BY = 'amount to change by';
Blockly.Msg.INPUT_LABEL_MATH_CONSTRAIN_VALUE = 'number to constrain';
Blockly.Msg.INPUT_LABEL_NUMBER_MIN = 'minimum';
Blockly.Msg.INPUT_LABEL_NUMBER_MAX = 'maximum';
Blockly.Msg.INPUT_LABEL_NUMBER_ATAN2_X = 'x coordinate';
Blockly.Msg.INPUT_LABEL_NUMBER_ATAN2_Y = 'y coordinate';
Blockly.Msg.INPUT_LABEL_LOOP_TIMES = 'number of times to repeat';
Blockly.Msg.INPUT_LABEL_LOOP_FROM = 'starting number';
Blockly.Msg.INPUT_LABEL_LOOP_TO = 'ending number';
Blockly.Msg.INPUT_LABEL_LOOP_BY = 'increment';
Blockly.Msg.INPUT_LABEL_LOOP_LIST = 'list to iterate over';
Blockly.Msg.INPUT_LABEL_TEXT_JOIN_ITEM = 'value %1';
Blockly.Msg.INPUT_LABEL_TEXT_APPEND = 'value to append';
Blockly.Msg.INPUT_LABEL_TEXT_TO_CHANGE = 'text to change';
Blockly.Msg.INPUT_LABEL_TEXT_TO_CHECK = 'text to check';
Blockly.Msg.INPUT_LABEL_TEXT_TO_FIND = 'text to find';
Blockly.Msg.INPUT_LABEL_TEXT_TO_REPLACE = 'text to replace';
Blockly.Msg.INPUT_LABEL_TEXT_POSITION = 'letter position';
Blockly.Msg.INPUT_LABEL_TEXT_START_POSITION = 'start position';
Blockly.Msg.INPUT_LABEL_TEXT_END_POSITION = 'end position';
Blockly.Msg.INPUT_LABEL_TEXT_PROMPT_MESSAGE = 'message';
Blockly.Msg.INPUT_LABEL_VARIABLES_SET = 'value to set';
Blockly.Msg.INPUT_LABEL_LISTS_CREATE_WITH_ITEM = 'value %1';
Blockly.Msg.INPUT_LABEL_LISTS_REPEAT_ITEM = 'value to repeat';
Blockly.Msg.INPUT_LABEL_LISTS_REPEAT_NUM = 'number of times to repeat';
Blockly.Msg.INPUT_LABEL_LISTS_TO_CHECK = 'list to check';
Blockly.Msg.INPUT_LABEL_LISTS_VALUE_TO_SET = 'value to set';
Blockly.Msg.INPUT_LABEL_LISTS_POSITION = 'position within list';
Blockly.Msg.INPUT_LABEL_LISTS_START_POSITION = 'start position';
Blockly.Msg.INPUT_LABEL_LISTS_END_POSITION = 'end position';
Blockly.Msg.INPUT_LABEL_LISTS_LIST_FROM_TEXT = 'text to split';
Blockly.Msg.INPUT_LABEL_LISTS_TEXT_FROM_LIST = 'list to join';
Blockly.Msg.INPUT_LABEL_LISTS_DELIMITER = 'delimiter';
Blockly.Msg.INPUT_LABEL_LISTS_TO_CHANGE = 'list to change';
Blockly.Msg.ANNOUNCE_MOVE_WORKSPACE = 'Moving %1 on workspace.';
Blockly.Msg.ANNOUNCE_MOVE_BEFORE = 'Moving %1 before %2.';
Blockly.Msg.ANNOUNCE_MOVE_AFTER = 'Moving %1 after %2.';
Blockly.Msg.ANNOUNCE_MOVE_INSIDE = 'Moving %1 inside %2.';
Blockly.Msg.ANNOUNCE_MOVE_AROUND = 'Moving %1 around %2.';
Blockly.Msg.ANNOUNCE_MOVE_TO = 'Moving %1 to %2.';
Blockly.Msg.ANNOUNCE_MOVE_OF = '%1 of %2';
Blockly.Msg.ANNOUNCE_MOVE_CANCELED = 'Canceled movement.';
Blockly.Msg.FIELD_LABEL_EMPTY = 'empty';
Blockly.Msg.ARIA_TYPE_FIELD_INPUT = 'input';
Blockly.Msg.ARIA_TYPE_FIELD_TEXT_INPUT = 'text';
Blockly.Msg.ARIA_TYPE_FIELD_NUMBER = 'number';
Blockly.Msg.ARIA_TYPE_FIELD_TEXT_INPUT_PROCEDURE = 'function name';
Blockly.Msg.ARIA_TYPE_FIELD_TEXT_INPUT_ARGUMENT = 'input name';
Blockly.Msg.ARIA_TYPE_FIELD_DROPDOWN = 'dropdown';
Blockly.Msg.ARIA_TYPE_FIELD_IMAGE = 'image';
Blockly.Msg.ARIA_TYPE_FIELD_CHECKBOX = 'checkbox';
Blockly.Msg.FIELD_LABEL_EDIT_PREFIX = 'Edit %1';
Blockly.Msg.OPEN_TRASH = 'Open trash';
Blockly.Msg.ZOOM_IN = 'Zoom in';
Blockly.Msg.ZOOM_OUT = 'Zoom out';
Blockly.Msg.RESET_ZOOM = 'Reset zoom';
Blockly.Msg.FIELD_LABEL_OPTION_INDEX = 'Option %1';
Blockly.Msg.FIELD_LABEL_CHECKBOX_CHECKED = 'Checked';
Blockly.Msg.FIELD_LABEL_CHECKBOX_UNCHECKED = 'Not checked';
Blockly.Msg.FIELD_LABEL_VARIABLE = 'Variable "%1"';
Blockly.Msg.ARIA_LABEL_BUTTON = 'button';
Blockly.Msg.ARIA_LABEL_HEADING = 'heading';
Blockly.Msg.BUBBLE_LABEL_DEFAULT = 'Bubble';
Blockly.Msg.BUBBLE_LABEL_COMMENT = 'Comment: %1';
Blockly.Msg.BUBBLE_LABEL_WARNING = 'Warning: %1';
Blockly.Msg.ICON_LABEL_DEFAULT = 'Icon';
Blockly.Msg.ICON_LABEL_COMMENT_CLOSED = 'Open Comment';
Blockly.Msg.ICON_LABEL_COMMENT_OPEN = 'Close Comment';
Blockly.Msg.ICON_LABEL_MUTATOR_CLOSED = 'Edit this block';
Blockly.Msg.ICON_LABEL_MUTATOR_OPEN = 'Close block editor';
Blockly.Msg.ICON_LABEL_WARNING_CLOSED = 'Open Warning';
Blockly.Msg.ICON_LABEL_WARNING_OPEN = 'Close Warning';
Blockly.Msg.ARIA_LABEL_COMMENT = 'Comment';
Blockly.Msg.ARIA_LABEL_COMMENT_COLLAPSE = 'Collapse Comment';
Blockly.Msg.ARIA_LABEL_COMMENT_EXPAND = 'Expand Comment';
Blockly.Msg.SCREENREADER_MODE_ENABLED = 'Screenreader mode is on, press %1 to turn it off';
Blockly.Msg.SCREENREADER_MODE_DISABLED = 'Screenreader mode is off, press %1 to turn it on';
Blockly.Msg.CURRENT_BLOCK_ANNOUNCEMENT = 'Current block: %1';
Blockly.Msg.PARENT_BLOCKS_ANNOUNCEMENT = 'Parent blocks: %1';
Blockly.Msg.NO_PARENT_ANNOUNCEMENT = 'Current block has no parent';
Blockly.Msg.SCREENREADER_HINT = 'Use the arrow keys to navigate. Press %1 to toggle screenreader accessibility mode.';
Blockly.Msg.ARIA_LABEL_ADD_ELSE_IF = 'Add else if';
Blockly.Msg.ARIA_LABEL_REMOVE_ELSE_IF = 'Remove else if';
Blockly.Msg.ARIA_LABEL_ADD_LIST_ITEM = 'Add list item';
Blockly.Msg.ARIA_LABEL_REMOVE_LIST_ITEM = 'Remove list item';
Blockly.Msg.ARIA_LABEL_ADD_TEXT = 'Add text';
Blockly.Msg.ARIA_LABEL_REMOVE_TEXT = 'Remove text';
Blockly.Msg.ARIA_LABEL_ADD_INPUT = 'Add input';
Blockly.Msg.ARIA_LABEL_REMOVE_INPUT = 'Remove input';
Blockly.Msg.ARIA_TYPE_FIELD_ANGLE = 'angle';
Blockly.Msg.ARIA_LABEL_FIELD_ANGLE = '%1 degrees';
Blockly.Msg.ARIA_TYPE_FIELD_DATE = 'date';
Blockly.Msg.ARIA_TYPE_FIELD_COLOUR = 'color';
Blockly.Msg.ARIA_TYPE_FIELD_BITMAP = 'pixel image';
Blockly.Msg.ARIA_TYPE_FIELD_GRID = 'grid dropdown';
Blockly.Msg.FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE = 'Randomize';
Blockly.Msg.FIELD_BITMAP_BUTTON_LABEL_CLEAR = 'Clear';
Blockly.Msg.FIELD_BITMAP_PIXEL_ON = 'on';
Blockly.Msg.FIELD_BITMAP_PIXEL_OFF = 'off';
Blockly.Msg.FIELD_BITMAP_PIXEL_LABEL = '%1, row %2, column %3';
Blockly.Msg.FIELD_BITMAP_ARIA_VALUE = '%1 by %2, %3 pixels on';
Blockly.Msg.OPEN_BACKPACK = 'Open backpack';
Blockly.Msg.CLOSE_BACKPACK = 'Close backpack';
Blockly.Msg.COPY_ALL_TO_BACKPACK = 'Copy All Blocks to Backpack';
Blockly.Msg.COPY_TO_BACKPACK = 'Copy to Backpack';
Blockly.Msg.EMPTY_BACKPACK = 'Empty Backpack';
Blockly.Msg.PASTE_ALL_FROM_BACKPACK = 'Paste All Blocks from Backpack';
Blockly.Msg.REMOVE_FROM_BACKPACK = 'Remove from Backpack';
Blockly.Msg.FIELD_MULTILINEINPUT_FINISH_EDITING = 'Finish editing';
Blockly.Msg.FIELD_MULTILINEINPUT_NEW_LINE = 'New line';
Blockly.Msg.ZOOM_TO_FIT_ARIA_LABEL = 'Zoom to fit';
Blockly.Msg.MINIMAP_ARIA_LABEL = 'Workspace minimap. Use the arrow keys to pan the workspace.';
Blockly.Msg.ARIA_LABEL_TRASH_EMPTY = 'Trash, currently empty';
