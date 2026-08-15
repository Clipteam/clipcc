/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import * as Constants from './constants';
import {isActiveTemplateBlock} from './interfaces/i_block_template';

/**
 * Check whether a connection is the continuation connection of a template
 * statement reporter. Template reporters are owned by their prototype and
 * must not become part of a user statement stack.
 * @param connection The connection to inspect.
 * @returns Whether the connection is a template reporter's next connection.
 */
function isTemplateNextConnection(connection: Blockly.Connection | null): boolean {
  const sourceBlock = connection?.getSourceBlock();
  return Boolean(
    sourceBlock &&
    connection === sourceBlock.nextConnection &&
    isActiveTemplateBlock(sourceBlock)
  );
}

/**
 * Class for connection type checking logic with custom rules.
 */
export class ConnectionChecker extends Blockly.ConnectionChecker {
  /**
   * Reject connections to the continuation of a prototype template reporter.
   * @param a The first connection to check.
   * @param b The second connection to check.
   * @param isDragging Whether the connection is being made by dragging.
   * @param optDistance The maximum distance for drag checks.
   * @returns The connection result code.
   */
  override canConnectWithReason(
    a: Blockly.Connection | null,
    b: Blockly.Connection | null,
    isDragging: boolean,
    optDistance?: number
  ): number {
    if (isTemplateNextConnection(a) || isTemplateNextConnection(b)) {
      return Blockly.Connection.REASON_CHECKS_FAILED;
    }
    return super.canConnectWithReason(a, b, isDragging, optDistance);
  }

  /**
   * Check whether this connection can be made by dragging.
   * @param a Connection to compare (on the block that's being dragged).
   * @param b Connection to compare against.
   * @param distance The maximum allowable distance between connections.
   * @returns True if the connection is allowed during a drag.
   */
  override doDragChecks(
    a: Blockly.RenderedConnection,
    b: Blockly.RenderedConnection,
    distance: number
  ): boolean {
    const canConnect = super.doDragChecks(a, b, distance);

    if (canConnect) {
      // Prevent other blocks connect to the input of procedure definition.
      if (
        b.getSourceBlock().type === Constants.PROCEDURES_DEFINITION_BLOCK_TYPE &&
        b.getParentInput()?.name === 'custom_block'
      ) {
        return false;
      }

      // Procedure prototype inputs are managed by the procedure mutation and
      // must not be replaced by user drag-and-drop.
      if (b.getSourceBlock().type === Constants.PROCEDURES_PROTOTYPE_BLOCK_TYPE) {
        return false;
      }

      // Active template blocks remain permanently attached to their
      // container. They must not be replaced nor connected with other blocks.
      const targetBlock = b.targetBlock();
      if (
        isActiveTemplateBlock(b.getSourceBlock()) ||
        (targetBlock && isActiveTemplateBlock(targetBlock))
      ) {
        return false;
      }
    }

    return canConnect;
  }
}

Blockly.registry.register(
  Blockly.registry.Type.CONNECTION_CHECKER,
  Blockly.registry.DEFAULT,
  ConnectionChecker,
  true
);
