/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

import * as Constants from './constants';
import {createTheme} from './colours';
import {registerScratchContextMenu} from './contextmenu_items';
import {registerFieldAngle} from './fields/angle';
import {registerFieldButton} from './fields/button';
import {registerFieldColourSlider} from './fields/colour_slider';
import {registerFieldMatrix} from './fields/matrix';
import {registerFieldNote} from './fields/note';
import {registerFieldTextInputRemovable} from './fields/textinput_removable';
import {registerFieldVariableGetter} from './fields/variable_getter';
import {registerFieldVerticalSeparator} from './fields/vertical_separator';
import {flyoutCategory as variableCategory} from './data_category';
import {flyoutCategory as procedureCategory} from './procedures_category';
import {isProcedureCallBlock, isProcedurePrototypeBlock} from './blocks/procedures';
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

import './block_comment_icon';

import './renderer/renderer';
import './connection_checker';
import './dragger';
import './insertion_marker_previewer';

import './toolbox/flyout';
import './toolbox/toolbox';
import './toolbox/category';
import './toolbox/collapsible_category';
import './toolbox/inflaters/block';
import './toolbox/inflaters/label';
import './toolbox/inflaters/status_indicator_label';

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

/**
 * Inject a Blockly editor into the specified container element (usually a div).
 * The necessary stuffs and dynamic categories for main workspace will be registered.
 * If there is a need to inject multiple workspaces, use `injectWorkspace` after the
 * first workspace injected.
 * @param container Containing element, or its ID, or a CSS selector.
 * @param options Optional dictionary of options.
 * @returns Newly created main workspace.
 */
export function inject(container: Element | string, options?: Blockly.BlocklyOptions) {
  // Register the fields.
  registerFieldAngle();
  registerFieldButton();
  registerFieldColourSlider();
  registerFieldMatrix();
  registerFieldNote();
  registerFieldTextInputRemovable();
  registerFieldVariableGetter();
  registerFieldVerticalSeparator();
  registerScratchContextMenu();

  // Register styles.

  Blockly.Css.register(styles);
  Blockly.Css.register(commentStyles);

  // Add workspace comment options.
  Blockly.ContextMenuItems.registerCommentOptions();

  // Unregister unused items.
  Blockly.ContextMenuRegistry.registry.unregister('blockInline');

  const workspace = injectWorkspace(container, options);

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
 * Inject a Blockly editor into the specified container element (usually a div).
 * @param container Containing element, or its ID, or a CSS selector.
 * @param options Optional dictionary of options.
 * @returns Newly created main workspace.
 */
export function injectWorkspace(container: Element | string, options?: Blockly.BlocklyOptions) {
  const defaultOptions: Blockly.BlocklyOptions = {
    renderer: 'scratch',
    theme: createTheme()
  };
  options = Object.assign(defaultOptions, options);
  return Blockly.inject(container, options);
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

export {reportValue} from './report_value';
export {setExternalProcedureDefCallback} from './procedures_category';
export {setGetCheckboxState} from './utils';

// Monkey-patches
Blockly.Scrollbar.scrollbarThickness = Blockly.Touch.TOUCH_ENABLED ? 14 : 11;
Blockly.FlyoutButton.TEXT_MARGIN_X = 40;
Blockly.FlyoutButton.TEXT_MARGIN_Y = 10;
Blockly.comments.CommentView.defaultCommentSize = new Blockly.utils.Size(200, 200);
Blockly.ToolboxCategory.nestedPadding = 6;
