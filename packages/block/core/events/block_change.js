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

'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Events.BlockChange');

import * as eventUtils from './utils';
import {BlockBase} from './block_base';
import * as Xml from '../xml';


/**
 * Class for a block change event.
 * @param {Blockly.Block} block The changed block.  Null for a blank event.
 * @param {string} element One of 'field', 'comment', 'disabled', etc.
 * @param {?string} name Name of input or field affected, or null.
 * @param {*} oldValue Previous value of element.
 * @param {*} newValue New value of element.
 * @extends {BlockBase}
 * @constructor
 */
export const BlockChange = function(block, element, name, oldValue, newValue) {
  if (!block) {
    return;  // Blank event to be populated by fromJson.
  }
  BlockChange.superClass_.constructor.call(this, block);
  this.element = element;
  this.name = name;
  this.oldValue = oldValue;
  this.newValue = newValue;
};
goog.inherits(BlockChange, BlockBase);

/**
 * Type of this event.
 * @type {string}
 */
BlockChange.prototype.type = eventUtils.CHANGE;

/**
 * Encode the event as JSON.
 * @return {!Object} JSON representation.
 */
BlockChange.prototype.toJson = function() {
  const json = BlockChange.superClass_.toJson.call(this);
  json['element'] = this.element;
  if (this.name) {
    json['name'] = this.name;
  }
  json['newValue'] = this.newValue;
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
BlockChange.prototype.fromJson = function(json) {
  BlockChange.superClass_.fromJson.call(this, json);
  this.element = json['element'];
  this.name = json['name'];
  this.newValue = json['newValue'];
};

/**
 * Does this event record any change of state?
 * @return {boolean} False if something changed.
 */
BlockChange.prototype.isNull = function() {
  return this.oldValue == this.newValue;
};

/**
 * Run a change event.
 * @param {boolean} forward True if run forward, false if run backward (undo).
 */
BlockChange.prototype.run = function(forward) {
  const workspace = this.getEventWorkspace_();
  const block = workspace.getBlockById(this.blockId);
  if (!block) {
    console.warn("Can't change non-existent block: " + this.blockId);
    return;
  }
  if (block.mutator) {
    // Close the mutator (if open) since we don't want to update it.
    block.mutator.setVisible(false);
  }
  const value = forward ? this.newValue : this.oldValue;
  switch (this.element) {
    case 'field': {
      const field = block.getField(this.name);
      if (field) {
        // Run the validator for any side-effects it may have.
        // The validator's opinion on validity is ignored.
        field.callValidator(value);
        field.setValue(value);
      } else {
        console.warn("Can't set non-existent field: " + this.name);
      }
      break;
    }
    case 'comment':
      block.setCommentText(value || null);
      break;
    case 'collapsed':
      block.setCollapsed(value);
      break;
    case 'disabled':
      block.setDisabled(value);
      break;
    case 'inline':
      block.setInputsInline(value);
      break;
    case 'mutation': {
      const oldState = BlockChange.getExtraBlockState_(
          /** @type {!BlockSvg} */ (block));
      if (block.loadExtraState) {
        block.loadExtraState(value);
      } else if (block.domToMutation) {
        block.domToMutation(
            Xml.textToDom(/** @type {string} */ (value) || '<mutation/>'));
      }
      eventUtils.fire(new BlockChange(
          block, 'mutation', null, oldState, value));
      break;
    }
    default:
      console.warn('Unknown change type: ' + this.element);
  }
};

// TODO (#5397): Encapsulate this in the BlocklyMutationChange event when
//    refactoring change events.
/**
 * Returns the extra state of the given block (either as XML or a JSO, depending
 * on the block's definition).
 * @param {!BlockSvg} block The block to get the extra state of.
 * @return {string} A stringified version of the extra state of the given block.
 * @package
 */
BlockChange.getExtraBlockState_ = function(block) {
  if (block.saveExtraState) {
    const state = block.saveExtraState();
    return state;
  } else if (block.mutationToDom) {
    const state = block.mutationToDom();
    return state ? Xml.domToText(state) : '';
  }
  return '';
};

eventUtils.register(eventUtils.BLOCK_CHANGE, BlockChange);
