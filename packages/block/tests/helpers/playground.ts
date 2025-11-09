/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {beforeAll, afterAll} from '@jest/globals';
import * as Blockly from 'blockly/core';
import * as Blocks from '../../src/index';
import {Gesture} from './gesture';

import * as toolbox from '../toolbox.json';

export interface PlaygroundTestContext {
  workspace: Blockly.WorkspaceSvg;
  gesture: Gesture;
}

const defaultOptions: Blockly.BlocklyOptions = {
  media: '../../media',
  collapse: false,
  disable: false,
  toolbox: toolbox,
  horizontalLayout: false,
  toolboxPosition: 'left',
  move: {
    scrollbars: true,
    wheel: true
  },
  zoom: {
    controls: true,
    wheel: true,
    startScale: 0.675,
    maxScale: 4,
    minScale: 0.25,
    scaleSpeed: 1.1
  }
};

/**
 * Setup the context of playground test.
 * @param options Optional dictionary of options.
 * @returns Context for testing.
 */
export function setupPlayground(options?: Blockly.BlocklyOptions) {
  const context = {} as PlaygroundTestContext;

  beforeAll(() => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    (window as any).Blockly.Msg = Blockly.Msg;
    require('../../msg/messages');

    context.workspace = Blocks.inject(container, Object.assign({}, defaultOptions, options));
    context.gesture = new Gesture(context.workspace);
  });

  afterAll(() => {
    context.workspace.dispose();
  });

  return context;
}
