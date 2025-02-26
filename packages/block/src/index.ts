/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import { registerFieldAngle } from './fields/angle';
import { registerFieldMatrix } from './fields/matrix';
import './blocks/extensions';
import './blocks/test';

export function inject(container: Element | string, options?: Blockly.BlocklyOptions) {
  // Register the fields.
  registerFieldAngle();
  registerFieldMatrix();

  const defaultOptions: Blockly.BlocklyOptions = {
    renderer: 'zelos'
  };
  options = Object.assign(defaultOptions, options);

  const workspace = Blockly.inject(container, options);
  return workspace;
}
