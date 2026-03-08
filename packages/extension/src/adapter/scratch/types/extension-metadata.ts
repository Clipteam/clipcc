/**
 * @license
 * Copyright 2018 Massachusetts Institute of Technology
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type ArgumentType from './argument-type';
import type BlockType from './block-type';
import type ReporterScope from './reporter-scope';
import type TargetType from './target-type';

/**
 * All the metadata needed to register an extension.
 */
export interface ExtensionMetadata {
    /** A unique alphanumeric identifier for this extension. No special characters allowed. */
    id: string;
    /** The human-readable name of this extension. */
    name?: string;
    /** URI for an image to be placed on each block in this extension. Data URI ok. */
    blockIconURI?: string;
    /** URI for an image to be placed on this extension's category menu item. Data URI ok. */
    menuIconURI?: string;
    /** Link to documentation content for this extension. */
    docsURI?: string;
    /** The blocks provided by this extension, plus separators. */
    blocks: Array<ExtensionBlockMetadata | string>;
    /** Map of menu name to metadata for each of this extension's menus. */
    menus?: Record<string, ExtensionMenuMetadata>;
    /** List new target type(s) provided by this extension. */
    targetTypes?: string[];
}

/**
 * All the metadata needed to register an extension block.
 */
export interface ExtensionBlockMetadata {
    /** A unique alphanumeric identifier for this block. No special characters allowed. */
    opcode: string;
    /** The name of the function implementing this block. Can be shared by other blocks/opcodes. */
    func?: string | ((...args: any) => any);
    /** The type of block (command, reporter, etc.) being described. */
    blockType: BlockType;
    /** The text on the block, with [PLACEHOLDERS] for arguments. */
    text: string;
    /** True if this block should not appear in the block palette. */
    hideFromPalette?: boolean;
    /** True if the block ends a stack - no blocks can be connected after it. */
    isTerminal?: boolean;
    /** True if this block is a reporter but should not allow a monitor. */
    disableMonitor?: boolean;
    /** If this block is a reporter, this is the scope/context for its value. */
    reporterScope?: ReporterScope;
    /** Sets whether a hat block is edge-activated. */
    isEdgeActivated?: boolean;
    /** Sets whether a hat/event block should restart existing threads. */
    shouldRestartExistingThreads?: boolean;
    /** For flow control blocks, the number of branches/substacks for this block. */
    branchCount?: number;
    /** Map of argument placeholder to metadata about each arg. */
    arguments?: Record<string, ExtensionArgumentMetadata>;
    /** True if creating a block factory / constructor. */
    isDynamic?: boolean;
    /** Optional list of target types for which this block should appear. */
    filter?: TargetType[];
}

/**
 * All the metadata needed to register an argument for an extension block.
 */
export interface ExtensionArgumentMetadata {
    /** The type of the argument (number, string, etc.). */
    type: ArgumentType;
    /** The default value of this argument. */
    defaultValue?: any;
    /** The name of the menu to use for this argument, if any. */
    menu?: string;
}

/**
 * All the metadata needed to register an extension drop-down menu.
 */
export type ExtensionMenuMetadata = {
    acceptReporters?: boolean;
    items: ExtensionDynamicMenu | ExtensionMenuItems | (() => [string, string][]);
} | ExtensionDynamicMenu | ExtensionMenuItems;

/**
 * The string name of a function which returns menu items.
 */
export type ExtensionDynamicMenu = string;

/**
 * Items in an extension menu.
 */
export type ExtensionMenuItems = Array<ExtensionMenuItemSimple | ExtensionMenuItemComplex>;

/**
 * A menu item for which the label and value are identical strings.
 */
export type ExtensionMenuItemSimple = string;

/**
 * A menu item for which the label and value can differ.
 */
export interface ExtensionMenuItemComplex {
    /** The value of the block argument when this menu item is selected. */
    value: any;
    /** The human-readable label of this menu item in the menu. */
    text: string;
}

/**
 * Check if the menu description is in short form (items only).
 */
export function isSimpleMenuMetadata(menu: ExtensionMenuMetadata): menu is ExtensionDynamicMenu | ExtensionMenuItems {
    return !(menu as any).items;
}
