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
 * @fileoverview Toolbox from whence to create blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Toolbox');

import * as browserEvents from './browser_events';
import * as common from './common';
import * as constants from './constants';
import * as registry from './registry';
import * as Touch from './touch';
import * as utils from './utils';

const dom = goog.require('goog.dom');
const TagName = goog.require('goog.dom.TagName');
const Rect = goog.require('goog.math.Rect');


/**
 * Class for a Toolbox.
 * Creates the toolbox's DOM.
 * @param {!Blockly.Workspace} workspace The workspace in which to create new
 *     blocks.
 * @constructor
 */
export const Toolbox = function(workspace) {
  /**
   * @type {!Blockly.Workspace}
   * @private
   */
  this.workspace_ = workspace;

  /**
   * Whether toolbox categories should be represented by icons instead of text.
   * @type {boolean}
   * @private
   */
  this.iconic_ = false;

  /**
   * Is RTL vs LTR.
   * @type {boolean}
   */
  this.RTL = workspace.options.RTL;

  /**
   * Whether the toolbox should be laid out horizontally.
   * @type {boolean}
   * @private
   */
  this.horizontalLayout_ = workspace.options.horizontalLayout;

  /**
   * Position of the toolbox and flyout relative to the workspace.
   * @type {number}
   */
  this.toolboxPosition = workspace.options.toolboxPosition;

  /**
   * Whether the toolbox is collapsed.
   * @type {boolean}
   * @private
   */
  this.isCollapsed_ = false;
};

/**
 * Width of the category menu.
 * @type {number}
 */
Toolbox.prototype.categoryWidth = 85;

/**
 * Width of the toolbox, which changes only in vertical layout.
 * This is the sum of the width of the flyout (250) and the category menu (85).
 * @type {number}
 */
Toolbox.prototype.width = 250 + Toolbox.prototype.categoryWidth;

/**
 * Height of the toolbox, which changes only in horizontal layout.
 * @type {number}
 */
Toolbox.prototype.height = 0;

Toolbox.prototype.selectedItem_ = null;

/**
 * Initializes the toolbox.
 */
Toolbox.prototype.init = function() {
  const workspace = this.workspace_;
  const svg = this.workspace_.getParentSvg();

  /**
   * HTML container for the Toolbox menu.
   * @type {Element}
   */
  this.HtmlDiv =
      dom.createDom(TagName.DIV, 'blocklyToolboxDiv');
  this.HtmlDiv.setAttribute('dir', workspace.RTL ? 'RTL' : 'LTR');
  svg.parentNode.insertBefore(this.HtmlDiv, svg);

  // Clicking on toolbox closes popups.
  browserEvents.conditionalBind(this.HtmlDiv, 'mousedown', this,
      function(e) {
        // Cancel any gestures in progress.
        this.workspace_.cancelCurrentGesture();
        if (utils.isRightButton(e) || e.target == this.HtmlDiv) {
          // Close flyout.
          this.workspace_.hideChaff(false);
        } else {
          // Just close popups.
          this.workspace_.hideChaff(true);
        }
        Touch.clearTouchIdentifier();  // Don't block future drags.
      }, /*opt_noCaptureIdentifier*/ false, /*opt_noPreventDefault*/ true);

  this.createFlyout_();
  this.categoryMenu_ = new Toolbox.CategoryMenu(this, this.HtmlDiv);
  this.populate_(workspace.options.languageTree);
  this.position();
};

/**
 * Dispose of this toolbox.
 */
Toolbox.prototype.dispose = function() {
  this.flyout_.dispose();
  this.categoryMenu_.dispose();
  this.categoryMenu_ = null;
  dom.removeNode(this.HtmlDiv);
  this.workspace_ = null;
  this.lastCategory_ = null;
};

/**
 * Create and configure a flyout based on the main workspace's options.
 * @private
 */
