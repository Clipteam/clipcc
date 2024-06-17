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
 * @fileoverview Flyout tray containing blocks which may be created.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Flyout');

import * as browserEvents from './browser_events';
import * as eventUtils from './events/utils';
import {BlockCreate} from './events/block_create';
import {VarCreate} from './events/var_create';
import {FlyoutButton} from './flyout_button';
import {FlyoutExtensionCategoryHeader} from './flyout_extension_category_header';
import * as scratchBlocksUtils from './scratch_blocks_utils';
import {Scrollbar} from './scrollbar';
import * as utils from './utils';
import * as Variables from './variables';
import {WorkspaceSvg} from './workspace_svg';
import * as Xml from './xml';
import * as blockSerializer from './serialization/blocks';

const dom = goog.require('goog.dom');
const Coordinate = goog.require('goog.math.Coordinate');


/**
 * Class for a flyout.
 * @param {!Object} workspaceOptions Dictionary of options for the workspace.
 * @constructor
 */
export const Flyout = function(workspaceOptions) {
  workspaceOptions.getMetrics = this.getMetrics_.bind(this);
  workspaceOptions.setMetrics = this.setMetrics_.bind(this);

  /**
   * @type {!Blockly.Workspace}
   * @protected
   */
  this.workspace_ = new WorkspaceSvg(workspaceOptions);
  this.workspace_.isFlyout = true;

  // When we create blocks for this workspace, instead of using the "optional" id
  // make the default `id` the same as the `type` for easier re-use.
  const newBlock = this.workspace_.newBlock;
  this.workspace_.newBlock = function(type, id) {
    // Use `type` if `id` isn't passed. `this` will be workspace.
    return newBlock.call(this, type, id || type);
  };

  /**
   * Is RTL vs LTR.
   * @type {boolean}
   */
  this.RTL = !!workspaceOptions.RTL;

  /**
   * Flyout should be laid out horizontally vs vertically.
   * @type {boolean}
   * @private
   */
  this.horizontalLayout_ = workspaceOptions.horizontalLayout;

  /**
   * Position of the toolbox and flyout relative to the workspace.
   * @type {number}
   * @protected
   */
  this.toolboxPosition_ = workspaceOptions.toolboxPosition;

  /**
   * Opaque data that can be passed to Blockly.browserEvents.unbind.
   * @type {!Array.<!Array>}
   * @private
   */
  this.eventWrappers_ = [];

  /**
   * List of background buttons that lurk behind each block to catch clicks
   * landing in the blocks' lakes and bays.
   * @type {!Array.<!Element>}
   * @private
   */
  this.backgroundButtons_ = [];

  /**
   * List of visible buttons.
   * @type {!Array.<!FlyoutButton>}
   * @protected
   */
  this.buttons_ = [];

  /**
   * List of event listeners.
   * @type {!Array.<!Array>}
   * @private
   */
  this.listeners_ = [];

  /**
   * List of blocks that should always be disabled.
   * @type {!Array.<!Blockly.Block>}
   * @private
   */
  this.permanentlyDisabled_ = [];

  /**
   * The toolbox that this flyout belongs to, or none if tihs is a simple
   * workspace.
   * @type {Blockly.Toolbox}
   * @private
   */
  this.parentToolbox_ = null;

  /**
   * The target position for the flyout scroll animation in pixels.
   * Is a number while animating, null otherwise.
   * @type {?number}
   * @package
   */
  this.scrollTarget = null;

  /**
   * A recycle bin for blocks.
   * @type {!Array.<!Blockly.Block>}
   * @private
   */
  this.recycleBlocks_ = [];

};

/**
 * Does the flyout automatically close when a block is created?
 * @type {boolean}
 */
Flyout.prototype.autoClose = false;

/**
 * Whether the flyout is visible.
 * @type {boolean}
 * @private
 */
Flyout.prototype.isVisible_ = false;

/**
 * Whether the workspace containing this flyout is visible.
 * @type {boolean}
 * @private
 */
Flyout.prototype.containerVisible_ = true;

/**
 * Corner radius of the flyout background.
 * @type {number}
 * @const
 */
Flyout.prototype.CORNER_RADIUS = 0;

/**
 * Margin around the edges of the blocks in the flyout.
 * @type {number}
 * @const
 */
