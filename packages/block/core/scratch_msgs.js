/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2018 Google Inc.
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
 * @fileoverview Scratch Messages singleton, with function to override Msg values.
 * @author chrisg@media.mit.edu (Chris Garrity)
 */
'use strict';

/**
 * Name space for the ScratchMsgs singleton.
 * Msg gets populated in the message files.
 */
import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.ScratchMsgs');

import {Msg} from './msg';


/**
 * The object containing messages for all locales - loaded from msg/scratch_msgs.
 * @type {Object}
 */
export const locales = {};

/**
 * The current locale.
 * @type {String}
 * @private
 */
let currentLocale = 'en';

/**
 * Change the Msg strings to a new Locale
 * Does not exist in Blockly, but needed in scratch-blocks
 * @param {string} locale E.g., 'de', or 'zh-tw'
 * @package
 */
export const setLocale = function(locale) {
  if (Object.keys(locales).includes(locale)) {
    currentLocale = locale;
    Object.assign(Msg, locales[locale]);
  } else {
    // keep current locale
    console.warn('Ignoring unrecognized locale: ' + locale);
  }
};

/**
 * Append new locale strings.
 * @param {Object} newLocales new locale object.
 * @package
 */
export const appendLocales = function(newLocales) {
  if (newLocales['default']) {
    Object.assign(Msg, newLocales['default']);
    delete newLocales.default;
  }
  Object.assign(locales, newLocales);
};

/**
 * Gets a localized message, for use in the Scratch VM with json init.
 * Does not interpolate placeholders. Provided to allow default values in
 * dynamic menus, for example, 'next backdrop', or 'random position'
 * @param {string} msgId id for the message, key in Msg table.
 * @param {string} defaultMsg string to use if the id isn't found.
 * @param {string} useLocale optional locale to use in place of currentLocale_.
 * @return {string} message with placeholders filled.
 * @package
 */
export const translate = function(msgId, defaultMsg, useLocale) {
  const locale = useLocale || currentLocale;

  if (Object.keys(locales).includes(locale)) {
    const messages = locales[locale];
    if (Object.keys(messages).includes(msgId)) {
      return messages[msgId];
    }
  }
  return defaultMsg;
};
