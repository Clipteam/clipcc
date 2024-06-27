/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2021 Google Inc.
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
 * @fileoverview Blockly's internal clipboard for managing copy-paste.
 * @author fenichel@google.com (Rachel Fenichel)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.clipboard');

import * as eventUtils from './events/utils';
import * as blocks from './serialization/blocks';


/**
 * Contents of the local clipboard.
 * @type {Object}
 * @private
 */
let clipboardState = null;

/**
 * Source of the local clipboard.
 * @type {Blockly.WorkspaceSvg}
 * @private
 */
let clipboardSource = null;

/**
 * Copy a block or workspace comment onto the local clipboard.
 * @param {!Blockly.Block | !Blockly.WorkspaceComment} toCopy Block or Workspace Comment
 *    to be copied.
 */
export const copy = function(toCopy) {
  let state;
  if (toCopy.isComment) {
    state = toCopy.toStateWithXY();
  } else {
    state = blocks.save(toCopy, {addCoordinates: true});
  }
  clipboardState = state;
  clipboardSource = toCopy.workspace;
};

/**
 * Duplicate this block and its children, or a workspace comment.
 * @param {!Blockly.Block | !Blockly.WorkspaceComment} toDuplicate Block or
 *     Workspace Comment to be copied.
 */
export const duplicate = function(toDuplicate) {
  // Save the clipboard.
  const clipboardStateOld = clipboardState;
  const clipboardSourceOld = clipboardSource;

  // Create a duplicate via a copy/paste operation.
  copy(toDuplicate);
  toDuplicate.workspace.paste(clipboardState);

  // Restore the clipboard.
  clipboardState = clipboardStateOld;
  clipboardSource = clipboardSourceOld;
};

/**
 * Paste a block or workspace comment on to the main workspace.
 * @return {boolean} True if the paste was successful, false otherwise.
 */
export const paste = function() {
  if (clipboardState) {
    eventUtils.setGroup(true);
    // Pasting always pastes to the main workspace, even if the copy started
    // in a flyout workspace.
    let workspace = clipboardSource;
    if (workspace.isFlyout) {
      workspace = workspace.targetWorkspace;
    }
    workspace.paste(clipboardState);
    eventUtils.setGroup(false);
    return true;
  }
  return false;
};
