/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2016 Massachusetts Institute of Technology
 * All rights reserved.
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

import * as Blockly from 'blockly/core';
import * as Constants from '../constants';
import {compareStrings} from '../scratch_blocks_utils';

/**
 * Block of Variables
 */
Blockly.Blocks['data_variable'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      lastDummyAlign0: 'CENTRE',
      args0: [
        {
          type: 'field_variable_getter',
          text: '',
          name: 'VARIABLE',
          variableType: Constants.SCALAR_VARIABLE_TYPE
        }
      ],
      extensions: ['contextMenu_getVariableBlock', 'colours_data', 'output_string', 'monitor_block']
    });
  }
};

/**
 * Block to set variable to a certain value
 */
Blockly.Blocks['data_setvariableto'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_SETVARIABLETO,
      args0: [
        {
          type: 'field_variable',
          name: 'VARIABLE',
          variableTypes: [Constants.SCALAR_VARIABLE_TYPE],
          defaultType: Constants.SCALAR_VARIABLE_TYPE
        },
        {
          type: 'input_value',
          name: 'VALUE'
        }
      ],
      extensions: ['colours_data', 'shape_statement']
    });
  }
};

/**
 * Block to change variable by a certain value
 */
Blockly.Blocks['data_changevariableby'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_CHANGEVARIABLEBY,
      args0: [
        {
          type: 'field_variable',
          name: 'VARIABLE',
          variableTypes: [Constants.SCALAR_VARIABLE_TYPE],
          defaultType: Constants.SCALAR_VARIABLE_TYPE
        },
        {
          type: 'input_value',
          name: 'VALUE'
        }
      ],
      extensions: ['colours_data', 'shape_statement']
    });
  }
};

/**
 * Block to show a variable
 */
Blockly.Blocks['data_showvariable'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_SHOWVARIABLE,
      args0: [
        {
          type: 'field_variable',
          name: 'VARIABLE',
          variableTypes: [Constants.SCALAR_VARIABLE_TYPE],
          defaultType: Constants.SCALAR_VARIABLE_TYPE
        }
      ],
      previousStatement: null,
      nextStatement: null,
      extensions: ['colours_data']
    });
  }
};

/**
 * Block to hide a variable
 */
Blockly.Blocks['data_hidevariable'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_HIDEVARIABLE,
      args0: [
        {
          type: 'field_variable',
          name: 'VARIABLE',
          variableTypes: [Constants.SCALAR_VARIABLE_TYPE],
          defaultType: Constants.SCALAR_VARIABLE_TYPE
        }
      ],
      previousStatement: null,
      nextStatement: null,
      extensions: ['colours_data']
    });
  }
};

/**
 * List reporter.
 */
Blockly.Blocks['data_listcontents'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      lastDummyAlign0: 'CENTRE',
      args0: [
        {
          type: 'field_variable_getter',
          text: '',
          name: 'LIST',
          variableType: Constants.LIST_VARIABLE_TYPE
        }
      ],
      extensions: ['contextMenu_getListBlock', 'colours_data_lists', 'output_string', 'monitor_block']
    });
  }
};

/**
 * List index menu, with all option.
 */
Blockly.Blocks['data_listindexall'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [
        {
          type: 'field_numberdropdown',
          name: 'INDEX',
          value: '1',
          min: 1,
          precision: 1,
          options: [
            ['1', '1'],
            [Blockly.Msg.DATA_INDEX_LAST, 'last'],
            [Blockly.Msg.DATA_INDEX_ALL, 'all']
          ]
        }
      ],
      extensions: ['colours_textfield', 'output_string']
    });
  }
};

/**
 * List index menu, with random option.
 */
Blockly.Blocks['data_listindexrandom'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [
        {
          type: 'field_numberdropdown',
          name: 'INDEX',
          value: '1',
          min: 1,
          precision: 1,
          options: [
            ['1', '1'],
            [Blockly.Msg.DATA_INDEX_LAST, 'last'],
            [Blockly.Msg.DATA_INDEX_RANDOM, 'random']
          ]
        }
      ],
      extensions: ['colours_textfield', 'output_string']
    });
  }
};

/**
 * Block to add item to list.
 */
Blockly.Blocks['data_addtolist'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_ADDTOLIST,
      args0: [
        {
          type: 'input_value',
          name: 'ITEM'
        },
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [Constants.LIST_VARIABLE_TYPE],
          defaultType: Constants.LIST_VARIABLE_TYPE
        }
      ],
      extensions: ['colours_data_lists', 'shape_statement']
    });
  }
};

/**
 * Block to delete item from list.
 */
Blockly.Blocks['data_deleteoflist'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_DELETEOFLIST,
      args0: [
        {
          type: 'input_value',
          name: 'INDEX'
        },
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [Constants.LIST_VARIABLE_TYPE],
          defaultType: Constants.LIST_VARIABLE_TYPE
        }
      ],
      extensions: ['colours_data_lists', 'shape_statement']
    });
  }
};

