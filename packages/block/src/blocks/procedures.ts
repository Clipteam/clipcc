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
 * @fileoverview Procedure blocks for Scratch.
 */

import * as Blockly from 'blockly/core';
import * as Constants from '../constants';
import type {ProcedureExtraState, ProcedureCallerExtraState} from '../serialization/procedures';
import {FieldTextInputRemovable} from '../fields/textinput_removable';
import {
  getCallBlocks,
  makeChangeShapeOption,
  makeEditOption,
  makeShowDefinitionOption
} from '../procedures_category';
import {ProcedureModel} from '../procedure_model';
import {ParameterModel} from '../parameter_model';
import type {IShadowTemplate} from '../interfaces/i_shadow_template';
import type {IDynamicDeletable} from '../interfaces/i_dynamic_deletable';
import {FuncChange} from '../events/func_change';

interface ConnectionMap {
  [key: string]: {
    shadow: Blockly.serialization.blocks.State,
    block: Blockly.BlockSvg
  } | null
}

export interface ProcedureBlock extends Blockly.BlockSvg {
  model: ProcedureModel;

  // Shared.
  getProcCode: () => string;
  getProcedureModel: () => ProcedureModel;
  removeAllInputs_: () => void;
  disconnectOldBlocks_: () => ConnectionMap;
  deleteShadows_: (connectionMap: ConnectionMap) => void;
  createAllInputs_: (connectionMap: ConnectionMap) => void;
  updateDisplay_: () => void;

  // Exist on all three blocks, but have different implementations.
  mutationToDom: () => Element,
  domToMutation: (xmlElement: Element) => void,
  populateArgument_: (
    type: string, index: number, connectionMap: ConnectionMap,
    id: string, input: Blockly.Input
  ) => void;
  addProcedureLabel_: (text: string) => void;
  setShape_: (shape: number | null, noConnectionUpdate?: boolean) => void;
  updateShape_: () => void;
}

export interface ProcedureDefinitionBlock extends Blockly.BlockSvg, IDynamicDeletable {
  type: 'procedures_definition';

  getProcCode: () => string;
  getProcedureModel: () => ProcedureModel;
}

export interface ProcedureCallBlock extends ProcedureBlock {
  type: 'procedures_call';
  return_: boolean;
  generateShadows_: boolean;

  saveExtraState: () => ProcedureCallerExtraState,
  loadExtraState: (state: ProcedureCallerExtraState) => void,

  getReturn: () => boolean;
  setReturn: (ret: boolean) => void;
  getTargetWorkspace_: () => Blockly.WorkspaceSvg;
  attachShadow_: (input: Blockly.Input, argumentType: string) => void;
  buildShadowState_: (type: string) => Blockly.serialization.blocks.State;
}

export interface ProcedurePrototypeBlock extends ProcedureBlock {
  type: 'procedures_prototype';

  saveExtraState: () => ProcedureExtraState,
  loadExtraState: (state: ProcedureExtraState) => void,

  createArgumentReporter_: (argumentType: string, displayName: string) => Blockly.BlockSvg;
  updateArgumentReporterNames_: (prevArgIds: string[], prevDisplayNames: string[]) => void;
}

export interface ProcedureDeclarationBlock extends ProcedureBlock {
  type: 'procedures_declaration';

  saveExtraState: () => ProcedureExtraState,
  loadExtraState: (state: ProcedureExtraState) => void,

  removeFieldCallback: (field: Blockly.Field) => void;
  createArgumentEditor_: (argumentType: string, displayName: string) => Blockly.BlockSvg;
  focusLastEditor_: () => void;
  getWarp: () => boolean;
  setWarp: (warp: boolean) => void;
  getReturn: () => boolean;
  setReturn: (ret: boolean) => void;
  getGlobal: () => boolean;
  setGlobal: (global: boolean) => boolean;
  addLabelExternal: () => void;
  addBooleanExternal: () => void;
  addStringNumberExternal: () => void;
  onChangeFn: () => void;
}

export interface ProcedureArgumentEditorBlock extends Blockly.BlockSvg {
  removeFieldCallback: (field: Blockly.Field) => void;
}

export interface ProcedureArgumentReporterBlock extends Blockly.BlockSvg, IShadowTemplate {
  shadowTemplate: boolean;
}

// Helper functions to check type of procedure blocks.

/**
 * Check whether block is procedures_definition.
 * @param block The block object.
 * @returns True if block is procedures_definition.
 */
export function isProcedureDefinitionBlock(block: Blockly.Block): block is ProcedureDefinitionBlock {
  return block.type === Constants.PROCEDURES_DEFINITION_BLOCK_TYPE;
}

/**
 * Check whether block is procedures_call.
 * @param block The block object.
 * @returns True if block is procedures_call.
 */
export function isProcedureCallBlock(block: Blockly.Block): block is ProcedureCallBlock {
  return block.type === Constants.PROCEDURES_CALL_BLOCK_TYPE;
}

/**
 * Check whether block is procedures_prototype.
 * @param block The block object.
 * @returns True if block is procedures_prototype.
 */
export function isProcedurePrototypeBlock(block: Blockly.Block): block is ProcedurePrototypeBlock {
  return block.type === Constants.PROCEDURES_PROTOTYPE_BLOCK_TYPE;
}

/**
 * Check whether block is argument_editor_*.
 * @param block The block object.
 * @returns True if block is argument_editor_*.
 */
export function isProcedureArgumentEditorBlock(block: Blockly.Block): block is ProcedureArgumentEditorBlock {
  return block.type === 'argument_editor_string_number' || block.type === 'argument_editor_boolean';
}

/**
 * Check whether block is argument_reporter_*.
 * @param block The block object.
 * @returns True if block is argument_reporter_*.
 */
export function isProcedureArgumentReporterBlock(block: Blockly.Block): block is ProcedureArgumentReporterBlock {
  return block.type === 'argument_reporter_string_number' || block.type === 'argument_reporter_boolean';
}

// End of helper functions.

// Serialization and deserialization.

/**
 * Create XML to represent the (non-editable) name and arguments of a procedure
 * call block.
 * @returns XML storage element.
 */
