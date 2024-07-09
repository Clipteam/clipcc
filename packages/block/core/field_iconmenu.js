/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2016 Massachusetts Institute of Technology
 * All rights reserved.
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
 * @fileoverview Icon picker input field.
 * This is primarily for use in Scratch Horizontal blocks.
 * Pops open a drop-down with icons; when an icon is selected, it replaces
 * the icon (image field) in the original block.
 * @author tmickel@mit.edu (Tim Mickel)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.FieldIconMenu');

import {BlockSvg} from './block_svg';
import * as browserEvents from './browser_events';
import * as common from './common';
import {DropDownDiv} from './dropdowndiv';
import * as eventUtils from './events/utils';
import {BlockChange} from './events/block_change';
import {Field} from './field';
import {FieldImage} from './field_image';
import * as rendererConstants from './renderer/constants';
import * as utils from './utils';


/**
 * Class for an icon menu field.
 * @extends {Field}
 */
export class FieldIconMenu extends Field {
  /**
   * @param {Object} icons List of icons. These take the same options as an Image Field.
   */
  constructor(icons) {
    // Example:
    // [{src: '...', width: 20, height: 20, alt: '...', value: 'machine_value'}, ...]
    // First icon provides the default values.
    const defaultValue = icons[0].value;
    super(defaultValue);
    /** @type {object} */
    this.icons_ = icons;
    this.addArgType('iconmenu');
  }

  /**
   * Construct a FieldIconMenu from a JSON arg object.
   * @param {!Object} element A JSON object with options.
   * @returns {!FieldIconMenu} The new field instance.
   * @package
   * @nocollapse
   */
  static fromJson(element) {
    return new FieldIconMenu(element['options']);
  }

  /**
   * Called when the field is placed on a block.
   * @param {Block} block The owning block.
   */
  init(block) {
    if (this.fieldGroup_) {
      // Icon menu has already been initialized once.
      return;
    }
    // Render the arrow icon
    // Fixed sizes in px. Saved for creating the flip transform of the menu renders above the button.
    const arrowSize = 12;
    /** @type {Number} */
    this.arrowX_ = 18;
    /** @type {Number} */
    this.arrowY_ = 10;
    if (block.RTL) {
      // In RTL, the icon position is flipped and rendered from the right (offset by width)
      this.arrowX_ = -this.arrowX_ - arrowSize;
    }
    /** @type {Element} */
    this.arrowIcon_ = utils.createSvgElement('image', {
      'height': arrowSize + 'px',
      'width': arrowSize + 'px',
      'transform': 'translate(' + this.arrowX_ + ',' + this.arrowY_ + ')'
    });
    this.arrowIcon_.setAttributeNS('http://www.w3.org/1999/xlink',
        'xlink:href', common.getMainWorkspace().options.pathToMedia + 'dropdown-arrow.svg');
    block.getSvgRoot().appendChild(this.arrowIcon_);
    super.init(block);
  }

  /**
  * Set the language-neutral value for this icon drop-down menu.
   * @param {?string} newValue New value.
   * @override
   */
  setValue(newValue) {
    if (newValue === null || newValue === this.value_) {
      return;  // No change
    }
    if (this.sourceBlock_ && eventUtils.isEnabled()) {
      eventUtils.fire(new BlockChange(
          this.sourceBlock_, 'field', this.name, this.value_, newValue));
    }
    this.value_ = newValue;
    // Find the relevant icon in this.icons_ to get the image src.
    this.setParentFieldImage(this.getSrcForValue(this.value_));
  }

  /**
  * Find the parent block's FieldImage and set its src.
   * @param {?string} src New src for the parent block FieldImage.
   * @private
   */
  setParentFieldImage(src) {
    // Only attempt if we have a set sourceBlock_ and parentBlock_
    // It's possible that this function could be called before
    // a parent block is set; in that case, fail silently.
    if (this.sourceBlock_ && this.sourceBlock_.parentBlock_) {
      const parentBlock = this.sourceBlock_.parentBlock_;
      // Loop through all inputs' fields to find the first FieldImage
      for (let i = 0, input; input = parentBlock.inputList[i]; i++) {
        for (let j = 0, field; field = input.fieldRow[j]; j++) {
          if (field instanceof FieldImage) {
            // Src for a FieldImage is stored in its value.
            field.setValue(src);
            return;
          }
        }
      }
    }
  }

  /**
   * Get the language-neutral value from this drop-down menu.
   * @return {string} Current language-neutral value.
   */
  getValue() {
    return this.value_;
  }

  /**
   * For a language-neutral value, get the src for the image that represents it.
   * @param {string} value Language-neutral value to look up.
   * @return {string} Src to image representing value
   */
  getSrcForValue(value) {
    for (let i = 0, icon; icon = this.icons_[i]; i++) {
      if (icon.value === value) {
        return icon.src;
      }
    }
  }

