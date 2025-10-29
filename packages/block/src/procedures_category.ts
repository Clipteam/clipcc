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

import * as Blockly from 'blockly/core';
import * as Constants from './constants';
import {
  compareStrings,
  isProcedureCallBlock,
  isProcedureDefinitionBlock,
  isProcedurePrototypeBlock
} from './utils';
import {ProcedureModel} from './procedure_model';
import type {ProcedureExtraState} from './serialization/procedures';
import type {
  ProcedureCallBlock,
  ProcedureDefinitionBlock,
  ProcedurePrototypeBlock
} from './blocks/procedures';
import {FuncCreate} from './events/func_create';
import {FuncChange} from './events/func_change';
import {FuncDelete} from './events/func_delete';

/**
 * Construct the blocks required by the flyout for the procedure category.
 * @param workspace The workspace contianing procedures.
 * @returns Array of XML block elements.
 */
export function flyoutCategory(workspace: Blockly.WorkspaceSvg): Blockly.utils.toolbox.FlyoutItemInfoArray {
  const toolboxDef: Blockly.utils.toolbox.FlyoutItemInfoArray = [];

  // Create the "Make a Block..." button.
  toolboxDef.push({
    kind: 'button',
    text: Blockly.Msg.NEW_PROCEDURE,
    callbackkey: 'CREATE_PROCEDURE'
  });
  workspace.registerButtonCallback('CREATE_PROCEDURE', function() {
    createProcedureDefCallback(workspace);
  });

  // Create the "Return" block.
  toolboxDef.push({
    kind: 'block',
    type: 'procedures_return',
    inputs: {
      VALUE: {
        shadow: {
          type: 'text',
          fields: {TEXT: 0}
        }
      }
    }
  });

  // Create call blocks for each procedure
  const states = allProcedureExtraStates(workspace);
  for (const state of states) {
    toolboxDef.push({
      kind: 'block',
      type: 'procedures_call',
      extraState: state
    });
  }

  return toolboxDef;
}

/**
 * Find all procedure definition in workspace.
 * @param root Root workspace.
 * @returns Array of procedure states.
 */
function allProcedureExtraStates(root: Blockly.Workspace): ProcedureExtraState[] {
  const procedures = root.getProcedureMap().getProcedures() as ProcedureModel[];
  const states: ProcedureExtraState[] = [];
  for (const procedure of procedures) {
    states.push(procedure.saveExtraState());
  }
  return states.sort((a, b) => {
    return compareStrings(a.proccode, b.proccode);
  });
}

/**
 * Find the definition block for the named procedure.
 * @param procCode The identifier of the procedure.
 * @param workspace The workspace to search.
 * @returns The procedure definition block, or null not found.
 */
function getDefineBlock(
  procCode: string,
  workspace: Blockly.Workspace
): ProcedureDefinitionBlock | null {
  // Assume that a procedure definition is a top block.
  const blocks = workspace.getTopBlocks(false);
  for (const block of blocks) {
    if (isProcedureDefinitionBlock(block)) {
      const prototypeBlock = block.getInput('custom_block')!.connection!.targetBlock()!;
      if (isProcedurePrototypeBlock(prototypeBlock) && prototypeBlock.getProcCode() == procCode) {
        return block;
      }
    }
  }
  return null;
}

/**
 * Find the prototype block for the named procedure.
 * @param procCode The identifier of the procedure.
 * @param workspace The workspace to search.
 * @returns The procedure prototype block, or null not found.
 */
function getPrototypeBlock(
  procCode: string,
  workspace: Blockly.Workspace
): ProcedurePrototypeBlock | null {
  const defineBlock = getDefineBlock(procCode, workspace);
  if (defineBlock) {
    return defineBlock.getInput('custom_block')!.connection!.targetBlock() as ProcedurePrototypeBlock;
  }
  return null;
}

/**
 * Create a state for a brand new custom procedure.
 * @returns The extra state for a new custom procedure
 */
function newProcedureExtraState(): ProcedureExtraState {
  return {
    proccode: Blockly.Msg.PROCEDURE_DEFAULT_NAME,
    argumentids: [],
    argumentnames: [],
    argumentdefaults: [],
    warp: false,
    return: false,
    global: false
  };
}

/**
 * Callback to create a new procedure custom command block.
 * @param workspace The workspace to create the new procedure on.
 */
function createProcedureDefCallback(workspace: Blockly.WorkspaceSvg) {
  externalProcedureDefCallback(
    newProcedureExtraState(),
    createProcedureCallbackFactory(workspace),
    true
  );
}