Flyout.prototype.MARGIN = 12;

// TODO: Move GAP_X and GAP_Y to their appropriate files.

/**
 * Gap between items in horizontal flyouts. Can be overridden with the "sep"
 * element.
 * @const {number}
 */
Flyout.prototype.GAP_X = Flyout.prototype.MARGIN * 3;

/**
 * Gap between items in vertical flyouts. Can be overridden with the "sep"
 * element.
 * @const {number}
 */
Flyout.prototype.GAP_Y = Flyout.prototype.MARGIN;

/**
 * Top/bottom padding between scrollbar and edge of flyout background.
 * @type {number}
 * @const
 */
Flyout.prototype.SCROLLBAR_PADDING = 2;

/**
 * Width of flyout.
 * @type {number}
 * @protected
 */
Flyout.prototype.width_ = 0;

/**
 * Height of flyout.
 * @type {number}
 * @protected
 */
Flyout.prototype.height_ = 0;

/**
 * Width of flyout contents.
 * @type {number}
 * @private
 */
Flyout.prototype.contentWidth_ = 0;

/**
 * Height of flyout contents.
 * @type {number}
 * @private
 */
Flyout.prototype.contentHeight_ = 0;

/**
 * Vertical offset of flyout.
 * @type {number}
 * @private
 */
Flyout.prototype.verticalOffset_ = 0;

/**
 * Range of a drag angle from a flyout considered "dragging toward workspace".
 * Drags that are within the bounds of this many degrees from the orthogonal
 * line to the flyout edge are considered to be "drags toward the workspace".
 * Example:
 * Flyout                                                  Edge   Workspace
 * [block] /  <-within this angle, drags "toward workspace" |
 * [block] ---- orthogonal to flyout boundary ----          |
 * [block] \                                                |
 * The angle is given in degrees from the orthogonal.
 *
 * This is used to know when to create a new block and when to scroll the
 * flyout. Setting it to 360 means that all drags create a new block.
 * @type {number}
 * @protected
*/
Flyout.prototype.dragAngleRange_ = 70;

/**
 * The fraction of the distance to the scroll target to move the flyout on
 * each animation frame, when auto-scrolling. Values closer to 1.0 will make
 * the scroll animation complete faster. Use 1.0 for no animation.
 * @type {number}
 */
Flyout.prototype.scrollAnimationFraction = 0.3;

/**
 * Whether to recycle blocks when refreshing the flyout. When false, do not allow
 * anything to be recycled. The default is to recycle.
 * @type {boolean}
 * @private
 */
Flyout.prototype.recyclingEnabled_ = true;

/**
 * Creates the flyout's DOM.  Only needs to be called once. The flyout can
 * either exist as its own svg element or be a g element nested inside a
 * separate svg element.
 * @param {string} tagName The type of tag to put the flyout in. This
 *     should be <svg> or <g>.
 * @return {!Element} The flyout's SVG group.
 */
Flyout.prototype.createDom = function(tagName) {
  /*
  <svg | g>
    <path class="blocklyFlyoutBackground"/>
    <g class="blocklyFlyout"></g>
  </ svg | g>
  */
  // Setting style to display:none to start. The toolbox and flyout
  // hide/show code will set up proper visibility and size later.
  this.svgGroup_ = utils.createSvgElement(tagName,
      {'class': 'blocklyFlyout', 'style': 'display: none'}, null);
  this.svgBackground_ = utils.createSvgElement('path',
      {'class': 'blocklyFlyoutBackground'}, this.svgGroup_);
  this.svgGroup_.appendChild(this.workspace_.createDom());
  return this.svgGroup_;
};

/**
 * Initializes the flyout.
 * @param {!Blockly.Workspace} targetWorkspace The workspace in which to create
 *     new blocks.
 */
