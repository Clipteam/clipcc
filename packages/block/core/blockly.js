/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2011 Google Inc.
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
 * @fileoverview Core JavaScript library for Blockly.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

/**
 * The top level namespace used to access the Blockly library.
 * @namespace Blockly
 **/
import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly');

import {Block} from './block';
import * as BlockAnimations from './block_animations';
import {BlockDragSurfaceSvg} from './block_drag_surface';
import {BlockDragger} from './block_dragger';
import {BlockSvg} from './block_svg';
import './block_render_svg_vertical';
// import './block_render_svg_horizontal'; // unused
import {Blocks} from './blocks';
import * as browserEvents from './browser_events';
import {Bubble} from './bubble';
import {BubbleDragger} from './bubble_dragger';
import * as clipboard from './clipboard';
import {Colours} from './colours';
import {Comment} from './comment';
import * as common from './common';
import {Connection} from './connection';
import {ConnectionDB} from './connection_db';
import * as constants from './constants';
import {ContextMenu} from './contextmenu';
import * as Css from './css';
import {DataCategory} from './data_category';
import * as dialog from './dialog';
import {DraggedConnectionManager} from './dragged_connection_manager';
import {DropDownDiv} from './dropdowndiv';
import * as Events from './events/events';
import * as Extensions from './extensions';
import {Field} from './field';
import {FieldAngle} from './field_angle';
import {FieldCheckbox} from './field_checkbox';
import {FieldColour} from './field_colour';
import {FieldColourSlider} from './field_colour_slider';
import {FieldDropdown} from './field_dropdown';
import {FieldIconMenu} from './field_iconmenu';
import {FieldImage} from './field_image';
import {FieldLabel} from './field_label';
import {FieldLabelSerializable} from './field_label_serializable';
import {FieldMatrix} from './field_matrix';
import {FieldNote} from './field_note';
import {FieldNumber} from './field_number';
import {FieldNumberDropdown} from './field_numberdropdown';
import {FieldTextDropdown} from './field_textdropdown';
import {FieldTextInput} from './field_textinput';
import {FieldTextInputRemovable} from './field_textinput_removable';
import {FieldVariable} from './field_variable';
import {FieldVariableGetter} from './field_variable_getter';
import {FieldVerticalSeparator} from './field_vertical_separator';
import {Flyout} from './flyout_base';
import {FlyoutButton} from './flyout_button';
import {FlyoutDragger} from './flyout_dragger';
import {FlyoutExtensionCategoryHeader} from './flyout_extension_category_header';
import {HorizontalFlyout} from './flyout_horizontal';
import {VerticalFlyout} from './flyout_vertical';
import {Generator} from './generator';
import {Gesture} from './gesture';
import {Grid} from './grid';
import {Icon} from './icon';
import * as inject from './inject';
import {Input} from './input';
import {InsertionMarkerManager} from './insertion_marker_manager';
import {Msg} from './msg';
import {Mutator} from './mutator';
import {Names} from './names';
import {Options} from './options';
import * as Procedures from './procedures';
import * as registry from './registry';
import {RenderedConnection} from './rendered_connection';
import {ScratchBlockComment} from './scratch_block_comment';
import * as scratchBlocksUtils from './scratch_blocks_utils';
import {ScratchBubble} from './scratch_bubble';
import * as ScratchMsgs from './scratch_msgs';
import {Scrollbar} from './scrollbar';
import {ScrollbarPair} from './scrollbar_pair';
import {Toolbox} from './toolbox';
import {Tooltip} from './tooltip';
import * as Touch from './touch';
import {Trashcan} from './trashcan';
import * as utils from './utils';
import {VariableMap} from './variable_map';
import {VariableModel} from './variable_model';
import * as Variables from './variables';
import {VirtualizedManager} from './virtualized_manager';
import {Warning} from './warning';
import {WidgetDiv} from './widgetdiv';
import {Workspace} from './workspace';
import {WorkspaceAudio} from './workspace_audio';
import {WorkspaceComment} from './workspace_comment';
import {WorkspaceCommentSvg} from './workspace_comment_svg';
import './workspace_comment_render_svg';
import {WorkspaceDragger} from './workspace_dragger';
import {WorkspaceSvg} from './workspace_svg';
import * as Xml from './xml';
import {ZoomControls} from './zoom_controls';