function callerMutationToDom(this: ProcedureCallBlock): Element {
  const extraState = this.model.saveExtraState();

  const container = document.createElement('mutation');
  container.setAttribute('proccode', extraState.proccode);
  container.setAttribute('return', JSON.stringify(this.return_)); // return_ might be modified in caller

  // Unused properties.
  container.setAttribute('argumentids', JSON.stringify(extraState.argumentids));
  container.setAttribute('warp', JSON.stringify(extraState.warp));
  container.setAttribute('global', JSON.stringify(extraState.global));

  return container;
}

/**
 * Parse XML to restore the (non-editable) name and arguments of a procedure
 * call block.
 * @param xmlElement XML storage element.
 */
function callerDomToMutation(this: ProcedureCallBlock, xmlElement: Element) {
  this.loadExtraState({
    proccode: xmlElement.getAttribute('proccode')!,
    argumentids: JSON.parse(xmlElement.getAttribute('argumentids')!),
    warp: JSON.parse(xmlElement.getAttribute('warp')!),
    return: JSON.parse(xmlElement.getAttribute('return')!),
    global: JSON.parse(xmlElement.getAttribute('global')!),
    generateshadows: JSON.parse(xmlElement.getAttribute('generateshadows')!)
  });
}

/**
 * Create XML to represent the (non-editable) name and arguments of a
 * procedures_prototype block or a procedures_declaration block.
 * @param generateShadows Whether to include the generateshadows
 *     flag in the generated XML.  False if not provided.
 * @returns XML storage element.
 */
function definitionMutationToDom(
  this: ProcedurePrototypeBlock | ProcedureDeclarationBlock,
  generateShadows?: boolean
): Element {
  const container = document.createElement('mutation');
  const extraState = this.model.saveExtraState();

  if (generateShadows) {
    container.setAttribute('generateshadows', 'true');
  }
  container.setAttribute('proccode', extraState.proccode);
  container.setAttribute('argumentids', JSON.stringify(extraState.argumentids));
  container.setAttribute('argumentnames', JSON.stringify(extraState.argumentnames));
  container.setAttribute('argumentdefaults', JSON.stringify(extraState.argumentdefaults));
  container.setAttribute('warp', JSON.stringify(extraState.warp));
  container.setAttribute('return', JSON.stringify(extraState.return));
  container.setAttribute('global', JSON.stringify(extraState.global));
  return container;
}

/**
 * Parse XML to restore the (non-editable) name and arguments of a
 * procedures_prototype block or a procedures_declaration block.
 * @param xmlElement XML storage element.
 */
function definitionDomToMutation(
  this: ProcedurePrototypeBlock | ProcedureDeclarationBlock,
  xmlElement: Element
) {
  this.loadExtraState({
    proccode: xmlElement.getAttribute('proccode')!,
    warp: JSON.parse(xmlElement.getAttribute('warp')!),
    return: JSON.parse(xmlElement.getAttribute('return')!),
    global: JSON.parse(xmlElement.getAttribute('global')!),
    argumentids: JSON.parse(xmlElement.getAttribute('argumentids')!),
    argumentnames: JSON.parse(xmlElement.getAttribute('argumentnames')!),
    argumentdefaults: JSON.parse(xmlElement.getAttribute('argumentdefaults')!)
  });
}

/**
 * Parse the string into JSON object.
 * @param object The string or an JSON object.
 * @returns The parsed object.
 */
function parseStringOrObject(object: unknown) {
  if (typeof object === 'string') {
    return JSON.parse(object);
  } else {
    return object;
  }
}

/**
 * Create state to represent the (non-editable) name and arguments of a procedure
 * call block.
 * @returns Extra state.
 */
function callerSaveExtraState(
  this: ProcedureCallBlock
): ProcedureCallerExtraState {
  const extraState = this.model.saveExtraState();
  extraState.return = this.return_; // use caller's return property

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {argumentnames, argumentdefaults, ...remains} = extraState; // remove used keys
  return remains;
}

/**
 * Parse state to restore the (non-editable) name and arguments of a procedure
 * call block.
 * @param state Extra state.
 */
function callerLoadExtraState(
  this: ProcedureCallBlock,
  state: ProcedureCallerExtraState
) {
  const procedureMap = this.getTargetWorkspace_().getProcedureMap();
  if (procedureMap.has(state.proccode)) {
    this.model = procedureMap.get(state.proccode) as ProcedureModel;
  } else {
    console.warn(`A procedure caller is loaded without any definition ${state.proccode}`);

    // Create a temporary model.
    this.model = ProcedureModel.loadExtraState(this.workspace, {
      argumentnames: [],
      argumentdefaults: [],
      ...state
    });
  }

  this.generateShadows_ = true;
  // Don't update shape if caller still has connections
  if (
    !(this.previousConnection && this.previousConnection.isConnected()) &&
    !(this.outputConnection && this.outputConnection.isConnected()) &&
    !(this.nextConnection && this.nextConnection.isConnected())
  ) {
    this.return_ = parseStringOrObject(state.return);
  }

  this.updateDisplay_();
}

/**
 * Create state to represent the (non-editable) name and arguments of a
 * procedures_prototype block or a procedures_declaration block.
 * @param generateShadows Whether to include the generateshadows
 *     flag in the generated state. False if not provided.
 * @returns Extra state.
 */
function definitionSaveExtraState(
  this: ProcedurePrototypeBlock | ProcedureDeclarationBlock,
  generateShadows?: boolean
): ProcedureExtraState {
  const extraState = this.model.saveExtraState();
  if (generateShadows) {
    extraState.generateshadows = true;
  }
  return extraState;
}

/**
 * Parse state to restore the (non-editable) name and arguments of a
 * procedures_prototype block or a procedures_declaration block.
 * @param state Extra state.
 */