Flyout.prototype.init = function(targetWorkspace) {
  this.targetWorkspace_ = targetWorkspace;
  this.workspace_.targetWorkspace = targetWorkspace;
  // Add scrollbar.
  this.scrollbar_ = new Scrollbar(this.workspace_,
      this.horizontalLayout_, false, 'blocklyFlyoutScrollbar');

  this.position();

  Array.prototype.push.apply(this.eventWrappers_,
      browserEvents.conditionalBind(this.svgGroup_, 'wheel', this, this.wheel_));
  // Dragging the flyout up and down (or left and right).
  Array.prototype.push.apply(this.eventWrappers_,
      browserEvents.conditionalBind(
          this.svgGroup_, 'mousedown', this, this.onMouseDown_));

  // A flyout connected to a workspace doesn't have its own current gesture.
  this.workspace_.getGesture =
      this.targetWorkspace_.getGesture.bind(this.targetWorkspace_);

  // Get variables from the main workspace rather than the target workspace.
  this.workspace_.variableMap_  = this.targetWorkspace_.getVariableMap();

  this.workspace_.createPotentialVariableMap();
};

/**
 * Dispose of this flyout.
 * Unlink from all DOM elements to prevent memory leaks.
 */
Flyout.prototype.dispose = function() {
  this.hide();
  browserEvents.unbind(this.eventWrappers_);
  if (this.scrollbar_) {
    this.scrollbar_.dispose();
    this.scrollbar_ = null;
  }
  if (this.workspace_) {
    this.workspace_.targetWorkspace = null;
    this.workspace_.dispose();
    this.workspace_ = null;
  }
  if (this.svgGroup_) {
    dom.removeNode(this.svgGroup_);
    this.svgGroup_ = null;
  }
  this.parentToolbox_ = null;
  this.svgBackground_ = null;
  this.targetWorkspace_ = null;
};

/**
 * Set the parent toolbox of this flyout.
 * @param {!Blockly.Toolbox} toolbox The toolbox that owns this flyout.
 */
Flyout.prototype.setParentToolbox = function(toolbox) {
  this.parentToolbox_ = toolbox;
};

/**
 * Get the width of the flyout.
 * @return {number} The width of the flyout.
 */
Flyout.prototype.getWidth = function() {
  return this.DEFAULT_WIDTH;
};

/**
 * Get the height of the flyout.
 * @return {number} The width of the flyout.
 */
Flyout.prototype.getHeight = function() {
  return this.height_;
};

/**
 * Get the workspace inside the flyout.
 * @return {!WorkspaceSvg} The workspace inside the flyout.
 * @package
 */
Flyout.prototype.getWorkspace = function() {
  return this.workspace_;
};

/**
 * Is the flyout visible?
 * @return {boolean} True if visible.
 */
Flyout.prototype.isVisible = function() {
  return this.isVisible_;
};

/**
 * Set whether the flyout is visible. A value of true does not necessarily mean
 * that the flyout is shown. It could be hidden because its container is hidden.
 * @param {boolean} visible True if visible.
 */
Flyout.prototype.setVisible = function(visible) {
  const visibilityChanged = (visible != this.isVisible());

  this.isVisible_ = visible;
  if (visibilityChanged) {
    this.updateDisplay_();
  }
};

/**
 * Set whether this flyout's container is visible.
 * @param {boolean} visible Whether the container is visible.
 */
Flyout.prototype.setContainerVisible = function(visible) {
  const visibilityChanged = (visible != this.containerVisible_);
  this.containerVisible_ = visible;
  if (visibilityChanged) {
    this.updateDisplay_();
  }
};

/**
 * Update the display property of the flyout based whether it thinks it should
 * be visible and whether its containing workspace is visible.
 * @private
 */
Flyout.prototype.updateDisplay_ = function() {
  let show = true;
  if (!this.containerVisible_) {
    show = false;
  } else {
    show = this.isVisible();
  }
  this.svgGroup_.style.display = show ? 'block' : 'none';
  // Update the scrollbar's visiblity too since it should mimic the
  // flyout's visibility.
  this.scrollbar_.setContainerVisible(show);
};

/**
 * Hide and empty the flyout.
 */
Flyout.prototype.hide = function() {
  if (!this.isVisible()) {
    return;
  }
  this.setVisible(false);
  // Delete all the event listeners.
  for (let x = 0, listen; listen = this.listeners_[x]; x++) {
    browserEvents.unbind(listen);
  }
  this.listeners_.length = 0;
  if (this.reflowWrapper_) {
    this.workspace_.removeChangeListener(this.reflowWrapper_);
    this.reflowWrapper_ = null;
  }
  // Do NOT delete the blocks here.  Wait until Flyout.show.
  // https://neil.fraser.name/news/2014/08/09/
};

