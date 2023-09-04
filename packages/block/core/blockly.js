/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2011 Google Inc.
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
 * @fileoverview Core JavaScript library for Blockly.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

/**
 * The top level namespace used to access the Blockly library.
 * @namespace Blockly
 **/
goog.provide('Blockly');

goog.require('Blockly.common');
goog.require('Blockly.BlockSvg.render');
goog.require('Blockly.DropDownDiv');
goog.require('Blockly.Events');
goog.require('Blockly.FieldAngle');
goog.require('Blockly.FieldCheckbox');
goog.require('Blockly.FieldColour');
goog.require('Blockly.FieldColourSlider');
// Date picker commented out since it increases footprint by 60%.
// Add it only if you need it.
//goog.require('Blockly.FieldDate');
goog.require('Blockly.FieldDropdown');
goog.require('Blockly.FieldIconMenu');
goog.require('Blockly.FieldImage');
goog.require('Blockly.FieldNote');
goog.require('Blockly.FieldTextInput');
goog.require('Blockly.FieldTextInputRemovable');
goog.require('Blockly.FieldTextDropdown');
goog.require('Blockly.FieldNumber');
goog.require('Blockly.FieldNumberDropdown');
goog.require('Blockly.FieldMatrix');
goog.require('Blockly.FieldVariable');
goog.require('Blockly.FieldVerticalSeparator');
goog.require('Blockly.Generator');
goog.require('Blockly.Msg');
goog.require('Blockly.Procedures');
goog.require('Blockly.ScratchMsgs');
goog.require('Blockly.Toolbox');
goog.require('Blockly.Touch');
goog.require('Blockly.WidgetDiv');
goog.require('Blockly.WorkspaceSvg');
goog.require('Blockly.constants');
goog.require('Blockly.inject');
goog.require('Blockly.utils');
goog.require('goog.color');


/**
 * Cached value for whether 3D is supported.
 * @type {!boolean}
 * @private
 */
Blockly.cache3dSupported_ = null;

/**
 * Cancel the native context menu, unless the focus is on an HTML input widget.
 * @param {!Event} e Mouse down event.
 * @private
 */
Blockly.onContextMenu_ = function(e) {
  if (!Blockly.utils.isTargetInput(e)) {
    // When focused on an HTML text input widget, don't cancel the context menu.
    e.preventDefault();
  }
};

/**
 * Close tooltips, context menus, dropdown selections, etc.
 * @param {boolean=} opt_allowToolbox If true, don't close the toolbox.
 * @deprecated Use Blockly.common.getMainWorkspace().hideChaff(opt_allowToolbox)
 */
Blockly.hideChaff = function(opt_allowToolbox) {
  Blockly.common.getMainWorkspace().hideChaff(opt_allowToolbox);
};

/**
 * Close tooltips, context menus, dropdown selections, etc.
 * For some elements (e.g. field text inputs), rather than hiding, it will
 * move them.
 * @param {boolean=} opt_allowToolbox If true, don't close the toolbox.
 * @deprecated Use Blockly.common.getMainWorkspace().hideChaffInternal_(opt_allowToolbox)
 */
Blockly.hideChaffOnResize = function(opt_allowToolbox) {
  Blockly.common.getMainWorkspace().hideChaffInternal_(opt_allowToolbox);
};

/**
 * Returns the main workspace.  Returns the last used main workspace (based on
 * focus).  Try not to use this function, particularly if there are multiple
 * Blockly instances on a page.
 * @return {!Blockly.Workspace} The main workspace.
 * @deprecated Use Blockly.common.getMainWorkspace()
 */
Blockly.getMainWorkspace = function() {
  return Blockly.common.getMainWorkspace();
};

/**
 * Refresh the visual state of a status button in all extension category headers.
 * @param {Blockly.Workspace} workspace A workspace.
 */