Toolbox.prototype.createFlyout_ = function() {
  const workspace = this.workspace_;

  const options = {
    disabledPatternId: workspace.options.disabledPatternId,
    parentWorkspace: workspace,
    RTL: workspace.RTL,
    oneBasedIndex: workspace.options.oneBasedIndex,
    horizontalLayout: workspace.horizontalLayout,
    toolboxPosition: workspace.options.toolboxPosition,
    stackGlowFilterId: workspace.options.stackGlowFilterId
  };

  if (workspace.horizontalLayout) {
    this.flyout_ = new (registry.getClass(
        registry.Type.FLYOUTS_HORIZONTAL_TOOLBOX, registry.DEFAULT, true))(options);
  } else {
    this.flyout_ = new (registry.getClass(
        registry.Type.FLYOUTS_VERTICAL_TOOLBOX, registry.DEFAULT, true))(options);
  }
  this.flyout_.setParentToolbox(this);

  dom.insertSiblingAfter(
      this.flyout_.createDom('svg'), this.workspace_.getParentSvg());
  this.flyout_.init(workspace);
};

/**
 * Fill the toolbox with categories and blocks.
 * @param {!Array{Object}} newTree tree of blocks.
 * @private
 */
Toolbox.prototype.populate_ = function(newTree) {
  this.categoryMenu_.populate(newTree);
  this.selectedItem_ = null; // All categories has been disposed, so clear selected item.
  this.showAll_();
  if (!this.isCollapsed_) {
    this.setSelectedItem(this.categoryMenu_.categories_[0], false);
  }
};

/**
 * Show all blocks for all categories in the flyout
 * @private
 */
Toolbox.prototype.showAll_ = function() {
  let allContents = [];
  for (let i = 0; i < this.categoryMenu_.categories_.length; i++) {
    const category = this.categoryMenu_.categories_[i];

    allContents.push({
      kind: 'label',
      id: category.id_,
      text: category.name_,
      'category-label': true,
      showStatusButton: category.showStatusButton_,
      'web-class': 'categoryLabel'
    });

    allContents = allContents.concat(category.getContents());
  }
  this.flyout_.show(allContents, !this.isCollapsed_);
};

/**
 * Get the width of the category menu.
 * @return {number} The width of the toolbox.
 */
Toolbox.prototype.getCategoryWidth = function() {
  return this.categoryWidth;
};

/**
 * Get the width of the toolbox.
 * @return {number} The width of the toolbox.
 */
Toolbox.prototype.getWidth = function() {
  return this.width;
};

/**
 * Get the height of the toolbox, not including the block menu.
 * @return {number} The height of the toolbox.
 */
Toolbox.prototype.getHeight = function() {
  return this.categoryMenu_ ? this.categoryMenu_.getHeight() : 0;
};

/**
 * Move the toolbox to the edge.
 */
Toolbox.prototype.position = function() {
  const treeDiv = this.HtmlDiv;
  if (!treeDiv) {
    // Not initialized yet.
    return;
  }
  const svg = this.workspace_.getParentSvg();
  const svgSize = common.svgSize(svg);
  if (this.horizontalLayout_) {
    treeDiv.style.left = '0';
    treeDiv.style.height = 'auto';
    treeDiv.style.width = svgSize.width + 'px';
    this.height = treeDiv.offsetHeight;
    if (this.toolboxPosition == constants.TOOLBOX_AT_TOP) {  // Top
      treeDiv.style.top = '0';
    } else {  // Bottom
      treeDiv.style.bottom = '0';
    }
  } else {
    if (this.toolboxPosition == constants.TOOLBOX_AT_RIGHT) {  // Right
      treeDiv.style.right = '0';
    } else {  // Left
      treeDiv.style.left = '0';
    }
    treeDiv.style.height = '100%';
  }
  this.flyout_.position();
};

/**
 * Unhighlight any previously specified option.
 */
Toolbox.prototype.clearSelection = function() {
  this.setSelectedItem(null);
};

/**
 * Adds a style on the toolbox. Usually used to change the cursor.
 * @param {string} style The name of the class to add.
 * @package
 */
Toolbox.prototype.addStyle = function(style) {
  utils.addClass(/** @type {!Element} */ (this.HtmlDiv), style);
};

/**
 * Removes a style from the toolbox. Usually used to change the cursor.
 * @param {string} style The name of the class to remove.
 * @package
 */
Toolbox.prototype.removeStyle = function(style) {
  utils.removeClass(/** @type {!Element} */ (this.HtmlDiv), style);
};

/**
 * Return the deletion rectangle for this toolbox.
 * @return {Rect} Rectangle in which to delete.
 */
