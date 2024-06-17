/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2017 Google Inc.
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
 * @fileoverview Data Flyout components including variable and list blocks.
 * @author marisaleung@google.com (Marisa Leung)
 */
'use strict';

/**
 * @name DataCategory
 * @namespace
 **/
import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.DataCategory');

import {Blocks} from './blocks';
import * as constants from './constants';
import {Msg} from './msg';
import {VariableModel} from './variable_model';
import * as Variables from './variables';
import * as Xml from './xml';

const dom = goog.require('goog.dom');


/**
 * Construct the blocks required by the flyout for the variable category.
 * @param {!Blockly.Workspace} workspace The workspace containing variables.
 * @return {!Array.<!Element>} Array of block elements.
 */
export const DataCategory = function(workspace) {
  let variableModelList = workspace.getVariablesOfType('');
  variableModelList.sort(VariableModel.compareByName);
  const content = [];

  DataCategory.addCreateButton(content, workspace, 'VARIABLE');

  for (let i = 0; i < variableModelList.length; i++) {
    DataCategory.addDataVariable(content, variableModelList[i]);
  }

  if (variableModelList.length > 0) {
    content[content.length - 1].gap = 24;
    const firstVariable = variableModelList[0];

    DataCategory.addSetVariableTo(content, firstVariable);
    DataCategory.addChangeVariableBy(content, firstVariable);
    DataCategory.addShowVariable(content, firstVariable);
    DataCategory.addHideVariable(content, firstVariable);
  }

  // Now add list variables to the flyout
  DataCategory.addCreateButton(content, workspace, 'LIST');
  variableModelList = workspace.getVariablesOfType(constants.LIST_VARIABLE_TYPE);
  variableModelList.sort(VariableModel.compareByName);
  for (let i = 0; i < variableModelList.length; i++) {
    DataCategory.addDataList(content, variableModelList[i]);
  }

  if (variableModelList.length > 0) {
    content[content.length - 1].gap = 24;
    const firstVariable = variableModelList[0];

    DataCategory.addAddToList(content, firstVariable);
    DataCategory.addSep(content);
    DataCategory.addDeleteOfList(content, firstVariable);
    DataCategory.addDeleteAllOfList(content, firstVariable);
    DataCategory.addInsertAtList(content, firstVariable);
    DataCategory.addReplaceItemOfList(content, firstVariable);
    DataCategory.addSep(content);
    DataCategory.addItemOfList(content, firstVariable);
    DataCategory.addItemNumberOfList(content, firstVariable);
    DataCategory.addLengthOfList(content, firstVariable);
    DataCategory.addListContainsItem(content, firstVariable);
    DataCategory.addSep(content);
    DataCategory.addShowList(content, firstVariable);
    DataCategory.addHideList(content, firstVariable);
  }

  return content;
};