function definitionLoadExtraState(
  this: ProcedurePrototypeBlock | ProcedureDeclarationBlock,
  state: ProcedureExtraState
) {
  if (!this.model) {
    const procedureMap = this.workspace.getProcedureMap();
    if (procedureMap.has(state.proccode)) {
      this.model = procedureMap.get(state.proccode) as ProcedureModel;
    } else {
      console.warn(`A procedure is loaded without any definition ${state.proccode}`);

      // Create a temporary model.
      this.model = ProcedureModel.loadExtraState(this.workspace, state);
    }
  }

  const extraState = this.model.saveExtraState();
  state.argumentids = parseStringOrObject(state.argumentids);
  state.argumentnames = parseStringOrObject(state.argumentnames);
  state.argumentdefaults = parseStringOrObject(state.argumentdefaults);

  this.model.loadExtraState(state);
  this.updateDisplay_();
  if ('updateArgumentReporterNames_' in this) {
    this.updateArgumentReporterNames_(
      extraState.argumentids,
      extraState.argumentnames!
    );
  }
}

// End of serialization and deserialization.

// Shared by all three procedure blocks (procedures_declaration,
// procedures_call, and procedures_prototype).

/**
 * Returns the name of the procedure this block calls, or the empty string if
 * it has not yet been set.
 * @returns Procedure name.
 */
function getProcCode(this: ProcedureBlock): string {
  return this.model.getProcCode();
}

/**
 * Returns the procedure model associated with this block.
 * @returns Procedure model.
 */
function getProcedureModel(this: ProcedureBlock): ProcedureModel {
  return this.model;
}

/**
 * Update the block's structure and appearance to match the internally stored
 * mutation.
 */
function updateDisplay(this: ProcedureBlock) {
  const connectionMap = this.disconnectOldBlocks_();
  this.removeAllInputs_();
  this.updateShape_();
  this.createAllInputs_(connectionMap);
  this.deleteShadows_(connectionMap);
}

/**
 * Disconnect old blocks from all value inputs on this block, but hold onto them
 * in case they can be reattached later.  Also save the shadow state if it exists.
 * The result is a map from argument ID to information that was associated with
 * that argument at the beginning of the mutation.
 * @returns An object mapping argument IDs to blocks and shadow states.
 */
function disconnectOldBlocks(this: ProcedureBlock): ConnectionMap {
  // Remove old stuff
  const connectionMap: ConnectionMap = {};
  for (const input of this.inputList) {
    if (input.connection) {
      const target = input.connection.targetBlock() as Blockly.BlockSvg;
      const saveInfo = {
        shadow: input.connection.getShadowState(true)!,
        block: target
      };
      connectionMap[input.name] = saveInfo;

      if (target) {
        input.connection.disconnect();
      }
    }
  }
  return connectionMap;
}

/**
 * Remove all inputs on the block, including dummy inputs.
 * Assumes no input has shadow state set.
 */
function removeAllInputs(this: ProcedureBlock) {
  // Delete inputs directly instead of with block.removeInput to avoid splicing
  // out of the input list at every index.
  for (const input of this.inputList) {
    input.dispose();
  }
  this.inputList = [];
}

/**
 * Create all inputs specified by the new procCode, and populate them with
 * shadow blocks or reconnected old blocks as appropriate.
 * @param connectionMap An object mapping argument IDs to blocks and shadow DOMs.
 */
function createAllInputs(this: ProcedureBlock, connectionMap: ConnectionMap) {
  // Split the proc into components, by %n, %b, and %s (ignoring escaped).
  let procComponents = this.model.getProcCode().split(/(?=[^\\]%[nbs])/);
  procComponents = procComponents.map(function(c) {
    return c.trim(); // Strip whitespace.
  });
  // Create arguments and labels as appropriate.
  let argumentCount = 0;
  for (const component of procComponents) {
    // The first component should always be created even if the value is ''.
    if (component.substring(0, 1) === '%') {
      const argumentType = component.substring(1, 2);
      if (!(argumentType === 'n' || argumentType === 'b' || argumentType === 's')) {
        throw new Error('Found an custom procedure with an invalid type: ' + argumentType);
      }

      const id = this.model.getParameter(argumentCount).getId();

      const input = this.appendValueInput(id);
      if (argumentType === 'b') {
        input.setCheck('Boolean');
      }
      this.populateArgument_(argumentType, argumentCount, connectionMap, id, input);
      argumentCount++;

      const labelText = component.substring(2).trim();
      if (labelText) {
        this.addProcedureLabel_(labelText.replace(/\\%/g, '%'));
      }
    } else {
      this.addProcedureLabel_(component.trim().replace(/\\%/g, '%'));
    }
  }
}

/**
 * Delete all shadow blocks in the given map.
 * @param connectionMap An object mapping argument IDs to the blocks that
 *     were connected to those IDs at the beginning of the mutation.
 */
function deleteShadows(this: ProcedureBlock, connectionMap: ConnectionMap) {
  // Get rid of all of the old shadow blocks if they aren't connected.
  if (connectionMap) {
    for (const id in connectionMap) {
      if (!Object.prototype.hasOwnProperty.call(connectionMap, id)) {
        continue;
      }
      const saveInfo = connectionMap[id];
      if (saveInfo) {
        const block = saveInfo['block'];
        if (block && block.isShadow()) {
          block.dispose(true);
          connectionMap[id] = null;
          // At this point we know which shadow DOMs are about to be orphaned in
          // the VM.  What do we do with that information?
        }
      }
    }
  }
}

// End of shared code.

/**
 * Add a label field with the given text to a procedures_call or
 * procedures_prototype block.
 * @param text The label text.
 */
function addLabelField(this: ProcedureCallBlock | ProcedurePrototypeBlock, text: string) {
  this.appendDummyInput().appendField(text);
}

/**
 * Add a label editor with the given text to a procedures_declaration
 * block.  Editing the text in the label editor updates the text of the
 * corresponding label fields on function calls.
 * @param text The label text.
 */
function addLabelEditor(this: ProcedureDeclarationBlock, text: string) {
  this.appendDummyInput(Blockly.utils.idGenerator.genUid())
    .appendField(new FieldTextInputRemovable(text));
}

/**
 * Build a state representing a shadow block of the given type.
 * @param type One of 's' (string) or 'n' (number).
 * @returns The state representing the new shadow block.
 */
function buildShadowState(type: string): Blockly.serialization.blocks.State {
  if (type === 'n') {
    return {
      type: 'math_number',
      fields: {NUM: 1}
    };
  } else {
    return {
      type: 'text',
      fields: {TEXT: ''}
    };
  }
}

