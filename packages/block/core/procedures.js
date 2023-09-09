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
 * @fileoverview Utility functions for handling procedures.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

/**
 * @name Blockly.Procedures
 * @namespace
 **/
import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Procedures');

import * as constants from './constants';
import * as eventUtils from './events/utils';
import {BlockChange} from './events/block_change';
import {Msg} from './msg';
import {Names} from './names';
import * as scratchBlocksUtils from './scratch_blocks_utils';
import * as Xml from './xml';

const dom = goog.require('goog.dom');


/**
 * Constant to separate procedure names from variables and generated functions
 * when running generators.
 * @deprecated Use constants.PROCEDURE_CATEGORY_NAME
 */
export const NAME_TYPE = constants.PROCEDURE_CATEGORY_NAME;

/**
 * Find all user-created procedure definitions in a workspace.
 * @param {!Blockly.Workspace} root Root workspace.
 * @return {!Array.<!Array.<!Array>>} Pair of arrays, the
 *     first contains procedures without return variables, the second with.
 *     Each procedure is defined by a three-element list of name, parameter
 *     list, and return value boolean.
 */
export const allProcedures = function(root) {
  const blocks = root.getAllBlocks();
  const proceduresReturn = [];
  const proceduresNoReturn = [];
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].getProcedureDef) {
      const tuple = blocks[i].getProcedureDef();
      if (tuple) {
        if (tuple[2]) {
          proceduresReturn.push(tuple);
        } else {
          proceduresNoReturn.push(tuple);
        }
      }
    }
  }
  proceduresNoReturn.sort(procTupleComparator);
  proceduresReturn.sort(procTupleComparator);
  return [proceduresNoReturn, proceduresReturn];
};

/**
 * Find all user-created procedure definition mutations in a workspace.
 * @param {!Blockly.Workspace} root Root workspace.
 * @return {!Array.<Element>} Array of mutation xml elements.
 * @package
 */
export const allProcedureMutations = function(root) {
  const blocks = root.getAllBlocks();
  const mutations = [];
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].type == constants.PROCEDURES_PROTOTYPE_BLOCK_TYPE) {
      const mutation = blocks[i].mutationToDom(/* opt_generateShadows */ true);
      if (mutation) {
        mutations.push(mutation);
      }
    }
  }
  return mutations;
};

/**
 * Sorts an array of procedure definition mutations alphabetically.
 * (Does not mutate the given array.)
 * @param {!Array.<Element>} mutations Array of mutation xml elements.
 * @return {!Array.<Element>} Sorted array of mutation xml elements.
 * @private
 */
const sortProcedureMutations = function(mutations) {
  const newMutations = mutations.slice();

  newMutations.sort(function(a, b) {
    const procCodeA = a.getAttribute('proccode');
    const procCodeB = b.getAttribute('proccode');

    return scratchBlocksUtils.compareStrings(procCodeA, procCodeB);
  });

  return newMutations;
};

/**
 * Comparison function for case-insensitive sorting of the first element of
 * a tuple.
 * @param {!Array} ta First tuple.
 * @param {!Array} tb Second tuple.
 * @return {number} -1, 0, or 1 to signify greater than, equality, or less than.
 * @private
 */
const procTupleComparator = function(ta, tb) {
  return scratchBlocksUtils.compareStrings(ta[0], tb[0]);
};

/**
 * Ensure two identically-named procedures don't exist.
 * @param {string} name Proposed procedure name.
 * @param {!Blockly.Block} block Block to disambiguate.
 * @return {string} Non-colliding name.
 */
export const findLegalName = function(name, block) {
  if (block.isInFlyout) {
    // Flyouts can have multiple procedures called 'do something'.
    return name;
  }
  while (!isLegalName(name, block.workspace, block)) {
    // Collision with another procedure.
    const r = name.match(/^(.*?)(\d+)$/);
    if (!r) {
      name += '2';
    } else {
      name = r[1] + (parseInt(r[2], 10) + 1);
    }
  }
  return name;
};

/**
 * Does this procedure have a legal name?  Illegal names include names of
 * procedures already defined.
 * @param {string} name The questionable name.
 * @param {!Blockly.Workspace} workspace The workspace to scan for collisions.
 * @param {Blockly.Block=} opt_exclude Optional block to exclude from
 *     comparisons (one doesn't want to collide with oneself).
 * @return {boolean} True if the name is legal.
 * @private
 */
const isLegalName = function(name, workspace, opt_exclude) {
  return !isNameUsed(name, workspace, opt_exclude);
};

