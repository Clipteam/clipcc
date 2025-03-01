/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { createTheme } from './colours';
import { registerFieldAngle } from './fields/angle';
import { registerFieldButton } from './fields/button';
import { registerFieldColourSlider } from './fields/colour_slider';
import { registerFieldMatrix } from './fields/matrix';
import { registerFieldNote } from './fields/note';

import './blocks/extensions';
import './blocks/common';
import './blocks/test';

export function inject(container: Element | string, options?: Blockly.BlocklyOptions) {
  // Register the fields.
  registerFieldAngle();
  registerFieldButton();
  registerFieldColourSlider();
  registerFieldMatrix();
  registerFieldNote();

  const defaultOptions: Blockly.BlocklyOptions = {
    renderer: 'zelos',
    theme: createTheme()
  };
  options = Object.assign(defaultOptions, options);

  const workspace = Blockly.inject(container, options);

  return workspace;
}