/**
 * Cached value for whether 3D is supported.
 * @type {!boolean}
 * @private
 */
const cache3dSupported = null;

/**
 * Cancel the native context menu, unless the focus is on an HTML input widget.
 * @param {!Event} e Mouse down event.
 * @private
 */
const onContextMenu = function(e) {
  if (!utils.isTargetInput(e)) {
    // When focused on an HTML text input widget, don't cancel the context menu.
    e.preventDefault();
  }
};

/**
 * Close tooltips, context menus, dropdown selections, etc.
 * @param {boolean=} opt_allowToolbox If true, don't close the toolbox.
 * @deprecated Use common.getMainWorkspace().hideChaff(opt_allowToolbox)
 */
export const hideChaff = function(opt_allowToolbox) {
  common.getMainWorkspace().hideChaff(opt_allowToolbox);
};

/**
 * Close tooltips, context menus, dropdown selections, etc.
 * For some elements (e.g. field text inputs), rather than hiding, it will
 * move them.
 * @param {boolean=} opt_allowToolbox If true, don't close the toolbox.
 * @deprecated Use common.getMainWorkspace().hideChaffOnResize(opt_allowToolbox)
 */
export const hideChaffOnResize = function(opt_allowToolbox) {
  common.getMainWorkspace().hideChaffOnResize(opt_allowToolbox);
};

/**
 * Returns the main workspace.  Returns the last used main workspace (based on
 * focus).  Try not to use this function, particularly if there are multiple
 * Blockly instances on a page.
 * @return {!Workspace.Workspace} The main workspace.
 * @deprecated Use common.getMainWorkspace()
 */
export const getMainWorkspace = function() {
  return common.getMainWorkspace();
};

/**
 * Refresh the visual state of a status button in all extension category headers.
 * @param {Workspace.Workspace} workspace A workspace.
 */
export const refreshStatusButtons = function(workspace) {
  const buttons = workspace.getFlyout().buttons_;
  for (let i = 0; i < buttons.length; i++) {
    if (buttons[i] instanceof FlyoutExtensionCategoryHeader) {
      buttons[i].refreshStatus();
    }
  }
};

/**
 * Helper function for defining a block from JSON.  The resulting function has
 * the correct value of jsonDef at the point in code where jsonInit is called.
 * @param {!Object} jsonDef The JSON definition of a block.
 * @return {function()} A function that calls jsonInit with the correct value
 *     of jsonDef.
 * @private
 */
const jsonInitFactory = function(jsonDef) {
  return function() {
    this.jsonInit(jsonDef);
  };
};

/**
 * Define blocks from an array of JSON block definitions, as might be generated
 * by the Blockly Developer Tools.
 * @param {!Array.<!Object>} jsonArray An array of JSON block definitions.
 */
export const defineBlocksWithJsonArray = function(jsonArray) {
  for (let i = 0; i < jsonArray.length; i++) {
    const elem = jsonArray[i];
    if (!elem) {
      console.warn(
          'Block definition #' + i + ' in JSON array is ' + elem + '. ' +
          'Skipping.');
    } else {
      const typename = elem.type;
      if (typename == null || typename === '') {
        console.warn(
            'Block definition #' + i +
            ' in JSON array is missing a type attribute. Skipping.');
      } else {
        if (Blocks[typename]) {
          console.warn(
              'Block definition #' + i + ' in JSON array' +
              ' overwrites prior definition of "' + typename + '".');
        }
        Blocks[typename] = {
          init: jsonInitFactory(elem)
        };
      }
    }
  }
};

/**
 * Is the given string a number (includes negative and decimals).
 * @param {string} str Input string.
 * @return {boolean} True if number, false otherwise.
 */
