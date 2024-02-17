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
 * @fileoverview A div that floats on top of the workspace, for drop-down menus.
 * The drop-down can be kept inside the workspace, animate in/out, etc.
 * @author tmickel@mit.edu (Tim Mickel)
 */

'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.DropDownDiv');

const dom = goog.require('goog.dom');
const style = goog.require('goog.style');


/**
 * Class for drop-down div.
 * @constructor
 */
export const DropDownDiv = function() {
};

/**
 * The div element. Set once by DropDownDiv.createDom.
 * @type {Element}
 * @private
 */
DropDownDiv.DIV_ = null;

/**
 * Drop-downs will appear within the bounds of this element if possible.
 * Set in DropDownDiv.setBoundsElement.
 * @type {Element}
 * @private
 */
DropDownDiv.boundsElement_ = null;

/**
 * The object currently using the drop-down.
 * @type {Object}
 * @private
 */
DropDownDiv.owner_ = null;

/**
 * Arrow size in px. Should match the value in CSS (need to position pre-render).
 * @type {number}
 * @const
 */
DropDownDiv.ARROW_SIZE = 16;

/**
 * Drop-down border size in px. Should match the value in CSS (need to position the arrow).
 * @type {number}
 * @const
 */
DropDownDiv.BORDER_SIZE = 1;

/**
 * Amount the arrow must be kept away from the edges of the main drop-down div, in px.
 * @type {number}
 * @const
 */
DropDownDiv.ARROW_HORIZONTAL_PADDING = 12;

/**
 * Amount drop-downs should be padded away from the source, in px.
 * @type {number}
 * @const
 */
DropDownDiv.PADDING_Y = 20;

/**
 * Length of animations in seconds.
 * @type {number}
 * @const
 */
DropDownDiv.ANIMATION_TIME = 0.25;

/**
 * Timer for animation out, to be cleared if we need to immediately hide
 * without disrupting new shows.
 * @type {number}
 */
DropDownDiv.animateOutTimer_ = null;

/**
 * Callback for when the drop-down is hidden.
 * @type {Function}
 */
DropDownDiv.onHide_ = 0;

/**
 * Create and insert the DOM element for this div.
 * @param {Element} container Element that the div should be contained in.
 */
DropDownDiv.createDom = function() {
  if (DropDownDiv.DIV_) {
    return;  // Already created.
  }
  DropDownDiv.DIV_ = dom.createDom('div', 'blocklyDropDownDiv');
  document.body.appendChild(DropDownDiv.DIV_);
  DropDownDiv.content_ = dom.createDom('div', 'blocklyDropDownContent');
  DropDownDiv.DIV_.appendChild(DropDownDiv.content_);
  DropDownDiv.arrow_ = dom.createDom('div', 'blocklyDropDownArrow');
  DropDownDiv.DIV_.appendChild(DropDownDiv.arrow_);

  // Transition animation for transform: translate() and opacity.
  DropDownDiv.DIV_.style.transition = 'transform ' +
    DropDownDiv.ANIMATION_TIME + 's, ' +
    'opacity ' + DropDownDiv.ANIMATION_TIME + 's';
};

/**
 * Set an element to maintain bounds within. Drop-downs will appear
 * within the box of this element if possible.
 * @param {Element} boundsElement Element to bound drop-down to.
 */
DropDownDiv.setBoundsElement = function(boundsElement) {
  DropDownDiv.boundsElement_ = boundsElement;
};

/**
 * Provide the div for inserting content into the drop-down.
 * @return {Element} Div to populate with content
 */
DropDownDiv.getContentDiv = function() {
  return DropDownDiv.content_;
};

/**
 * Clear the content of the drop-down.
 */
DropDownDiv.clearContent = function() {
  DropDownDiv.content_.innerHTML = '';
  DropDownDiv.content_.style.width = '';
};

/**
 * Set the colour for the drop-down.
 * @param {string} backgroundColour Any CSS color for the background
 * @param {string} borderColour Any CSS color for the border
 */
DropDownDiv.setColour = function(backgroundColour, borderColour) {
  DropDownDiv.DIV_.style.backgroundColor = backgroundColour;
  DropDownDiv.DIV_.style.borderColor = borderColour;
};

/**
 * Set the category for the drop-down.
 * @param {string} category The new category for the drop-down.
 */
DropDownDiv.setCategory = function(category) {
  DropDownDiv.DIV_.setAttribute('data-category', category);
};

/**
 * Shortcut to show and place the drop-down with positioning determined
 * by a particular block. The primary position will be below the block,
 * and the secondary position above the block. Drop-down will be
 * constrained to the block's workspace.
 * @param {Object} owner The object showing the drop-down
 * @param {!Blockly.Block} block Block to position the drop-down around.
 * @param {Function=} opt_onHide Optional callback for when the drop-down is hidden.
 * @param {Number} opt_secondaryYOffset Optional Y offset for above-block positioning.
 * @return {boolean} True if the menu rendered below block; false if above.
 */