  /**
   * Show the drop-down menu for editing this field.
   * @private
   */
  showEditor_() {
    // If there is an existing drop-down we own, this is a request to hide the drop-down.
    if (DropDownDiv.hideIfOwner(this)) {
      return;
    }
    // If there is an existing drop-down someone else owns, hide it immediately and clear it.
    DropDownDiv.hideWithoutAnimation();
    DropDownDiv.clearContent();
    // Populate the drop-down with the icons for this field.
    const contentDiv = DropDownDiv.getContentDiv();
    // Accessibility properties
    contentDiv.setAttribute('role', 'menu');
    contentDiv.setAttribute('aria-haspopup', 'true');
    for (let i = 0, icon; icon = this.icons_[i]; i++) {
      // Icons with the type property placeholder take up space but don't have any functionality
      // Use for special-case layouts
      if (icon.type == 'placeholder') {
        const placeholder = document.createElement('span');
        placeholder.setAttribute('class', 'blocklyDropDownPlaceholder');
        placeholder.style.width = icon.width + 'px';
        placeholder.style.height = icon.height + 'px';
        contentDiv.appendChild(placeholder);
        continue;
      }
      const button = document.createElement('button');
      button.setAttribute('id', ':' + i); // For aria-activedescendant
      button.setAttribute('role', 'menuitem');
      button.setAttribute('class', 'blocklyDropDownButton');
      button.title = icon.alt;
      button.style.width = icon.width + 'px';
      button.style.height = icon.height + 'px';
      let backgroundColor = this.sourceBlock_.getColour();
      if (icon.value == this.getValue()) {
        // This icon is selected, show it in a different colour
        backgroundColor = this.sourceBlock_.getColourTertiary();
        button.setAttribute('aria-selected', 'true');
      }
      button.style.backgroundColor = backgroundColor;
      button.style.borderColor = this.sourceBlock_.getColourTertiary();
      browserEvents.bind(button, 'click', this, this.buttonClick_);
      browserEvents.bind(button, 'mouseup', this, this.buttonClick_);
      // These are applied manually instead of using the :hover pseudoclass
      // because Android has a bad long press "helper" menu and green highlight
      // that we must prevent with ontouchstart preventDefault
      browserEvents.bind(button, 'mousedown', button, function(e) {
        this.setAttribute('class', 'blocklyDropDownButton blocklyDropDownButtonHover');
        e.preventDefault();
      });
      browserEvents.bind(button, 'mouseover', button, function() {
        this.setAttribute('class', 'blocklyDropDownButton blocklyDropDownButtonHover');
        contentDiv.setAttribute('aria-activedescendant', this.id);
      });
      browserEvents.bind(button, 'mouseout', button, function() {
        this.setAttribute('class', 'blocklyDropDownButton');
        contentDiv.removeAttribute('aria-activedescendant');
      });
      const buttonImg = document.createElement('img');
      buttonImg.src = icon.src;
      //buttonImg.alt = icon.alt;
      // Upon click/touch, we will be able to get the clicked element as e.target
      // Store a data attribute on all possible click targets so we can match it to the icon.
      button.setAttribute('data-value', icon.value);
      buttonImg.setAttribute('data-value', icon.value);
      button.appendChild(buttonImg);
      contentDiv.appendChild(button);
    }
    contentDiv.style.width = FieldIconMenu.DROPDOWN_WIDTH + 'px';

    DropDownDiv.setColour(this.sourceBlock_.getColour(), this.sourceBlock_.getColourTertiary());
    DropDownDiv.setCategory(this.sourceBlock_.parentBlock_.getCategory());

    // Update source block colour to look selected
    this.savedPrimary_ = this.sourceBlock_.getColour();
    this.sourceBlock_.setColour(this.sourceBlock_.getColourSecondary(),
        this.sourceBlock_.getColourSecondary(),
        this.sourceBlock_.getColourTertiary(),
        this.sourceBlock_.getColourQuaternary());

    const scale = this.sourceBlock_.workspace.scale;
    // Offset for icon-type horizontal blocks.
    const secondaryYOffset = (
      -(rendererConstants.MIN_BLOCK_Y * scale) - (BlockSvg.FIELD_Y_OFFSET * scale)
    );
    const renderedPrimary = DropDownDiv.showPositionedByBlock(
        this, this.sourceBlock_, this.onHide_.bind(this), secondaryYOffset);
    if (!renderedPrimary) {
      // Adjust for rotation
      const arrowX = this.arrowX_ + DropDownDiv.ARROW_SIZE / 1.5 + 1;
      const arrowY = this.arrowY_ + DropDownDiv.ARROW_SIZE / 1.5;
      // Flip the arrow on the button
      this.arrowIcon_.setAttribute('transform',
          'translate(' + arrowX + ',' + arrowY + ') rotate(180)');}
  }

  /**
   * Callback for when a button is clicked inside the drop-down.
   * Should be bound to the FieldIconMenu.
   * @param {Event} e DOM event for the click/touch
   * @private
   */
  buttonClick_(e) {
    const value = e.target.getAttribute('data-value');
    this.setValue(value);
    DropDownDiv.hide();
  }

  /**
   * Callback for when the drop-down is hidden.
   */
  onHide_() {
    // Reset the button colour and clear accessibility properties
    // Only attempt to do this reset if sourceBlock_ is not disposed.
    // It could become disposed before an onHide_, for example,
    // when a block is dragged from the flyout.
    if (this.sourceBlock_) {
      this.sourceBlock_.setColour(this.savedPrimary_,
          this.sourceBlock_.getColourSecondary(),
          this.sourceBlock_.getColourTertiary(),
          this.sourceBlock_.getColourQuaternary());
    }
    DropDownDiv.content_.removeAttribute('role');
    DropDownDiv.content_.removeAttribute('aria-haspopup');
    DropDownDiv.content_.removeAttribute('aria-activedescendant');
    // Unflip the arrow if appropriate
    this.arrowIcon_.setAttribute('transform', 'translate(' + this.arrowX_ + ',' + this.arrowY_ + ')');
  }
}



/**
 * Fixed width of the drop-down, in px. Icon buttons will flow inside this width.
 * @type {number}
 * @const
 */
FieldIconMenu.DROPDOWN_WIDTH = 168;

/**
 * Save the primary colour of the source block while the menu is open, for reset.
 * @type {number|string}
 * @private
 */
FieldIconMenu.savedPrimary_ = null;

/**
 * Mouse cursor style when over the hotspot that initiates the editor.
 * @const
 */
FieldIconMenu.prototype.CURSOR = 'default';

Field.register('field_iconmenu', FieldIconMenu);