export const isNumber = function(str) {
  return !!str.match(/^\s*-?\d+(\.\d+)?\s*$/);
};

// monkey-patched code

/**
 * Show the context menu for this workspace comment.
 * @param {!Event} e Mouse event.
 * @private
 */
WorkspaceCommentSvg.prototype.showContextMenu_ = function(e) {
  if (this.workspace.options.readOnly) {
    return;
  }
  // Save the current workspace comment in a variable for use in closures.
  const comment = this;
  const menuOptions = [];

  if (this.isDeletable() && this.isMovable()) {
    menuOptions.push(ContextMenu.commentDuplicateOption(comment));
    menuOptions.push(ContextMenu.commentDeleteOption(comment));
  }

  ContextMenu.show(e, menuOptions, this.RTL);
};

/**
 * Obtain a newly created block.
 * @param {?string} prototypeName Name of the language object containing
 *     type-specific functions for this block.
 * @param {string=} opt_id Optional ID.  Use this ID if provided, otherwise
 *     create a new ID.
 * @return {!Block} The created block.
 */
Workspace.prototype.newBlock = function(prototypeName, opt_id) {
  return new Block(this, prototypeName, opt_id);
};

/**
 * Obtain a newly created block.
 * @param {?string} prototypeName Name of the language object containing
 *     type-specific functions for this block.
 * @param {string=} opt_id Optional ID.  Use this ID if provided, otherwise
 *     create a new ID.
 * @return {!BlockSvg} The created block.
 */
WorkspaceSvg.prototype.newBlock = function(prototypeName, opt_id) {
  return new BlockSvg(this, prototypeName, opt_id);
};

export {
  Block,
  BlockAnimations,
  BlockDragSurfaceSvg,
  BlockDragger,
  BlockSvg,
  Blocks,
  browserEvents,
  Bubble,
  BubbleDragger,
  clipboard,
  Colours,
  Comment,
  common,
  Connection,
  ConnectionDB,
  constants,
  ContextMenu,
  Css,
  DataCategory,
  dialog,
  DraggedConnectionManager,
  DropDownDiv,
  Events,
  Extensions,
  Field,
  FieldAngle,
  FieldCheckbox,
  FieldColour,
  FieldColourSlider,
  FieldDropdown,
  FieldIconMenu,
  FieldImage,
  FieldLabel,
  FieldLabelSerializable,
  FieldMatrix,
  FieldNote,
  FieldNumber,
  FieldNumberDropdown,
  FieldTextDropdown,
  FieldTextInput,
  FieldTextInputRemovable,
  FieldVariable,
  FieldVariableGetter,
  FieldVerticalSeparator,
  Flyout,
  FlyoutButton,
  FlyoutDragger,
  FlyoutExtensionCategoryHeader,
  HorizontalFlyout,
  VerticalFlyout,
  Generator,
  Gesture,
  Grid,
  Icon,
  inject,
  Input,
  InsertionMarkerManager,
  Msg,
  Mutator,
  Names,
  Options,
  Procedures,
  registry,
  RenderedConnection,
  ScratchBlockComment,
  scratchBlocksUtils,
  ScratchBubble,
  ScratchMsgs,
  Scrollbar,
  ScrollbarPair,
  Toolbox,
  Tooltip,
  Touch,
  Trashcan,
  utils,
  VariableMap,
  VariableModel,
  Variables,
  VirtualizedManager,
  Warning,
  WidgetDiv,
  Workspace,
  WorkspaceAudio,
  WorkspaceComment,
  WorkspaceCommentSvg,
  WorkspaceDragger,
  WorkspaceSvg,
  Xml,
  ZoomControls
};

// IE9 does not have a console.  Create a stub to stop errors.
if (!goog.global['console']) {
  goog.global['console'] = {
    'log': function() {},
    'warn': function() {}
  };
}

// Export symbols that would otherwise be renamed by Closure compiler.
if (!goog.global['Blockly']) {
  goog.global['Blockly'] = {};
}
goog.global['Blockly']['getMainWorkspace'] = common.getMainWorkspace;
