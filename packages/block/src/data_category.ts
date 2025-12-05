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

import * as Blockly from 'blockly/core';
import * as Constants from './constants';
import {createVariableVisually} from './variables';

/**
 * Construct the elements (blocks and button) required by the flyout for the
 * variable category.
 * @param workspace The workspace containing variables.
 * @returns Array of XML elements.
 */
export function flyoutCategory(workspace: Blockly.WorkspaceSvg): Blockly.utils.toolbox.FlyoutDefinition {
  let variableModelList = workspace.getVariableMap().getVariablesOfType(Constants.SCALAR_VARIABLE_TYPE);
  variableModelList.sort(Blockly.Variables.compareByName);
  const contents: Blockly.utils.toolbox.FlyoutItemInfoArray = [];

  addCreateButton(contents, workspace, 'VARIABLE');

  for (let i = 0; i < variableModelList.length; i++) {
    addDataVariable(contents, variableModelList[i]);
  }

  if (variableModelList.length > 0) {
    (contents[contents.length - 1] as Blockly.utils.toolbox.SeparatorInfo).gap = 24;
    const firstVariable = variableModelList[0];

    addSetVariableTo(contents, firstVariable);
    addChangeVariableBy(contents, firstVariable);
    addShowVariable(contents, firstVariable);
    addHideVariable(contents, firstVariable);
  }

  // Now add list variables to the flyout
  addCreateButton(contents, workspace, 'LIST');
  variableModelList = workspace.getVariableMap().getVariablesOfType(Constants.LIST_VARIABLE_TYPE);
  variableModelList.sort(Blockly.Variables.compareByName);
  for (let i = 0; i < variableModelList.length; i++) {
    addDataList(contents, variableModelList[i]);
  }

  if (variableModelList.length > 0) {
    (contents[contents.length - 1] as Blockly.utils.toolbox.SeparatorInfo).gap = 24;
    const firstVariable = variableModelList[0];

    addAddToList(contents, firstVariable);
    addSep(contents);
    addDeleteOfList(contents, firstVariable);
    addDeleteAllOfList(contents, firstVariable);
    addInsertAtList(contents, firstVariable);
    addReplaceItemOfList(contents, firstVariable);
    addSep(contents);
    addItemOfList(contents, firstVariable);
    addItemNumberOfList(contents, firstVariable);
    addLengthOfList(contents, firstVariable);
    addListContainsItem(contents, firstVariable);
    addSep(contents);
    addShowList(contents, firstVariable);
    addHideList(contents, firstVariable);
  }

  return contents;
}