/**
 * Return if the given name is already a procedure name.
 * @param {string} name The questionable name.
 * @param {!Blockly.Workspace} workspace The workspace to scan for collisions.
 * @param {Blockly.Block=} opt_exclude Optional block to exclude from
 *     comparisons (one doesn't want to collide with oneself).
 * @return {boolean} True if the name is used, otherwise return false.
 */
export const isNameUsed = function(name, workspace, opt_exclude) {
  const blocks = workspace.getAllBlocks();
  // Iterate through every block and check the name.
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i] == opt_exclude) {
      continue;
    }
    if (blocks[i].getProcedureDef) {
      const procName = blocks[i].getProcedureDef();
      if (Names.equals(procName[0], name)) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Rename a procedure.  Called by the editable field.
 * @param {string} name The proposed new name.
 * @return {string} The accepted name.
 * @this {Blockly.Field}
 */
export const rename = function(name) {
  // Strip leading and trailing whitespace.  Beyond this, all names are legal.
  name = name.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');

  // Ensure two identically-named procedures don't exist.
  const legalName = findLegalName(name, this.sourceBlock_);
  const oldName = this.text_;
  if (oldName != name && oldName != legalName) {
    // Rename any callers.
    const blocks = this.sourceBlock_.workspace.getAllBlocks();
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].renameProcedure) {
        blocks[i].renameProcedure(oldName, legalName);
      }
    }
  }
  return legalName;
};

/**
 * Construct the blocks required by the flyout for the procedure category.
 * @param {!Blockly.Workspace} workspace The workspace contianing procedures.
 * @return {!Array.<!Element>} Array of XML block elements.
 */
export const flyoutCategory = function(workspace) {
  const xmlList = [];

  addCreateButton(workspace, xmlList);

  // Create call blocks for each procedure defined in the workspace
  let mutations = allProcedureMutations(workspace);
  mutations = sortProcedureMutations(mutations);
  for (let i = 0; i < mutations.length; i++) {
    const mutation = mutations[i];
    // <block type="procedures_call">
    //   <mutation ...></mutation>
    // </block>
    const block = dom.createDom('block');
    block.setAttribute('type', 'procedures_call');
    block.setAttribute('gap', 16);
    block.appendChild(mutation);
    xmlList.push(block);
  }
  return xmlList;
};

/**
 * Create the "Make a Block..." button.
 * @param {!Blockly.Workspace} workspace The workspace contianing procedures.
 * @param {!Array.<!Element>} xmlList Array of XML block elements to add to.
 * @private
 */
const addCreateButton = function(workspace, xmlList) {
  const button = dom.createDom('button');
  const msg = Msg.NEW_PROCEDURE;
  const callbackKey = 'CREATE_PROCEDURE';
  const callback = function() {
    createProcedureDefCallback(workspace);
  };
  button.setAttribute('text', msg);
  button.setAttribute('callbackKey', callbackKey);
  workspace.registerButtonCallback(callbackKey, callback);
  xmlList.push(button);
};

/**
 * Find all callers of a named procedure.
 * @param {string} name Name of procedure (procCode in scratch-blocks).
 * @param {!Blockly.Workspace} ws The workspace to find callers in.
 * @param {!Blockly.Block} definitionRoot The root of the stack where the
 *     procedure is defined.
 * @param {boolean} allowRecursive True if the search should include recursive
 *     procedure calls.  False if the search should ignore the stack starting
 *     with definitionRoot.
 * @return {!Array.<!Blockly.Block>} Array of caller blocks.
 * @package
 */
export const getCallers = function(name, ws, definitionRoot,
    allowRecursive) {
  const allBlocks = [];
  const topBlocks = ws.getTopBlocks();

  // Start by deciding which stacks to investigate.
  for (let i = 0; i < topBlocks.length; i++) {
    const block = topBlocks[i];
    if (block.id == definitionRoot.id && !allowRecursive) {
      continue;
    }
    allBlocks.push.apply(allBlocks, block.getDescendants(false));
  }

  const callers = [];
  for (let i = 0; i < allBlocks.length; i++) {
    const block = allBlocks[i];
    if (block.type == constants.PROCEDURES_CALL_BLOCK_TYPE ) {
      const procCode = block.getProcCode();
      if (procCode && procCode == name) {
        callers.push(block);
      }
    }
  }
  return callers;
};

/**
 * Find and edit all callers with a procCode using a new mutation.
 * @param {string} name Name of procedure (procCode in scratch-blocks).
 * @param {!Blockly.Workspace} ws The workspace to find callers in.
 * @param {!Element} mutation New mutation for the callers.
 * @package
 */
