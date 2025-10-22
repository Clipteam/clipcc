/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ConstantProvider} from './constants';
import {RenderInfo} from './render_info';

/**
 * Custom renderer for Scratch-style blocks.
 */
export class ScratchRenderer extends Blockly.zelos.Renderer {
  /**
   * Create a new instance of the renderer's constant provider.
   * @returns The constant provider.
   */
  protected override makeConstants_(): ConstantProvider {
    return new ConstantProvider();
  }

  /**
   * Create a new instance of the renderer's render info object.
   * @param block The block to measure.
   * @returns The render info object.
   */
  protected override makeRenderInfo_(block: Blockly.BlockSvg): Blockly.zelos.RenderInfo {
    return new RenderInfo(this, block);
  }
}

Blockly.blockRendering.register('scratch', ScratchRenderer);