/**
 * Construct and add a data_variable block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addDataVariable = function(content, variable) {
  // <block id="variableId" type="data_variable">
  //    <field name="VARIABLE">variablename</field>
  // </block>
  DataCategory.addBlock(content, variable, 'data_variable', 'VARIABLE');
  // In the flyout, this ID must match variable ID for monitor syncing reasons
  content[content.length - 1].id = variable.getId();
};

/**
 * Construct and add a data_setvariableto block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addSetVariableTo = function(content, variable) {
  // <block type="data_setvariableto" gap="20">
  //   <value name="VARIABLE">
  //    <shadow type="data_variablemenu"></shadow>
  //   </value>
  //   <value name="VALUE">
  //     <shadow type="text">
  //       <field name="TEXT">0</field>
  //     </shadow>
  //   </value>
  // </block>
  DataCategory.addBlock(content, variable, 'data_setvariableto',
      'VARIABLE', ['VALUE', 'text', 0]);
};

/**
 * Construct and add a data_changevariableby block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addChangeVariableBy = function(content, variable) {
  // <block type="data_changevariableby">
  //   <value name="VARIABLE">
  //    <shadow type="data_variablemenu"></shadow>
  //   </value>
  //   <value name="VALUE">
  //     <shadow type="math_number">
  //       <field name="NUM">1</field>
  //     </shadow>
  //   </value>
  // </block>
  DataCategory.addBlock(content, variable, 'data_changevariableby',
      'VARIABLE', ['VALUE', 'math_number', 1]);
};

/**
 * Construct and add a data_showVariable block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addShowVariable = function(content, variable) {
  // <block type="data_showvariable">
  //   <value name="VARIABLE">
  //     <shadow type="data_variablemenu"></shadow>
  //   </value>
  // </block>
  DataCategory.addBlock(content, variable, 'data_showvariable',
      'VARIABLE');
};

/**
 * Construct and add a data_hideVariable block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addHideVariable = function(content, variable) {
  // <block type="data_hidevariable">
  //   <value name="VARIABLE">
  //     <shadow type="data_variablemenu"></shadow>
  //   </value>
  // </block>
  DataCategory.addBlock(content, variable, 'data_hidevariable',
      'VARIABLE');
};

/**
 * Construct and add a data_listcontents block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addDataList = function(content, variable) {
  // <block id="variableId" type="data_listcontents">
  //    <field name="LIST">variablename</field>
  // </block>
  DataCategory.addBlock(content, variable, 'data_listcontents', 'LIST');
  // In the flyout, this ID must match variable ID for monitor syncing reasons
  content[content.length - 1].id = variable.getId();
};

/**
 * Construct and add a data_addtolist block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addAddToList = function(content, variable) {
  // <block type="data_addtolist">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  //   <value name="ITEM">
  //     <shadow type="text">
  //       <field name="TEXT">thing</field>
  //     </shadow>
  //   </value>
  // </block>
  DataCategory.addBlock(content, variable, 'data_addtolist', 'LIST',
      ['ITEM', 'text', Msg.DEFAULT_LIST_ITEM]);
};

/**
 * Construct and add a data_deleteoflist block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addDeleteOfList = function(content, variable) {
  // <block type="data_deleteoflist">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  //   <value name="INDEX">
  //     <shadow type="math_integer">
  //       <field name="NUM">1</field>
  //     </shadow>
  //   </value>
  // </block>
  DataCategory.addBlock(content, variable, 'data_deleteoflist', 'LIST',
      ['INDEX', 'math_integer', 1]);
};

/**
 * Construct and add a data_deleteoflist block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addDeleteAllOfList = function(content, variable) {
  // <block type="data_deletealloflist">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  // </block>
  DataCategory.addBlock(content, variable, 'data_deletealloflist',
      'LIST');
};

/**
 * Construct and add a data_insertatlist block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addInsertAtList = function(content, variable) {
  // <block type="data_insertatlist">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  //   <value name="INDEX">
  //     <shadow type="math_integer">
  //       <field name="NUM">1</field>
  //     </shadow>
  //   </value>
  //   <value name="ITEM">
  //     <shadow type="text">
  //       <field name="TEXT">thing</field>
  //     </shadow>
  //   </value>
  // </block>
  DataCategory.addBlock(content, variable, 'data_insertatlist', 'LIST',
      ['INDEX', 'math_integer', 1], ['ITEM', 'text', Msg.DEFAULT_LIST_ITEM]);
};

/**
 * Construct and add a data_replaceitemoflist block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addReplaceItemOfList = function(content, variable) {
  // <block type="data_replaceitemoflist">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  //   <value name="INDEX">
  //     <shadow type="math_integer">
  //       <field name="NUM">1</field>
  //     </shadow>
  //   </value>
  //   <value name="ITEM">
  //     <shadow type="text">
  //       <field name="TEXT">thing</field>
  //     </shadow>
  //   </value>
  // </block>
  DataCategory.addBlock(content, variable, 'data_replaceitemoflist',
      'LIST', ['INDEX', 'math_integer', 1], ['ITEM', 'text', Msg.DEFAULT_LIST_ITEM]);
};

/**
 * Construct and add a data_itemoflist block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addItemOfList = function(content, variable) {
  // <block type="data_itemoflist">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  //   <value name="INDEX">
  //     <shadow type="math_integer">
  //       <field name="NUM">1</field>
  //     </shadow>
  //   </value>
  // </block>
  DataCategory.addBlock(content, variable, 'data_itemoflist', 'LIST',
      ['INDEX', 'math_integer', 1]);
};

/** Construct and add a data_itemnumoflist block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addItemNumberOfList = function(content, variable) {
  // <block type="data_itemnumoflist">
  //   <value name="ITEM">
  //     <shadow type="text">
  //       <field name="TEXT">thing</field>
  //     </shadow>
  //   </value>
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  // </block>
  DataCategory.addBlock(content, variable, 'data_itemnumoflist',
      'LIST', ['ITEM', 'text', Msg.DEFAULT_LIST_ITEM]);
};

/**
 * Construct and add a data_lengthoflist block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addLengthOfList = function(content, variable) {
  // <block type="data_lengthoflist">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  // </block>
  DataCategory.addBlock(content, variable, 'data_lengthoflist', 'LIST');
};

/**
 * Construct and add a data_listcontainsitem block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addListContainsItem = function(content, variable) {
  // <block type="data_listcontainsitem">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  //   <value name="ITEM">
  //     <shadow type="text">
  //       <field name="TEXT">thing</field>
  //     </shadow>
  //   </value>
  // </block>
  DataCategory.addBlock(content, variable, 'data_listcontainsitem',
      'LIST', ['ITEM', 'text', Msg.DEFAULT_LIST_ITEM]);
};

/**
 * Construct and add a data_showlist block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addShowList = function(content, variable) {
  // <block type="data_showlist">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  // </block>
  DataCategory.addBlock(content, variable, 'data_showlist', 'LIST');
};

/**
 * Construct and add a data_hidelist block to content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 */