Toolbox.prototype.getClientRect = function() {
  if (!this.HtmlDiv) {
    return null;
  }

  // If not an auto closing flyout, always use the (larger) flyout client rect
  if (!this.flyout_.autoClose) {
    return this.flyout_.getClientRect();
  }

  // BIG_NUM is offscreen padding so that blocks dragged beyond the toolbox
  // area are still deleted.  Must be smaller than Infinity, but larger than
  // the largest screen size.
  const BIG_NUM = 10000000;
  const toolboxRect = this.HtmlDiv.getBoundingClientRect();

  const x = toolboxRect.left;
  const y = toolboxRect.top;
  const width = toolboxRect.width;
  const height = toolboxRect.height;

  // Assumes that the toolbox is on the SVG edge.  If this changes
  // (e.g. toolboxes in mutators) then this code will need to be more complex.
  if (this.toolboxPosition == constants.TOOLBOX_AT_LEFT) {
    return new Rect(-BIG_NUM, -BIG_NUM, BIG_NUM + x + width,
        2 * BIG_NUM);
  } else if (this.toolboxPosition == constants.TOOLBOX_AT_RIGHT) {
    return new Rect(toolboxRect.right - width, -BIG_NUM, BIG_NUM + width, 2 * BIG_NUM);
  } else if (this.toolboxPosition == constants.TOOLBOX_AT_TOP) {
    return new Rect(-BIG_NUM, -BIG_NUM, 2 * BIG_NUM,
        BIG_NUM + y + height);
  } else {  // Bottom
    return new Rect(0, y, 2 * BIG_NUM, BIG_NUM);
  }
};

/**
 * Is the toolbox collapsed?
 * @returns {boolean} True if the toolbox is collapsed.
 */
Toolbox.prototype.isCollapsed = function() {
  return this.isCollapsed_;
};

/**
 * Set whether the toolbox collapsed.
 * @param {boolean} collapsed Whether the toolbox collapsed.
 */
Toolbox.prototype.setCollapsed = function(collapsed) {
  if (this.isCollapsed_ == collapsed) {
    return;
  }
  this.isCollapsed_ = collapsed;
  this.flyout_.scrollTarget = null;
  this.flyout_.setVisible(!collapsed);
  if (!collapsed) {
    // Correctly position the flyout's scrollbar when it opens.
    this.flyout_.position();
  }
  this.workspace_.recordDeleteAreas_();
};

/**
 * Update the flyout's contents without closing it.  Should be used in response
 * to a change in one of the dynamic categories, such as variables or
 * procedures.
 */
Toolbox.prototype.refreshSelection = function() {
  this.showAll_();
};

/**
 * @return {Toolbox.Category} the currently selected category.
 */
Toolbox.prototype.getSelectedItem = function() {
  return this.selectedItem_;
};

/**
 * @return {string} The name of the currently selected category.
 */
Toolbox.prototype.getSelectedCategoryName = function() {
  return this.selectedItem_.name_;
};

/**
 * @return {string} The id of the currently selected category.
 * @public
 */
Toolbox.prototype.getSelectedCategoryId = function() {
  return this.selectedItem_.id_;
};

/**
 * @return {number} The distance flyout is scrolled below the top of the currently
 * selected category.
 */
Toolbox.prototype.getCategoryScrollOffset = function() {
  const categoryPos = this.getCategoryPositionById(this.getSelectedCategoryId());
  return this.flyout_.getScrollPos() - categoryPos;
};

/**
 * Get the position of a category by name.
 * @param  {string} name The name of the category.
 * @return {number} The position of the category.
 */
Toolbox.prototype.getCategoryPositionByName = function(name) {
  const scrollPositions = this.flyout_.categoryScrollPositions;
  for (let i = 0; i < scrollPositions.length; i++) {
    if (name === scrollPositions[i].categoryName) {
      return scrollPositions[i].position;
    }
  }
};

/**
 * Get the position of a category by id.
 * @param  {string} id The id of the category.
 * @return {number} The position of the category.
 * @public
 */
Toolbox.prototype.getCategoryPositionById = function(id) {
  const scrollPositions = this.flyout_.categoryScrollPositions;
  for (let i = 0; i < scrollPositions.length; i++) {
    if (id === scrollPositions[i].categoryId) {
      return scrollPositions[i].position;
    }
  }
};

/**
 * Get the length of a category by name.
 * @param  {string} name The name of the category.
 * @return {number} The length of the category.
 */
