/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test} from '@jest/globals';
import * as Blockly from 'blockly/core';
import type {ProcedureCallerExtraState, ProcedureExtraState} from '../../src/serialization/procedures';
import {Dragger} from '../../src/dragger';
import {setupPlayground} from '../helpers/playground';

/**
 * Create procedure prototype state for a single argument.
 * @param type Argument type.
 * @param id Argument ID.
 * @param name Argument display name.
 * @returns Procedure prototype state.
 */
function procedureState(type: 'b' | 'n' | 's', id: string, name = 'parameter'): ProcedureExtraState {
  return {
    proccode: `procedure %${type}`,
    argumentids: [id],
    argumentdefaults: [''],
    argumentnames: [name],
    warp: false,
    return: false,
    global: false
  };
}

/**
 * Create procedure caller state for a single argument.
 * @param type Argument type.
 * @param id Argument ID.
 * @returns Procedure caller state.
 */
function callerState(type: 'b' | 'n' | 's', id: string): ProcedureCallerExtraState {
  return {
    proccode: `procedure %${type}`,
    argumentids: [id],
    warp: false,
    return: false,
    global: false,
    generateshadows: false
  };
}

describe('Blocks: Procedures', () => {
  const context = setupPlayground();

  /**
   * Create a prototype block without recording setup events.
   * @param state Procedure prototype state.
   * @returns The created prototype block.
   */
  function createPrototype(state: ProcedureExtraState) {
    Blockly.Events.disable();
    try {
      const block = context.workspace.newBlock('procedures_prototype') as Blockly.BlockSvg & {
        loadExtraState: (state: ProcedureExtraState) => void;
      };
      block.initSvg();
      block.loadExtraState(state);
      return block;
    } finally {
      Blockly.Events.enable();
    }
  }

  /**
   * Create a caller block without recording setup events.
   * @param state Procedure caller state.
   * @returns The created caller block.
   */
  function createCaller(state: ProcedureCallerExtraState) {
    Blockly.Events.disable();
    try {
      const block = context.workspace.newBlock('procedures_call') as Blockly.BlockSvg & {
        loadExtraState: (state: ProcedureCallerExtraState) => void;
      };
      block.initSvg();
      block.loadExtraState(state);
      return block;
    } finally {
      Blockly.Events.enable();
    }
  }

  test('Prototype and argument reporter are regular blocks', () => {
    const prototype = createPrototype(procedureState('s', 'ARG'));
    const reporter = prototype.getInputTargetBlock('ARG')!;

    expect(prototype.isShadow()).toBe(false);
    expect(prototype.isDeletable()).toBe(false);
    expect(prototype.isDuplicatable()).toBe(false);
    expect((prototype as Blockly.BlockSvg & {satellite: boolean}).satellite).toBe(true);
    expect(reporter.isShadow()).toBe(false);
    expect((reporter as Blockly.BlockSvg & {blockTemplate: boolean}).blockTemplate).toBe(true);
    expect(reporter.isDeletable()).toBe(false);
  });

  test('Prototype input cannot be replaced by drag-and-drop', () => {
    const prototype = createPrototype(procedureState('s', 'ARG'));
    const replacement = context.workspace.newBlock('text') as Blockly.BlockSvg;
    replacement.initSvg();

    const inputConnection = prototype.getInput('ARG')!.connection! as Blockly.RenderedConnection;
    const outputConnection = replacement.outputConnection! as Blockly.RenderedConnection;
    expect(context.workspace.connectionChecker.doDragChecks(outputConnection, inputConnection, 0)).toBe(false);
  });

  test('Dragging a template reporter creates a regular clone', () => {
    const prototype = createPrototype(procedureState('s', 'ARG'));
    const reporter = prototype.getInputTargetBlock('ARG')! as Blockly.BlockSvg & {
      blockTemplate: boolean;
    };
    const originalId = reporter.id;
    const dragger = new Dragger(reporter);
    const clone = dragger.onDragStart(new PointerEvent('pointerdown', {
      bubbles: true,
      clientX: 0,
      clientY: 0,
      pointerType: 'mouse'
    })) as Blockly.BlockSvg & {blockTemplate: boolean};

    expect(clone.id).not.toBe(originalId);
    expect(clone.isShadow()).toBe(false);
    expect(clone.blockTemplate).toBe(false);
    expect(clone.isDeletable()).toBe(true);
    expect(reporter.getParent()).toBe(prototype);

    clone.dispose(true, false);
  });

  test('Serialized regular prototype does not create duplicate reporters', () => {
    const state: Blockly.serialization.blocks.State = {
      type: 'procedures_definition',
      inputs: {
        custom_block: {
          block: {
            type: 'procedures_prototype',
            extraState: procedureState('s', 'ARG'),
            inputs: {
              ARG: {
                block: {
                  type: 'argument_reporter_string_number',
                  fields: {VALUE: 'parameter'}
                }
              }
            }
          }
        }
      }
    };

    const definition = Blockly.serialization.blocks.append(state, context.workspace) as Blockly.BlockSvg;
    const prototype = definition.getInputTargetBlock('custom_block')!;

    const reporters = prototype.getDescendants(false).filter(
      (block) => block.type === 'argument_reporter_string_number'
    );
    expect(reporters).toHaveLength(1);
    expect(reporters[0].isShadow()).toBe(false);
  });

  test('Removed prototype reporters are disposed', () => {
    const prototype = createPrototype(procedureState('s', 'OLD')) as Blockly.BlockSvg & {
      loadExtraState: (state: ProcedureExtraState) => void;
    };
    const oldReporter = prototype.getInputTargetBlock('OLD')!;

    prototype.loadExtraState(procedureState('n', 'NEW'));

    expect(context.workspace.getBlockById(oldReporter.id)).toBeNull();
    expect(prototype.getInputTargetBlock('NEW')).not.toBeNull();
  });

  test('Regular argument reporters outside prototypes are not disposed', () => {
    const caller = createCaller(callerState('s', 'ARG')) as Blockly.BlockSvg & {
      loadExtraState: (state: ProcedureCallerExtraState) => void;
    };
    const reporter = context.workspace.newBlock('argument_reporter_string_number') as Blockly.BlockSvg;
    reporter.initSvg();
    reporter.outputConnection!.connect(caller.getInput('ARG')!.connection!);

    caller.loadExtraState({
      proccode: 'procedure',
      argumentids: [],
      warp: false,
      return: false,
      global: false,
      generateshadows: false
    });

    expect(context.workspace.getBlockById(reporter.id)).not.toBeNull();
  });

  test('Workspace round-trip does not orphan duplicate template reporters', () => {
    context.workspace.clear();
    context.workspace.getProcedureMap().clear();

    const state: Blockly.serialization.blocks.State = {
      type: 'procedures_definition',
      inputs: {
        custom_block: {
          block: {
            type: 'procedures_prototype',
            extraState: procedureState('s', 'ARG')
          }
        }
      }
    };
    Blockly.serialization.blocks.append(state, context.workspace);

    const saved = Blockly.serialization.workspaces.save(context.workspace);
    context.workspace.clear();
    context.workspace.getProcedureMap().clear();
    Blockly.serialization.workspaces.load(saved, context.workspace);

    const reporters = context.workspace.getAllBlocks(false).filter(
      (block) => block.type === 'argument_reporter_string_number'
    );
    expect(reporters).toHaveLength(1);
    expect(reporters[0].getParent()?.type).toBe('procedures_prototype');

    const xml = Blockly.Xml.workspaceToDom(context.workspace);
    context.workspace.clear();
    context.workspace.getProcedureMap().clear();
    Blockly.Xml.domToWorkspace(xml, context.workspace);

    const xmlReporters = context.workspace.getAllBlocks(false).filter(
      (block) => block.type === 'argument_reporter_string_number'
    );
    expect(xmlReporters).toHaveLength(1);
    expect(xmlReporters[0].getParent()?.type).toBe('procedures_prototype');
  });
});