/**
 * Block to delete all items from list.
 */
Blockly.Blocks['data_deletealloflist'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_DELETEALLOFLIST,
      args0: [
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [Constants.LIST_VARIABLE_TYPE],
          defaultType: Constants.LIST_VARIABLE_TYPE
        }
      ],
      extensions: ['colours_data_lists', 'shape_statement']
    });
  }
};

/**
 * Block to insert item to list.
 */
Blockly.Blocks['data_insertatlist'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_INSERTATLIST,
      args0: [
        {
          type: 'input_value',
          name: 'ITEM'
        },
        {
          type: 'input_value',
          name: 'INDEX'
        },
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [Constants.LIST_VARIABLE_TYPE],
          defaultType: Constants.LIST_VARIABLE_TYPE
        }
      ],
      extensions: ['colours_data_lists', 'shape_statement']
    });
  }
};

/**
 * Block to insert item to list.
 */
Blockly.Blocks['data_replaceitemoflist'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_REPLACEITEMOFLIST,
      args0: [
        {
          type: 'input_value',
          name: 'INDEX'
        },
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [Constants.LIST_VARIABLE_TYPE],
          defaultType: Constants.LIST_VARIABLE_TYPE
        },
        {
          type: 'input_value',
          name: 'ITEM'
        }
      ],
      extensions: ['colours_data_lists', 'shape_statement']
    });
  }
};

/**
 * Block for reporting item of list.
 */
Blockly.Blocks['data_itemoflist'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_ITEMOFLIST,
      args0: [
        {
          type: 'input_value',
          name: 'INDEX'
        },
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [Constants.LIST_VARIABLE_TYPE],
          defaultType: Constants.LIST_VARIABLE_TYPE
        }
      ],
      output: null,
      extensions: ['colours_data_lists'],
      outputShape: Constants.OUTPUT_SHAPE_ROUND
    });
  }
};

/**
 * Block for reporting the item # of a string in a list.
 */
Blockly.Blocks['data_itemnumoflist'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_ITEMNUMOFLIST,
      args0: [
        {
          type: 'input_value',
          name: 'ITEM'
        },
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [Constants.LIST_VARIABLE_TYPE],
          defaultType: Constants.LIST_VARIABLE_TYPE
        }
      ],
      output: null,
      extensions: ['colours_data_lists'],
      outputShape: Constants.OUTPUT_SHAPE_ROUND
    });
  }
};

/**
 * Block for reporting length of list.
 */
Blockly.Blocks['data_lengthoflist'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_LENGTHOFLIST,
      args0: [
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [Constants.LIST_VARIABLE_TYPE],
          defaultType: Constants.LIST_VARIABLE_TYPE
        }
      ],
      extensions: ['colours_data_lists', 'output_number']
    });
  }
};

/**
 * Block to report whether list contains item.
 */
Blockly.Blocks['data_listcontainsitem'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_LISTCONTAINSITEM,
      args0: [
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [Constants.LIST_VARIABLE_TYPE],
          defaultType: Constants.LIST_VARIABLE_TYPE
        },
        {
          type: 'input_value',
          name: 'ITEM'
        }
      ],
      extensions: ['colours_data_lists', 'output_boolean']
    });
  }
};

/**
 * Block to show a list.
 */
Blockly.Blocks['data_showlist'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_SHOWLIST,
      args0: [
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [Constants.LIST_VARIABLE_TYPE],
          defaultType: Constants.LIST_VARIABLE_TYPE
        }
      ],
      extensions: ['colours_data_lists', 'shape_statement']
    });
  }
};

/**
 * Block to hide a list.
 */
Blockly.Blocks['data_hidelist'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.DATA_HIDELIST,
      args0: [
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [Constants.LIST_VARIABLE_TYPE],
          defaultType: Constants.LIST_VARIABLE_TYPE
        }
      ],
      extensions: ['colours_data_lists', 'shape_statement']
    });
  }
};

/**
 * Callback factory for dropdown menu options associated with a variable getter
 * block.  Each variable on the workspace gets its own item in the dropdown
 * menu, and clicking on that item changes the text of the field on the source
 * block.
 * @param block The block to update.
 * @param id The id of the variable to set on this block.
 * @param fieldName The name of the field to update on the block.
 * @returns A function that updates the block with the new name.
 */
function variableOptionCallbackFactory(
  block: Blockly.Block,
  id: string,
  fieldName: string
): () => void {
  return function() {
    const variableField = block.getField(fieldName);
    if (!variableField) {
      console.log('Tried to get a variable field on the wrong type of block.');
    } else {
      variableField.setValue(id);
    }
  };
};

