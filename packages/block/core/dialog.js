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

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.dialog');


let alertImplementation = function(message, opt_callback) {
  window.alert(message);
  if (opt_callback) {
    opt_callback();
  }
};

let confirmImplementation = function(message, callback) {
  callback(window.confirm(message));
};

let promptImplementation = function(message, defaultValue, callback) {
  callback(window.prompt(message, defaultValue));
};

/**
 * Wrapper to window.alert() that app developers may override via setAlert to
 * provide alternatives to the modal browser window.
 * @param {string} message The message to display to the user.
 * @param {function()=} opt_callback The callback when the alert is dismissed.
 */
export const alert = function(message, opt_callback) {
  alertImplementation(message, opt_callback);
};

/**
 * Sets the function to be run when alert() is called.
 * @param {!function(string, function()=)} alertFunction The function to be run.
 * @see alert
 */
export const setAlert = function(alertFunction) {
  alertImplementation = alertFunction;
};

/**
 * Wrapper to window.confirm() that app developers may override via setConfirm
 * to provide alternatives to the modal browser window.
 * @param {string} message The message to display to the user.
 * @param {!function(boolean)} callback The callback for handling user response.
 */
export const confirm = function(message, callback) {
  confirmImplementation(message, callback);
};

/**
 * Sets the function to be run when confirm() is called.
 * @param {!function(string, !function(boolean))} confirmFunction The function
 *    to be run.
 * @see confirm
 */
export const setConfirm = function(confirmFunction) {
  confirmImplementation = confirmFunction;
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
export const prompt = function(message, defaultValue, callback, _opt_title,
    _opt_varType) {
  // opt_title and opt_varType are unused because we only need them to pass
  // information to the scratch-gui, which overwrites this function
  promptImplementation(message, defaultValue, callback);
};

/**
 * Sets the function to be run when prompt() is called.
 * @param {!function(string, string, !function(?string))} promptFunction The
 *    function to be run.
 * @see prompt
 */
export const setPrompt = function(promptFunction) {
  promptImplementation = promptFunction;
};
