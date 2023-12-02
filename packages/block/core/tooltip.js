/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2011 Google Inc.
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
 * @fileoverview Library to create tooltips for Blockly.
 * First, call Tooltip.init() after onload.
 * Second, set the 'tooltip' property on any SVG element that needs a tooltip.
 * If the tooltip is a string, then that message will be displayed.
 * If the tooltip is an SVG element, then that object's tooltip will be used.
 * Third, call Tooltip.bindMouseEvents(e) passing the SVG element.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

/**
 * @name Tooltip
 * @namespace
 **/
import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Tooltip');

import * as browserEvents from './browser_events';
import * as utils from './utils';
import {WidgetDiv} from './widgetdiv';

const dom = goog.require('goog.dom');
const TagName = goog.require('goog.dom.TagName');


export const Tooltip = function() {};

/**
 * Is a tooltip currently showing?
 */
Tooltip.visible = false;

/**
 * Is someone else blocking the tooltip from being shown?
 * @type {boolean}
 * @private
 */
Tooltip.blocked_ = false;

/**
 * Maximum width (in characters) of a tooltip.
 */
Tooltip.LIMIT = 50;

/**
 * PID of suspended thread to clear tooltip on mouse out.
 * @private
 */
Tooltip.mouseOutPid_ = 0;

/**
 * PID of suspended thread to show the tooltip.
 * @private
 */
Tooltip.showPid_ = 0;

/**
 * Last observed X location of the mouse pointer (freezes when tooltip appears).
 * @private
 */
Tooltip.lastX_ = 0;

/**
 * Last observed Y location of the mouse pointer (freezes when tooltip appears).
 * @private
 */
Tooltip.lastY_ = 0;

/**
 * Current element being pointed at.
 * @private
 */
Tooltip.element_ = null;

/**
 * Once a tooltip has opened for an element, that element is 'poisoned' and
 * cannot respawn a tooltip until the pointer moves over a different element.
 * @private
 */
Tooltip.poisonedElement_ = null;

/**
 * Horizontal offset between mouse cursor and tooltip.
 */
Tooltip.OFFSET_X = 0;

/**
 * Vertical offset between mouse cursor and tooltip.
 */
Tooltip.OFFSET_Y = 10;

/**
 * Radius mouse can move before killing tooltip.
 */
Tooltip.RADIUS_OK = 10;

/**
 * Delay before tooltip appears.
 */
Tooltip.HOVER_MS = 750;

/**
 * Horizontal padding between tooltip and screen edge.
 */
Tooltip.MARGINS = 5;

/**
 * The HTML container.  Set once by Tooltip.createDom.
 * @type {Element}
 */
Tooltip.DIV = null;

/**
 * Create the tooltip div and inject it onto the page.
 */
Tooltip.createDom = function() {
  if (Tooltip.DIV) {
    return;  // Already created.
  }
  // Create an HTML container for popup overlays (e.g. editor widgets).
  Tooltip.DIV =
      dom.createDom(TagName.DIV, 'blocklyTooltipDiv');
  document.body.appendChild(Tooltip.DIV);
};

/**
 * Binds the required mouse events onto an SVG element.
 * @param {!Element} element SVG element onto which tooltip is to be bound.
 */
Tooltip.bindMouseEvents = function(element) {
  browserEvents.bind(element, 'mouseover', null,
      Tooltip.onMouseOver_);
  browserEvents.bind(element, 'mouseout', null,
      Tooltip.onMouseOut_);

  // Don't use browserEvents.bind for mousemove since that would create a
  // corresponding touch handler, even though this only makes sense in the
  // context of a mouseover/mouseout.
  element.addEventListener('mousemove', Tooltip.onMouseMove_, false);
};

/**
 * Hide the tooltip if the mouse is over a different object.
 * Initialize the tooltip to potentially appear for this object.
 * @param {!Event} e Mouse event.
 * @private
 */
Tooltip.onMouseOver_ = function(e) {
  if (Tooltip.blocked_) {
    // Someone doesn't want us to show tooltips.
    return;
  }
  // If the tooltip is an object, treat it as a pointer to the next object in
  // the chain to look at.  Terminate when a string or function is found.
  let element = e.target;
  while (typeof element.tooltip !== 'string' && typeof element.tooltip !== 'function') {
    element = element.tooltip;
  }
  if (Tooltip.element_ != element) {
    Tooltip.hide();
    Tooltip.poisonedElement_ = null;
    Tooltip.element_ = element;
  }
  // Forget about any immediately preceding mouseOut event.
  clearTimeout(Tooltip.mouseOutPid_);
};

/**
 * Hide the tooltip if the mouse leaves the object and enters the workspace.
 * @param {!Event} _e Mouse event.
 * @private
 */
Tooltip.onMouseOut_ = function(_e) {
  if (Tooltip.blocked_) {
    // Someone doesn't want us to show tooltips.
    return;
  }
  // Moving from one element to another (overlapping or with no gap) generates
  // a mouseOut followed instantly by a mouseOver.  Fork off the mouseOut
  // event and kill it if a mouseOver is received immediately.
  // This way the task only fully executes if mousing into the void.
  Tooltip.mouseOutPid_ = setTimeout(function() {
    Tooltip.element_ = null;
    Tooltip.poisonedElement_ = null;
    Tooltip.hide();
  }, 1);
  clearTimeout(Tooltip.showPid_);
};