Toolbox.prototype.getCategoryLengthByName = function(name) {
  const scrollPositions = this.flyout_.categoryScrollPositions;
  for (let i = 0; i < scrollPositions.length; i++) {
    if (name === scrollPositions[i].categoryName) {
      return scrollPositions[i].length;
    }
  }
};

/**
 * Get the length of a category by id.
 * @param  {string} id The id of the category.
 * @return {number} The length of the category.
 * @public
 */
Toolbox.prototype.getCategoryLengthById = function(id) {
  const scrollPositions = this.flyout_.categoryScrollPositions;
  for (let i = 0; i < scrollPositions.length; i++) {
    if (id === scrollPositions[i].categoryId) {
      return scrollPositions[i].length;
    }
  }
};

/**
 * Set the scroll position of the flyout.
 * @param {number} pos The position to set.
 */
Toolbox.prototype.setFlyoutScrollPos = function(pos) {
  this.flyout_.setScrollPos(pos);
};


/**
 * Set the currently selected category.
 * @param {Toolbox.Category} item The category to select.
 * @param {boolean=} opt_shouldScroll Whether to scroll to the selected category. Defaults to true.
 * @param {boolean=} opt_shouldCollapse Whether to be collapsed. Defaults to false.
 */
Toolbox.prototype.setSelectedItem = function(item, opt_shouldScroll, opt_shouldCollapse) {
  if (typeof opt_shouldScroll === 'undefined') {
    opt_shouldScroll = true;
  }
  if (opt_shouldCollapse && this.selectedItem_ == item) {
    // Select the category that is already open. Collapse the toolbox.
    this.selectedItem_.setSelected(false);
    this.selectedItem_ = null;
    this.setCollapsed(true);
    return;
  }
  if (this.selectedItem_ && this.selectedItem_ != item) {
    // They selected a different category but one was already open.  Close it.
    this.selectedItem_.setSelected(false);
  }
  this.selectedItem_ = item;
  if (this.selectedItem_ != null) {
    this.selectedItem_.setSelected(true);
    // Scroll flyout to the top of the selected category
    const categoryId = item.id_;
    if (this.isCollapsed_) {
      this.setCollapsed(false);
      if (opt_shouldScroll) {
        this.scrollToCategoryById(categoryId, true);
      }
    }
    else if (opt_shouldScroll) {
      this.scrollToCategoryById(categoryId);
    }
  }
};

/**
 * Select and scroll to a category by name.
 * @param {string} name The name of the category to select and scroll to.
 */
Toolbox.prototype.setSelectedCategoryByName = function(name) {
  this.selectCategoryByName(name);
  this.scrollToCategoryByName(name);
};

/**
 * Select and scroll to a category by id.
 * @param {string} id The id of the category to select and scroll to.
 * @public
 */
Toolbox.prototype.setSelectedCategoryById = function(id) {
  this.selectCategoryById(id);
  this.scrollToCategoryById(id);
};

/**
 * Scroll to a category by name.
 * @param {string} name The name of the category to scroll to.
 * @param {boolean=} opt_immediately True to call moveTo instead of scrollTo. Defaults to false.
 * @package
 */
Toolbox.prototype.scrollToCategoryByName = function(name, opt_immediately) {
  const scrollPositions = this.flyout_.categoryScrollPositions;
  for (let i = 0; i < scrollPositions.length; i++) {
    if (name === scrollPositions[i].categoryName) {
      this.flyout_.setVisible(true);
      if (opt_immediately) {
        this.flyout_.moveTo(scrollPositions[i].position);
      }
      else {
        this.flyout_.scrollTo(scrollPositions[i].position);
      }
      return;
    }
  }
};

/**
 * Scroll to a category by id.
 * @param {string} id The id of the category to scroll to.
 * @param {boolean=} opt_immediately True to call moveTo instead of scrollTo. Defaults to false.
 * @public
 */
Toolbox.prototype.scrollToCategoryById = function(id, opt_immediately) {
  const scrollPositions = this.flyout_.categoryScrollPositions;
  for (let i = 0; i < scrollPositions.length; i++) {
    if (id === scrollPositions[i].categoryId) {
      this.flyout_.setVisible(true);
      if (opt_immediately) {
        this.flyout_.moveTo(scrollPositions[i].position);
      }
      else {
        this.flyout_.scrollTo(scrollPositions[i].position);
      }
      return;
    }
  }
};