/**
 * Callback for rename variable dropdown menu option associated with a
 * variable getter block.
 * @param block The block with the variable to rename.
 * @param fieldName The name of the field to inspect on the block.
 * @returns A function that renames the variable.
 */
function renameOptionCallbackFactory(
  block: Blockly.Block,
  fieldName: string
): () => void {
  return function() {
    const workspace = block.workspace;
    const variable = (block.getField(fieldName) as Blockly.FieldVariable).getVariable()!;
    Blockly.Variables.renameVariable(workspace, variable);
  };
};

/**
 * Callback for delete variable dropdown menu option associated with a
 * variable getter block.
 * @param block The block with the variable to delete.
 * @param fieldName The name of the field to inspect on the block.
 * @returns A function that deletes the variable.
 */
function deleteOptionCallbackFactory(
  block: Blockly.Block,
  fieldName: string
): () => void {
  return function() {
    const variable = (block.getField(fieldName) as Blockly.FieldVariable).getVariable()!;
    Blockly.Variables.deleteVariable(variable.getWorkspace(), variable, block);
    (block.workspace as Blockly.WorkspaceSvg).refreshToolboxSelection();
  };
};

/**
 * Mixin to add a context menu for a data_variable block.  It adds one item for
 * each variable defined on the workspace.
 */
const CUSTOM_CONTEXT_MENU_GET_VARIABLE_MIXIN = {
  /**
   * Add context menu option to change the selected variable.
   * @param options List of menu options to add to.
   */
  customContextMenu: function(
    this: Blockly.Block,
    options: Array<Blockly.ContextMenuRegistry.ContextMenuOption |
      Blockly.ContextMenuRegistry.LegacyContextMenuOption>
  ) {
    const fieldName = 'VARIABLE';
    if (this.isCollapsed()) {
      return;
    }
    const currentVarName = (this.getField(fieldName) as Blockly.FieldVariable).getText();
    if (!this.isInFlyout) {
      const variablesList = this.workspace.getVariableMap().getVariablesOfType('');
      variablesList.sort(function(a, b) {
        return compareStrings(a.getName(), b.getName());
      });
      for (let i = 0; i < variablesList.length; i++) {
        const varName = variablesList[i].getName();
        if (varName == currentVarName) continue;

        options.push({
          enabled: true,
          text: varName,
          callback: variableOptionCallbackFactory(this, variablesList[i].getId(), fieldName)
        });
      }
    } else {
      const renameOption = {
        text: Blockly.Msg.RENAME_VARIABLE,
        enabled: true,
        callback: renameOptionCallbackFactory(this, fieldName)
      };
      const deleteOption = {
        text: Blockly.Msg.DELETE_VARIABLE.replace('%1', currentVarName),
        enabled: true,
        callback: deleteOptionCallbackFactory(this, fieldName)
      };
      options.push(renameOption);
      options.push(deleteOption);
    }
  }
};

Blockly.Extensions.registerMixin('contextMenu_getVariableBlock', CUSTOM_CONTEXT_MENU_GET_VARIABLE_MIXIN);

/**
 * Mixin to add a context menu for a data_listcontents block.  It adds one item for
 * each list defined on the workspace.
 */
const CUSTOM_CONTEXT_MENU_GET_LIST_MIXIN = {
  /**
   * Add context menu option to change the selected list.
   * @param options List of menu options to add to.
   */
  customContextMenu: function(
    this: Blockly.Block,
    options: Array<Blockly.ContextMenuRegistry.ContextMenuOption |
      Blockly.ContextMenuRegistry.LegacyContextMenuOption>
  ) {
    const fieldName = 'LIST';
    if (this.isCollapsed()) {
      return;
    }
    const currentVarName = (this.getField(fieldName) as Blockly.FieldVariable).getText();
    if (!this.isInFlyout) {
      const variablesList = this.workspace.getVariableMap().getVariablesOfType('list');
      variablesList.sort(function(a, b) {
        return compareStrings(a.getName(), b.getName());
      });
      for (let i = 0; i < variablesList.length; i++) {
        const varName = variablesList[i].getName();
        if (varName == currentVarName) continue;

        options.push({
          enabled: true,
          text: varName,
          callback: variableOptionCallbackFactory(this, variablesList[i].getId(), fieldName)
        });
      }
    } else {
      const renameOption = {
        text: Blockly.Msg.RENAME_LIST,
        enabled: true,
        callback: renameOptionCallbackFactory(this, fieldName)
      };
      const deleteOption = {
        text: Blockly.Msg.DELETE_LIST.replace('%1', currentVarName),
        enabled: true,
        callback: deleteOptionCallbackFactory(this, fieldName)
      };
      options.push(renameOption);
      options.push(deleteOption);
    }
  }
};

Blockly.Extensions.registerMixin('contextMenu_getListBlock', CUSTOM_CONTEXT_MENU_GET_LIST_MIXIN);