export const mutateCallersAndPrototype = function(name, ws, mutation) {
  const defineBlock = getDefineBlock(name, ws);
  const prototypeBlock = getPrototypeBlock(name, ws);
  if (defineBlock && prototypeBlock) {
    const callers = getCallers(name,
        defineBlock.workspace, defineBlock, true /* allowRecursive */);
    callers.push(prototypeBlock);
    eventUtils.setGroup(true);
    for (let i = 0, caller; caller = callers[i]; i++) {
      const oldMutationDom = caller.mutationToDom();
      const oldMutation = oldMutationDom && Xml.domToText(oldMutationDom);
      caller.domToMutation(mutation);
      const newMutationDom = caller.mutationToDom();
      const newMutation = newMutationDom && Xml.domToText(newMutationDom);
      if (oldMutation != newMutation) {
        eventUtils.fire(new BlockChange(
            caller, 'mutation', null, oldMutation, newMutation));
      }
    }
    eventUtils.setGroup(false);
  } else {
    alert('No define block on workspace'); // TODO decide what to do about this.
  }
};

/**
 * Find the definition block for the named procedure.
 * @param {string} procCode The identifier of the procedure.
 * @param {!Blockly.Workspace} workspace The workspace to search.
 * @return {Blockly.Block} The procedure definition block, or null not found.
 * @package
 */
export const getDefineBlock = function(procCode, workspace) {
  // Assume that a procedure definition is a top block.
  const blocks = workspace.getTopBlocks(false);
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].type == constants.PROCEDURES_DEFINITION_BLOCK_TYPE) {
      const prototypeBlock = blocks[i].getInput('custom_block').connection.targetBlock();
      if (prototypeBlock.getProcCode && prototypeBlock.getProcCode() == procCode) {
        return blocks[i];
      }
    }
  }
  return null;
};

/**
 * Find the prototype block for the named procedure.
 * @param {string} procCode The identifier of the procedure.
 * @param {!Blockly.Workspace} workspace The workspace to search.
 * @return {Blockly.Block} The procedure prototype block, or null not found.
 * @package
 */
export const getPrototypeBlock = function(procCode, workspace) {
  const defineBlock = getDefineBlock(procCode, workspace);
  if (defineBlock) {
    return defineBlock.getInput('custom_block').connection.targetBlock();
  }
  return null;
};

/**
 * Create a mutation for a brand new custom procedure.
 * @return {Element} The mutation for a new custom procedure
 * @package
 */
export const newProcedureMutation = function() {
  const mutationText = '<xml>' +
      '<mutation' +
      ' proccode="' + Msg['PROCEDURE_DEFAULT_NAME'] + '"' +
      ' argumentids="[]"' +
      ' argumentnames="[]"' +
      ' argumentdefaults="[]"' +
      ' warp="false">' +
      '</mutation>' +
      '</xml>';
  return Xml.textToDom(mutationText).firstChild;
};

/**
 * Callback to create a new procedure custom command block.
 * @param {!Blockly.Workspace} workspace The workspace to create the new procedure on.
 * @private
 */
const createProcedureDefCallback = function(workspace) {
  externalProcedureDefCallback(
      newProcedureMutation(),
      createProcedureCallbackFactory(workspace)
  );
};

/**
 * Callback factory for adding a new custom procedure from a mutation.
 * @param {!Blockly.Workspace} workspace The workspace to create the new procedure on.
 * @return {function(?Element)} callback for creating the new custom procedure.
 * @private
 */
const createProcedureCallbackFactory = function(workspace) {
  return function(mutation) {
    if (mutation) {
      const blockText = '<xml>' +
          '<block type="procedures_definition">' +
          '<statement name="custom_block">' +
          '<shadow type="procedures_prototype">' +
          Xml.domToText(mutation) +
          '</shadow>' +
          '</statement>' +
          '</block>' +
          '</xml>';
      const blockDom = Xml.textToDom(blockText).firstChild;
      eventUtils.setGroup(true);
      const block = Xml.domToBlock(blockDom, workspace);
      const scale = workspace.scale; // To convert from pixel units to workspace units
      // Position the block so that it is at the top left of the visible workspace,
      // padded from the edge by 30 units. Position in the top right if RTL.
      let posX = -workspace.scrollX;
      if (workspace.RTL) {
        posX += workspace.getMetrics().contentWidth - 30;
      } else {
        posX += 30;
      }
      block.moveBy(posX / scale, (-workspace.scrollY + 30) / scale);
      block.scheduleSnapAndBump();
      eventUtils.setGroup(false);
    }
  };
};

