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

goog.provide('Blockly.VirtualizedManager');

/**
 * Class for virtualized manager.
 * @param {Blockly.WorkspaceSvg} workspace
 */
Blockly.VirtualizedManager = function(workspace) {
    this.workspace = workspace;
    this._observedBlocks = [];
    this.observe = this.observe.bind(this);
    this.unobserve = this.unobserve.bind(this);
    this.check = this.check.bind(this);
    this.dispose = this.dispose.bind(this);
}

/**
 * Observe a block.
 * @param {Blockly.BlockSvg} block 
 */
Blockly.VirtualizedManager.prototype.observe = function(block) {
    if (!this._observedBlocks.includes(block)) {
        this._observedBlocks.push(block);
    }
}

/**
 * Unobserve a block.
 * @param {Blockly.BlockSvg} block 
 */
Blockly.VirtualizedManager.prototype.unobserve = function(block) {
    if (this._observedBlocks.includes(block)) {
        this._observedBlocks = this._observedBlocks.filter(function(i) {
          return i !== block;
        });
    }
}

/**
 * Dispose VirtualizedManager.
 */
Blockly.VirtualizedManager.prototype.dispose = function() {
    this._observedBlocks = [];
}

/**
 * Check if block need to be show or hide.
 */
Blockly.VirtualizedManager.prototype.check = function() {
    var workspace = this.workspace;
    var workspaceHeight = workspace.getParentSvg().height.baseVal.value;
    var workspaceWidth = workspace.getParentSvg().width.baseVal.value;
    var canvasPos = Blockly.utils.getRelativeXY(workspace.getCanvas());
    for (var i = 0; i < this._observedBlocks.length; i++) {
        var block = this._observedBlocks[i];
        var blockPos = block.getRelativeToSurfaceXY();
        blockPos.x *= workspace.scale;
        blockPos.y *= workspace.scale;
        
        var visible = true;
        
        // bottom-right check
        if (canvasPos.y + blockPos.y > workspaceHeight) {
            visible = false;
        } else if (canvasPos.x + blockPos.x > workspaceWidth) {
            visible = false;
        } else {
            // top-left check
            var blockSize = block.getHeightWidth();
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
}
