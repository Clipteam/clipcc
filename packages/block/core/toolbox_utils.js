
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Utility functions for the toolbox and flyout.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.utils.toolbox');

import * as Xml from './xml';

/**
 * Parse the provided toolbox definition into a consistent format.
 * @param {Blockly.utils.toolbox.ToolboxDefinition} toolboxDef The definition of the
 *    toolbox in one of its many forms.
 * @return {Array.<Blockly.utils.toolbox.Toolbox>} Array of JSON holding
 *    information on toolbox contents.
 * @package
 */

export const convertToolboxToJSON = function(toolboxDef) {
  if (!toolboxDef) {
    return null;
  }
  // If it is an array of JSON, then it is already in the correct format.
  if (Array.isArray(toolboxDef) && toolboxDef.length && !(toolboxDef[0].nodeType)) {
    return /** @type {!Array.<Blockly.utils.toolbox.Toolbox>} */ (toolboxDef);
  }

  return toolboxXmlToJson_(toolboxDef);
};

/**
 * Convert the xml for a toolbox to JSON.
 * @param {!NodeList|!Node|!Array<Node>} toolboxDef The
 *     definition of the toolbox in one of its many forms.
 * @return {!Array.<Blockly.utils.toolbox.Toolbox>} A list of objects in the
 *    toolbox.
 * @private
 */
export const toolboxXmlToJson_ = function(toolboxDef) {
  const arr = [];
  // If it is a node it will have children.
  let childNodes = toolboxDef.childNodes;
  if (!childNodes) {
    // Otherwise the toolboxDef is an array or collection.
    childNodes = toolboxDef;
  }
  for (let i = 0, child; (child = childNodes[i]); i++) {
    if (!child.tagName) {
      continue;
    }
    const obj = {};
    obj['kind'] = child.tagName.toUpperCase();
    // Store the xml for a block
    if (child.tagName.toUpperCase() == 'BLOCK') {
      obj['blockxml'] = Xml.domToText(child);
    }
    // Get the contents for a category.
    if (child.tagName.toUpperCase() == 'CATEGORY') {
      obj['contents'] = toolboxXmlToJson_(child);
    }
    // Add xml attributes to object
    for (let j = 0; j < child.attributes.length; j++) {
      const attr = child.attributes[j];
      obj[attr.nodeName] = attr.value;
    }
    arr.push(obj);
  }
  return arr;
};

/**
 * Whether or not the toolbox definition has categories or not.
 * @param {Node|Array.<Blockly.utils.toolbox.Toolbox>} toolboxDef The definition
 *    of the toolbox. Either in xml or JSON.
 * @return {boolean} True if the toolbox has categories.
 * @package
 */
export const hasCategories = function(toolboxDef) {
  if (Array.isArray(toolboxDef)) {
    // Search for categories
    return !!(toolboxDef.length && toolboxDef[0]['kind'].toUpperCase() == 'CATEGORY');
  } else {
    return !!(toolboxDef && toolboxDef.getElementsByTagName('category').length);
  }
};