/**
 * Construct and add a data_variable block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addDataVariable(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
  // <block id="variableId" type="data_variable">
  //    <field name="VARIABLE">variablename</field>
  // </block>
  addBlock(contents, variable, 'data_variable', 'VARIABLE');
  // In the flyout, this ID must match variable ID for monitor syncing reasons
  (contents[contents.length - 1] as Blockly.utils.toolbox.BlockInfo).id = variable.getId();
}

/**
 * Construct and add a data_setvariableto block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addSetVariableTo(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
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
  addBlock(
    contents, variable, 'data_setvariableto', 'VARIABLE',
    ['VALUE', 'text', '0']
  );
}

/**
 * Construct and add a data_changevariableby block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addChangeVariableBy(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
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
  addBlock(
    contents, variable, 'data_changevariableby', 'VARIABLE',
    ['VALUE', 'math_number', '1']
  );
}

/**
 * Construct and add a data_showVariable block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addShowVariable(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
  // <block type="data_showvariable">
  //   <value name="VARIABLE">
  //     <shadow type="data_variablemenu"></shadow>
  //   </value>
  // </block>
  addBlock(contents, variable, 'data_showvariable', 'VARIABLE');
}

/**
 * Construct and add a data_hideVariable block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addHideVariable(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
  // <block type="data_hidevariable">
  //   <value name="VARIABLE">
  //     <shadow type="data_variablemenu"></shadow>
  //   </value>
  // </block>
  addBlock(contents, variable, 'data_hidevariable', 'VARIABLE');
}

/**
 * Construct and add a data_listcontents block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addDataList(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
  // <block id="variableId" type="data_listcontents">
  //    <field name="LIST">variablename</field>
  // </block>
  addBlock(contents, variable, 'data_listcontents', 'LIST');
  // In the flyout, this ID must match variable ID for monitor syncing reasons
  (contents[contents.length - 1] as Blockly.utils.toolbox.BlockInfo).id = variable.getId();
}

/**
 * Construct and add a data_addtolist block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addAddToList(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
  // <block type="data_addtolist">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  //   <value name="ITEM">
  //     <shadow type="text">
  //       <field name="TEXT">thing</field>
  //     </shadow>
  //   </value>
  // </block>
  addBlock(
    contents, variable, 'data_addtolist', 'LIST',
    ['ITEM', 'text', Blockly.Msg.DEFAULT_LIST_ITEM]
  );
}

/**
 * Construct and add a data_deleteoflist block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addDeleteOfList(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
  // <block type="data_deleteoflist">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  //   <value name="INDEX">
  //     <shadow type="math_integer">
  //       <field name="NUM">1</field>
  //     </shadow>
  //   </value>
  // </block>
  addBlock(
    contents, variable, 'data_deleteoflist', 'LIST',
    ['INDEX', 'math_integer', '1']
  );
}

/**
 * Construct and add a data_deleteoflist block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addDeleteAllOfList(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
  // <block type="data_deletealloflist">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  // </block>
  addBlock(contents, variable, 'data_deletealloflist', 'LIST');
}

/**
 * Construct and add a data_insertatlist block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addInsertAtList(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
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
  addBlock(
    contents, variable, 'data_insertatlist', 'LIST',
    ['INDEX', 'math_integer', '1'],
    ['ITEM', 'text', Blockly.Msg.DEFAULT_LIST_ITEM]
  );
}

/**
 * Construct and add a data_replaceitemoflist block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addReplaceItemOfList(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
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
  addBlock(
    contents, variable, 'data_replaceitemoflist', 'LIST',
    ['INDEX', 'math_integer', '1'],
    ['ITEM', 'text', Blockly.Msg.DEFAULT_LIST_ITEM]
  );
}

/**
 * Construct and add a data_itemoflist block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addItemOfList(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
  // <block type="data_itemoflist">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  //   <value name="INDEX">
  //     <shadow type="math_integer">
  //       <field name="NUM">1</field>
  //     </shadow>
  //   </value>
  // </block>
  addBlock(
    contents, variable, 'data_itemoflist', 'LIST',
    ['INDEX', 'math_integer', '1']
  );
}

/**
 * Construct and add a data_itemnumoflist block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addItemNumberOfList(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
  // <block type="data_itemnumoflist">
  //   <value name="ITEM">
  //     <shadow type="text">
  //       <field name="TEXT">thing</field>
  //     </shadow>
  //   </value>
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  // </block>
  addBlock(
    contents, variable, 'data_itemnumoflist', 'LIST',
    ['ITEM', 'text', Blockly.Msg.DEFAULT_LIST_ITEM]
  );
}

/**
 * Construct and add a data_lengthoflist block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addLengthOfList(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
  // <block type="data_lengthoflist">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  // </block>
  addBlock(contents, variable, 'data_lengthoflist', 'LIST');
}

/**
 * Construct and add a data_listcontainsitem block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addListContainsItem(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
  // <block type="data_listcontainsitem">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  //   <value name="ITEM">
  //     <shadow type="text">
  //       <field name="TEXT">thing</field>
  //     </shadow>
  //   </value>
  // </block>
  addBlock(
    contents, variable, 'data_listcontainsitem', 'LIST',
    ['ITEM', 'text', Blockly.Msg.DEFAULT_LIST_ITEM]
  );
}

/**
 * Construct and add a data_showlist block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addShowList(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
  // <block type="data_showlist">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  // </block>
  addBlock(contents, variable, 'data_showlist', 'LIST');
}

/**
 * Construct and add a data_hidelist block to xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 */
function addHideList(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>
) {
  // <block type="data_hidelist">
  //   <field name="LIST" variabletype="list" id="">variablename</field>
  // </block>
  addBlock(contents, variable, 'data_hidelist', 'LIST');
}

