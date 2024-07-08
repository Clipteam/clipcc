/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2020 Google Inc.
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
 * @fileoverview This file is a universal registry that provides generic methods
 *    for registering and unregistering different types of classes.
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.registry');


/**
 * A map of maps. With the keys being the type and name of the class we are
 * registering and the value being the constructor function.
 * e.g. {'field': {'field_angle': Blockly.FieldAngle}}
 * @type {!Object<string, !Object<string, (function(new:?)|!Object)>>}
 */
const typeMap = Object.create(null);

/**
 * A map of maps. With the keys being the type and caseless name of the class we
 * are registring, and the value being the most recent cased name for that
 * registration.
 * @type {!Object<string, !Object<string, string>>}
 */
const nameMap = Object.create(null);

/**
 * The string used to register the default class for a type of plugin.
 * @type {string}
 */
export const DEFAULT = 'default';

/**
 * A name with the type of the element stored in the generic.
 * @template T
 */
export class Type {
  /**
   * @param {string} name The name of the registry type.
   */
  constructor(name) {
    this.name_ = name;
  }
  /**
   * Returns the name of the type.
   * @return {string} The name.
   */
  toString() {
    return this.name_;
  }
}

/** @type {!Type<Blockly.Events.Abstract>} */
Type.EVENT = new Type('event');

/** @type {!Type<Blockly.Field>} */
Type.FIELD = new Type('field');

/** @type {!Type<Blockly.VerticalFlyout>} */
Type.FLYOUTS_VERTICAL_TOOLBOX =
    new Type('flyoutsVerticalToolbox');

/** @type {!Type<Blockly.HorizontalFlyout>} */
Type.FLYOUTS_HORIZONTAL_TOOLBOX =
    new Type('flyoutsHorizontalToolbox');

/**
 * Registers a class based on a type and name.
 * @param {string|!Type<T>} type The type of the plugin. (e.g. Field)
 * @param {string} name The plugin's name. (Ex. field_angle)
 * @param {?function(new:T, ...?)|Object} registryItem The class or object to
 *     register.
 * @param {boolean=} opt_allowOverrides True to prevent an error when overriding
 *     an already registered item.
 * @throws {Error} if the type or name is empty, a name with the given type has
 *     already been registered, or if the given class or object is not valid for
 *     its type.
 * @template T
 */
export const register = function(type, name, registryItem, opt_allowOverrides) {
  if ((!(type instanceof Type) && typeof type !== 'string') ||
      String(type).trim() === '') {
    throw Error(
        'Invalid type "' + type + '". The type must be a' +
        ' non-empty string or a Type.');
  }
  type = String(type).toLowerCase();

  if ((typeof name !== 'string') || (name.trim() === '')) {
    throw Error(
        'Invalid name "' + name + '". The name must be a' +
        ' non-empty string.');
  }
  const caselessName = name.toLowerCase();
  if (!registryItem) {
    throw Error('Can not register a null value');
  }
  let typeRegistry = typeMap[type];
  let nameRegistry = nameMap[type];
  // If the type registry has not been created, create it.
  if (!typeRegistry) {
    typeRegistry = typeMap[type] = Object.create(null);
    nameRegistry = nameMap[type] = Object.create(null);
  }

  // Validate that the given class has all the required properties.
  validate(type, registryItem);

  // Don't throw an error if opt_allowOverrides is true.
  if (!opt_allowOverrides && typeRegistry[caselessName]) {
    throw Error(
        'Name "' + caselessName + '" with type "' + type +
        '" already registered.');
  }
  typeRegistry[caselessName] = registryItem;
  nameRegistry[caselessName] = name;
};

/**
 * Checks the given registry item for properties that are required based on the
 * type.
 * @param {string} type The type of the plugin. (e.g. Field)
 * @param {Function|Object} registryItem A class or object that we are checking
 *     for the required properties.
 * @private
 */
const validate = function(type, registryItem) {
  switch (type) {
    case String(Type.FIELD):
      if (typeof registryItem.fromJson !== 'function') {
        throw Error('Type "' + type + '" must have a fromJson function');
      }
      break;
  }
};

/**
 * Unregisters the registry item with the given type and name.
 * @param {string|!Type<T>} type The type of the plugin. (e.g. Field)
 * @param {string} name The plugin's name. (Ex. field_angle)
 * @template T
 */
export const unregister = function(type, name) {
  type = String(type).toLowerCase();
  name = name.toLowerCase();
  const typeRegistry = typeMap[type];
  if (!typeRegistry || !typeRegistry[name]) {
    console.warn(
        'Unable to unregister [' + name + '][' + type + '] from the ' +
        'registry.');
    return;
  }
  delete typeMap[type][name];
  delete nameMap[type][name];
};

