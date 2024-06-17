/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
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
 * @fileoverview Variable input field.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.FieldVariable');

import * as constants from './constants';
import * as eventUtils from './events/utils';
import {BlockChange} from './events/block_change';
import {Field} from './field';
import {FieldDropdown} from './field_dropdown';
import {Msg} from './msg';
import * as rendererConstants from './renderer/constants';
import * as utils from './utils';
import {VariableModel} from './variable_model';
import * as Variables from './variables';

const asserts = goog.require('goog.asserts');
const Size = goog.require('goog.math.Size');


/**
 * Class for a variable's dropdown field.
 * @param {?string} varname The default name for the variable.  If null,
 *     a unique variable name will be generated.
 * @param {Function=} opt_validator A function that is executed when a new
 *     option is selected.  Its sole argument is the new option value.
 * @param {Array.<string>} opt_variableTypes A list of the types of variables to
 *     include in the dropdown.
 * @extends {FieldDropdown}
 * @constructor
 */
export const FieldVariable = function(varname, opt_validator, opt_variableTypes) {
  // The FieldDropdown constructor would call setValue, which might create a
  // spurious variable.  Just do the relevant parts of the constructor.
  this.menuGenerator_ = FieldVariable.dropdownCreate;
  this.size_ = new Size(rendererConstants.FIELD_WIDTH,
      rendererConstants.FIELD_HEIGHT);
  this.setValidator(opt_validator);
  // TODO (blockly #1499): Add opt_default_type to match default value.
  // If not set, ''.
  this.defaultVariableName = (varname || '');
  const hasSingleVarType = opt_variableTypes && (opt_variableTypes.length == 1);
  this.defaultType_ = hasSingleVarType ? opt_variableTypes[0] : '';
  this.variableTypes = opt_variableTypes;
  this.addArgType('variable');

  this.value_ = null;
};
goog.inherits(FieldVariable, FieldDropdown);

/**
 * Construct a FieldVariable from a JSON arg object,
 * dereferencing any string table references.
 * @param {!Object} options A JSON object with options (variable,
 *                          variableTypes, and defaultType).
 * @returns {!FieldVariable} The new field instance.
 * @package
 * @nocollapse
 */
FieldVariable.fromJson = function(options) {
  const varname = utils.replaceMessageReferences(options['variable']);
  const variableTypes = options['variableTypes'];
  return new FieldVariable(varname, null, variableTypes);
};

/**
 * Initialize everything needed to render this field.  This includes making sure
 * that the field's value is valid.
 * @public
 */
FieldVariable.prototype.init = function() {
  if (this.fieldGroup_) {
    // Dropdown has already been initialized once.
    return;
  }
  FieldVariable.superClass_.init.call(this);

  // TODO (blockly #1010): Change from init/initModel to initView/initModel
  this.initModel();
};

/**
 * Initialize the model for this field if it has not already been initialized.
 * If the value has not been set to a variable by the first render, we make up a
 * variable rather than let the value be invalid.
 * @package
 */
FieldVariable.prototype.initModel = function() {
  if (this.variable_) {
    return; // Initialization already happened.
  }
  this.workspace_ = this.sourceBlock_.workspace;
  // Initialize this field if it's in a broadcast block in the flyout
  let variable = this.initFlyoutBroadcast_(this.workspace_);
  if (!variable) {
    variable = Variables.getOrCreateVariablePackage(
        this.workspace_, null, this.defaultVariableName, this.defaultType_);
  }
  // Don't fire a change event for this setValue.  It would have null as the
  // old value, which is not valid.
  eventUtils.disable();
  try {
    this.setValue(variable.getId());
  } finally {
    eventUtils.enable();
  }
};

/**
 * Initialize broadcast blocks in the flyout.
 * Implicit deletion of broadcast messages from the scratch vm may cause
 * broadcast blocks in the flyout to change which variable they display as the
 * selected option when the workspace is refreshed.
 * Re-sort the broadcast messages by name, and set the field value to the id
 * of the variable that comes first in sorted order.
 * @param {!Blockly.Workspace} workspace The flyout workspace containing the
 * broadcast block.
 * @return {string} The variable of type 'broadcast_msg' that comes
 * first in sorted order.
 */
FieldVariable.prototype.initFlyoutBroadcast_ = function(workspace) {
  // Using shorter name for this constant
  const broadcastMsgType = constants.BROADCAST_MESSAGE_VARIABLE_TYPE;
  const broadcastVars = workspace.getVariablesOfType(broadcastMsgType);
  if(workspace.isFlyout && this.defaultType_ == broadcastMsgType &&
      broadcastVars.length != 0) {
    broadcastVars.sort(VariableModel.compareByName);
    return broadcastVars[0];
  }
};