/**
 * Converts the flyout definition into a list of flyout items.
 * @param {?FlyoutDefinition} flyoutDef The definition of
 *    the flyout in one of its many forms.
 * @return {FlyoutItemInfoArray} A list of flyout items.
 * @package
 */
Flyout.prototype.convertFlyoutDefToJsonArray = function(flyoutDef) {
  if (!flyoutDef) {
    return [];
  }

  if (flyoutDef['contents']) {
    return flyoutDef['contents'];
  }

  // If it is already in the correct format return the flyoutDef.
  if (Array.isArray(flyoutDef) && flyoutDef.length > 0 &&
    !flyoutDef[0].nodeType) {
    return flyoutDef;
  }

  return this.xmlToJsonArray_(
      /** @type {!Array<Node>|!NodeList} */(flyoutDef));
};

/**
 * Converts the xml for a toolbox to JSON.
 * @param {!Node|!Array<Node>|!NodeList} toolboxDef The
 *     definition of the toolbox in one of its many forms.
 * @return {!FlyoutItemInfoArray|
 *          !Array<ToolboxItemInfo>} A list of objects in
 *          the toolbox.
 * @private
 */
Flyout.prototype.xmlToJsonArray_ = function(toolboxDef) {
  const arr = [];
  // If it is a node it will have children.
  let childNodes = toolboxDef.childNodes;
  if (!childNodes) {
    // Otherwise the toolboxDef is an array or collection.
    childNodes = toolboxDef;
  }
  for (let i = 0, child; (child = childNodes[i]); i++) {
    if (!child.tagName) {
      if (typeof child === 'string') {
        arr.push(child);
      }
      continue;
    }
    const obj = {};
    const tagName = child.tagName.toUpperCase();
    obj['kind'] = tagName;

    // Store the XML for a block.
    if (tagName == 'BLOCK') {
      obj['blockxml'] = child;
    } else if (child.childNodes && child.childNodes.length > 0) {
      // Get the contents of a category
      obj['contents'] = this.xmlToJsonArray_(child);
    }

    // Add XML attributes to object
    this.addAttributes_(child, obj);
    arr.push(obj);
  }
  return arr;
};

/**
 * Adds the attributes on the node to the given object.
 * @param {!Node} node The node to copy the attributes from.
 * @param {!Object} obj The object to copy the attributes to.
 * @private
 */
Flyout.prototype.addAttributes_ = function(node, obj) {
  for (let j = 0; j < node.attributes.length; j++) {
    const attr = node.attributes[j];
    if (attr.nodeName.indexOf('css-') > -1) {
      obj['cssconfig'] = obj['cssconfig'] || {};
      obj['cssconfig'][attr.nodeName.replace('css-', '')] = attr.value;
    } else {
      obj[attr.nodeName] = attr.value;
    }
  }
};

Flyout.prototype.getRecycledBlock_ = function(id) {
  const recycled = this.recycleBlocks_.findIndex(function(block) {
    return block.id === id;
  });
  if (recycled > -1) {
    return this.recycleBlocks_.splice(recycled, 1)[0];
  }
};

/**
 * Create a block from the xml and permanently disable any blocks that were
 * defined as disabled.
 * @param {!Object} blockInfo The info of the block.
 * @return {!Blockly.BlockSvg} The block created from the blockXml.
 * @private
 */
Flyout.prototype.createFlyoutBlock_ = function(blockInfo) {
  let block;
  if (blockInfo['blockxml']) {
    const xml = typeof blockInfo['blockxml'] === 'string' ?
      Xml.textToDom(`<xml>${blockInfo['blockxml']}</xml>`).firstChild :
      blockInfo['blockxml'];
    block = this.getRecycledBlock_(xml.getAttribute('id') || xml.getAttribute('type'));
    if (!block) {
      block = Xml.domToBlock(xml, this.workspace_);
    }
  } else {
    block = this.getRecycledBlock_(blockInfo['id'] || blockInfo['type']);
    if (!block) {
      block = blockSerializer.load(blockInfo, this.workspace_);
    }
  }

  if (block.disabled) {
    // Record blocks that were initially disabled.
    // Do not enable these blocks as a result of capacity filtering.
    this.permanentlyDisabled_.push(block);
  }
  return block;
};