/**
 * Get a category by its index.
 * @param  {number} index The index of the category.
 * @return {Toolbox.Category} the category, or null if there are no categories.
 * @package
 */
Toolbox.prototype.getCategoryByIndex = function(index) {
  if (!this.categoryMenu_.categories_) return null;
  return this.categoryMenu_.categories_[index];
};

/**
 * Select a category by name.
 * @param {string} name The name of the category to select.
 * @package
 */
Toolbox.prototype.selectCategoryByName = function(name) {
  for (let i = 0; i < this.categoryMenu_.categories_.length; i++) {
    const category = this.categoryMenu_.categories_[i];
    if (name === category.name_) {
      if (this.selectedItem_) {
        this.selectedItem_.setSelected(false);
      }
      this.selectedItem_ = category;
      this.selectedItem_.setSelected(true);
    }
  }
};

/**
 * Select a category by id.
 * @param {string} id The id of the category to select.
 * @package
 */
Toolbox.prototype.selectCategoryById = function(id) {
  for (let i = 0; i < this.categoryMenu_.categories_.length; i++) {
    const category = this.categoryMenu_.categories_[i];
    if (id === category.id_) {
      if (this.selectedItem_) {
        this.selectedItem_.setSelected(false);
      }
      this.selectedItem_ = category;
      this.selectedItem_.setSelected(true);
    }
  }
};

/**
 * Wrapper function for calling setSelectedItem from a touch handler.
 * @param {Toolbox.Category} item The category to select.
 * @return {function} A function that can be passed to bindEvent.
 */
Toolbox.prototype.setSelectedItemFactory = function(item) {
  const selectedItem = item;
  return function() {
    if (!this.workspace_.isDragging()) {
      this.setSelectedItem(selectedItem, true, true);
      Touch.clearTouchIdentifier();
    }
  };
};

// Category menu
/**
 * Class for a table of category titles that will control which category is
 * displayed.
 * @param {Toolbox} parent The toolbox that owns the category menu.
 * @param {Element} parentHtml The containing html div.
 * @constructor
 */
Toolbox.CategoryMenu = function(parent, parentHtml) {
  this.parent_ = parent;
  this.height_ = 0;
  this.parentHtml_ = parentHtml;
  this.createDom();
  this.categories_ = [];
};

/**
 * @return {number} the height of the category menu.
 */
Toolbox.CategoryMenu.prototype.getHeight = function() {
  return this.height_;
};

/**
 * Create the DOM for the category menu.
 */
Toolbox.CategoryMenu.prototype.createDom = function() {
  this.table = dom.createDom('div', this.parent_.horizontalLayout_ ?
    'scratchCategoryMenuHorizontal' : 'scratchCategoryMenu');
  this.parentHtml_.appendChild(this.table);
};

/**
 * Fill the toolbox with categories and blocks by creating a new
 * {Toolbox.Category} for every category tag in the toolbox xml.
 * @param {?Array<Object>} tree tree of blocks, or null.
 */
Toolbox.CategoryMenu.prototype.populate = function(tree) {
  if (!tree) {
    return;
  }

  // Remove old categories
  this.dispose();
  this.createDom();
  const categories = [];
  // Find actual categories from the DOM tree.
  for (let i = 0, child; child = tree[i]; i++) {
    if (!child.kind || child.kind.toUpperCase() !== 'CATEGORY') {
      continue;
    }
    categories.push(child);
  }

  // Create a single column of categories
  for (let i = 0; i < categories.length; i++) {
    const child = categories[i];
    const row = dom.createDom('div', 'scratchCategoryMenuRow');
    this.table.appendChild(row);
    if (child) {
      this.categories_.push(new Toolbox.Category(this, row,
          child));
    }
  }
  this.height_ = this.table.offsetHeight;
};

/**
 * Dispose of this Category Menu and all of its children.
 */
Toolbox.CategoryMenu.prototype.dispose = function() {
  for (let i = 0, category; category = this.categories_[i]; i++) {
    category.dispose();
  }
  this.categories_ = [];
  if (this.table) {
    dom.removeNode(this.table);
    this.table = null;
  }
};


// Category
/**
 * Class for the data model of a category in the toolbox.
 * @param {Toolbox.CategoryMenu} parent The category menu that owns this
 *     category.
 * @param {Element} parentHtml The containing html div.
 * @param {Object} tree tree of blocks.
 * @constructor
 */
