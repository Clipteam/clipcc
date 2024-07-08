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
 * @fileoverview Object representing an input (value, statement, or dummy).
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Input');

import * as constants from './constants';
import {FieldLabel} from './field_label';
import * as utils from './utils';

const asserts = goog.require('goog.asserts');
const dom = goog.require('goog.dom');


/**
 * Class for an input with an optional field.
 */
export class Input {
  /**
   * @param {number} type The type of the input.
   * @param {string} name Language-neutral identifier which may used to find this
   *     input again.
   * @param {!Blockly.Block} block The block containing this input.
   * @param {Blockly.Connection} connection Optional connection for this input.
   */
  constructor(type, name, block, connection) {
    if (type != constants.DUMMY_INPUT && !name) {
      throw 'Value inputs and statement inputs must have non-empty name.';
    }
    /** @type {number} */
    this.type = type;
    /** @type {string} */
    this.name = name;
    /**
     * @type {!Blockly.Block}
     * @private
     */
    this.sourceBlock_ = block;
    /** @type {Blockly.Connection} */
    this.connection = connection;
    /** @type {!Array.<!Blockly.Field>} */
    this.fieldRow = [];

    /**
     * The shape that is displayed when this input is rendered but not filled.
     * @type {SVGElement}
     * @package
     */
    this.outlinePath = null;
  }
  /**
   * Add a field (or label from string), and all prefix and suffix fields, to the
   * end of the input's field row.
   * @param {string|!Blockly.Field} field Something to add as a field.
   * @param {string=} opt_name Language-neutral identifier which may used to find
   *     this field again.  Should be unique to the host block.
   * @return {!Input} The input being append to (to allow chaining).
   */
  appendField(field, opt_name) {
    this.insertFieldAt(this.fieldRow.length, field, opt_name);
    return this;
  }
  /**
   * Inserts a field (or label from string), and all prefix and suffix fields, at
   * the location of the input's field row.
   * @param {number} index The index at which to insert field.
   * @param {string|!Blockly.Field} field Something to add as a field.
   * @param {string=} opt_name Language-neutral identifier which may used to find
   *     this field again.  Should be unique to the host block.
   * @return {number} The index following the last inserted field.
   */
  insertFieldAt(index, field, opt_name) {
    if (index < 0 || index > this.fieldRow.length) {
      throw new Error('index ' + index + ' out of bounds.');
    }

    // Empty string, Null or undefined generates no field, unless field is named.
    if (!field && !opt_name) {
      return this;
    }
    // Generate a FieldLabel when given a plain text field.
    if (typeof field === 'string') {
      field = new FieldLabel(/** @type {string} */(field));
    }
    field.setSourceBlock(this.sourceBlock_);
    if (this.sourceBlock_.rendered) {
      field.init();
    }
    field.name = opt_name;

    if (field.prefixField) {
      // Add any prefix.
      index = this.insertFieldAt(index, field.prefixField);
    }
    // Add the field to the field row.
    this.fieldRow.splice(index, 0, field);
    ++index;
    if (field.suffixField) {
      // Add any suffix.
      index = this.insertFieldAt(index, field.suffixField);
    }

    if (this.sourceBlock_.rendered) {
      this.sourceBlock_.render();
      // Adding a field will cause the block to change shape.
      this.sourceBlock_.bumpNeighbours_();
    }
    return index;
  }
  /**
   * Remove a field from this input.
   * @param {string} name The name of the field.
   * @throws {asserts.AssertionError} if the field is not present.
   */
  removeField(name) {
    for (let i = 0, field; field = this.fieldRow[i]; i++) {
      if (field.name === name) {
        field.dispose();
        this.fieldRow.splice(i, 1);
        if (this.sourceBlock_.rendered) {
          this.sourceBlock_.render();
          // Removing a field will cause the block to change shape.
          this.sourceBlock_.bumpNeighbours_();
        }
        return;
      }
    }
    asserts.fail('Field "%s" not found.', name);
  }
  /**
   * Gets whether this input is visible or not.
   * @return {boolean} True if visible.
   */
  isVisible() {
    return this.visible_;
  }
  /**
   * Sets whether this input is visible or not.
   * Used to collapse/uncollapse a block.
   * @param {boolean} visible True if visible.
   * @return {!Array.<!Blockly.Block>} List of blocks to render.
   */
  setVisible(visible) {
    let renderList = [];
    if (this.visible_ == visible) {
      return renderList;
    }
    this.visible_ = visible;

    const display = visible ? 'block' : 'none';
    for (let y = 0, field; field = this.fieldRow[y]; y++) {
      field.setVisible(visible);
    }
    if (this.connection) {
      // Has a connection.
      if (visible) {
        renderList = this.connection.unhideAll();
      } else {
        this.connection.hideAll();
      }
      const child = this.connection.targetBlock();
      if (child) {
        child.getSvgRoot().style.display = display;
        if (!visible) {
          child.rendered = false;
        }
      }
    }
    return renderList;
  }
  /**
   * Change a connection's compatibility.
   * @param {string|Array.<string>|null} check Compatible value type or
   *     list of value types.  Null if all types are compatible.
   * @return {!Input} The input being modified (to allow chaining).
   */
  setCheck(check) {
    if (!this.connection) {
      throw 'This input does not have a connection.';
    }
    this.connection.setCheck(check);
    return this;
  }
  /**
   * Change the alignment of the connection's field(s).
   * @param {number} align One of constants.ALIGN_LEFT, ALIGN_CENTRE, ALIGN_RIGHT.
   *   In RTL mode directions are reversed, and ALIGN_RIGHT aligns to the left.
   * @return {!Input} The input being modified (to allow chaining).
   */
  setAlign(align) {
    this.align = align;
    if (this.sourceBlock_.rendered) {
      this.sourceBlock_.render();
    }
    return this;
  }
  /**
   * Initialize the fields on this input.
   */
  init() {
    if (!this.sourceBlock_.workspace.rendered) {
      return; // Headless blocks don't need fields initialized.
    }
    for (let i = 0; i < this.fieldRow.length; i++) {
      this.fieldRow[i].init(this.sourceBlock_);
    }
  }
  /**
   * Sever all links to this input.
   */
  dispose() {
    if (this.outlinePath) {
      dom.removeNode(this.outlinePath);
    }
    for (let i = 0, field; field = this.fieldRow[i]; i++) {
      field.dispose();
    }
    if (this.connection) {
      this.connection.dispose();
    }
    this.sourceBlock_ = null;
  }
  /**
   * Create the input shape path element and attach it to the given SVG element.
   * @param {!SVGElement} svgRoot The parent on which ot append the new element.
   * @package
   */
  initOutlinePath(svgRoot) {
    if (!this.sourceBlock_.workspace.rendered) {
      return; // Headless blocks don't need field outlines.
    }
    if (this.outlinePath) {
      return;
    }
    if (this.type == constants.INPUT_VALUE) {
      this.outlinePath = utils.createSvgElement(
        'path',
        {
          'class': 'blocklyPath',
          'style': 'visibility: hidden', // Hide by default - shown when not connected.
          'd': '' // IE doesn't like paths without the data definition, set an empty default
        },
        svgRoot);
    }
  }
}

/**
 * Alignment of input's fields (left, right or centre).
 * @type {number}
 */
Input.prototype.align = constants.ALIGN_LEFT;

/**
 * Is the input visible?
 * @type {boolean}
 * @private
 */
Input.prototype.visible_ = true;











