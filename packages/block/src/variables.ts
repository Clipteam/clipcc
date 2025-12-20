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
 * @fileoverview Utility functions for handling variables.
 * @author fraser@google.com (Neil Fraser)
 */

import * as Blockly from 'blockly/core';
import './variable_model';
import './variable_map';
import * as callbackRegistry from './callback_registry';
import * as Constants from './constants';
import {VariableModel} from './variable_model';
import type {VerticalFlyout} from './toolbox/flyout';

/**
 * Constant prefix to differentiate cloud variable names from other types
 * of variables.
 * This is the \u2601 cloud unicode character followed by a space.
 */
export const CLOUD_PREFIX = '☁ ';

/**
 * Create a new variable on the given workspace via registered prompt.
 * @param workspace The workspace on which to create the variable.
 * @param callback An optional callback function to act on the id of the
 *     variable that is created from the user's input, or null if the change is
 *     to be aborted (cancel button or an invalid name was provided).
 * @param type Optional type of the variable to be created, like 'string' or
 *     'list'.
 */
export function createVariableVisually(
  workspace: Blockly.WorkspaceSvg,
  callback?: (id?: string) => void,
  type?: string
) {
  // Decide on a modal message based on the type. If type was not
  // provided, default to the original message for scalar variables.
  let newMsg: string;
  let modalTitle: string;
  if (type === Constants.BROADCAST_MESSAGE_VARIABLE_TYPE) {
    newMsg = Blockly.Msg.NEW_BROADCAST_MESSAGE_TITLE;
    modalTitle = Blockly.Msg.BROADCAST_MODAL_TITLE;
  } else if (type === Constants.LIST_VARIABLE_TYPE) {
    newMsg = Blockly.Msg.NEW_LIST_TITLE;
    modalTitle = Blockly.Msg.LIST_MODAL_TITLE;
  } else {
    // Note: this case covers 1) scalar variables, 2) any new type of
    // variable not explicitly checked for above, and 3) a null or undefined
    // type -- turns a falsey type into ''
    // TODO (#1251) Warn developers that they didn't provide a type/
    // provided a falsey type
    type = type ? type : '';
    newMsg = Blockly.Msg.NEW_VARIABLE_TITLE;
    modalTitle = Blockly.Msg.VARIABLE_MODAL_TITLE;
  }
  const validate = nameValidator.bind(null, type);
  const prompt = callbackRegistry.get('prompt');

  // Prompt the user to enter a name for the variable
  prompt(
    newMsg,
    '',
    function(
      text: string,
      additionalVars: string[],
      variableOptions?: { scope?: string; isCloud?: boolean }
    ) {
      variableOptions = variableOptions || {};
      const scope = variableOptions.scope;
      const isLocal = scope === 'local' || false;
      const isCloud = variableOptions.isCloud || false;
      // Default to [] if additionalVars is not provided
      additionalVars = additionalVars || [];
      // Only use additionalVars for global variable creation.
      const additionalVarNames = isLocal ? [] : additionalVars;

      const validatedText = validate(
        text,
        workspace,
        additionalVarNames,
        isCloud,
        callback
      );
      if (validatedText) {
        const variable = new VariableModel(
          workspace,
          validatedText,
          type,
          undefined,
          isLocal,
          isCloud
        );
        workspace.getVariableMap().addVariable(variable);
        Blockly.Events.fire(
          new (Blockly.Events.get(Blockly.Events.VAR_CREATE))(variable)
        );

        // Refresh checkbox status
        const toolbox = workspace.getToolbox();
        if (!toolbox) return;
        const flyout = toolbox.getFlyout() as VerticalFlyout;
        const variableBlockId = variable.getId();

        flyout.setCheckboxState(variableBlockId, true);

        if (callback) {
          callback(variableBlockId);
        }
      } else {
        // User canceled prompt without a value.
        if (callback) {
          callback();
        }
      }
    },
    modalTitle,
    type
  );
}

/**
 * This function provides a common interface for variable name validation
 * agnostic of type. This is so that functions like  createVariable and
 * renameVariable can call a single function (with a single type signature) to
 * validate the user-provided name for a variable.
 * @param type The type of the variable for which the provided name should be
 *     validated.
 * @param text The user-provided text that should be validated as a variable
 *     name.
 * @param workspace The workspace on which to validate the variable name. This
 *     is the workspace used to check whether the variable already exists.
 * @param additionalVars A list of additional var names to check for conflicts
 *     against.
 * @param isCloud Whether the variable is a cloud variable.
 * @param callback An optional function to be called on a pre-existing
 *     variable of the user-provided name. This function is currently only used
 *     for broadcast messages.
 * @returns The validated name according to the parameters given, if the name is
 *     determined to be valid, or null if the name is determined to be invalid/
 *     in-use, and the calling function should not proceed with creating or
 *     renaming the variable.
 */
function nameValidator(
  type: string,
  text: string,
  workspace: Blockly.WorkspaceSvg,
  additionalVars: string[],
  isCloud: boolean,
  callback?: (id?: string) => void
): string | null {
  // The validators for the different variable types require slightly different
  // arguments. For broadcast messages, if a broadcast message of the provided
  // name already exists, the validator needs to call a function that updates
  // the selected field option of the dropdown menu of the block that was used
  // to create the new message. For scalar variables and lists, the validator
  // has the same validation behavior, but needs to know which type of variable
  // to check for and needs a type-specific error message that is displayed when
  // a variable of the given name and type already exists.

  if (type === Constants.BROADCAST_MESSAGE_VARIABLE_TYPE) {
    return validateBroadcastMessageName(text, workspace, callback);
  } else if (type === Constants.LIST_VARIABLE_TYPE) {
    return validateScalarVarOrListName(
      text,
      workspace,
      additionalVars,
      false,
      type,
      Blockly.Msg.LIST_ALREADY_EXISTS
    );
  } else {
    return validateScalarVarOrListName(
      text,
      workspace,
      additionalVars,
      isCloud,
      type,
      Blockly.Msg.VARIABLE_ALREADY_EXISTS
    );
  }
}