/**
 * Create a new shadow block and attach it to the given input.
 * @param input The value input to attach a block to.
 * @param argumentType One of 'b' (boolean), 's' (string) or 'n' (number).
 */
function attachShadow(
  this: ProcedureCallBlock,
  input: Blockly.Input,
  argumentType: string
) {
  if (argumentType === 'n' || argumentType === 's') {
    const blockType = argumentType === 'n' ? 'math_number' : 'text';
    Blockly.Events.disable();
    let newBlock;
    try {
      newBlock = this.workspace.newBlock(blockType) as Blockly.BlockSvg;
      if (argumentType === 'n') {
        newBlock.setFieldValue('1', 'NUM');
      } else {
        newBlock.setFieldValue('', 'TEXT');
      }
      newBlock.setShadow(true);
      if (!this.isInsertionMarker()) {
        newBlock.initSvg();
      }
    } finally {
      Blockly.Events.enable();
    }
    if (Blockly.Events.isEnabled()) {
      Blockly.Events.fire(new (Blockly.Events.get(Blockly.Events.BLOCK_CREATE))(newBlock));
    }
    newBlock.outputConnection!.connect(input.connection!);
  }
}

/**
 * Create a new argument reporter block.
 * @param argumentType One of 'b' (boolean), 's' (string) or 'n' (number).
 * @param displayName The name of the argument as provided by the
 *     user, which becomes the text of the label on the argument reporter block.
 * @returns The newly created argument reporter block.
 */
function createArgumentReporter(
  this: ProcedurePrototypeBlock,
  argumentType: string,
  displayName: string
): Blockly.BlockSvg {
  const blockType = (argumentType === 'n' || argumentType === 's') ?
    'argument_reporter_string_number' : 'argument_reporter_boolean';
  Blockly.Events.disable();
  let newBlock;
  try {
    newBlock = this.workspace.newBlock(blockType) as Blockly.BlockSvg;
    newBlock.setShadow(true);
    newBlock.setFieldValue(displayName, 'VALUE');
    if (!this.isInsertionMarker()) {
      newBlock.initSvg();
    }
  } finally {
    Blockly.Events.enable();
  }
  if (Blockly.Events.isEnabled()) {
    Blockly.Events.fire(new (Blockly.Events.get(Blockly.Events.BLOCK_CREATE))(newBlock));
  }
  return newBlock;
}

/**
 * Populate the argument by attaching the correct child block or shadow to the
 * given input.
 * @param type One of 'b' (boolean), 's' (string) or 'n' (number).
 * @param index The index of this argument into the argument id array.
 * @param connectionMap An object mapping argument IDs to blocks and shadow DOMs.
 * @param id The ID of the input to populate.
 * @param input The newly created input to populate.
 */
function populateArgumentOnCaller(
  this: ProcedureCallBlock,
  type: string,
  index: number,
  connectionMap: ConnectionMap,
  id: string,
  input: Blockly.Input
) {
  let oldBlock = null;
  let oldShadow = null;
  if (connectionMap && (id in connectionMap)) {
    const saveInfo = connectionMap[id]!;
    oldBlock = saveInfo['block'];
    oldShadow = saveInfo['shadow'];
  }

  if (connectionMap && oldBlock) {
    // Reattach the old block and shadow DOM.
    connectionMap[input.name] = null;
    if (type !== 'b' && this.generateShadows_ && !oldBlock.isShadow()) {
      const shadowState = oldShadow || this.buildShadowState_(type);
      input.connection!.setShadowState(shadowState);
    }
    oldBlock.outputConnection!.connect(input.connection!);
  } else if (this.generateShadows_) {
    this.attachShadow_(input, type);
  }
}

/**
 * Populate the argument by attaching the correct argument reporter to the given
 * input.
 * @param type One of 'b' (boolean), 's' (string) or 'n' (number).
 * @param index The index of this argument into the argument ID and
 *     argument display name arrays.
 * @param connectionMap An object mapping argument IDs to blocks and shadow DOMs.
 * @param id The ID of the input to populate.
 * @param input The newly created input to populate.
 */
function populateArgumentOnPrototype(
  this: ProcedurePrototypeBlock,
  type: string,
  index: number,
  connectionMap: ConnectionMap,
  id: string,
  input: Blockly.Input
) {
  let oldBlock = null;
  if (connectionMap && (id in connectionMap)) {
    const saveInfo = connectionMap[id]!;
    oldBlock = saveInfo['block'];
  }

  const oldTypeMatches = checkOldTypeMatches(oldBlock, type);
  const displayName = this.model.getParameter(index).getName();

  // Decide which block to attach.
  let argumentReporter;
  if (connectionMap && oldBlock && oldTypeMatches) {
    // Update the text if needed. The old argument reporter is the same type,
    // and on the same input, but the argument's display name may have changed.
    argumentReporter = oldBlock;
    argumentReporter.setFieldValue(displayName, 'VALUE');
    connectionMap[input.name] = null;
  } else {
    argumentReporter = this.createArgumentReporter_(type, displayName);
  }

  // Attach the block.
  input.connection!.connect(argumentReporter.outputConnection!);
}

/**
 * Populate the argument by attaching the correct argument editor to the given
 * input.
 * @param type One of 'b' (boolean), 's' (string) or 'n' (number).
 * @param index The index of this argument into the argument id and
 *     argument display name arrays.
 * @param connectionMap An object mapping argument IDs to blocks and shadow DOMs.
 * @param id The ID of the input to populate.
 * @param input The newly created input to populate.
 */
function populateArgumentOnDeclaration(
  this: ProcedureDeclarationBlock,
  type: string,
  index: number,
  connectionMap: ConnectionMap,
  id: string,
  input: Blockly.Input
) {
  let oldBlock = null;
  if (connectionMap && (id in connectionMap)) {
    const saveInfo = connectionMap[id]!;
    oldBlock = saveInfo['block'];
  }

  // TODO: This always returns false, because it checks for argument reporter
  // blocks instead of argument editor blocks.  Create a new version for argument
  // editors.
  const oldTypeMatches = checkOldTypeMatches(oldBlock, type);
  const displayName = this.model.getParameter(index).getName();

  // Decide which block to attach.
  let argumentEditor;
  if (oldBlock && oldTypeMatches) {
    argumentEditor = oldBlock;
    oldBlock.setFieldValue(displayName, 'TEXT');
    connectionMap[input.name] = null;
  } else {
    argumentEditor = this.createArgumentEditor_(type, displayName);
  }

  // Attach the block.
  input.connection!.connect(argumentEditor.outputConnection!);
}

