/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Contains functions registering serializers (eg blocks,
 * variables, plugins, etc).
 */
'use strict';

/**
 * Contains functions registering serializers (eg blocks, variables, plugins,
 * etc).
 * @namespace Blockly.serialization.registry
 */

import * as goog from 'google-closure-library/closure/goog/goog.js';
import * as registry from '../registry.js';

goog.declareModuleId('Blockly.serialization.registry');

/**
 * Registers the given serializer so that it can be used for serialization and
 * deserialization.
 * @param {string} name The name of the serializer to register.
 * @param {ISerializer} serializer The serializer to register.
 * @alias Blockly.serialization.registry.register
 */
export const register = function(name, serializer) {
  registry.register(registry.Type.SERIALIZER, name, serializer);
};

/**
 * Unregisters the serializer associated with the given name.
 * @param {string} name The name of the serializer to unregister.
 * @alias Blockly.serialization.registry.unregister
 */
export const unregister = function(name) {
  registry.unregister(registry.Type.SERIALIZER, name);
};
