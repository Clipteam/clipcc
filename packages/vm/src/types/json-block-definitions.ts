/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Copied from packages\blockly\core\interfaces\i_json_block_definition.ts 0bdae1497b9b832617eb12c87e25a4d556e34c07
// Adapted to fit the needs of the VM extension system.

import type * as ClipCCBlocks from 'clipcc-block';

type FieldCheckboxFromJsonConfig = ClipCCBlocks.FieldCheckboxFromJsonConfig;
type FieldDropdownFromJsonConfig = ClipCCBlocks.FieldDropdownFromJsonConfig;
type FieldImageFromJsonConfig = ClipCCBlocks.FieldImageFromJsonConfig;
type FieldNumberFromJsonConfig = ClipCCBlocks.FieldNumberFromJsonConfig;
type FieldTextInputFromJsonConfig = ClipCCBlocks.FieldTextInputFromJsonConfig;
type FieldVariableFromJsonConfig = ClipCCBlocks.FieldVariableFromJsonConfig;
type Align = ClipCCBlocks.inputs.Align;

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
export interface JsonBlockDefinition {
    type: string;
    style?: string | null;
    colour?: string | number;
    output?: string | string[] | null;
    previousStatement?: string | string[] | null;
    nextStatement?: string | string[] | null;
    outputShape?: number;
    inputsInline?: boolean;
    tooltip?: string;
    helpUrl?: string;
    extensions?: string[];
    mutator?: string;
    enableContextMenu?: boolean;
    suppressPrefixSuffix?: boolean;

    // clipcc-block specific fields
    checkboxInFlyout?: boolean;

    [key: `message${number}`]: string | undefined;
    [key: `args${number}`]: JsonBlockArg[] | undefined;
    [key: `implicitAlign${number}`]: string | undefined;
    // Backwards compatibility: lastDummyAlign aliases implicitAlign.
    [key: `lastDummyAlign${number}`]: string | undefined;
}

export type JsonBlockArg =
    | InputValueArg
    | InputStatementArg
    | InputDummyArg
    | InputEndRowArg
    | FieldInputArg
    | FieldNumberArg
    | FieldDropdownArg
    | FieldCheckboxArg
    | FieldImageArg
    | FieldVariableArg
    | UnknownArg;

export interface UnknownArg {
    type: string;
    [key: string]: unknown;
}

/** Input args */
export interface InputValueArg {
    type: 'input_value';
    name?: string;
    check?: string | string[];
    align?: Align;
}

export interface InputStatementArg {
    type: 'input_statement';
    name?: string;
    check?: string | string[];
}

export interface InputDummyArg {
    type: 'input_dummy';
    name?: string;
}

export interface InputEndRowArg {
    type: 'input_end_row';
    name?: string;
}

/** Field args */
export interface FieldInputArg extends FieldTextInputFromJsonConfig {
    type: 'field_input';
    name?: string;
}

export interface FieldNumberArg extends FieldNumberFromJsonConfig {
    type: 'field_number';
    name?: string;
}

export interface FieldDropdownArg extends FieldDropdownFromJsonConfig {
    type: 'field_dropdown';
    name?: string;
}

export interface FieldCheckboxArg extends FieldCheckboxFromJsonConfig {
    type: 'field_checkbox';
    name?: string;
}

export interface FieldImageArg extends FieldImageFromJsonConfig {
    type: 'field_image';
    name?: string;
}

export interface FieldVariableArg extends FieldVariableFromJsonConfig {
    type: 'field_variable';
    name?: string;
}