DataCategory.addHideList = function(content, variable) {
  // <block type="data_hidelist">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  // </block>
  DataCategory.addBlock(content, variable, 'data_hidelist', 'LIST');
};

/**
 * Construct a create variable button and push it to the content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {Blockly.Workspace} workspace Workspace to register callback to.
 * @param {string} type Type of variable this is for. For example, 'LIST' or
 *     'VARIABLE'.
 */
DataCategory.addCreateButton = function(content, workspace, type) {
  const button = {kind: 'button'};
  // Set default msg, callbackKey, and callback values for type 'VARIABLE'
  let msg = Msg.NEW_VARIABLE;
  let callbackKey = 'CREATE_VARIABLE';
  let callback = function(button) {
    Variables.createVariable(button.getTargetWorkspace(), null, '');};

  if (type === 'LIST') {
    msg = Msg.NEW_LIST;
    callbackKey = 'CREATE_LIST';
    callback = function(button) {
      Variables.createVariable(button.getTargetWorkspace(), null,
          constants.LIST_VARIABLE_TYPE);};
  }
  Object.assign(button, {
    text: msg,
    callbackkey: callbackKey
  });
  workspace.registerButtonCallback(callbackKey, callback);
  content.push(button);
};

/**
 * Construct a variable block with the given variable, blockType, and optional
 *     value tags. Add the variable block to the given content.
 * @param {!Array.<!Object>} content Array of block elements.
 * @param {?Blockly.VariableModel} variable Variable to select in the field.
 * @param {string} blockType Type of block. For example, 'data_hidelist' or
 *     data_showlist'.
 * @param {string} fieldName Name of field in block. For example: 'VARIABLE' or
 *     'LIST'.
 * @param {?Array.<string>} opt_value Optional array containing the value name
 *     and shadow type of value tags.
 * @param {?Array.<string>} opt_secondValue Optional array containing the value
 *     name and shadow type of a second pair of value tags.
 */
DataCategory.addBlock = function(content, variable, blockType,
    fieldName, opt_value, opt_secondValue) {
  if (Blocks[blockType]) {
    let firstValueField;
    let secondValueField;
    if (opt_value) {
      firstValueField = DataCategory.createValue(opt_value[0],
          opt_value[1], opt_value[2]);
    }
    if (opt_secondValue) {
      secondValueField = DataCategory.createValue(opt_secondValue[0],
          opt_secondValue[1], opt_secondValue[2]);
    }

    const blockState = {
      kind: 'block',
      type: blockType,
      gap: 8,
      fields: Variables.generateVariableFieldState(variable, fieldName),
      inputs: {}
    };
    if (firstValueField) {
      blockState.inputs[firstValueField.name] = {block: firstValueField.field};
    }
    if (secondValueField) {
      blockState.inputs[secondValueField.name] = {block: secondValueField.field};
    }
    content.push(blockState);
  }
};

/**
 * Create the text representation of a value state with a shadow of the
 *     indicated type inside.
 * @param {string} valueName Name of the value tags.
 * @param {string} type The type of the shadow tags.
 * @param {string|number} value The default shadow value.
 * @return {Object} The generated state.
 */
DataCategory.createValue = function(valueName, type, value) {
  let fieldName;
  switch (valueName) {
    case 'ITEM':
      fieldName = 'TEXT';
      break;
    case 'INDEX':
      fieldName = 'NUM';
      break;
    case 'VALUE':
      if (type === 'math_number') {
        fieldName = 'NUM';
      } else {
        fieldName = 'TEXT';
      }
      break;
  }
  return {
    name: valueName,
    field: {
      type: type,
      fields: {[fieldName]: value},
      shadow: true
    }
  };
};

/**
 * Construct a block separator. Add the separator to the given content.
 * @param {!Array.<!Object>} content Array of block elements.
 */
DataCategory.addSep = function(content) {
  content.push({
    kind: 'sep',
    gap: 36
  });
};