/**
 * Validate the given name as a broadcast message type.
 * @param name The name to validate
 * @param workspace The workspace the name should be validated against.
 * @param callback An optional function to call if a broadcast message
 *     already exists with the given name. This function will be called on the
 *     id of the existing variable.
 * @returns The validated name, or null if invalid.
 */
function validateBroadcastMessageName(
  name: string,
  workspace: Blockly.WorkspaceSvg,
  callback?: (id?: string) => void
): string | null {
  if (!name) {
    // no name was provided or the user cancelled the prompt
    return null;
  }
  const variable = workspace.getVariableMap().getVariable(name, Constants.BROADCAST_MESSAGE_VARIABLE_TYPE);
  if (variable) {
    // If the user provided a name for a broadcast message that already exists,
    // use the provided callback function to update the selected option in
    // the field of the block that was used to create
    // this message.
    if (callback) {
      callback(variable.getId());
    }
    // Return null to signal to the calling function that we do not want to create
    // a new variable since one already exists.
    return null;
  } else {
    // The name provided is actually a new name, so the calling
    // function should go ahead and create it as a new variable.
    return name;
  }
}

/**
 * Validate the given name as a scalar variable or list type.
 * This function is also responsible for any user facing error-handling.
 * @param name The name to validate
 * @param workspace The workspace the name should be validated against.
 * @param additionalVars A list of additional variable names to check for
 *     conflicts against.
 * @param isCloud Whether the variable is a cloud variable.
 * @param type The type to validate the variable as. This should be one of
 *     SCALAR_VARIABLE_TYPE or LIST_VARIABLE_TYPE.
 * @param errorMsg The type-specific error message the user should see if a
 *     variable of the validated, given name and type already exists.
 * @returns The validated name, or null if invalid.
 */
function validateScalarVarOrListName(
  name: string,
  workspace: Blockly.WorkspaceSvg,
  additionalVars: string[],
  isCloud: boolean,
  type: string,
  errorMsg: string
): string | null {
  // For scalar variables, we don't want leading or trailing white space
  name = name.trim();
  if (!name) {
    return null;
  }
  if (isCloud) {
    name = CLOUD_PREFIX + name;
  }
  if (workspace.getVariableMap().getVariable(name, type) || additionalVars.indexOf(name) >= 0) {
    // error
    Blockly.dialog.alert(errorMsg.replace('%1', name));
    return null;
  } else {
    // trimmed name is valid
    return name;
  }
}

/**
 * Rename a variable with the given workspace, variableType, and oldName via registered prompt.
 * @param workspace The workspace on which to rename the variable.
 * @param variable Variable to rename.
 * @param callback A callback. It will be passed an acceptable new variable
 *     name, or null if change is to be aborted (cancel button), or undefined if
 *     an existing variable was chosen.
 */
export function renameVariableVisually(
  workspace: Blockly.WorkspaceSvg,
  variable: VariableModel,
  callback?: (id?: string) => void
) {
  // Validation and modal message/title depends on the variable type
  let promptMsg; let modalTitle;
  const varType = variable.getType();
  if (varType === Constants.BROADCAST_MESSAGE_VARIABLE_TYPE) {
    console.warn(
      `Unexpected attempt to rename a broadcast message with ` +
      `id: "${variable.getId()} and name: ${variable.getName()}`
    );
    return;
  }
  if (varType === Constants.LIST_VARIABLE_TYPE) {
    promptMsg = Blockly.Msg.RENAME_LIST_TITLE;
    modalTitle = Blockly.Msg.RENAME_LIST_MODAL_TITLE;
  } else {
    // Default for all other types of variables
    promptMsg = Blockly.Msg.RENAME_VARIABLE_TITLE;
    modalTitle = Blockly.Msg.RENAME_VARIABLE_MODAL_TITLE;
  }
  const validate = nameValidator.bind(null, varType);

  const promptText = promptMsg.replace('%1', variable.getName());
  let promptDefaultText = variable.getName();
  if (variable.getCloud() && variable.getName().indexOf(CLOUD_PREFIX) === 0) {
    promptDefaultText = promptDefaultText.substring(CLOUD_PREFIX.length);
  }

  const promptCallback = callbackRegistry.get('prompt');
  promptCallback(
    promptText,
    promptDefaultText,
    (newName: string, additionalVars: string[]) => {
      if (
        variable.getCloud() &&
        newName.length > 0 &&
        newName.indexOf(CLOUD_PREFIX) === 0
      ) {
        newName = newName.substring(CLOUD_PREFIX.length);
        // The name validator will add the prefix back
      }
      additionalVars = additionalVars || [];
      const additionalVarNames = variable.getLocal() ? [] : additionalVars;
      const validatedText = validate(
        newName,
        workspace,
        additionalVarNames,
        variable.getCloud()
      );
      if (validatedText) {
        workspace.getVariableMap().renameVariable(variable, validatedText);
        if (callback) {
          callback(newName);
        }
      } else {
        // User canceled prompt without a value.
        if (callback) {
          callback();
        }
      }
    },
    modalTitle,
    varType
  );
}

