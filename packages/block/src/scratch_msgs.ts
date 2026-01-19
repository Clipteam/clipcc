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

import * as Blockly from 'blockly/core';

/**
 * The object containing messages for all locales - loaded from msg/scratch_msgs.ts
 */
export const locales: Record<string, typeof Blockly.Msg> = {};

// @todo Now we just import from messages.js directly
// @ts-ignore Just make tsc happy for now
window.Blockly.Msg = window.Blockly.Msg.Msg;
import '../msg/messages.js';
locales['en'] = Blockly.Msg;

/**
 * The current locale.
 */
let currentLocale = 'en';

/**
 * Change the Msg strings to a new Locale
 * Does not exist in Blockly, but needed in scratch-blocks
 * @param locale E.g., 'de', or 'zh-tw'
 * @package
 */
export function setLocale(locale: string) {
  if (Object.keys(locales).includes(locale)) {
    currentLocale = locale;
    Object.assign(Blockly.Msg, locales[locale]);
  } else {
    // keep current locale
    console.warn('Ignoring unrecognized locale: ' + locale);
  }
};

/**
 * Gets a localized message, for use in the Scratch VM with json init.
 * Does not interpolate placeholders. Provided to allow default values in
 * dynamic menus, for example, 'next backdrop', or 'random position'
 * @param msgId id for the message, key in Msg table.
 * @param defaultMsg string to use if the id isn't found.
 * @param locale optional locale to use in place of currentLocale_.
 * @returns message with placeholders filled.
 * @package
 */
export function translate(msgId: string, defaultMsg: string, locale = currentLocale) {
  if (Object.keys(locales).includes(locale)) {
    const messages = locales[locale];
    if (Object.keys(messages).includes(msgId)) {
      return messages[msgId];
    }
  }
  return defaultMsg;
};
