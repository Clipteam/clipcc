/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

import * as Constants from './constants';
import {injectCssVariables, Scratch} from './theme';
import {registerScratchContextMenu} from './contextmenu_items';
import {registerScratchShortcuts} from './shortcut_items';
import {FieldAngle, registerFieldAngle} from './fields/angle';
import {FieldButton, registerFieldButton} from './fields/button';
import {FieldColourSlider, registerFieldColourSlider} from './fields/colour_slider';
import {FieldMatrix, registerFieldMatrix} from './fields/matrix';
import {FieldNote, registerFieldNote} from './fields/note';
import {FieldNumber, registerFieldNumber} from './fields/number';
import {FieldVariable, registerFieldVariable} from './fields/variable';
import {FieldTextInputRemovable, registerFieldTextInputRemovable} from './fields/textinput_removable';
import {FieldVariableGetter, registerFieldVariableGetter} from './fields/variable_getter';
import {FieldVerticalSeparator, registerFieldVerticalSeparator} from './fields/vertical_separator';
import {flyoutCategory as variableCategory} from './data_category';
import {flyoutCategory as procedureCategory} from './procedures_category';
import {isProcedureCallBlock, isProcedurePrototypeBlock} from './blocks/procedures';
import {ZoomControls} from './zoom_controls';
import {buildGlowFilter} from './glow';
import styles from './styles/blockly.css';
import commentStyles from './styles/comment.css';

import {FuncChange} from './events/func_change';
import {FuncCreate} from './events/func_create';
import {FuncDelete} from './events/func_delete';
import './events/block_comment_create';
import './events/block_comment_delete';
import './events/block_comment_move';
import './events/block_comment_resize';
import './events/block_comment_collapse';
import './events/block_change';
import './events/var_create';
import './events/var_delete';

import './renderer/renderer';
import './connection_checker';
import './block_comment_icon';
import './dragger';
import './metrics_manager';
import './insertion_marker_previewer';

import './toolbox/flyout';
import './toolbox/toolbox';
import './toolbox/category';
import './toolbox/collapsible_category';
import './toolbox/inflaters/block';
import './toolbox/inflaters/label';
import './toolbox/inflaters/status_indicator_label';

import './variable_model';
import './variable_map';

import './blocks/extensions';
import './blocks/common';
import './blocks/motion';
import './blocks/looks';
import './blocks/sound';
import './blocks/event';
import './blocks/control';
import './blocks/sensing';
import './blocks/operators';
import './blocks/data';
import './blocks/procedures';

import './serialization/procedures';
import {virtualize} from './virtualized_manager';

export interface ClipCCBlockOptions extends Blockly.BlocklyOptions {
  virtualized?: boolean;
}

/**
 * Inject a Blockly editor into the specified container element (usually a div).
 * @param container Containing element, or its ID, or a CSS selector.
 * @param options Optional dictionary of options.
 * @returns Newly created main workspace.
 */
export function inject(container: Element | string, options?: ClipCCBlockOptions) {
  const defaultOptions = {
    renderer: 'scratch',
    theme: Scratch
  } satisfies ClipCCBlockOptions;
  options = Object.assign(defaultOptions, options);
  const workspace = Blockly.inject(container, options);

  if (options.virtualized) {
    virtualize(workspace);
  }

  // Register styles.
  injectCssVariables(workspace);

  // Build glow filter for glowStack.
  buildGlowFilter(workspace);

  // Dynamic categories.
  workspace.registerToolboxCategoryCallback(
    Constants.VARIABLE_CATEGORY_NAME,
    variableCategory
  );
  workspace.registerToolboxCategoryCallback(
    Constants.PROCEDURE_CATEGORY_NAME,
    procedureCategory
  );

  // Event listener to update toolbox selection. VAR_CREATE, VAR_DELETE, VAR_RENAME
  // and VAR_TYPE_CHANGE has been listend internally.
  // See (private) Blockly.Workspace.variableChangeCallback.
  workspace.addChangeListener((event: Blockly.Events.Abstract) => {
    switch (event.type) {
      case FuncChange.TYPE: {
        // Update all procedure blocks.
        Blockly.Events.disable();
        const allBlocks = workspace.getAllBlocks(false);
        for (const block of allBlocks) {
          if (isProcedureCallBlock(block) || isProcedurePrototypeBlock(block)) {
            block.updateDisplay_();
          }
        }
        Blockly.Events.enable();

        workspace.refreshToolboxSelection();
        break;
      }
      case FuncCreate.TYPE:
      case FuncDelete.TYPE:
        workspace.refreshToolboxSelection();
        break;
    }
  });

  workspace.refreshToolboxSelection();
  return workspace;
}