/**
 * Construct a create variable button and push it to the xmlList.
 * @param contents Array of flyout item info.
 * @param workspace Workspace to register callback to.
 * @param type Type of variable this is for. For example, 'LIST' or 'VARIABLE'.
 */
function addCreateButton(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  workspace: Blockly.WorkspaceSvg,
  type: string
) {
  let buttonInfo: Blockly.utils.toolbox.ButtonInfo;
  switch (type) {
    case 'LIST':
      workspace.registerButtonCallback('CREATE_LIST', function(button: Blockly.FlyoutButton) {
        createVariableVisually(
          button.getTargetWorkspace(), undefined, Constants.LIST_VARIABLE_TYPE
        );
      });
      buttonInfo = {
        kind: 'button',
        text: Blockly.Msg.NEW_LIST,
        callbackkey: 'CREATE_LIST'
      };
      break;
    default:
      workspace.registerButtonCallback('CREATE_VARIABLE', function(button: Blockly.FlyoutButton) {
        createVariableVisually(
          button.getTargetWorkspace(), undefined, Constants.SCALAR_VARIABLE_TYPE
        );
      });
      buttonInfo = {
        kind: 'button',
        text: Blockly.Msg.NEW_VARIABLE,
        callbackkey: 'CREATE_VARIABLE'
      };
  }
  contents.push(buttonInfo);
}

/**
 * Construct a variable block with the given variable, blockType, and optional
 *     value tags. Add the variable block to the given xmlList.
 * @param contents Array of flyout item info.
 * @param variable Variable to select in the field.
 * @param blockType Type of block. For example, 'data_hidelist' or
 *     data_showlist'.
 * @param fieldName Name of field in block. For example: 'VARIABLE' or
 *     'LIST'.
 * @param value Optional array containing the value name
 *     and shadow type of value tags.
 * @param secondValue Optional array containing the value
 *     name and shadow type of a second pair of value tags.
 */
function addBlock(
  contents: Blockly.utils.toolbox.FlyoutItemInfoArray,
  variable: Blockly.IVariableModel<Blockly.IVariableState>,
  blockType: string,
  fieldName: string,
  value?: string[],
  secondValue?: string[]
) {
  if (Blockly.Blocks[blockType]) {
    let firstValueField;
    let secondValueField;
    if (value) {
      firstValueField = createValue(value[0], value[1], value[2]);
    }
    if (secondValue) {
      secondValueField = createValue(secondValue[0], secondValue[1], secondValue[2]);
    }

    const blockState: Blockly.utils.toolbox.BlockInfo = {
      kind: 'block',
      type: blockType,
      gap: 10,
      fields: generateVariableFieldState(variable, fieldName),
      inputs: {}
    };
    if (firstValueField) {
      blockState.inputs![firstValueField.name] = {shadow: firstValueField.field};
    }
    if (secondValueField) {
      blockState.inputs![secondValueField.name] = {shadow: secondValueField.field};
    }
    contents.push(blockState);
  }
}

/**
 * Create the text representation of a value dom element with a shadow of the
 *     indicated type inside.
 * @param valueName Name of the value tags.
 * @param type The type of the shadow tags.
 * @param value The default shadow value.
 * @returns The generated dom element in text.
 */
function createValue(valueName: string, type: string, value: string | number) {
  let fieldName = '';
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
      fields: {[fieldName]: value}
    }
  };
}

/**
 * Construct a block separator. Add the separator to the given xmlList.
 * @param contents Array of flyout item info.
 */
function addSep(contents: Blockly.utils.toolbox.FlyoutItemInfoArray) {
  contents.push({
    kind: 'sep',
    gap: 36
  });
}

/**
 * Generate XML string for variable field.
 * @param variableModel The variable model to generate
 *     an XML string from.
 * @param name The optional name of the field, such as "VARIABLE"
 *     or "LIST". Defaults to "VARIABLE".
 * @returns The generated XML.
 */
function generateVariableFieldState(
  variableModel: Blockly.IVariableModel<Blockly.IVariableState>,
  name?: string
) {
  const typeString = variableModel.getType();

  const fieldName = name || 'VARIABLE';
  return {
    [fieldName]: {
      id: variableModel.getId(),
      variabletype: typeString,
      name: variableModel.getName()
    }
  };
}
