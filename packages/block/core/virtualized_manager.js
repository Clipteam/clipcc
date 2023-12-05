/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2014 Google Inc.
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
 * @fileoverview Object managing whether blocks should be show.
 */

'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.VirtualizedManager');

import * as utils from './utils';


/**
 * Class for virtualized manager.
 * @param {Blockly.WorkspaceSvg} workspace The workspace.
 */
export const VirtualizedManager = function(workspace) {
  this.workspace = workspace;
  this._observedBlocks = [];
  this._requestedCheck = false;
  this.observe = this.observe.bind(this);
  this.unobserve = this.unobserve.bind(this);
  this.requestCheck = this.requestCheck.bind(this);
  this.dispose = this.dispose.bind(this);
};

/**
 * Observe a block.
 * @param {Blockly.BlockSvg} block The block to observe.
 */
VirtualizedManager.prototype.observe = function(block) {
  if (!this._observedBlocks.includes(block)) {
    this._observedBlocks.push(block);
  }
};

/**
 * Unobserve a block.
 * @param {Blockly.BlockSvg} block The block to unobserve.
 */
VirtualizedManager.prototype.unobserve = function(block) {
  if (this._observedBlocks.includes(block)) {
    this._observedBlocks = this._observedBlocks.filter(function(i) {
      return i !== block;
    });
  }
};

/**
 * Dispose VirtualizedManager.
 */
VirtualizedManager.prototype.dispose = function() {
  this._observedBlocks = [];
};

/**
 * Request check if block need to be show or hide.
 */
VirtualizedManager.prototype.requestCheck = function() {
  if (!this._requestedCheck) {
    this._requestedCheck = true;
      queueMicrotask(() => {
        this.check_();
        this._requestedCheck = false;
    });
  }
}

/**
 * Check if block need to be show or hide.
 */
VirtualizedManager.prototype.check_ = function() {
  const workspace = this.workspace;
  const workspaceHeight = workspace.getParentSvg().height.baseVal.value;
  const workspaceWidth = workspace.getParentSvg().width.baseVal.value;
  const workspaceCanvas = workspace.getCanvas();
  const canvasPos = utils.getRelativeXY(workspaceCanvas);
  for (let i = 0; i < this._observedBlocks.length; i++) {
    const block = this._observedBlocks[i];
    // block may not have been rendered, so we skip checking for it.
    // see Clipteam/clipcc#10
    if (!block.rendered) {
      continue;
    }
    const blockPos = block.getRelativeToSurfaceXY();
    blockPos.x *= workspace.scale;
    blockPos.y *= workspace.scale;
        
    let visible = true;
        
    // bottom-right check
    if (canvasPos.y + blockPos.y > workspaceHeight) {
      visible = false;
    } else if (canvasPos.x + blockPos.x > workspaceWidth) {
      visible = false;
    } else {
      // top-left check
      const blockSize = block.getHeightWidth();
      blockSize.width *= workspace.scale;
      blockSize.height *= workspace.scale;
      if (canvasPos.x + blockPos.x + blockSize.width < 0) {
        visible = false;
      } else if (canvasPos.y + blockPos.y + blockSize.height < 0) {
        visible = false;
      }
    }
        
    block.setVisible(visible);
  }
};