/**
 * Check whether the type of the old block corresponds to the given argument
 * type.
 * @param oldBlock The old block to check.
 * @param type The argument type.  One of 'n', 'n', or 's'.
 * @returns True if the type matches, false otherwise.
 */
function checkOldTypeMatches(oldBlock: Blockly.BlockSvg | null, type: string) {
  if (!oldBlock) {
    return false;
  }
  if ((type === 'n' || type === 's') &&
      oldBlock.type === 'argument_reporter_string_number') {
    return true;
  }
  if (type === 'b' && oldBlock.type === 'argument_reporter_boolean') {
    return true;
  }
  return false;
}

/**
 * Create an argument editor.
 * An argument editor is a shadow block with a single text field, which is used
 * to set the display name of the argument.
 * @param argumentType One of 'b' (boolean), 's' (string) or
 *     'n' (number).
 * @param displayName The display name  of this argument, which is the
 *     text of the field on the shadow block.
 * @returns The newly created argument editor block.
 */
function createArgumentEditor(
  this: ProcedureDeclarationBlock,
  argumentType: string,
  displayName: string
): Blockly.BlockSvg {
  Blockly.Events.disable();
  let newBlock;
  try {
    if (argumentType === 'n' || argumentType === 's') {
      newBlock = this.workspace.newBlock('argument_editor_string_number') as Blockly.BlockSvg;
    } else {
      newBlock = this.workspace.newBlock('argument_editor_boolean') as Blockly.BlockSvg;
    }
    newBlock.setFieldValue(displayName, 'TEXT');
    newBlock.setShadow(true);
    if (!this.isInsertionMarker()) {
      newBlock.initSvg();
      newBlock.render(); // Render immediately for rendering TextInput field correctly.
    }
  } finally {
    Blockly.Events.enable();
  }
  if (Blockly.Events.isEnabled()) {
    Blockly.Events.fire(new (Blockly.Events.get(Blockly.Events.BLOCK_CREATE))(newBlock));
  }
  return newBlock;
}

/**
 * Update the serializable information on the block based on the existing inputs
 * and their text.
 */
function updateDeclarationProcCode(this: ProcedureDeclarationBlock) {
  const procCodeParts = [];
  const params = this.model.getParameters();
  let currentParamIndex = 0;
  for (const input of this.inputList) {
    if (input.type === Constants.DUMMY_INPUT) {
      procCodeParts.push((input.fieldRow[0] as Blockly.FieldLabel).getValue()?.replace(/%/g, '\\%'));
    } else if (input.type === Constants.INPUT_VALUE) {
      // Inspect the argument editor.
      const target = input.connection!.targetBlock()!;
      params[currentParamIndex].setName(target.getFieldValue('TEXT'));
      currentParamIndex += 1;
      if (target.type === 'argument_editor_boolean') {
        procCodeParts.push('%b');
      } else {
        procCodeParts.push('%s');
      }
    } else {
      throw new Error('Unexpected input type on a procedure mutator root: ' + input.type);
    }
  }
  this.model.setProcCode(procCodeParts.join(' '));
}

/**
 * Focus on the last argument editor or label editor on the block.
 */
function focusLastEditor(this: ProcedureDeclarationBlock) {
  if (this.inputList.length > 0) {
    const newInput = this.inputList[this.inputList.length - 1];
    if (newInput.type === Constants.DUMMY_INPUT) {
      newInput.fieldRow[0].showEditor();
    } else if (newInput.type === Constants.INPUT_VALUE) {
      // Inspect the argument editor.
      const target = newInput.connection!.targetBlock()!;
      target.getField('TEXT')!.showEditor();
    }
  }
}

/**
 * Externally-visible function to add a label to the procedure declaration.
 */
function addLabelExternal(this: ProcedureDeclarationBlock) {
  Blockly.WidgetDiv.hide();
  this.model.setProcCode(this.model.getProcCode() + ' label text');
  this.updateDisplay_();
  this.focusLastEditor_();
}

/**
 * Externally-visible function to add a boolean argument to the procedure
 * declaration.
 */
function addBooleanExternal(this: ProcedureDeclarationBlock) {
  Blockly.WidgetDiv.hide();
  this.model.setProcCode(this.model.getProcCode() + ' %b');
  this.model.appendParameter(new ParameterModel(
    this.workspace,
    'boolean',
    Blockly.utils.idGenerator.genUid(),
    'false'
  ));
  this.updateDisplay_();
  this.focusLastEditor_();
}

/**
 * Externally-visible function to add a string/number argument to the procedure
 * declaration.
 */
function addStringNumberExternal(this: ProcedureDeclarationBlock) {
  Blockly.WidgetDiv.hide();
  this.model.setProcCode(this.model.getProcCode() + ' %s');
  this.model.appendParameter(new ParameterModel(
    this.workspace,
    'number or text',
    Blockly.utils.idGenerator.genUid(),
    ''
  ));
  this.updateDisplay_();
  this.focusLastEditor_();
}

/**
 * Externally-visible function to get the warp on procedure declaration.
 * @returns The value of the warp_ property.
 */
function getWarp(this: ProcedureDeclarationBlock): boolean {
  return this.model.isWarp();
}

/**
 * Externally-visible function to set the warp on procedure declaration.
 * @param warp The value of the warp_ property.
 */
function setWarp(this: ProcedureDeclarationBlock, warp: boolean) {
  this.model.setWarp(warp);
}

/**
 * Externally-visible function to get the return on procedure declaration.
 * @returns The value of the return_ property.
 */
function getReturn(this: ProcedureDeclarationBlock): boolean {
  return this.model.isReporter();
}

/**
 * Externally-visible function to set the return on procedure declaration.
 * @param ret The value of the return_ property.
 */
function setReturn(this: ProcedureDeclarationBlock, ret: boolean) {
  this.model.setReturnTypes(ret ? [] : null);
  this.updateShape_();
}

