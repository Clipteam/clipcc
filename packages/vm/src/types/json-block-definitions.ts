/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Copied from packages\blockly\core\interfaces\i_json_block_definition.ts 0bdae1497b9b832617eb12c87e25a4d556e34c07
// Adapted to fit the needs of the VM extension system.

import type * as ClipCCBlocks from 'clipcc-block';

type FieldDropdownFromJsonConfig = ClipCCBlocks.FieldDropdownFromJsonConfig;

/**
 * Defines the JSON structure for a block definition.
 *
 * @example
 * ```typescript
 * const blockDef:  JsonBlockDefinition = {
 *   type: 'custom_block',
 *   message0: 'move %1 steps',
 *   args0: [
 *     {
 *       'type': 'field_number',
 *       'name': 'INPUT',
 *     },
 *   ],
 *   previousStatement: null,
 *   nextStatement: null,
 * };
 * ```
 */
export interface JsonBlockDefinition extends ClipCCBlocks.JsonBlockDefinition {
    // clipcc-block specific fields
    checkboxInFlyout?: boolean;

    // Backwards compatibility: lastDummyAlign aliases implicitAlign.
    [key: `lastDummyAlign${number}`]: string | undefined;
}

export type JsonBlockArg = ClipCCBlocks.JsonBlockArg;

export interface FieldDropdownArg extends FieldDropdownFromJsonConfig {
    type: 'field_dropdown';
    name?: string;
}