/**
 * When hovering over an element, schedule a tooltip to be shown.  If a tooltip
 * is already visible, hide it if the mouse strays out of a certain radius.
 * @param {!Event} e Mouse event.
 * @private
 */
Tooltip.onMouseMove_ = function(e) {
  if (!Tooltip.element_ || !Tooltip.element_.tooltip) {
    // No tooltip here to show.
    return;
  } else if (WidgetDiv.isVisible()) {
    // Don't display a tooltip if a widget is open (tooltip would be under it).
    return;
  } else if (Tooltip.blocked_) {
    // Someone doesn't want us to show tooltips.  We are probably handling a
    // user gesture, such as a click or drag.
    return;
  }
  if (Tooltip.visible) {
    // Compute the distance between the mouse position when the tooltip was
    // shown and the current mouse position.  Pythagorean theorem.
    const dx = Tooltip.lastX_ - e.pageX;
    const dy = Tooltip.lastY_ - e.pageY;
    if (Math.sqrt(dx * dx + dy * dy) > Tooltip.RADIUS_OK) {
      Tooltip.hide();
    }
  } else if (Tooltip.poisonedElement_ != Tooltip.element_) {
    // The mouse moved, clear any previously scheduled tooltip.
    clearTimeout(Tooltip.showPid_);
    // Maybe this time the mouse will stay put.  Schedule showing of tooltip.
    Tooltip.lastX_ = e.pageX;
    Tooltip.lastY_ = e.pageY;
    Tooltip.showPid_ =
        setTimeout(Tooltip.show_, Tooltip.HOVER_MS);
  }
};

/**
 * Hide the tooltip.
 */
Tooltip.hide = function() {
  if (Tooltip.visible) {
    Tooltip.visible = false;
    if (Tooltip.DIV) {
      Tooltip.DIV.style.display = 'none';
    }
  }
  if (Tooltip.showPid_) {
    clearTimeout(Tooltip.showPid_);
  }
};

/**
 * Hide any in-progress tooltips and block showing new tooltips until the next
 * call to unblock().
 * @package
 */
Tooltip.block = function() {
  Tooltip.hide();
  Tooltip.blocked_ = true;
};

/**
 * Unblock tooltips: allow them to be scheduled and shown according to their own
 * logic.
 * @package
 */
Tooltip.unblock = function() {
  Tooltip.blocked_ = false;
};

/**
 * Create the tooltip and show it.
 * @private
 */
Tooltip.show_ = function() {
  if (Tooltip.blocked_) {
    // Someone doesn't want us to show tooltips.
    return;
  }
  Tooltip.poisonedElement_ = Tooltip.element_;
  if (!Tooltip.DIV) {
    return;
  }
  // Erase all existing text.
  dom.removeChildren(/** @type {!Element} */ (Tooltip.DIV));
  // Get the new text.
  let tip = Tooltip.element_.tooltip;
  while (typeof tip === 'function') {
    tip = tip();
  }
  tip = utils.wrap(tip, Tooltip.LIMIT);
  // Create new text, line by line.
  const lines = tip.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(lines[i]));
    Tooltip.DIV.appendChild(div);
  }
  const rtl = Tooltip.element_.RTL;
  const windowSize = dom.getViewportSize();
  // Display the tooltip.
  Tooltip.DIV.style.direction = rtl ? 'rtl' : 'ltr';
  Tooltip.DIV.style.display = 'block';
  Tooltip.visible = true;
  // Move the tooltip to just below the cursor.
  let anchorX = Tooltip.lastX_;
  if (rtl) {
    anchorX -= Tooltip.OFFSET_X + Tooltip.DIV.offsetWidth;
  } else {
    anchorX += Tooltip.OFFSET_X;
  }
  let anchorY = Tooltip.lastY_ + Tooltip.OFFSET_Y;

  if (anchorY + Tooltip.DIV.offsetHeight >
      windowSize.height + window.scrollY) {
    // Falling off the bottom of the screen; shift the tooltip up.
    anchorY -= Tooltip.DIV.offsetHeight + 2 * Tooltip.OFFSET_Y;
  }
  if (rtl) {
    // Prevent falling off left edge in RTL mode.
    anchorX = Math.max(Tooltip.MARGINS - window.scrollX, anchorX);
  } else {
    if (anchorX + Tooltip.DIV.offsetWidth >
        windowSize.width + window.scrollX - 2 * Tooltip.MARGINS) {
      // Falling off the right edge of the screen;
      // clamp the tooltip on the edge.
      anchorX = windowSize.width - Tooltip.DIV.offsetWidth -
          2 * Tooltip.MARGINS;
    }
  }
  Tooltip.DIV.style.top = anchorY + 'px';
  Tooltip.DIV.style.left = anchorX + 'px';
};