/**
 * Externally-visible function to get the global on procedure declaration.
 * @returns The value of the global_ property.
 */
function getGlobal(this: ProcedureDeclarationBlock): boolean {
  return this.model.isGlobal();
}

/**
 * Externally-visible function to set the global on procedure declaration.
 * @param global The value of global_ property.
 */
function setGlobal(this: ProcedureDeclarationBlock, global: boolean) {
  this.model.setGlobal(global);
}

/**
 * Callback to remove a field, only for the declaration block.
 * @param field The field being removed.
 */
function removeFieldCallback(this: ProcedureDeclarationBlock, field: Blockly.Field) {
  // Do not delete if there is only one input
  if (this.inputList.length === 1) {
    return;
  }
  let inputNameToRemove = null;
  let parameterIndex = 0;
  for (let n = 0; n < this.inputList.length; n++) {
    const input = this.inputList[n];
    if (input.connection) {
      const target = input.connection.targetBlock()!;
      if (field.name && target.getField(field.name) === field) {
        inputNameToRemove = input.name;
        continue;
      }
    } else {
      for (let j = 0; j < input.fieldRow.length; j++) {
        if (input.fieldRow[j] === field) {
          inputNameToRemove = input.name;
          continue;
        }
      }
    }
    if (input.type !== Blockly.inputs.inputTypes.DUMMY) {
      ++parameterIndex;
    }
  }
  if (inputNameToRemove) {
    Blockly.WidgetDiv.hide();
    this.removeInput(inputNameToRemove);
    this.model.deleteParameter(parameterIndex);
    this.onChangeFn();
    this.updateDisplay_();
  }
}

/**
 * Callback to pass removeField up to the declaration block from arguments.
 * @param field The field being removed.
 */
function removeArgumentCallback(
  this: ProcedureDeclarationBlock | ProcedureArgumentEditorBlock,
  field: Blockly.Field
) {
  const parentBlock = this.getParent();
  if (parentBlock && parentBlock.removeFieldCallback) {
    parentBlock.removeFieldCallback(field);
  }
}

/**
 * Update argument reporter field values after an edit to the prototype mutation
 * using previous argument ids and names.
 * Because the argument reporters only store names and not which argument ids they
 * are linked to, it would not be safe to update all argument reporters on the workspace
 * since they may be argument reporters with the same name from a different procedure.
 * Until there is a more explicit way of identifying argument reporter blocks using ids,
 * be conservative and only update argument reporters that are used in the
 * stack below the prototype, ie the definition.
 * @param prevArgIds The previous ordering of argument ids.
 * @param prevDisplayNames The previous argument names.
 */
function updateArgumentReporterNames(
  this: ProcedurePrototypeBlock,
  prevArgIds: string[],
  prevDisplayNames: string[]
) {
  const nameChanges = [];
  const argReporters = [];
  const definitionBlock = this.getParent();
  if (!definitionBlock) return;

  // Create a list of argument reporters that are descendants of the definition stack (see above comment)
  const allBlocks = definitionBlock.getDescendants(false) as Blockly.BlockSvg[];
  for (const block of allBlocks) {
    if (isProcedureArgumentReporterBlock(block) && !block.isShadow()) {
      // Exclude arg reporters in the prototype block, which are shadows.
      argReporters.push(block);
    }
  }

  // Create a list of "name changes", including the new name and blocks matching the old name
  // Only search over the current set of argument ids, ignore args that have been removed
  for (const param of this.model.getParameters()) {
    // Find the previous index of this argument id. Could be -1 if it is newly added.
    const prevIndex = prevArgIds.indexOf(param.getId());
    if (prevIndex === -1) continue; // Newly added argument, no corresponding previous argument to update.
    const prevName = prevDisplayNames[prevIndex];
    if (prevName !== param.getName()) {
      nameChanges.push({
        newName: param.getName(),
        blocks: argReporters.filter(function(block) {
          return block.getFieldValue('VALUE') === prevName;
        })
      });
    }
  }

  // Finally update the blocks for each name change.
  // Do this after creating the lists to avoid cycles of renaming.
  for (const nameChange of nameChanges) {
    for (const block of nameChange.blocks) {
      block.setFieldValue(nameChange.newName, 'VALUE');
    }
  }
}

/**
 * Set the block's shape.
 * @param shape The new shape.
 * @param noConnectionUpdate True to not update the connection, used for
 *    prototype block.
 */
function setProcedureShape(
  this: ProcedureCallBlock | ProcedureDeclarationBlock | ProcedurePrototypeBlock,
  shape: number | null,
  noConnectionUpdate?: boolean
) {
  switch (shape) {
    case Constants.OUTPUT_SHAPE_NORMAL:
      this.setOutputShape(Constants.OUTPUT_SHAPE_NORMAL);
      if (!noConnectionUpdate) {
        this.setOutput(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
      }
      break;
    case Constants.OUTPUT_SHAPE_ROUND:
      this.setOutputShape(Constants.OUTPUT_SHAPE_ROUND);
      if (!noConnectionUpdate) {
        this.setPreviousStatement(false);
        this.setNextStatement(false);
        this.setOutput(true);
      }
      break;
    default:
      console.error(`Unknown shape ${shape}`);
  }
}

/**
 * Get the main workspace associated with current workspace.
 * @returns The workspace.
 */
function getCallerTargetWorkspace(this: ProcedureCallBlock) {
  return this.workspace.isFlyout ? this.workspace.targetWorkspace : this.workspace;
}

/**
 * Block for defining a procedure.
 */
Blockly.Blocks['procedures_definition'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.PROCEDURES_DEFINITION,
      args0: [{
        type: 'input_statement',
        name: 'custom_block'
      }],
      extensions: ['colours_more', 'shape_hat', 'procedure_def_contextmenu']
    });
    this.hat = Constants.SHAPE_BOWLER_HAT;
    this.isCopyable = () => false;
  },
  setStyle: function(blockStyleName: string) {
    // equivalent to super.setStyle()
    const proto: Blockly.Block = Object.getPrototypeOf(this);
    proto.setStyle.call(this, blockStyleName);
    this.hat = Constants.SHAPE_BOWLER_HAT;
  },
  /**
   * The method called during disposal.
   */
  destroy: function() {
    if (this.isInsertionMarker()) {
      return;
    }
    // Remove the procedure model from map.
    this.workspace.getProcedureMap().delete(this.getProcCode());
  },
  /**
   * Delete a block and hide chaff when doing so. This is called from the
   * context menu and keyboard shortcuts as the full delete action.
   */
  checkAndDelete: function() {
    if (this.workspace.isFlyout || !this.checkDeletable(false)) {
      return;
    }

    Blockly.Events.setGroup(true);
    this.workspace.hideChaff();
    if (this.outputConnection) {
      // Do not attempt to heal rows
      // (https://github.com/google/blockly/issues/4832)
      this.dispose(false, true);
    } else {
      this.dispose(true, true);
    }
    Blockly.Events.setGroup(false);
  },
  /**
   * Check whether the block is deletable currently.
   * @param quiet True to not alert.
   * @returns True if the block is deletable.
   */
  checkDeletable: function(quiet: boolean) {
    const callers = getCallBlocks(this.getProcCode(), this.workspace, this);
    if (!quiet && callers.length > 0) {
      Blockly.dialog.alert(Blockly.Msg.PROCEDURE_USED);
      return false;
    }
    return true;
  },
  /**
   * Get procCode of the procedure.
   * @returns The procCode of current procedure.
   */
  getProcCode: function() {
    return this.getProcedureModel().getProcCode();
  },
  /**
   * Get procedure model of current block.
   * @returns The procedure model.
   */
  getProcedureModel: function() {
    const input = this.getInput('custom_block');
    const targetBlock = input?.connection?.targetBlock();
    if (targetBlock) {
      return (targetBlock as ProcedurePrototypeBlock).getProcedureModel();
    }
    return null;
  }
} as ProcedureDefinitionBlock;

