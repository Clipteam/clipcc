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

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.common');

import * as constants from './constants';

const color = goog.require('goog.color');


/**
 * Database of all workspaces.
 * @private
 */
const WorkspaceDB = Object.create(null);

/**
 * Find the workspace with the specified ID.
 * @param {string} id ID of workspace to find.
 * @return {Blockly.Workspace} The sought after workspace or null if not found.
 */
export const getWorkspaceById = function(id) {
  return WorkspaceDB[id] || null;
};

/**
 * Register a workspace in the workspace db.
 * @param {Blockly.Workspace} workspace The workspace to register.
 */
export const registerWorkspace = function(workspace) {
  WorkspaceDB[workspace.id] = workspace;
};

/**
 * Unregister a workspace from the workspace db.
 * @param {Blockly.Workspace} workspace The workspace to delete.
 */
export const unregisterWorkpace = function(workspace) {
  delete WorkspaceDB[workspace.id];
};

/**
 * The main workspace most recently used.
 * Set by Blockly.WorkspaceSvg.prototype.markFocused
 * @type {Blockly.Workspace}
 */
let mainWorkspace = null;

/**
 * Returns the last used top level workspace (based on focus).  Try not to use
 * this function, particularly if there are multiple Blockly instances on a
 * page.
 * @return {!Blockly.Workspace} The main workspace.
 */
export const getMainWorkspace = function() {
  return mainWorkspace;
};

/**
 * Sets last used main workspace.
 * @param {!Blockly.Workspace} workspace The most recently used top level workspace.
 */
export const setMainWorkspace = function(workspace) {
  mainWorkspace = workspace;
};

/**
 * Currently selected block.
 * @type {Blockly.Block}
 */
let selected = null;

/**
 * Returns the currently selected block.
 * @return {Blockly.Block} The currently selected block.
 */
export const getSelected = function() {
  return selected;
};

/**
 * Sets the currently selected block. This function does not visually mark the
 * block as selected or fire the required events. If you wish to
 * programmatically select a block, use `BlockSvg#select`.
 * @param {?Blockly.Block} newSelection The newly selected block.
 */
export const setSelected = function(newSelection) {
  selected = newSelection;
};

/**
 * All of the connections on blocks that are currently being dragged.
 * @type {!Array.<!Blockly.Connection>}
 */
export const draggingConnections = [];

/**
 * Convert a hue (HSV model) into an RGB hex triplet.
 * @param {number} hue Hue on a colour wheel (0-360).
 * @return {string} RGB code, e.g. '#5ba65b'.
 */
export const hueToRgb = function(hue) {
  return color.hsvToHex(hue, constants.HSV_SATURATION,
      constants.HSV_VALUE * 255);
};

/**
 * Returns the dimensions of the specified SVG image.
 * @param {!Element} svg SVG image.
 * @return {!Object} Contains width and height properties.
 */
export const svgSize = function(svg) {
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
export const resizeSvgContents = function(workspace) {
  workspace.resizeContents();
};

/**
 * Size the SVG image to completely fill its container. Call this when the view
 * actually changes sizes (e.g. on a window resize/device orientation change).
 * See resizeSvgContents to resize the workspace when the contents
 * change (e.g. when a block is added or removed).
 * Record the height/width of the SVG image.
 * @param {!Blockly.WorkspaceSvg} workspace Any workspace in the SVG.
 */
export const svgResize = function(workspace) {
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

let statusButtonCallbackImplementation = function(id) {
  window.alert('status button was pressed for ' + id);
};

/**
 * Wrapper to a callback for status buttons.
 * @param {string} id An identifier.
 */
export const statusButtonCallback = function(id) {
  statusButtonCallbackImplementation(id);
};

/**
 * Sets the function to be run when statusButtonCallback() is called.
 * @param {!function(string)} callback The function to be run.
 * @see statusButtonCallback
 */
export const setStatusButtonCallback = function(callback) {
  statusButtonCallbackImplementation = callback;
};
