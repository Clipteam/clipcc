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
import {registerFieldVariableGetter} from './fields/variable_getter';
import {registerScratchCategory} from './toolbox/category';
import {ContinuousToolBox} from './toolbox/toolbox';
import {ContinuousVerticalFlyout} from './toolbox/flyout';
import {flyoutCategory as variableCategory} from './data_category';

import './blocks/extensions';
import './blocks/common';
import './blocks/data';
import './blocks/test';

export function inject(container: Element | string, options?: Blockly.BlocklyOptions) {
  // Register the fields.
  registerFieldAngle();
  registerFieldButton();
  registerFieldColourSlider();
  registerFieldMatrix();
  registerFieldNote();
  registerFieldVariableGetter();

  registerScratchCategory();

  const defaultOptions: Blockly.BlocklyOptions = {
    renderer: 'zelos',
    theme: createTheme(),
    plugins: {
      toolbox: ContinuousToolBox,
      flyoutsVerticalToolbox: ContinuousVerticalFlyout
    }
  };
  options = Object.assign(defaultOptions, options);

  const workspace = Blockly.inject(container, options);

  // Dynamic categories.
  workspace.registerToolboxCategoryCallback(
    Constants.VARIABLE_CATEGORY_NAME,
    variableCategory
  );

  return workspace;
}
