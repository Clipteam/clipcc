/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2017 Massachusetts Institute of Technology
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
 * @fileoverview Vertical separator field. Draws a vertical line.
 * @author ericr@media.mit.edu (Eric Rosenbaum)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.FieldVerticalSeparator');

import {Field} from './field';
import * as rendererConstants from './renderer/constants';
import * as utils from './utils';

const dom = goog.require('goog.dom');
const Size = goog.require('goog.math.Size');


/**
 * Class for a vertical separator line.
 * @extends {Field}
 */
export class FieldVerticalSeparator extends Field {
  constructor() {
    super(null);
    this.sourceBlock_ = null;
    this.width_ = 1;
    this.height_ = rendererConstants.ICON_SEPARATOR_HEIGHT;
    this.size_ = new Size(this.width_, this.height_);
  }

  /**
  * Construct a FieldVerticalSeparator from a JSON arg object.
  * @param {!Object} _element A JSON object with options (unused, but passed in
  *     by Field.fromJson).
  * @returns {!FieldVerticalSeparator} The new field instance.
  * @package
  * @nocollapse
  */
  static fromJson(
  /* eslint-disable no-unused-vars */ _element
  /* eslint-enable no-unused-vars */
  ) {
    return new FieldVerticalSeparator();
  }

  /**
  * Install this field on a block.
  */
  init() {
    if (this.fieldGroup_) {
      // Image has already been initialized once.
      return;
    }
    // Build the DOM.
    /** @type {SVGElement} */
    this.fieldGroup_ = utils.createSvgElement('g', {}, null);
    if (!this.visible_) {
      this.fieldGroup_.style.display = 'none';
    }
    /** @type {SVGElement} */
    this.lineElement_ = utils.createSvgElement('line',
        {
          'stroke': this.sourceBlock_.getColourSecondary(),
          'stroke-linecap': 'round',
          'x1': 0,
          'y1': 0,
          'x2': 0,
          'y2': this.height_
        }, this.fieldGroup_);

    this.sourceBlock_.getSvgRoot().appendChild(this.fieldGroup_);
  }

  /**
  * Set the height of the line element, without adjusting the field's height.
  * This allows the line's height to be changed without causing it to be
  * centered with the new height (needed for correct rendering of hat blocks).
  * @param {number} newHeight the new height for the line.
  * @package
  */
  setLineHeight(newHeight) {
    this.lineElement_.setAttribute('y2', newHeight);
  }

  /**
  * Dispose of all DOM objects belonging to this text.
  */
  dispose() {
    dom.removeNode(this.fieldGroup_);
    this.fieldGroup_ = null;
    this.lineElement_ = null;
  }

  /**
  * Get the value of this field. A no-op in this case.
  * @return {string} null.
  * @override
  */
  getValue() {
    return null;
  }

  /**
  * Set the value of this field. A no-op in this case.
  * @param {?string} src New value.
  * @override
  */
  setValue(
  /* eslint-disable no-unused-vars */ src
  /* eslint-enable no-unused-vars */
  ) {
    return;
  }

  /**
  * Set the text of this field. A no-op in this case.
  * @param {?string} alt New text.
  * @override
  */
  setText(
  /* eslint-disable no-unused-vars */ alt
  /* eslint-enable no-unused-vars */
  ) {
    return;
  }

  /**
  * Separator lines are fixed width, no need to render.
  * @private
  */
  render_() {
    // NOP
  }

  /**
  * Separator lines are fixed width, no need to update.
  * @private
  */
  updateWidth() {
    // NOP
  }
}



/**
 * Editable fields are saved by the XML renderer, non-editable fields are not.
 */
FieldVerticalSeparator.prototype.EDITABLE = false;

Field.register(
    'field_vertical_separator', FieldVerticalSeparator);