DropDownDiv.showPositionedByBlock = function(owner, block,
    opt_onHide, opt_secondaryYOffset) {
  const scale = block.workspace.scale;
  const bBox = {width: block.width, height: block.height};
  bBox.width *= scale;
  bBox.height *= scale;
  const position = block.getSvgRoot().getBoundingClientRect();
  // If we can fit it, render below the block.
  const primaryX = position.left + bBox.width / 2;
  const primaryY = position.top + bBox.height;
  // If we can't fit it, render above the entire parent block.
  const secondaryX = primaryX;
  let secondaryY = position.top;
  if (opt_secondaryYOffset) {
    secondaryY += opt_secondaryYOffset;
  }
  // Set bounds to workspace; show the drop-down.
  DropDownDiv.setBoundsElement(block.workspace.getParentSvg().parentNode);
  return DropDownDiv.show(this, primaryX, primaryY, secondaryX, secondaryY, opt_onHide);
};

/**
 * Show and place the drop-down.
 * The drop-down is placed with an absolute "origin point" (x, y) - i.e.,
 * the arrow will point at this origin and box will positioned below or above it.
 * If we can maintain the container bounds at the primary point, the arrow will
 * point there, and the container will be positioned below it.
 * If we can't maintain the container bounds at the primary point, fall-back to the
 * secondary point and position above.
 * @param {Object} owner The object showing the drop-down
 * @param {number} primaryX Desired origin point x, in absolute px
 * @param {number} primaryY Desired origin point y, in absolute px
 * @param {number} secondaryX Secondary/alternative origin point x, in absolute px
 * @param {number} secondaryY Secondary/alternative origin point y, in absolute px
 * @param {Function=} opt_onHide Optional callback for when the drop-down is hidden
 * @return {boolean} True if the menu rendered at the primary origin point.
 */
DropDownDiv.show = function(owner, primaryX, primaryY, secondaryX, secondaryY, opt_onHide) {
  DropDownDiv.owner_ = owner;
  DropDownDiv.onHide_ = opt_onHide;
  const div = DropDownDiv.DIV_;
  const metrics = DropDownDiv.getPositionMetrics(primaryX, primaryY, secondaryX, secondaryY);
  // Update arrow CSS
  DropDownDiv.arrow_.style.transform = 'translate(' +
    metrics.arrowX + 'px,' + metrics.arrowY + 'px) rotate(45deg)';
  DropDownDiv.arrow_.setAttribute('class',
    metrics.arrowAtTop ? 'blocklyDropDownArrow arrowTop' : 'blocklyDropDownArrow arrowBottom');
  // Set direction based on owner's rtl
  div.style.direction = owner.sourceBlock_ && owner.sourceBlock_.RTL ? 'rtl' : 'ltr';

  // When we change `translate` multiple times in close succession,
  // Chrome may choose to wait and apply them all at once.
  // Since we want the translation to initial X, Y to be immediate,
  // and the translation to final X, Y to be animated,
  // we saw problems where both would be applied after animation was turned on,
  // making the dropdown appear to fly in from (0, 0).
  // Using both `left`, `top` for the initial translation and then `translate`
  // for the animated transition to final X, Y is a workaround.

  // First apply initial translation.
  div.style.left = metrics.initialX + 'px';
  div.style.top = metrics.initialY + 'px';
  // Show the div.
  div.style.display = 'block';
  div.style.opacity = 1;
  // Add final translate, animated through `transition`.
  // Coordinates are relative to (initialX, initialY),
  // where the drop-down is absolutely positioned.
  const dx = (metrics.finalX - metrics.initialX);
  const dy = (metrics.finalY - metrics.initialY);
  div.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  return metrics.arrowAtTop;
};

/**
 * Helper to position the drop-down and the arrow, maintaining bounds.
 * See explanation of origin points in DropDownDiv.show.
 * @param {number} primaryX Desired origin point x, in absolute px
 * @param {number} primaryY Desired origin point y, in absolute px
 * @param {number} secondaryX Secondary/alternative origin point x, in absolute px
 * @param {number} secondaryY Secondary/alternative origin point y, in absolute px
 * @returns {Object} Various final metrics, including rendered positions for drop-down and arrow.
 */