/**
 * Callback to open the modal for editing custom procedures.
 * @param {!Blockly.Block} block The block that was right-clicked.
 * @private
 */
const editProcedureCallback = function(block) {
  // Edit can come from one of three block types (call, define, prototype)
  // Normalize by setting the block to the prototype block for the procedure.
  if (block.type == constants.PROCEDURES_DEFINITION_BLOCK_TYPE) {
    const input = block.getInput('custom_block');
    if (!input) {
      alert('Bad input'); // TODO: Decide what to do about this.
      return;
    }
    const conn = input.connection;
    if (!conn) {
      alert('Bad connection'); // TODO: Decide what to do about this.
      return;
    }
    const innerBlock = conn.targetBlock();
    if (!innerBlock ||
        !innerBlock.type == constants.PROCEDURES_PROTOTYPE_BLOCK_TYPE) {
      alert('Bad inner block'); // TODO: Decide what to do about this.
      return;
    }
    block = innerBlock;
  } else if (block.type == constants.PROCEDURES_CALL_BLOCK_TYPE) {
    // This is a call block, find the prototype corresponding to the procCode.
    // Make sure to search the correct workspace, call block can be in flyout.
    const workspaceToSearch = block.workspace.isFlyout ?
        block.workspace.targetWorkspace : block.workspace;
    block = getPrototypeBlock(
        block.getProcCode(), workspaceToSearch);
  }
  // Block now refers to the procedure prototype block, it is safe to proceed.
  externalProcedureDefCallback(
      block.mutationToDom(),
      editProcedureCallbackFactory(block)
  );
};

/**
 * Callback factory for editing an existing custom procedure.
 * @param {!Blockly.Block} block The procedure prototype block being edited.
 * @return {function(?Element)} Callback for editing the custom procedure.
 * @private
 */
const editProcedureCallbackFactory = function(block) {
  return function(mutation) {
    if (mutation) {
      mutateCallersAndPrototype(block.getProcCode(),
          block.workspace, mutation);
    }
  };
};

/**
 * Callback to create a new procedure custom command block.
 * @private
 */
let externalProcedureDefCallback = function(/** mutator, callback */) {
  alert('External procedure editor must be override Blockly.Procedures.externalProcedureDefCallback');
};

/**
 * Set the callback to create a new procedure.
 * @param {function} func The callback to create a new procedure.
 * @public
 */
export const setExternalProcedureDefCallback = function(func) {
  externalProcedureDefCallback = func;
};

/**
 * Make a context menu option for editing a custom procedure.
 * This appears in the context menu for procedure definitions and procedure
 * calls.
 * @param {!Blockly.BlockSvg} block The block where the right-click originated.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 * @package
 */
export const makeEditOption = function(block) {
  const editOption = {
    enabled: true,
    text: Msg.EDIT_PROCEDURE,
    callback: function() {
      editProcedureCallback(block);
    }
  };
  return editOption;
};

/**
 * Callback to show the procedure definition corresponding to a custom command
 * block.
 * TODO(#1136): Implement.
 * @param {!Blockly.Block} block The block that was right-clicked.
 * @private
 */
const showProcedureDefCallback = function(block) {
  alert('TODO(#1136): implement showing procedure definition (procCode was "' +
      block.procCode_ + '")');
};

/**
 * Make a context menu option for showing the definition for a custom procedure,
 * based on a right-click on a custom command block.
 * @param {!Blockly.BlockSvg} block The block where the right-click originated.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 * @package
 */
export const makeShowDefinitionOption = function(block) {
  const option = {
    enabled: true,
    text: Msg.SHOW_PROCEDURE_DEFINITION,
    callback: function() {
      showProcedureDefCallback(block);
    }
  };
  return option;
};

/**
 * Callback to try to delete a custom block definitions.
 * @param {string} procCode The identifier of the procedure to delete.
 * @param {!Blockly.Block} definitionRoot The root block of the stack that
 *     defines the custom procedure.
 * @return {boolean} True if the custom procedure was deleted, false otherwise.
 * @package
 */
export const deleteProcedureDefCallback = function(procCode,
    definitionRoot) {
  const callers = getCallers(procCode,
      definitionRoot.workspace, definitionRoot, false /* allowRecursive */);
  if (callers.length > 0) {
    return false;
  }

  const workspace = definitionRoot.workspace;

  // Delete the whole stack.
  eventUtils.setGroup(true);
  definitionRoot.dispose();
  eventUtils.setGroup(false);

  // TODO (#1354) Update this function when '_' is removed
  // Refresh toolbox, so caller doesn't appear there anymore
  workspace.refreshToolboxSelection_();

  return true;
};