Toolbox.Category = function(parent, parentHtml, tree) {
  this.parent_ = parent;
  this.parentHtml_ = parentHtml;
  this.name_ = tree['name'];
  this.id_ = tree['id'];
  this.setColour(tree);
  this.custom_ = tree['custom'];
  this.iconURI_ = tree['iconURI'];
  this.showStatusButton_ = tree['showStatusButton'];
  this.contents_ = [];
  if (!this.custom_) {
    this.parseContents_(tree.contents);
  }
  this.createDom();
};

/**
 * Dispose of this category and all of its contents.
 */
Toolbox.Category.prototype.dispose = function() {
  if (this.item_) {
    dom.removeNode(this.item_);
    this.item_ = null;
  }
  this.parent_ = null;
  this.parentHtml_ = null;
  this.contents_ = null;
};

/**
 * Used to determine the css classes for the menu item for this category
 * based on its current state.
 * @private
 * @param {boolean=} selected Indication whether the category is currently selected.
 * @return {string} The css class names to be applied, space-separated.
 */
Toolbox.Category.prototype.getMenuItemClassName_ = function(selected) {
  const classNames = [
    'scratchCategoryMenuItem',
    'scratchCategoryId-' + this.id_,
  ];
  if (selected) {
    classNames.push('categorySelected');
  }
  return classNames.join(' ');
};

/**
 * Create the DOM for a category in the toolbox.
 */
Toolbox.Category.prototype.createDom = function() {
  const toolbox = this.parent_.parent_;
  this.item_ = dom.createDom('div',
      {'class': this.getMenuItemClassName_()});
  this.label_ = dom.createDom('div',
      {'class': 'scratchCategoryMenuItemLabel'},
      utils.replaceMessageReferences(this.name_));
  // cc beg - new category style
  this.colorBar_ = dom.createDom('div',
      {'class': 'scratchCategoryItemColorBar'});
  this.colorBar_.style.backgroundColor = this.colour_;
  this.colorBar_.style.borderColor = this.secondaryColour_;
  this.item_.appendChild(this.colorBar_);
  // cc end - new category style
  this.item_.appendChild(this.label_);
  this.parentHtml_.appendChild(this.item_);
  browserEvents.bind(
      this.item_, 'mouseup', toolbox, toolbox.setSelectedItemFactory(this));
};

/**
 * Set the selected state of this category.
 * @param {boolean} selected Whether this category is selected.
 */
Toolbox.Category.prototype.setSelected = function(selected) {
  this.item_.className = this.getMenuItemClassName_(selected);
};

/**
 * Set the contents of this category from DOM.
 * @param {Object} tree tree of blocks.
 * @constructor
 */
Toolbox.Category.prototype.parseContents_ = function(tree) {
  for (let i = 0, child; child = tree[i]; i++) {
    if (!child.kind) {
      continue;
    }

    switch (child.kind.toUpperCase()) {
      case 'BLOCK':
      case 'SHADOW':
      case 'LABEL':
      case 'BUTTON':
      case 'SEP':
      case 'TEXT':
        this.contents_.push(child);
        break;
      default:
        break;
    }
  }
};

/**
 * Get the contents of this category.
 * @return {!Array|string} xmlList List of blocks to show, or a string with the
 *     name of a custom category.
 */
Toolbox.Category.prototype.getContents = function() {
  return this.custom_ ? this.custom_ : this.contents_;
};

/**
 * Set the colour of the category's background from a category info.
 * @param {Object} state category state with "colour" and "secondaryColour" attribute.
 *     Colours are a hex string or hue on a colour wheel (0-360).
 */
Toolbox.Category.prototype.setColour = function(state) {
  const colour = state['colour'];
  const secondaryColour = state['secondaryColour'] || state['secondarycolour'];
  if (typeof colour === 'string') {
    if (colour.match(/^#[0-9a-fA-F]{6}$/)) {
      this.colour_ = colour;
    } else {
      this.colour_ = common.hueToRgb(colour);
    }
    if (secondaryColour.match(/^#[0-9a-fA-F]{6}$/)) {
      this.secondaryColour_ = secondaryColour;
    } else {
      this.secondaryColour_ = common.hueToRgb(secondaryColour);
    }
    this.hasColours_ = true;
  } else {
    this.colour_ = '#000000';
    this.secondaryColour_ = '#000000';
  }
};