/**
 * Callback factory for adding a new custom procedure from a mutation.
 * @param workspace The workspace to create the new procedure on.
 * @returns callback for creating the new custom procedure.
 */
function createProcedureCallbackFactory(
  workspace: Blockly.WorkspaceSvg
): (state?: ProcedureExtraState) => void {
  return function(state?: ProcedureExtraState) {
    if (state) {
      Blockly.Events.setGroup(true);
      // Add to procedure map of the workspace.
      const model = ProcedureModel.loadExtraState(workspace, state);
      workspace.getProcedureMap().add(model);
      Blockly.Events.fire(new FuncCreate(model));

      // Create the definition block.
      const blockState: Blockly.serialization.blocks.State = {
        type: Constants.PROCEDURES_DEFINITION_BLOCK_TYPE,
        inputs: {
          custom_block: {
            shadow: {
              type: Constants.PROCEDURES_PROTOTYPE_BLOCK_TYPE,
              extraState: state
            }
          }
        }
      };
      const block = Blockly.serialization.blocks.append(blockState, workspace) as ProcedureDefinitionBlock;
      Blockly.renderManagement.finishQueuedRenders().then(() => {
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
        Blockly.Events.setGroup(false);
      });
    }
  };
}

/**
 * Callback to open the modal for editing custom procedures.
 * @param block The block that was right-clicked.
 */
function editProcedureCallback(block: ProcedureDefinitionBlock | ProcedureCallBlock) {
  // Edit can come from one of three block types (call, define, prototype)
  // Normalize by setting the block to the prototype block for the procedure.
  let prototypeBlock: ProcedurePrototypeBlock;
  if (isProcedureDefinitionBlock(block)) {
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
    if (!innerBlock || !isProcedurePrototypeBlock(innerBlock)) {
      alert('Bad inner block'); // TODO: Decide what to do about this.
      return;
    }
    prototypeBlock = innerBlock;
  } else if (isProcedureCallBlock(block)) {
    // @todo edit global procedure
    // if (block.getGlobal()) {
    //   // Change workspace before performing search
    //   externalCheckoutWsCallback(block.getProcCode());
    // }
    // This is a call block, find the prototype corresponding to the procCode.
    // Make sure to search the correct workspace, call block can be in flyout.
    // block's workspace may lost after checkout workspace
    let workspaceToSearch;
    if (block.workspace !== null) {
      workspaceToSearch = block.workspace.isFlyout ? block.workspace.targetWorkspace! : block.workspace;
    } else {
      workspaceToSearch = Blockly.getMainWorkspace();
    }

    prototypeBlock = getPrototypeBlock(block.getProcCode(), workspaceToSearch)!;
  } else {
    prototypeBlock = block;
  }
  // Block now refers to the procedure prototype block, it is safe to proceed.
  externalProcedureDefCallback(
    prototypeBlock.saveExtraState(),
    editProcedureCallbackFactory(prototypeBlock),
    false
  );
}

/**
 * Callback factory for editing an existing custom procedure.
 * @param block The procedure prototype block being edited.
 * @returns Callback for editing the custom procedure.
 */
function editProcedureCallbackFactory(block: ProcedurePrototypeBlock) {
  return function(state?: ProcedureExtraState) {
    if (state) {
      const procedureMap = block.workspace.getProcedureMap();
      const prevProcCode = block.getProcCode();
      const procedureModel = procedureMap.get(prevProcCode) as ProcedureModel;

      // Update the model with extra states.
      procedureModel.loadExtraState(state);
      if (procedureModel.getProcCode() !== prevProcCode) {
        procedureMap.delete(prevProcCode);
        procedureMap.add(procedureModel);
      }

      // Update all procedure blocks.
      const allBlocks = block.workspace.getAllBlocks(false);
      for (const block of allBlocks) {
        if (isProcedureCallBlock(block) || isProcedurePrototypeBlock(block)) {
          block.updateDisplay_();
        }
      }

      Blockly.Events.setGroup(true);
      Blockly.Events.fire(new FuncChange(procedureModel, state));
      Blockly.Events.setGroup(false);
    }
  };
}

/**
 * Callback to create a new procedure custom command block.
 * @param state The state of prcedure block.
 * @param callback Callback function triggered after edit.
 * @param isCreate True if the procedure is newly created.
 */
let externalProcedureDefCallback = function(
  state: ProcedureExtraState,
  callback: (state?: ProcedureExtraState) => void,
  isCreate: boolean
) {
  alert('External procedure editor must override externalProcedureDefCallback');
};

/**
 * Set the callback to create a new procedure.
 * @param callback The callback to create a new procedure.
 */
