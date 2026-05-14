/* eslint-disable @typescript-eslint/no-explicit-any */
import type {BlockFunction} from '../blocks/category_prototype';
import type Runtime from '../engine/runtime';
import type {JsonBlockDefinition} from '../types/json-block-definitions';
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
    blocks: ExtensionItemMetadata[];
    /** Map of menu name to metadata for each of this extension's menus. */
    menus?: Record<string, ExtensionMenuItem>;
    /** Whether to show a status button for this extension. */
    showStatusButton?: boolean;
    /** The primary color for this extension. */
    color1?: string;
    /** The secondary color for this extension. */
    color2?: string;
    /** The tertiary color for this extension. */
    color3?: string;
    /**
     * New target type(s).
     * @todo Not implemented by VM.
     */
    targetTypes?: string[];
    /**
     * Custom field types used by this extension's blocks, if any.
     * @todo Not implemented by VM.
     */
    customFieldTypes?: Record<string, ExtensionCustomFieldTypeMetadata>;
}

/** ExtensionMetadata but normalized by extension manager and passed to runtime */
export interface NormalizedExtensionMetadata extends Omit<ExtensionMetadata, 'menus'> {
    menus?: Record<string, NormalizedExtensionMenuItem>;
}

export type ExtensionItemMetadata = ExtensionBlockMetadata | ExtensionButtonMetadata | '---';

export interface ExtensionCustomFieldTypeMetadata {
    output: JsonBlockDefinition['output'];
    outputShape: JsonBlockDefinition['outputShape'];
    implementation: any;
}

export interface MenuInfo {
    json: JsonBlockDefinition;
}

export interface BlockInfo {
    info: ExtensionBlockMetadata;
    json: JsonBlockDefinition;
    xml: string;
};

export interface ButtonInfo {
    info: ExtensionButtonMetadata;
    xml: string;
};

export interface SepInfo {
    info: '---';
    xml: string;
};

export type CategoryInfo =
    Pick<
        ExtensionMetadata,
        'id' | 'name' | 'showStatusButton' | 'blockIconURI' | 'menuIconURI' | 'color1' | 'color2' | 'color3'
    > &
    {
        menuInfo: Record<string, NormalizedExtensionMenuItem>;
        customFieldTypes: Record<string, ExtensionCustomFieldTypeInfo>;
        menus: MenuInfo[];
        blocks: (BlockInfo | ButtonInfo | SepInfo)[];
    };

export interface ExtensionCustomFieldTypeInfo {
    fieldName: string;
    extendedName: string;
    argumentTypeInfo: {
        shadow: {
            type: string;
            fieldName: string;
        }
    }
    scratchBlocksDefinition: {
        json: JsonBlockDefinition;
    }
    fieldImplementation: any;
}

/**
 * All the metadata needed to register an extension block.
 */

export interface ExtensionButtonMetadata {
    blockType: BlockType.BUTTON;
    text: string;
    func?: string;
    filter?: TargetType[];
    hideFromPalette?: boolean;
}

export interface ExtensionBlockMetadata {
    /** A unique alphanumeric identifier for this block. No special characters allowed. */
    opcode: string;
    /** The name of the function implementing this block. Can be shared by other blocks/opcodes. */
    func?: BlockFunction;
    /** The type of block (command, reporter, etc.) being described. */
    blockType: Exclude<BlockType, BlockType.BUTTON>;
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
    blockIconURI?: string;
    isDynamic?: boolean;
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

export interface ExtensionImageMetadata {
    type: ArgumentType.IMAGE;
    dataURI?: string;
    flipRTL?: boolean;
}

/**
 * A menu item for which the label and value can differ.
 */
export interface NormalizedExtensionMenuItem {
    items: ShortExtensionMenuItem;
    acceptReporters?: boolean;
}

export interface ExtensionMenuItemObject {
    /** The value of the block argument when this menu item is selected. */
    value: string;
    /** The human-readable label of this menu item in the menu. */
    text: string;
}

export type MenuItemFunction = ((editingTargetId?: string | null) => [string, string][]);

export type ShortExtensionMenuItem =
    MenuItemFunction | ExtensionMenuItemObject[];

export type ExtensionMenuItem = NormalizedExtensionMenuItem | ShortExtensionMenuItem;

export interface ExtensionClass {
    getInfo(): ExtensionMetadata;
}

export interface PeripheralExtensionClass extends ExtensionClass {
    scan(): void;
    connect(peripheralId: number): void;
    disconnect(): void;
    isConnected(): boolean;
}

export type ExtensionClassConstructor = new (runtime: Runtime) => ExtensionClass;
export type PeripheralExtensionClassConstructor = new (runtime: Runtime) => PeripheralExtensionClass;