/**
 * Dispose of this field.
 * @public
 */
FieldVariable.dispose = function() {
  FieldVariable.superClass_.dispose.call(this);
  this.workspace_ = null;
  this.variableMap_ = null;
};

/**
 * Attach this field to a block.
 * @param {!Blockly.Block} block The block containing this field.
 */
FieldVariable.prototype.setSourceBlock = function(block) {
  asserts.assert(!block.isShadow(),
      'Variable fields are not allowed to exist on shadow blocks.');
  FieldVariable.superClass_.setSourceBlock.call(this, block);
};

/**
 * Get the variable's ID.
 * @return {string} Current variable's ID.
 */
FieldVariable.prototype.getValue = function() {
  return this.variable_ ? this.variable_.getId() : null;
};

/**
 * Get the text from this field, which is the selected variable's name.
 * @return {string} The selected variable's name, or the empty string if no
 *     variable is selected.
 */
FieldVariable.prototype.getText = function() {
  return this.variable_ ? this.variable_.name : '';
};

/**
 * Get the variable model for the selected variable.
 * Not guaranteed to be in the variable map on the workspace (e.g. if accessed
 * after the variable has been deleted).
 * @return {?Blockly.VariableModel} the selected variable, or null if none was
 *     selected.
 * @package
 */
FieldVariable.prototype.getVariable = function() {
  return this.variable_;
};

/**
 * Set the variable ID.
 * @param {string} id New variable ID, which must reference an existing
 *     variable.
 */
FieldVariable.prototype.setValue = function(id) {
  const workspace = this.sourceBlock_.workspace;
  const variable = Variables.getVariable(workspace, id);

  if (!variable) {
    throw new Error('Variable id doesn\'t point to a real variable!  ID was ' +
        id);
  }
  // Type checks!
  const type = variable.type;
  if (!this.typeIsAllowed_(type)) {
    throw new Error('Variable type doesn\'t match this field!  Type was ' +
        type);
  }
  if (this.sourceBlock_ && eventUtils.isEnabled()) {
    const oldValue = this.variable_ ? this.variable_.getId() : null;
    eventUtils.fire(new BlockChange(
        this.sourceBlock_, 'field', this.name, oldValue, id));
  }
  this.variable_ = variable;
  this.value_ = id;
  this.setText(variable.name);
};

/**
 * Check whether the given variable type is allowed on this field.
 * @param {string} type The type to check.
 * @return {boolean} True if the type is in the list of allowed types.
 * @private
 */
FieldVariable.prototype.typeIsAllowed_ = function(type) {
  const typeList = this.getVariableTypes_();
  if (!typeList) {
    return true; // If it's null, all types are valid.
  }
  for (let i = 0; i < typeList.length; i++) {
    if (type == typeList[i]) {
      return true;
    }
  }
  return false;
};

/**
 * Return a list of variable types to include in the dropdown.
 * @return {!Array.<string>} Array of variable types.
 * @throws {Error} if variableTypes is an empty array.
 * @private
 */
FieldVariable.prototype.getVariableTypes_ = function() {
  // TODO (#1513): Try to avoid calling this every time the field is edited.
  let variableTypes = this.variableTypes;
  if (variableTypes === null) {
    // If variableTypes is null, return all variable types.
    if (this.sourceBlock_) {
      const workspace = this.sourceBlock_.workspace;
      return workspace.getVariableTypes();
    }
  }
  variableTypes = variableTypes || [''];
  if (variableTypes.length == 0) {
    // Throw an error if variableTypes is an empty list.
    const name = this.getText();
    throw new Error('\'variableTypes\' of field variable ' +
      name + ' was an empty list');
  }
  return variableTypes;
};

/**
 * Return a sorted list of variable names for variable dropdown menus.
 * Include a special option at the end for creating a new variable name.
 * @return {!Array.<string>} Array of variable names.
 * @this {FieldVariable}
 */