export function setExternalProcedureDefCallback(callback: typeof externalProcedureDefCallback) {
  externalProcedureDefCallback = callback;
}

/**
 * Callback to checkout current workspace for global procedures.
 * @param procCode Procedure proccode.
 */
let externalCheckoutWorkspaceCallback = function(procCode: string) {
  alert('External procedure editor must be override externalCheckoutWorkspaceCallback');
};

/**
 * Set the callback to checkout current workspace for global procedures.
 * @param callback The callback to checkout current workspace.
 */
export function setExternalCheckoutWsCallback(callback: typeof externalCheckoutWorkspaceCallback) {
  externalCheckoutWorkspaceCallback = callback;
}

/**
 * Make a context menu option for editing a custom procedure.
 * This appears in the context menu for procedure definitions and procedure
 * calls.
 * @param block The block where the right-click originated.
 * @returns A menu option, containing text, enabled, and a callback.
 */
export function makeEditOption(
  block: ProcedureDefinitionBlock | ProcedureCallBlock
): Blockly.ContextMenuRegistry.LegacyContextMenuOption {
  const editOption = {
    enabled: true,
    text: Blockly.Msg.EDIT_PROCEDURE,
    callback: function() {
      editProcedureCallback(block);
    }
  };
  return editOption;
}

/**
 * Callback to show the procedure definition corresponding to a custom command
 * block.
 * @param block The block that was right-clicked.
 */
function showProcedureDefCallback(block: ProcedureCallBlock) {
  let workspace;
  // if (block.getGlobal()) {
  //   externalCheckoutWorkspaceCallback(block.getProcCode());
  // }
  // block's workspace may lost after checkout workspace
  if (block.workspace !== null) {
    workspace = block.workspace.isFlyout ? block.workspace.targetWorkspace! : block.workspace;
  } else {
    workspace = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
  }

  const defBlock = getDefineBlock(block.getProcCode(), workspace);
  if (defBlock) {
    workspace.centerOnBlock(defBlock.id);
    defBlock.select();
  }
}

/**
 * Make a context menu option for showing the definition for a custom procedure,
 * based on a right-click on a custom block.
 * @param block The block where the right-click originated.
 * @returns A menu option, containing text, enabled, and a callback.
 */
export function makeShowDefinitionOption(
  block: ProcedureCallBlock
): Blockly.ContextMenuRegistry.LegacyContextMenuOption {
  const option = {
    enabled: true,
    text: Blockly.Msg.SHOW_PROCEDURE_DEFINITION,
    callback: function() {
      showProcedureDefCallback(block);
    }
  };
  return option;
}

/**
 * Make a context menu option for changing the shape for a custom procedure,
 * based on a right-click on a custom block.
 * @param block The block where the right-click originated.
 * @returns A menu option, containing text, enabled, and a callback.
 */
export function makeChangeShapeOption(
  block: ProcedureCallBlock
): Blockly.ContextMenuRegistry.LegacyContextMenuOption {
  const option = {
    enabled: true,
    text: Blockly.Msg.CHANGE_PROCEDURE_SHAPE,
    callback: function() {
      const oldState = block.saveExtraState();
      block.setReturn(!block.getReturn());
      const newState = block.saveExtraState();
      Blockly.Events.setGroup(true);
      Blockly.Events.fire(new Blockly.Events.BlockChange(block, 'mutation', null, oldState, newState));
      Blockly.Events.setGroup(false);
    }
  };
  return option;
}

/**
 * Make a context menu option for forcibly deleting a custom procedure.
 * This appears in the context menu for procedure definitions.
 * @param block The block where the right-click originated.
 * @returns A menu option, containing text, enabled, and a callback.
 * @package
 */
export function makeForceDeleteOption(
  block: Blockly.BlockSvg
): Blockly.ContextMenuRegistry.LegacyContextMenuOption {
  return {
    enabled: true,
    text: Blockly.Msg.FORCE_DELETE,
    callback: function() {
      // dialog.confirm(Blockly.Msg.FORCE_DELETE_INFO, function(ok) {
      //   if (ok) {
      //     const workspace = block.workspace;

      //     workspace.removeProcedure(block);

      //     // Delete the whole stack.
      //     Blockly.Events.setGroup(true);
      //     block.dispose();
      //     Blockly.Events.setGroup(false);

      //     // TODO (#1354) Update this function when '_' is removed
      //     // Refresh toolbox, so caller doesn't appear there anymore
      //     workspace.refreshToolboxSelection();
      //   }
      // });
    }
  };
}