Blockly.refreshStatusButtons = function(workspace) {
  const buttons = workspace.getFlyout().buttons_;
  for (let i = 0; i < buttons.length; i++) {
    if (buttons[i] instanceof Blockly.FlyoutExtensionCategoryHeader) {
      buttons[i].refreshStatus();
    }
  }
};

/**
 * Helper function for defining a block from JSON.  The resulting function has
 * the correct value of jsonDef at the point in code where jsonInit is called.
 * @param {!Object} jsonDef The JSON definition of a block.
 * @return {function()} A function that calls jsonInit with the correct value
 *     of jsonDef.
 * @private
 */
Blockly.jsonInitFactory_ = function(jsonDef) {
  return function() {
    this.jsonInit(jsonDef);
  };
};

/**
 * Define blocks from an array of JSON block definitions, as might be generated
 * by the Blockly Developer Tools.
 * @param {!Array.<!Object>} jsonArray An array of JSON block definitions.
 */
Blockly.defineBlocksWithJsonArray = function(jsonArray) {
  for (let i = 0; i < jsonArray.length; i++) {
    const elem = jsonArray[i];
    if (!elem) {
      console.warn(
          'Block definition #' + i + ' in JSON array is ' + elem + '. ' +
          'Skipping.');
    } else {
      const typename = elem.type;
      if (typename == null || typename === '') {
        console.warn(
            'Block definition #' + i +
            ' in JSON array is missing a type attribute. Skipping.');
      } else {
        if (Blockly.Blocks[typename]) {
          console.warn(
              'Block definition #' + i + ' in JSON array' +
              ' overwrites prior definition of "' + typename + '".');
        }
        Blockly.Blocks[typename] = {
          init: Blockly.jsonInitFactory_(elem)
        };
      }
    }
  }
};

/**
 * Is the given string a number (includes negative and decimals).
 * @param {string} str Input string.
 * @return {boolean} True if number, false otherwise.
 */
Blockly.isNumber = function(str) {
  return !!str.match(/^\s*-?\d+(\.\d+)?\s*$/);
};

// monkey-patched code

/**
 * Show the context menu for this workspace comment.
 * @param {!Event} e Mouse event.
 * @private
 */
Blockly.WorkspaceCommentSvg.prototype.showContextMenu_ = function(e) {
  if (this.workspace.options.readOnly) {
    return;
  }
  // Save the current workspace comment in a variable for use in closures.
  const comment = this;
  const menuOptions = [];

  if (this.isDeletable() && this.isMovable()) {
    menuOptions.push(Blockly.ContextMenu.commentDuplicateOption(comment));
    menuOptions.push(Blockly.ContextMenu.commentDeleteOption(comment));
  }

  Blockly.ContextMenu.show(e, menuOptions, this.RTL);
};

/**
 * Obtain a newly created block.
 * @param {?string} prototypeName Name of the language object containing
 *     type-specific functions for this block.
 * @param {string=} opt_id Optional ID.  Use this ID if provided, otherwise
 *     create a new ID.
 * @return {!Blockly.Block} The created block.
 */
Blockly.Workspace.prototype.newBlock = function(prototypeName, opt_id) {
  return new Blockly.Block(this, prototypeName, opt_id);
};

/**
 * Obtain a newly created block.
 * @param {?string} prototypeName Name of the language object containing
 *     type-specific functions for this block.
 * @param {string=} opt_id Optional ID.  Use this ID if provided, otherwise
 *     create a new ID.
 * @return {!Blockly.BlockSvg} The created block.
 */
Blockly.WorkspaceSvg.prototype.newBlock = function(prototypeName, opt_id) {
  return new Blockly.BlockSvg(this, prototypeName, opt_id);
};


// IE9 does not have a console.  Create a stub to stop errors.
if (!goog.global['console']) {
  goog.global['console'] = {
    'log': function() {},
    'warn': function() {}
  };
}

// Export symbols that would otherwise be renamed by Closure compiler.
if (!goog.global['Blockly']) {
  goog.global['Blockly'] = {};
}
goog.global['Blockly']['getMainWorkspace'] = Blockly.common.getMainWorkspace;