/**
 * Create the blocks to be shown in this flyout.
 * @param {!Object|!Array|string} content List of blocks to show
 * @return {{contents: Object, gaps: Object}}  The populated flyout info
 */
Flyout.prototype.createFlyoutInfo_ = function(content) {
  const contents = [];
  const gaps = [];
  this.permanentlyDisabled_.length = 0;
  content = this.convertFlyoutDefToJsonArray(content);

  const defaultGap = this.horizontalLayout_ ? this.GAP_X : this.GAP_Y;
  for (let i = 0, contentInfo; (contentInfo = content[i]); i++) {
    if (typeof contentInfo === 'string') {
      const fnToApply = this.workspace_.targetWorkspace.getToolboxCategoryCallback(contentInfo);
      content.splice(i + 1, 0, ...this.convertFlyoutDefToJsonArray(
          fnToApply(this.workspace_.targetWorkspace)));
      continue;
    }
    if (contentInfo['custom']) {
      const fnToApply = this.workspace_.targetWorkspace.getToolboxCategoryCallback(contentInfo['custom']);
      const newList = this.convertFlyoutDefToJsonArray(fnToApply(this.workspace_.targetWorkspace));
      content.splice.apply(
          content, [i, 1].concat(newList));
      contentInfo = content[i];
    }

    const kind = contentInfo.kind.toUpperCase();
    if (kind === 'BLOCK') {
      const blockInfo = contentInfo;
      const block = this.createFlyoutBlock_(blockInfo);
      contents.push({type: 'block', block});
      const gap = parseInt(contentInfo.gap, 10);
      gaps.push(isNaN(gap) ? defaultGap : gap);
    } else if (kind === 'SEP') {
      const newGap = parseInt(contentInfo.gap, 10);
      // Ignore gaps before the first block.
      if (!isNaN(newGap) && gaps.length > 0) {
        gaps[gaps.length - 1] = newGap;
      } else {
        gaps.push(defaultGap);
      }
    } else if (kind === 'LABEL' && this.shouldShowStatusButton(contentInfo.showStatusButton)) {
      const curButton = new FlyoutExtensionCategoryHeader(this.workspace_,
          this.targetWorkspace_, contentInfo);
      contents.push({ type: 'button', button: curButton });
      gaps.push(defaultGap);
    } else if (kind === 'BUTTON' || kind === 'LABEL') {
      // Labels behave the same as buttons, but are styled differently.
      const isLabel = kind === 'LABEL';
      const curButton = new FlyoutButton(this.workspace_,
          this.targetWorkspace_, contentInfo, isLabel);
      contents.push({ type: 'button', button: curButton });
      gaps.push(defaultGap);
    }
  }

  return {contents, gaps};
};

/**
 * Whether we should show the status button near the label.
 * @param {string|boolean|null} value The value
 * @private
 */
Flyout.prototype.shouldShowStatusButton = function(value) {
  return typeof value === 'boolean' ? value : value === 'true';
};

/**
 * Show and populate the flyout.
 * @param {!Object|!Array|string} content List of blocks to show
 *     Variables and procedures have a custom set of blocks.
 * @param {boolean=} opt_visible Whether visible after show. Defaults to true.
 */
Flyout.prototype.show = function(content, opt_visible) {
  if (typeof opt_visible === 'undefined') {
    opt_visible = true;
  }

  this.workspace_.setResizesEnabled(false);
  this.hide();
  this.clearOldBlocks_();

  if (typeof content === 'string') {
    const fnToApply = this.workspace_.targetWorkspace.getToolboxCategoryCallback(contentInfo['custom']);
    content = fnToApply(this.workspace_.targetWorkspace);
  }

  // Set visible to true to create blocks properly.
  this.setVisible(true);

  const {contents, gaps} = this.createFlyoutInfo_(content);

  this.emptyRecycleBlocks_();

  this.layout_(contents, gaps);

  this.setVisible(opt_visible);

  // IE 11 is an incompetent browser that fails to fire mouseout events.
  // When the mouse is over the background, deselect all blocks.
  const deselectAll = function() {
    const topBlocks = this.workspace_.getTopBlocks(false);
    for (let i = 0, block; block = topBlocks[i]; i++) {
      block.removeSelect();
    }
  };

  this.listeners_.push(browserEvents.bind(this.svgBackground_, 'mouseover',
      this, deselectAll));

  this.workspace_.setResizesEnabled(true);
  this.reflow();

  // Correctly position the flyout's scrollbar when it opens.
  this.position();

  this.reflowWrapper_ = this.reflow.bind(this);
  this.workspace_.addChangeListener(this.reflowWrapper_);

  this.recordCategoryScrollPositions_();
};