/**
 * Block for calling a procedure.
 */
Blockly.Blocks['procedures_call'] = {
  init: function() {
    this.jsonInit({
      extensions: ['colours_more', 'shape_statement', 'procedure_call_contextmenu']
    });
    this.return_ = false;
  },
  // Shared
  getProcCode: getProcCode,
  getProcedureModel: getProcedureModel,
  removeAllInputs_: removeAllInputs,
  disconnectOldBlocks_: disconnectOldBlocks,
  deleteShadows_: deleteShadows,
  createAllInputs_: createAllInputs,
  updateDisplay_: updateDisplay,

  // Exist on all three blocks, but have different implementations.
  mutationToDom: callerMutationToDom,
  domToMutation: callerDomToMutation,
  saveExtraState: callerSaveExtraState,
  loadExtraState: callerLoadExtraState,
  populateArgument_: populateArgumentOnCaller,
  addProcedureLabel_: addLabelField,
  setShape_: setProcedureShape,
  updateShape_() {
    const prevIsReturn = this.getOutputShape() !== Constants.OUTPUT_SHAPE_NORMAL;
    const isReturn = this.return_;
    if (prevIsReturn !== isReturn) {
      this.setShape_(isReturn ? Constants.OUTPUT_SHAPE_ROUND : Constants.OUTPUT_SHAPE_NORMAL);
    }
  },

  // Only exists on the external caller.
  getTargetWorkspace_: getCallerTargetWorkspace,
  attachShadow_: attachShadow,
  buildShadowState_: buildShadowState,
  setReturn(ret: boolean) {
    this.return_ = ret;
    this.updateShape_();
  },
  getReturn() {
    return this.return_;
  }
} as ProcedureCallBlock;

/**
 * Block for calling a procedure, for rendering inside
 * define block.
 */
Blockly.Blocks['procedures_prototype'] = {
  init: function() {
    this.jsonInit({
      extensions: ['colours_more', 'shape_statement']
    });
  },
  // Shared.
  getProcCode: getProcCode,
  getProcedureModel: getProcedureModel,
  removeAllInputs_: removeAllInputs,
  disconnectOldBlocks_: disconnectOldBlocks,
  deleteShadows_: deleteShadows,
  createAllInputs_: createAllInputs,
  updateDisplay_: updateDisplay,

  // Exist on all three blocks, but have different implementations.
  mutationToDom: definitionMutationToDom,
  domToMutation: definitionDomToMutation,
  saveExtraState: definitionSaveExtraState,
  loadExtraState: definitionLoadExtraState,
  populateArgument_: populateArgumentOnPrototype,
  addProcedureLabel_: addLabelField,
  setShape_: setProcedureShape,
  updateShape_() {
    const prevIsReturn = this.getOutputShape() !== Constants.OUTPUT_SHAPE_NORMAL;
    const isReturn = this.model.isReporter();
    if (prevIsReturn !== isReturn) {
      this.setShape_(isReturn ? Constants.OUTPUT_SHAPE_ROUND : Constants.OUTPUT_SHAPE_NORMAL, true);
    }
  },

  // Only exists on procedures_prototype.
  createArgumentReporter_: createArgumentReporter,
  updateArgumentReporterNames_: updateArgumentReporterNames
} as ProcedurePrototypeBlock;

/**
 * The root block in the procedure declaration editor.
 */
Blockly.Blocks['procedures_declaration'] = {
  init: function() {
    this.jsonInit({
      extensions: ['colours_more', 'shape_statement']
    });
    // Create a procedure model.
    this.model = new ProcedureModel(this.workspace, '');
  },
  // Shared.
  getProcCode: getProcCode,
  getProcedureModel: getProcedureModel,
  removeAllInputs_: removeAllInputs,
  disconnectOldBlocks_: disconnectOldBlocks,
  deleteShadows_: deleteShadows,
  createAllInputs_: createAllInputs,
  updateDisplay_: updateDisplay,

  // Exist on all three blocks, but have different implementations.
  mutationToDom: definitionMutationToDom,
  domToMutation: definitionDomToMutation,
  saveExtraState: definitionSaveExtraState,
  loadExtraState: definitionLoadExtraState,
  populateArgument_: populateArgumentOnDeclaration,
  addProcedureLabel_: addLabelEditor,
  setShape_: setProcedureShape,
  updateShape_() {
    const prevIsReturn = this.getOutputShape() !== Constants.OUTPUT_SHAPE_NORMAL;
    const isReturn = this.model.isReporter();
    if (prevIsReturn !== isReturn) {
      this.setShape_(isReturn ? Constants.OUTPUT_SHAPE_ROUND : Constants.OUTPUT_SHAPE_NORMAL);
    }
  },

  // Exist on declaration and arguments editors, with different implementations.
  removeFieldCallback: removeFieldCallback,

  // Only exist on procedures_declaration.
  createArgumentEditor_: createArgumentEditor,
  focusLastEditor_: focusLastEditor,
  getWarp: getWarp,
  setWarp: setWarp,
  getReturn: getReturn,
  setReturn: setReturn,
  getGlobal: getGlobal,
  setGlobal: setGlobal,
  addLabelExternal: addLabelExternal,
  addBooleanExternal: addBooleanExternal,
  addStringNumberExternal: addStringNumberExternal,
  onChangeFn: updateDeclarationProcCode,
  isSimpleReporter() {
    // Fix wrong label shape when there's only one label.
    return false;
  }
} as ProcedureDeclarationBlock;

