/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

import * as Constants from './constants';
import {createTheme} from './colours';
import {registerFieldAngle} from './fields/angle';
import {registerFieldButton} from './fields/button';
import {registerFieldColourSlider} from './fields/colour_slider';
import {registerFieldMatrix} from './fields/matrix';
import {registerFieldNote} from './fields/note';
import {registerFieldTextInputRemovable} from './fields/textinput_removable';
import {registerFieldVariableGetter} from './fields/variable_getter';
import {registerFieldVerticalSeparator} from './fields/vertical_separator';
import {registerScratchCategory} from './toolbox/category';
import {ContinuousToolBox} from './toolbox/toolbox';
import {ContinuousVerticalFlyout} from './toolbox/flyout';
import {flyoutCategory as variableCategory} from './data_category';
import {flyoutCategory as procedureCategory} from './procedures_category';
import styles from './styles/blockly.css';

import './renderer/renderer';
import './connection_checker';

import './blocks/extensions';
import './blocks/common';
import './blocks/data';
import './blocks/procedures';
import './blocks/test';

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

  registerScratchCategory();

  Blockly.Css.register(styles);

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
    theme: createTheme(),
    plugins: {
      toolbox: ContinuousToolBox,
      flyoutsVerticalToolbox: ContinuousVerticalFlyout
    }
  };
  options = Object.assign(defaultOptions, options);
  return Blockly.inject(container, options);
}

export {setExternalProcedureDefCallback} from './procedures_category';

// Monkey-patches
Blockly.Scrollbar.scrollbarThickness = Blockly.Touch.TOUCH_ENABLED ? 14 : 11;