/**
 * Returns the state of the workspace as a plain JavaScript object.
 * @param workspace The workspace to serialize.
 * @returns The serialized state of the workspace.
 */
export function saveWorkspace(workspace: Blockly.Workspace) {
  return Blockly.serialization.workspaces.save(workspace);
}

/**
 * Loads the variable represented by the given state into the given workspace.
 * @param state The state of the workspace to deserialize into the workspace.
 * @param workspace The workspace to add the new state to.
 * @param recordUndo If true, events triggered by this function will be
 *     undo-able by the user. False by default.
 */
export function loadWorkspace(
  state: {[key: string]: unknown},
  workspace: Blockly.Workspace,
  recordUndo?: boolean
) {
  Blockly.serialization.workspaces.load(state, workspace, {recordUndo});
}

/**
 * Clears the workspace and loads the given serialized state.
 * @deprecated XML serialization is discouraged to use in Blockly and
 * lack many essential stuffs like customizing variables and procedures.
 * The function is just kept for backward compatibility, use
 * `loadWorkspace()` instead.
 * @param xml XML representation of a Blockly workspace.
 * @param workspace The workspace to load the serialized data onto.
 * @returns The block IDs of the blocks that were loaded.
 */
export function clearWorkspaceAndLoadFromXml(
  xml: Element,
  workspace: Blockly.WorkspaceSvg
): string[] {
  workspace.setResizesEnabled(false);
  Blockly.Events.setGroup(true);
  workspace.clear();

  console.warn('clearWorkspaceAndLoadFromXml is deprecated and broken. Please use loadWorkspace instead.');

  const blockIds = Blockly.Xml.domToWorkspace(xml, workspace);
  workspace.setResizesEnabled(true);
  return blockIds;
}

/**
 * Set up environments for the clipcc-block. It should be called only once before
 * creating any workspaces.
 */
function setupEnvironment() {
  // Register the fields.
  registerFieldAngle();
  registerFieldButton();
  registerFieldColourSlider();
  registerFieldMatrix();
  registerFieldNote();
  registerFieldNumber();
  registerFieldVariable();
  registerFieldTextInputRemovable();
  registerFieldVariableGetter();
  registerFieldVerticalSeparator();
  registerScratchContextMenu();
  registerScratchShortcuts();

  Blockly.Css.register(styles);
  Blockly.Css.register(commentStyles);

  // Add workspace comment options.
  Blockly.ContextMenuItems.registerCommentOptions();

  // Unregister unused items.
  Blockly.ContextMenuRegistry.registry.unregister('blockInline');

  // Monkey-patches
  Blockly.Scrollbar.scrollbarThickness = Blockly.Touch.TOUCH_ENABLED ? 14 : 11;
  Blockly.FlyoutButton.TEXT_MARGIN_X = 40;
  Blockly.FlyoutButton.TEXT_MARGIN_Y = 10;
  Blockly.comments.CommentView.defaultCommentSize = new Blockly.utils.Size(200, 200);
  Blockly.ToolboxCategory.nestedPadding = 6;

  Blockly.WorkspaceSvg.prototype.addZoomControls = function() {
    this.zoomControls_ = new ZoomControls(this) as unknown as Blockly.ZoomControls;
    const svgZoomControls = this.zoomControls_.createDom();
    this.svgGroup_.appendChild(svgZoomControls);
  };
}

// Environment Setup
setupEnvironment();

// Exports
export * from 'blockly/core';

export * as callbackRegistry from './callback_registry';
export * as constants from './constants';
export * as scratchBlocksUtils from './utils';
export type * as proceduresSerializer from './serialization/procedures';
export type * as variableModel from './variable_model';

export {reportValue} from './report_value';
export {Colours} from './theme';
export {BlockDragEnd} from './events/block_drag_end';
export * as Theme from './theme';
export {glowStack} from './glow';

export {
  FieldAngle,
  FieldButton,
  FieldColourSlider,
  FieldMatrix,
  FieldNote,
  FieldNumber,
  FieldVariable,
  FieldTextInputRemovable,
  FieldVariableGetter,
  FieldVerticalSeparator
};