/**
 * Empty out the recycled blocks, properly destroying everything.
 * @private
 */
Flyout.prototype.emptyRecycleBlocks_ = function() {
  // Clean out the old recycle bin.
  const oldBlocks = this.recycleBlocks_;
  this.recycleBlocks_ = [];
  for (let i = 0; i < oldBlocks.length; i++) {
    oldBlocks[i].dispose(false, false);
  }
};

/**
 * Store an array of category names, ids, scrollbar positions, and category lengths.
 * This is used when scrolling the flyout to cause a category to be selected.
 * @private
 */
Flyout.prototype.recordCategoryScrollPositions_ = function() {
  this.categoryScrollPositions = [];
  // Record category names and positions using the text label at the top of each one.
  for (let i = 0; i < this.buttons_.length; i++) {
    if (this.buttons_[i].getIsCategoryLabel()) {
      const categoryLabel = this.buttons_[i];
      this.categoryScrollPositions.push({
        categoryName: categoryLabel.getText(),
        position: this.horizontalLayout_ ?
          categoryLabel.getPosition().x : categoryLabel.getPosition().y
      });
    }
  }
  // Record the length of each category, setting the final one to 0.
  const numCategories = this.categoryScrollPositions.length;
  if (numCategories > 0) {
    for (let i = 0; i < numCategories - 1; i++) {
      const currentPos = this.categoryScrollPositions[i].position;
      const nextPos = this.categoryScrollPositions[i + 1].position;
      const length = nextPos - currentPos;
      this.categoryScrollPositions[i].length = length;
    }
    this.categoryScrollPositions[numCategories - 1].length = 0;
    // Record the id of each category.
    for (let i = 0; i < numCategories; i++) {
      const category = this.parentToolbox_.getCategoryByIndex(i);
      if (category && category.id_) {
        this.categoryScrollPositions[i].categoryId = category.id_;
      }
    }
  }
};

/**
 * Select a category using the scroll position.
 * @param {number} pos The scroll position in pixels.
 * @package
 */
Flyout.prototype.selectCategoryByScrollPosition = function(pos) {
  // If we are currently auto-scrolling, due to selecting a category by clicking on it,
  // do not update the category selection.
  if (this.scrollTarget) {
    return;
  }
  const workspacePos = Math.round(pos / this.workspace_.scale);
  // Traverse the array of scroll positions in reverse, so we can select the furthest
  // category that the scroll position is beyond.
  for (let i = this.categoryScrollPositions.length - 1; i >= 0; i--) {
    if (workspacePos >= this.categoryScrollPositions[i].position) {
      this.parentToolbox_.selectCategoryById(this.categoryScrollPositions[i].categoryId);
      return;
    }
  }
};

/**
 * Step the scrolling animation by scrolling a fraction of the way to
 * a scroll target, and request the next frame if necessary.
 * @package
 */
Flyout.prototype.stepScrollAnimation = function() {
  if (!this.scrollTarget) {
    return;
  }
  const scrollPos = this.horizontalLayout_ ?
    -this.workspace_.scrollX : -this.workspace_.scrollY;
  const diff = this.scrollTarget - scrollPos;
  if (Math.abs(diff) < 1) {
    this.scrollbar_.set(this.scrollTarget);
    this.scrollTarget = null;
    return;
  }
  this.scrollbar_.set(scrollPos + diff * this.scrollAnimationFraction);

  // Polyfilled by dom.animationFrame.polyfill
  requestAnimationFrame(this.stepScrollAnimation.bind(this));
};

/**
 * Get the scaled scroll position.
 * @return {number} The current scroll position.
 */
Flyout.prototype.getScrollPos = function() {
  const pos = this.horizontalLayout_ ?
    -this.workspace_.scrollX : -this.workspace_.scrollY;
  return pos / this.workspace_.scale;
};

