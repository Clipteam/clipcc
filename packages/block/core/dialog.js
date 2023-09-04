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

'use strict';

goog.provide('Blockly.dialog');


Blockly.dialog.alertImplementation_ = function(message, opt_callback) {
  window.alert(message);
  if (opt_callback) {
    opt_callback();
  }
};

Blockly.dialog.confirmImplementation_ = function(message, callback) {
  callback(window.confirm(message));
};

Blockly.dialog.promptImplementation_ = function(message, defaultValue, callback) {
  callback(window.prompt(message, defaultValue));
};

/**
 * Wrapper to window.alert() that app developers may override via setAlert to
 * provide alternatives to the modal browser window.
 * @param {string} message The message to display to the user.
 * @param {function()=} opt_callback The callback when the alert is dismissed.
 */
Blockly.dialog.alert = function(message, opt_callback) {
  Blockly.dialog.alertImplementation_(message, opt_callback);
};

/**
 * Sets the function to be run when Blockly.dialog.alert() is called.
 * @param {!function(string, function()=)} alertFunction The function to be run.
 * @see Blockly.dialog.alert
 */
Blockly.dialog.setAlert = function(alertFunction) {
  Blockly.dialog.alertImplementation_ = alertFunction;
};

/**
 * Wrapper to window.confirm() that app developers may override via setConfirm
 * to provide alternatives to the modal browser window.
 * @param {string} message The message to display to the user.
 * @param {!function(boolean)} callback The callback for handling user response.
 */
Blockly.dialog.confirm = function(message, callback) {
  Blockly.dialog.confirmImplementation_(message, callback);
};

/**
 * Sets the function to be run when Blockly.dialog.confirm() is called.
 * @param {!function(string, !function(boolean))} confirmFunction The function
 *    to be run.
 * @see Blockly.dialog.confirm
 */
Blockly.dialog.setConfirm = function(confirmFunction) {
  Blockly.dialog.confirmImplementation_ = confirmFunction;
};

/**
 * Wrapper to window.prompt() that app developers may override via setPrompt to
 * provide alternatives to the modal browser window. Built-in browser prompts
 * are often used for better text input experience on mobile device. We strongly
 * recommend testing mobile when overriding this.
 * @param {string} message The message to display to the user.
 * @param {string} defaultValue The value to initialize the prompt with.
 * @param {!function(?string)} callback The callback for handling user response.
 * @param {?string} _opt_title An optional title for the prompt.
 * @param {?string} _opt_varType An optional variable type for variable specific
 *     prompt behavior.
 */
Blockly.dialog.prompt = function(message, defaultValue, callback, _opt_title,
    _opt_varType) {
  // opt_title and opt_varType are unused because we only need them to pass
  // information to the scratch-gui, which overwrites this function
  Blockly.dialog.promptImplementation_(message, defaultValue, callback);
};

/**
 * Sets the function to be run when Blockly.dialog.prompt() is called.
 * @param {!function(string, string, !function(?string))} promptFunction The
 *    function to be run.
 * @see Blockly.dialog.prompt
 */
Blockly.dialog.setPrompt = function(promptFunction) {
  Blockly.dialog.promptImplementation_ = promptFunction;
};
