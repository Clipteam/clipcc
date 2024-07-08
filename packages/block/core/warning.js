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
 * @fileoverview Object representing a warning.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Warning');

import {Bubble} from './bubble';
import * as eventUtils from './events/utils';
import {Ui} from './events/ui';
import {Icon} from './icon';
import * as utils from './utils';


/**
 * Class for a warning.
 * @extends {Icon}
 */
export class Warning extends Icon {
  /**
   * @param {!Blockly.Block} block The block associated with this warning.
   */
  constructor(block) {
    super(block);
    /**
     * Does this icon get hidden when the block is collapsed.
     */
    this.collapseHidden = false;

    this.createIcon();
    // The text_ object can contain multiple warnings.
    this.text_ = {};
  }
  /**
   * Create the text for the warning's bubble.
   * @param {string} text The text to display.
   * @return {!SVGTextElement} The top-level node of the text.
   * @private
   */
  static textToDom_(text) {
    const paragraph = /** @type {!SVGTextElement} */ (utils.createSvgElement(
        'text',
        {
          'class': 'blocklyText blocklyBubbleText',
          'y': Bubble.BORDER_WIDTH
        },
        null)
    );
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const tspanElement = utils.createSvgElement('tspan',
          { 'dy': '1em', 'x': Bubble.BORDER_WIDTH }, paragraph);
      const textNode = document.createTextNode(lines[i]);
      tspanElement.appendChild(textNode);
    }
    return paragraph;
  }
  /**
   * Draw the warning icon.
   * @param {!Element} group The icon group.
   * @private
   */
  drawIcon_(group) {
    // Triangle with rounded corners.
    utils.createSvgElement('path',
        {
          'class': 'blocklyIconShape',
          'd': 'M2,15Q-1,15 0.5,12L6.5,1.7Q8,-1 9.5,1.7L15.5,12Q17,15 14,15z'
        },
        group);
    // Can't use a real '!' text character since different browsers and operating
    // systems render it differently.
    // Body of exclamation point.
    utils.createSvgElement('path',
        {
          'class': 'blocklyIconSymbol',
          'd': 'm7,4.8v3.16l0.27,2.27h1.46l0.27,-2.27v-3.16z'
        },
        group);
    // Dot of exclamation point.
    utils.createSvgElement('rect',
        {
          'class': 'blocklyIconSymbol',
          'x': '7',
          'y': '11',
          'height': '2',
          'width': '2'
        },
        group);
  }
  /**
   * Show or hide the warning bubble.
   * @param {boolean} visible True if the bubble should be visible.
   */
  setVisible(visible) {
    if (visible == this.isVisible()) {
      // No change.
      return;
    }
    eventUtils.fire(
        new Ui(this.block_, 'warningOpen', !visible, visible));
    if (visible) {
      // Create the bubble to display all warnings.
      const paragraph = Warning.textToDom_(this.getText());
      this.bubble_ = new Bubble(
          /** @type {!Blockly.WorkspaceSvg} */(this.block_.workspace),
          paragraph, this.block_.svgPath_, this.iconXY_, null, null);
      if (this.block_.RTL) {
        // Right-align the paragraph.
        // This cannot be done until the bubble is rendered on screen.
        const maxWidth = paragraph.getBBox().width;
        for (let i = 0, textElement; textElement = paragraph.childNodes[i]; i++) {
          textElement.setAttribute('text-anchor', 'end');
          textElement.setAttribute('x', maxWidth + Bubble.BORDER_WIDTH);
        }
      }
      this.updateColour();
      // Bump the warning into the right location.
      const size = this.bubble_.getBubbleSize();
      this.bubble_.setBubbleSize(size.width, size.height);
    } else {
      // Dispose of the bubble.
      this.bubble_.dispose();
      this.bubble_ = null;
      this.body_ = null;
    }
  }
  /**
   * Bring the warning to the top of the stack when clicked on.
   * @param {!Event} _e Mouse up event.
   * @private
   */
  bodyFocus_(_e) {
    this.bubble_.promote_();
  }
  /**
   * Set this warning's text.
   * @param {string} text Warning text (or '' to delete).
   * @param {string} id An ID for this text entry to be able to maintain
   *     multiple warnings.
   */
  setText(text, id) {
    if (this.text_[id] == text) {
      return;
    }
    if (text) {
      this.text_[id] = text;
    } else {
      delete this.text_[id];
    }
    if (this.isVisible()) {
      this.setVisible(false);
      this.setVisible(true);
    }
  }
  /**
   * Get this warning's texts.
   * @return {string} All texts concatenated into one string.
   */
  getText() {
    const allWarnings = [];
    for (const id in this.text_) {
      allWarnings.push(this.text_[id]);
    }
    return allWarnings.join('\n');
  }
  /**
   * Dispose of this warning.
   */
  dispose() {
    this.block_.warning = null;
    Icon.prototype.dispose.call(this);
  }
}