DropDownDiv.getPositionMetrics = function(primaryX, primaryY, secondaryX, secondaryY) {
  const div = DropDownDiv.DIV_;
  const boundPosition = DropDownDiv.boundsElement_.getBoundingClientRect();

  const boundSize = style.getSize(DropDownDiv.boundsElement_);
  const divSize = style.getSize(div);

  // First decide if we will render at primary or secondary position
  // i.e., above or below
  // renderX, renderY will eventually be the final rendered position of the box.
  let renderX, renderY, renderedSecondary;
  // Can the div fit inside the bounds if we render below the primary point?
  if (primaryY + divSize.height > boundPosition.top + boundSize.height) {
    // We can't fit below in terms of y. Can we fit above?
    if (secondaryY - divSize.height < boundPosition.top) {
      // We also can't fit above, so just render below anyway.
      renderX = primaryX;
      renderY = primaryY + DropDownDiv.PADDING_Y;
      renderedSecondary = false;
    } else {
      // We can fit above, render secondary
      renderX = secondaryX;
      renderY = secondaryY - divSize.height - DropDownDiv.PADDING_Y;
      renderedSecondary = true;
    }
  } else {
    // We can fit below, render primary
    renderX = primaryX;
    renderY = primaryY + DropDownDiv.PADDING_Y;
    renderedSecondary = false;
  }
  // First calculate the absolute arrow X
  // This needs to be done before positioning the div, since the arrow
  // wants to be as close to the origin point as possible.
  let arrowX = renderX - DropDownDiv.ARROW_SIZE / 2;
  // Keep in overall bounds
  arrowX = Math.max(boundPosition.left, Math.min(arrowX, boundPosition.left + boundSize.width));

  // Adjust the x-position of the drop-down so that the div is centered and within bounds.
  const centerX = divSize.width / 2;
  renderX -= centerX;
  // Fit horizontally in the bounds.
  renderX = Math.max(
      boundPosition.left,
      Math.min(renderX, boundPosition.left + boundSize.width - divSize.width)
  );
  // After we've finished caclulating renderX, adjust the arrow to be relative to it.
  arrowX -= renderX;

  // Pad the arrow by some pixels, primarily so that it doesn't render on top of a rounded border.
  arrowX = Math.max(
      DropDownDiv.ARROW_HORIZONTAL_PADDING,
      Math.min(arrowX, divSize.width - DropDownDiv.ARROW_HORIZONTAL_PADDING - DropDownDiv.ARROW_SIZE)
  );

  // Calculate arrow Y. If we rendered secondary, add on bottom.
  // Extra pixels are added so that it covers the border of the div.
  let arrowY = (renderedSecondary) ? divSize.height - DropDownDiv.BORDER_SIZE : 0;
  arrowY -= (DropDownDiv.ARROW_SIZE / 2) + DropDownDiv.BORDER_SIZE;

  // Initial position calculated without any padding to provide an animation point.
  const initialX = renderX; // X position remains constant during animation.
  let initialY;
  if (renderedSecondary) {
    initialY = secondaryY - divSize.height; // No padding on Y
  } else {
    initialY = primaryY; // No padding on Y
  }

  return {
    initialX: initialX,
    initialY : initialY,
    finalX: renderX,
    finalY: renderY,
    arrowX: arrowX,
    arrowY: arrowY,
    arrowAtTop: !renderedSecondary
  };
};

/**
 * Is the container visible?
 * @return {boolean} True if visible.
 */
DropDownDiv.isVisible = function() {
  return !!DropDownDiv.owner_;
};

/**
 * Hide the menu only if it is owned by the provided object.
 * @param {Object} owner Object which must be owning the drop-down to hide
 * @return {Boolean} True if hidden
 */
DropDownDiv.hideIfOwner = function(owner) {
  if (DropDownDiv.owner_ === owner) {
    DropDownDiv.hide();
    return true;
  }
  return false;
};

/**
 * Hide the menu, triggering animation.
 */
DropDownDiv.hide = function() {
  // Start the animation by setting the translation and fading out.
  const div = DropDownDiv.DIV_;
  // Reset to (initialX, initialY) - i.e., no translation.
  div.style.transform = 'translate(0px, 0px)';
  div.style.opacity = 0;
  DropDownDiv.animateOutTimer_ = setTimeout(function() {
    // Finish animation - reset all values to default.
    DropDownDiv.hideWithoutAnimation();
  }, DropDownDiv.ANIMATION_TIME * 1000);
  if (DropDownDiv.onHide_) {
    DropDownDiv.onHide_();
    DropDownDiv.onHide_ = null;
  }
};

/**
 * Hide the menu, without animation.
 */
DropDownDiv.hideWithoutAnimation = function() {
  if (!DropDownDiv.isVisible()) {
    return;
  }
  const div = DropDownDiv.DIV_;
  DropDownDiv.animateOutTimer_ && window.clearTimeout(DropDownDiv.animateOutTimer_);
  div.style.transform = '';
  div.style.top = '';
  div.style.left = '';
  div.style.display = 'none';
  DropDownDiv.clearContent();
  DropDownDiv.owner_ = null;
  if (DropDownDiv.onHide_) {
    DropDownDiv.onHide_();
    DropDownDiv.onHide_ = null;
  }
};
