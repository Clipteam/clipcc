/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import * as Constants from './constants';

/**
 * Class for connection type checking logic with custom rules.
 */
export class ConnectionChecker extends Blockly.ConnectionChecker {
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
      // Prevent other blocks connect to the input of precedure definition.
      if (
        b.getSourceBlock().type === Constants.PROCEDURES_DEFINITION_BLOCK_TYPE &&
        b.getParentInput()?.name === 'custom_block'
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