/**
 * Set the scroll position, scaling it.
 * @param {number} pos The scroll position to set.
 */
Flyout.prototype.setScrollPos = function(pos) {
  this.scrollbar_.set(pos * this.workspace_.scale);
};

/**
 * Set whether the flyout can recycle blocks. A value of true allows blocks to be recycled.
 * @param {boolean} recycle True if recycling is possible.
 */
Flyout.prototype.setRecyclingEnabled = function(recycle) {
  this.recyclingEnabled_ = recycle;
};

/**
 * Delete blocks and background buttons from a previous showing of the flyout.
 * @private
 */
Flyout.prototype.clearOldBlocks_ = function() {
  // Delete any blocks from a previous showing.
  const oldBlocks = this.workspace_.getTopBlocks(false);
  for (let i = 0, block; block = oldBlocks[i]; i++) {
    if (block.workspace == this.workspace_) {
      if (this.recyclingEnabled_ &&
          scratchBlocksUtils.blockIsRecyclable(block)) {
        this.recycleBlock_(block);
      } else {
        block.dispose(false, false);
      }
    }
  }
  // Delete any background buttons from a previous showing.
  for (let j = 0; j < this.backgroundButtons_.length; j++) {
    const rect = this.backgroundButtons_[j];
    if (rect) dom.removeNode(rect);
  }
  this.backgroundButtons_.length = 0;

  for (let i = 0, button; button = this.buttons_[i]; i++) {
    button.dispose();
  }
  this.buttons_.length = 0;

  // Clear potential variables from the previous showing.
  this.workspace_.getPotentialVariableMap().clear();
};

/**
 * Add listeners to a block that has been added to the flyout.
 * @param {!Element} root The root node of the SVG group the block is in.
 * @param {!Blockly.Block} block The block to add listeners for.
 * @param {!Element} rect The invisible rectangle under the block that acts as
 *     a button for that block.
 * @private
 */
Flyout.prototype.addBlockListeners_ = function(root, block, rect) {
  this.listeners_.push(browserEvents.conditionalBind(root, 'mousedown', null,
      this.blockMouseDown_(block)));
  this.listeners_.push(browserEvents.conditionalBind(rect, 'mousedown', null,
      this.blockMouseDown_(block)));
  this.listeners_.push(browserEvents.bind(root, 'mouseover', block,
      block.addSelect));
  this.listeners_.push(browserEvents.bind(root, 'mouseout', block,
      block.removeSelect));
  this.listeners_.push(browserEvents.bind(rect, 'mouseover', block,
      block.addSelect));
  this.listeners_.push(browserEvents.bind(rect, 'mouseout', block,
      block.removeSelect));
};

/**
 * Handle a mouse-down on an SVG block in a non-closing flyout.
 * @param {!Blockly.Block} block The flyout block to copy.
 * @return {!Function} Function to call when block is clicked.
 * @private
 */
Flyout.prototype.blockMouseDown_ = function(block) {
  const flyout = this;
  return function(e) {
    const gesture = flyout.targetWorkspace_.getGesture(e);
    if (gesture) {
      gesture.setStartBlock(block);
      gesture.handleFlyoutStart(e, flyout);
    }
  };
};

/**
 * Mouse down on the flyout background.  Start a scroll drag.
 * @param {!Event} e Mouse down event.
 * @private
 */
Flyout.prototype.onMouseDown_ = function(e) {
  const gesture = this.targetWorkspace_.getGesture(e);
  if (gesture) {
    gesture.handleFlyoutStart(e, this);
  }
  // Interrupt scroll animation
  this.scrollTarget = null;
};

/**
 * Create a copy of this block on the workspace.
 * @param {!Blockly.BlockSvg} originalBlock The block to copy from the flyout.
 * @return {Blockly.BlockSvg} The newly created block, or null if something
 *     went wrong with deserialization.
 * @package
 */