/**
 * Gets the registry item for the given name and type. This can be either a
 * class or an object.
 * @param {string|!Type<T>} type The type of the plugin. (e.g. Field)
 * @param {string} name The plugin's name. (Ex. field_angle)
 * @param {boolean=} opt_throwIfMissing Whether or not to throw an error if we
 *     are unable to find the plugin.
 * @return {?function(new:T, ...?)|Object} The class or object with the given
 *     name and type or null if none exists.
 * @template T
 * @private
 */
const getItem = function(type, name, opt_throwIfMissing) {
  type = String(type).toLowerCase();
  name = name.toLowerCase();
  const typeRegistry = typeMap[type];
  if (!typeRegistry || !typeRegistry[name]) {
    const msg = 'Unable to find [' + name + '][' + type + '] in the registry.';
    if (opt_throwIfMissing) {
      throw new Error(
          msg + ' You must require or register a ' + type + ' plugin.');
    } else {
      console.warn(msg);
    }
    return null;
  }
  return typeRegistry[name];
};

/**
 * Returns whether or not the registry contains an item with the given type and
 * name.
 * @param {string|!Type<T>} type The type of the plugin. (e.g. Field)
 * @param {string} name The plugin's name. (Ex. field_angle)
 * @return {boolean} True if the registry has an item with the given type and
 *     name, false otherwise.
 * @template T
 */
export const hasItem = function(type, name) {
  type = String(type).toLowerCase();
  name = name.toLowerCase();
  const typeRegistry = typeMap[type];
  if (!typeRegistry) {
    return false;
  }
  return !!(typeRegistry[name]);
};

/**
 * Gets the class for the given name and type.
 * @param {string|!Type<T>} type The type of the plugin.
 *     (e.g. Field, Renderer)
 * @param {string} name The plugin's name. (Ex. field_angle, geras)
 * @param {boolean=} opt_throwIfMissing Whether or not to throw an error if we
 *     are unable to find the plugin.
 * @return {?function(new:T, ...?)} The class with the given name and type or
 *     null if none exists.
 * @template T
 */
export const getClass = function(type, name, opt_throwIfMissing) {
  return getItem(type, name, opt_throwIfMissing);
};

/**
 * Gets the object for the given name and type.
 * @param {string|!Type<T>} type The type of the plugin. (e.g. Category)
 * @param {string} name The plugin's name. (Ex. logic_category)
 * @param {boolean=} opt_throwIfMissing Whether or not to throw an error if we
 *     are unable to find the object.
 * @return {?T} The object with the given name and type or null if none exists.
 * @template T
 */
export const getObject = function(type, name, opt_throwIfMissing) {
  return getItem(type, name, opt_throwIfMissing);
};

/**
 * Returns a map of items registered with the given type.
 * @param {string|!Type<T>} type The type of the plugin. (e.g. Category)
 * @param {boolean} opt_cased Whether or not to return a map with cased keys
 *     (rather than caseless keys). False by default.
 * @param {boolean=} opt_throwIfMissing Whether or not to throw an error if we
 *     are unable to find the object. False by default.
 * @return {?Object<string, ?T|?function(new:T, ...?)>} A map of objects with
 *     the given type, or null if none exists.
 * @template T
 */
export const getAllItems = function(type, opt_cased, opt_throwIfMissing) {
  type = String(type).toLowerCase();
  const typeRegistry = typeMap[type];
  if (!typeRegistry) {
    const msg = `Unable to find [${type}] in the registry.`;
    if (opt_throwIfMissing) {
      throw new Error(`${msg} You must require or register a ${type} plugin.`);
    } else {
      console.warn(msg);
    }
    return null;
  }
  if (!opt_cased) {
    return typeRegistry;
  }
  const nameRegistry = nameMap[type];
  const casedRegistry = Object.create(null);
  const keys = Object.keys(typeRegistry);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    casedRegistry[nameRegistry[key]] = typeRegistry[key];
  }
  return casedRegistry;
};

/**
 * Gets the class from Blockly options for the given type.
 * This is used for plugins that override a built in feature. (e.g. Toolbox)
 * @param {!Type<T>} type The type of the plugin.
 * @param {!Options} options The option object to check for the given
 *     plugin.
 * @param {boolean=} opt_throwIfMissing Whether or not to throw an error if we
 *     are unable to find the plugin.
 * @return {?function(new:T, ...?)} The class for the plugin.
 * @template T
 */
export const getClassFromOptions = function(type, options, opt_throwIfMissing) {
  const typeName = type.toString();
  const plugin = options.plugins[typeName] || DEFAULT;

  // If the user passed in a plugin class instead of a registered plugin name.
  if (typeof plugin === 'function') {
    return plugin;
  }
  return getClass(type, plugin, opt_throwIfMissing);
};
