/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Common functions used both internally and externally, but which
 * must not be at the top level to avoid circular dependencies.
 */
'use strict';

goog.provide('Blockly.common');


/**
 * Database of all workspaces.
 * @private
 */
Blockly.common.WorkspaceDB_ = Object.create(null);

/**
 * Find the workspace with the specified ID.
 * @param {string} id ID of workspace to find.
 * @return {Blockly.Workspace} The sought after workspace or null if not found.
 */
Blockly.common.getWorkspaceById = function(id) {
  return Blockly.common.WorkspaceDB_[id] || null;
};

/**
 * Register a workspace in the workspace db.
 * @param {Blockly.Workspace} workspace The workspace to register.
 */
Blockly.common.registerWorkspace = function(workspace) {
  Blockly.common.WorkspaceDB_[workspace.id] = workspace;
}

/**
 * Unregister a workspace from the workspace db.
 * @param {Blockly.Workspace} workspace The workspace to delete.
 */
Blockly.common.unregisterWorkpace = function(workspace) {
  delete Blockly.common.WorkspaceDB_[workspace.id];
};

/**
 * The main workspace most recently used.
 * Set by Blockly.WorkspaceSvg.prototype.markFocused
 * @type {Blockly.Workspace}
 */
Blockly.common.mainWorkspace_ = null;

/**
 * Returns the last used top level workspace (based on focus).  Try not to use
 * this function, particularly if there are multiple Blockly instances on a
 * page.
 * @return {!Blockly.Workspace} The main workspace.
 */
Blockly.common.getMainWorkspace = function() {
  return Blockly.common.mainWorkspace_;
};

/**
 * Sets last used main workspace.
 * @param {!Blockly.Workspace} workspace The most recently used top level workspace.
 */
Blockly.common.setMainWorkspace = function(workspace) {
  Blockly.common.mainWorkspace_ = workspace;
};

/**
 * Currently selected block.
 * @type {Blockly.Block}
 */
Blockly.common.selected_ = null;

/**
 * Returns the currently selected block.
 * @return {Blockly.Block} The currently selected block.
 */
Blockly.common.getSelected = function() {
  return Blockly.common.selected_;
};

/**
 * Sets the currently selected block. This function does not visually mark the
 * block as selected or fire the required events. If you wish to
 * programmatically select a block, use `BlockSvg#select`.
 * @param {?Blockly.Block} newSelection The newly selected block.
 */
Blockly.common.setSelected = function(newSelection) {
  Blockly.common.selected_ = newSelection;
};

/**
 * All of the connections on blocks that are currently being dragged.
 * @type {!Array.<!Blockly.Connection>}
 */
Blockly.common.draggingConnections = [];

/**
 * Convert a hue (HSV model) into an RGB hex triplet.
 * @param {number} hue Hue on a colour wheel (0-360).
 * @return {string} RGB code, e.g. '#5ba65b'.
 */
Blockly.common.hueToRgb = function(hue) {
  return goog.color.hsvToHex(hue, Blockly.constants.HSV_SATURATION,
      Blockly.constants.HSV_VALUE * 255);
};

/**
 * Returns the dimensions of the specified SVG image.
 * @param {!Element} svg SVG image.
 * @return {!Object} Contains width and height properties.
 */
Blockly.common.svgSize = function(svg) {
  return {
    width: svg.cachedWidth_,
    height: svg.cachedHeight_
  };
};

/**
 * Size the workspace when the contents change.  This also updates
 * scrollbars accordingly.
 * @param {!Blockly.WorkspaceSvg} workspace The workspace to resize.
 */
Blockly.common.resizeSvgContents = function(workspace) {
  workspace.resizeContents();
};

/**
 * Size the SVG image to completely fill its container. Call this when the view
 * actually changes sizes (e.g. on a window resize/device orientation change).
 * See Blockly.common.resizeSvgContents to resize the workspace when the contents
 * change (e.g. when a block is added or removed).
 * Record the height/width of the SVG image.
 * @param {!Blockly.WorkspaceSvg} workspace Any workspace in the SVG.
 */
Blockly.common.svgResize = function(workspace) {
  let mainWorkspace = workspace;
  while (mainWorkspace.options.parentWorkspace) {
    mainWorkspace = mainWorkspace.options.parentWorkspace;
  }
  const svg = mainWorkspace.getParentSvg();
  const div = svg.parentNode;
  if (!div) {
    // Workspace deleted, or something.
    return;
  }
  const width = div.offsetWidth;
  const height = div.offsetHeight;
  if (svg.cachedWidth_ != width) {
    svg.setAttribute('width', width + 'px');
    svg.cachedWidth_ = width;
  }
  if (svg.cachedHeight_ != height) {
    svg.setAttribute('height', height + 'px');
    svg.cachedHeight_ = height;
  }
  mainWorkspace.resize();
};