Flyout.prototype.createBlock = function(originalBlock) {
  let newBlock = null;
  eventUtils.disable();
  const variablesBeforeCreation = this.targetWorkspace_.getAllVariables();
  this.targetWorkspace_.setResizesEnabled(false);
  try {
    newBlock = this.placeNewBlock_(originalBlock);
    // Close the flyout.
    this.targetWorkspace_.hideChaff();
  } finally {
    eventUtils.enable();
  }

  const newVariables = Variables.getAddedVariables(this.targetWorkspace_,
      variablesBeforeCreation);

  if (eventUtils.isEnabled()) {
    eventUtils.setGroup(true);
    eventUtils.fire(new BlockCreate(newBlock));
    // Fire a VarCreate event for each (if any) new variable created.
    for (let i = 0; i < newVariables.length; i++) {
      const thisVariable = newVariables[i];
      eventUtils.fire(new VarCreate(thisVariable));
    }
  }
  if (this.autoClose) {
    this.hide();
  }
  return newBlock;
};

/**
 * Reflow blocks and their buttons.
 */
Flyout.prototype.reflow = function() {
  if (this.reflowWrapper_) {
    this.workspace_.removeChangeListener(this.reflowWrapper_);
  }
  const blocks = this.workspace_.getTopBlocks(false);
  this.reflowInternal_(blocks);
  if (this.reflowWrapper_) {
    this.workspace_.addChangeListener(this.reflowWrapper_);
  }
};

/**
 * @return {boolean} True if this flyout may be scrolled with a scrollbar or by
 *     dragging.
 * @package
 */
Flyout.prototype.isScrollable = function() {
  return this.scrollbar_ ? this.scrollbar_.isVisible() : false;
};

/**
 * Copy a block from the flyout to the workspace and position it correctly.
 * @param {!Blockly.Block} oldBlock The flyout block to copy.
 * @return {!Blockly.Block} The new block in the main workspace.
 * @private
 */
Flyout.prototype.placeNewBlock_ = function(oldBlock) {
  const targetWorkspace = this.targetWorkspace_;
  const svgRootOld = oldBlock.getSvgRoot();
  if (!svgRootOld) {
    throw 'oldBlock is not rendered.';
  }

  // Clone the block.
  const json = /** @type {!blocks.State} */ (blockSerializer.save(oldBlock));
  // Normallly this resizes leading to weird jumps. Save it for terminateDrag.
  targetWorkspace.setResizesEnabled(false);
  const block = /** @type {!BlockSvg} */ (blockSerializer.load(json, targetWorkspace));

  this.positionNewBlock_(oldBlock, block);

  return block;
};

/**
 * Positions a block on the target workspace.
 * @param {!BlockSvg} oldBlock The flyout block being copied.
 * @param {!BlockSvg} block The block to posiiton.
 * @private
 */
Flyout.prototype.positionNewBlock_ = function(oldBlock, block) {
  const targetWorkspace = this.targetWorkspace_;

  // The offset in pixels between the main workspace's origin and the upper left
  // corner of the injection div.
  const mainOffsetPixels = targetWorkspace.getOriginOffsetInPixels();

  // The offset in pixels between the flyout workspace's origin and the upper
  // left corner of the injection div.
  const flyoutOffsetPixels = this.workspace_.getOriginOffsetInPixels();

  // The position of the old block in flyout workspace coordinates.
  const oldBlockPosWs = oldBlock.getRelativeToSurfaceXY();

  // The position of the old block in pixels relative to the flyout
  // workspace's origin.
  const oldBlockPosPixels = oldBlockPosWs.scale(this.workspace_.scale);

  // The position of the old block in pixels relative to the upper left corner
  // of the injection div.
  const oldBlockOffsetPixels = Coordinate.sum(flyoutOffsetPixels,
      oldBlockPosPixels);

  // The position of the old block in pixels relative to the origin of the
  // main workspace.
  const finalOffsetPixels = Coordinate.difference(oldBlockOffsetPixels,
      mainOffsetPixels);

  // The position of the old block in main workspace coordinates.
  const finalOffsetMainWs = finalOffsetPixels.scale(1 / targetWorkspace.scale);

  block.moveBy(finalOffsetMainWs.x, finalOffsetMainWs.y);
};

/**
 * Put a previously created block into the recycle bin, used during large
 * workspace swaps to limit the number of new dom elements we need to create
 *
 * @param {!Blockly.BlockSvg} block The block to recycle.
 * @private
 */
Flyout.prototype.recycleBlock_ = function(block) {
  const xy = block.getRelativeToSurfaceXY();
  block.moveBy(-xy.x, -xy.y);
  this.recycleBlocks_.push(block);
};
