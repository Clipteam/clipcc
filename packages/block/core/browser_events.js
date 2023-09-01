/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2021 Google Inc.
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
 * @fileoverview Browser event handling.
 * @author fenichel@google.com (Rachel Fenichel)
 */
'use strict';

goog.provide('Blockly.browserEvents');

goog.require('Blockly.Touch');


/**
 * Bind an event handler that can be ignored if it is not part of the active
 * touch stream.
 * Use this for events that either start or continue a multi-part gesture (e.g.
 * mousedown or mousemove, which may be part of a drag or click).
 * @param {!EventTarget} node Node upon which to listen.
 * @param {string} name Event name to listen to (e.g. 'mousedown').
 * @param {Object} thisObject The value of 'this' in the function.
 * @param {!Function} func Function to call when event is triggered.
 * @param {boolean=} opt_noCaptureIdentifier True if triggering on this event
 *     should not block execution of other event handlers on this touch or
 *     other simultaneous touches.  False by default.
 * @param {boolean=} opt_noPreventDefault True if triggering on this event
 *     should prevent the default handler.  False by default.  If
 *     opt_noPreventDefault is provided, opt_noCaptureIdentifier must also be
 *     provided.
 * @return {!Array.<!Array>} Opaque data that can be passed to
 *     browserEvents.unbind.
 * @public
 */
Blockly.browserEvents.conditionalBind = function(
    node, name, thisObject, func, opt_noCaptureIdentifier,
    opt_noPreventDefault) {
  let handled = false;
  const wrapFunc = function(e) {
    const captureIdentifier = !opt_noCaptureIdentifier;
    // Handle each touch point separately.  If the event was a mouse event, this
    // will hand back an array with one element, which we're fine handling.
    const events = Blockly.Touch.splitEventByTouches(e);
    for (let i = 0, event; event = events[i]; i++) {
      if (captureIdentifier && !Blockly.Touch.shouldHandleEvent(event)) {
        continue;
      }
      Blockly.Touch.setClientFromTouch(event);
      if (thisObject) {
        func.call(thisObject, event);
      } else {
        func(event);
      }
      handled = true;
    }
  };

  node.addEventListener(name, wrapFunc, false);
  const bindData = [[node, name, wrapFunc]];

  // Add equivalent touch event.
  if (name in Blockly.Touch.TOUCH_MAP) {
    const touchWrapFunc = function(e) {
      wrapFunc(e);
      // Calling preventDefault stops the browser from scrolling/zooming the
      // page.
      const preventDef = !opt_noPreventDefault;
      if (handled && preventDef) {
        e.preventDefault();
      }
    };
    for (let i = 0, type; type = Blockly.Touch.TOUCH_MAP[name][i]; i++) {
      node.addEventListener(type, touchWrapFunc, false);
      bindData.push([node, type, touchWrapFunc]);
    }
  }
  return bindData;
};


/**
 * Bind an event handler that should be called regardless of whether it is part
 * of the active touch stream.
 * Use this for events that are not part of a multi-part gesture (e.g.
 * mouseover for tooltips).
 * @param {!EventTarget} node Node upon which to listen.
 * @param {string} name Event name to listen to (e.g. 'mousedown').
 * @param {Object} thisObject The value of 'this' in the function.
 * @param {!Function} func Function to call when event is triggered.
 * @return {!Array.<!Array>} Opaque data that can be passed to
 *     browserEvents.unbind.
 * @public
 */
Blockly.browserEvents.bind = function(node, name, thisObject, func) {
  const wrapFunc = function(e) {
    if (thisObject) {
      func.call(thisObject, e);
    } else {
      func(e);
    }
  };

  node.addEventListener(name, wrapFunc, false);
  const bindData = [[node, name, wrapFunc]];

  // Add equivalent touch event.
  if (name in Blockly.Touch.TOUCH_MAP) {
    const touchWrapFunc = function(e) {
      // Punt on multitouch events.
      if (e.changedTouches.length == 1) {
        // Map the touch event's properties to the event.
        const touchPoint = e.changedTouches[0];
        e.clientX = touchPoint.clientX;
        e.clientY = touchPoint.clientY;
      }
      wrapFunc(e);

      // Stop the browser from scrolling/zooming the page.
      e.preventDefault();
    };
    for (let i = 0, type; type = Blockly.Touch.TOUCH_MAP[name][i]; i++) {
      node.addEventListener(type, touchWrapFunc, false);
      bindData.push([node, type, touchWrapFunc]);
    }
  }
  return bindData;
};

/**
 * Unbind one or more events event from a function call.
 * @param {!Array.<!Array>} bindData Opaque data from browserEvents.bind.
 *     This list is emptied during the course of calling this function.
 * @return {!Function} The function call.
 * @public
 */
Blockly.browserEvents.unbind = function(bindData) {
  let func;
  while (bindData.length) {
    const bindDatum = bindData.pop();
    const node = bindDatum[0];
    const name = bindDatum[1];
    func = bindDatum[2];
    node.removeEventListener(name, func, false);
  }
  return func;
};