FieldVariable.dropdownCreate = function() {
  if (!this.variable_) {
    throw new Error('Tried to call dropdownCreate on a variable field with no' +
        ' variable selected.');
  }
  let variableModelList = [];
  const name = this.getText();
  let workspace = null;
  if (this.sourceBlock_) {
    workspace = this.sourceBlock_.workspace;
  }
  if (workspace) {
    const variableTypes = this.getVariableTypes_();
    // Get a copy of the list, so that adding rename and new variable options
    // doesn't modify the workspace's list.
    for (let i = 0; i < variableTypes.length; i++) {
      const variableType = variableTypes[i];
      const variables = workspace.getVariablesOfType(variableType);
      variableModelList = variableModelList.concat(variables);

      const potentialVarMap = workspace.getPotentialVariableMap();
      if (potentialVarMap) {
        const potentialVars = potentialVarMap.getVariablesOfType(variableType);
        variableModelList = variableModelList.concat(potentialVars);
      }
    }
  }
  variableModelList.sort(VariableModel.compareByName);

  const options = [];
  for (let i = 0; i < variableModelList.length; i++) {
    // Set the uuid as the internal representation of the variable.
    options[i] = [variableModelList[i].name, variableModelList[i].getId()];
  }
  if (this.defaultType_ == constants.BROADCAST_MESSAGE_VARIABLE_TYPE) {
    options.unshift(
        [Msg.NEW_BROADCAST_MESSAGE, constants.NEW_BROADCAST_MESSAGE_ID]);
  } else {
    // Scalar variables and lists have the same backing action, but the option
    // text is different.
    let renameText;
    let deleteText;
    if (this.defaultType_ == constants.LIST_VARIABLE_TYPE) {
      renameText = Msg.RENAME_LIST;
      deleteText = Msg.DELETE_LIST;
    } else {
      renameText = Msg.RENAME_VARIABLE;
      deleteText = Msg.DELETE_VARIABLE;
    }
    options.push([renameText, constants.RENAME_VARIABLE_ID]);
    if (deleteText) {
      options.push(
          [
            deleteText.replace('%1', name),
            constants.DELETE_VARIABLE_ID
          ]);
    }
  }

  return options;
};

/**
 * Handle the selection of an item in the variable dropdown menu.
 * Special case the 'Rename variable...', 'Delete variable...',
 * and 'New message...' options.
 * In the rename case, prompt the user for a new name.
 * @param {!goog.ui.Menu} menu The Menu component clicked.
 * @param {!goog.ui.MenuItem} menuItem The MenuItem selected within menu.
 */
FieldVariable.prototype.onItemSelected = function(menu, menuItem) {
  const id = menuItem.getValue();
  if (this.sourceBlock_ && this.sourceBlock_.workspace) {
    const workspace = this.sourceBlock_.workspace;
    if (id == constants.RENAME_VARIABLE_ID) {
      // Rename variable.
      Variables.renameVariable(workspace, this.variable_);
      return;
    } else if (id == constants.DELETE_VARIABLE_ID) {
      // Delete variable.
      workspace.deleteVariableById(this.variable_.getId());
      return;
    } else if (id == constants.NEW_BROADCAST_MESSAGE_ID) {
      const thisField = this;
      const updateField = function(varId) {
        if (varId) {
          thisField.setValue(varId);
        }
      };
      Variables.createVariable(workspace, updateField,
          constants.BROADCAST_MESSAGE_VARIABLE_TYPE);
      return;
    }

    // TODO (blockly #1529): Call any validation function, and allow it to override.
  }
  this.setValue(id);
};


/**
 * Saves this field's value.
 * @param {boolean=} doFullSerialization If true, the variable field will
 *     serialize the full state of the field being referenced (ie ID, name,
 *     and type) rather than just a reference to it (ie ID).
 * @return {*} The state of the variable field.
 * @override
 * @package
 */
FieldVariable.prototype.saveState = function(doFullSerialization) {
  const legacyState = this.saveLegacyState(FieldVariable);
  if (legacyState !== null) {
    return legacyState;
  }
  // Make sure the variable is initialized.
  this.initModel();
  const state = {
    id: this.variable_.getId()
  };
  if (doFullSerialization) {
    state['name'] = this.variable_.name;
    state['type'] = this.variable_.type;
  }
  return state;
};

/**
 * Sets the field's value based on the given state.
 * @param {*} state The state of the variable to assign to this variable field.
 * @override
 * @package
 */
FieldVariable.prototype.loadState = function(state) {
  if (this.loadLegacyState(FieldVariable, state)) {
    return;
  }
  // This is necessary so that blocks in the flyout can have custom var names.
  const variable = Variables.getOrCreateVariablePackage(
      this.sourceBlock_.workspace,
      state['id'] || null,
      state['name'],
      state['type'] || '');
  this.setValue(variable.getId());
};

/**
 * Overrides referencesVariables(), indicating this field refers to a variable.
 * @return {boolean} True.
 * @package
 * @override
 */
FieldVariable.prototype.referencesVariables = function() {
  return true;
};

Field.register('field_variable', FieldVariable);