/**
 * Block for defining a procedure.
 */
Blockly.Blocks['procedures_return'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.PROCEDURES_RETURN,
      args0: [{
        type: 'input_value',
        name: 'VALUE'
      }],
      extensions: ['colours_more', 'shape_end']
    });
  },
  /**
   * Procedure return cannot exist without the corresponding procedure definition.
   * @param event Change event.
   */
  onchange: function(this: Blockly.BlockSvg, event: Blockly.Events.Abstract) {
    // Don't change state if:
    //   * It's at the start of a drag.
    //   * It's not a BlockMove nor a FuncChange.
    if (
      !this.workspace.isDragging || this.workspace.isDragging() ||
      (event.type !== Blockly.Events.BLOCK_MOVE && event.type !== FuncChange.TYPE)
    ) {
      return;
    }
    if (!this.isInFlyout) {
      // There is no need to record the enable/disable change on the undo/redo
      // list since the change will be automatically recreated when replayed.
      Blockly.Events.setRecordUndo(false);
      const root = this.getRootBlock();
      const shouldDisable = !isProcedureDefinitionBlock(root) || !root.getProcedureModel().isReporter();
      this.setDisabledReason(shouldDisable, 'Return block should be placed in a function definition.');
      Blockly.Events.setRecordUndo(true);
    }
  }
};

/**
 * Block for calling and discarding the return value of a procedure.
 */
Blockly.Blocks['procedures_discard'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'input_value',
        name: 'VALUE'
      }],
      extensions: ['colours_more', 'shape_statement']
    });
  }
};

Blockly.Blocks['argument_reporter_boolean'] = {
  init: function() {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_label_serializable',
        name: 'VALUE',
        text: ''
      }],
      extensions: ['colours_argument', 'output_boolean']
    });
    this.shadowTemplate = true;
  }
} as ProcedureArgumentReporterBlock;

Blockly.Blocks['argument_reporter_string_number'] = {
  init: function() {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_label_serializable',
        name: 'VALUE',
        text: ''
      }],
      extensions: ['colours_argument', 'output_number', 'output_string']
    });
    this.shadowTemplate = true;
  }
} as ProcedureArgumentReporterBlock;

Blockly.Blocks['argument_editor_boolean'] = {
  init: function() {
    this.jsonInit({message0: ' %1',
      args0: [{
        type: 'field_input_removable',
        name: 'TEXT',
        text: 'foo'
      }],
      extensions: ['colours_textfield', 'output_boolean']
    });
  },
  // Exist on declaration and arguments editors, with different implementations.
  removeFieldCallback: removeArgumentCallback
} as ProcedureArgumentEditorBlock;

Blockly.Blocks['argument_editor_string_number'] = {
  init: function() {
    this.jsonInit({
      message0: '%1',
      args0: [{
        type: 'field_input_removable',
        name: 'TEXT',
        text: 'foo'
      }],
      extensions: ['colours_textfield', 'output_number', 'output_string']
    });
  },
  // Exist on declaration and arguments editors, with different implementations.
  removeFieldCallback: removeArgumentCallback
} as ProcedureArgumentEditorBlock;

/**
 * Mixin to add a context menu for a procedure definition block.
 * It adds the "edit" option and removes the "duplicate" option.
 */
const PROCEDURE_DEF_CONTEXTMENU = {
  /**
   * Add the "edit" option and removes the "duplicate" option from the context
   * menu.
   * @param menuOptions List of menu options to edit.
   */
  customContextMenu: function(this: ProcedureDefinitionBlock, menuOptions: Array<
    | Blockly.ContextMenuRegistry.ContextMenuOption
    | Blockly.ContextMenuRegistry.LegacyContextMenuOption
  >) {
    // Add the edit option at the end.
    menuOptions.push(makeEditOption(this));

    // Find and remove the duplicate option
    for (let i = 0, option; option = menuOptions[i]; i++) {
      if (option.text === Blockly.Msg.DUPLICATE_BLOCK) {
        menuOptions.splice(i, 1);
        break;
      }
    }
  }
};

Blockly.Extensions.registerMixin('procedure_def_contextmenu', PROCEDURE_DEF_CONTEXTMENU);

/**
 * Mixin to add a context menu for a procedure call block.
 * It adds the "edit" option and the "define" option.
 */
const PROCEDURE_CALL_CONTEXTMENU = {
  /**
   * Add the "edit" option to the context menu.
   * @param menuOptions List of menu options to edit.
   */
  customContextMenu: function(this: ProcedureCallBlock, menuOptions: Array<
    | Blockly.ContextMenuRegistry.ContextMenuOption
    | Blockly.ContextMenuRegistry.LegacyContextMenuOption
  >) {
    if (!(this.previousConnection && this.previousConnection.isConnected()) &&
    !(this.outputConnection && this.outputConnection.isConnected()) &&
    !(this.nextConnection && this.nextConnection.isConnected())) {
      menuOptions.push(makeChangeShapeOption(this));
    }
    menuOptions.push(makeEditOption(this));
    menuOptions.push(makeShowDefinitionOption(this));
  }
};

Blockly.Extensions.registerMixin('procedure_call_contextmenu', PROCEDURE_CALL_CONTEXTMENU);
