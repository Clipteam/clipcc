/**
 * ClipCC Extension's class.
 */
export interface CCXExtensionClass {
    /**
     * Triggered when the plugin is enabled. In this event, the extension should
     * finish adding content to the editor.
     */
    onInit? (): void;
    /**
     * Triggered when the extension is disabled. In this event, the extension
     * should finish removing the content added to the editor.
     */
    onUninit? (): void;
    /**
     * Triggered when the editor loads a project. The parameter data represents the
     * data of the current project, and the parameter extensions represents the
     * extensions needed by the current project. In this event, the extensions should
     * finish replacing the old version of the project to make sure it is suitable
     * for the new version. Note that if the original project is identical to the
     * current environment, this event will still be triggered and the extension
     * should not modify the project. This event in the extension should provide
     * judgment to ensure that the version migration is correct.
     * @param data Project's original data.
     * @param extensions All extensions, A map of url and version.
     */
    beforeProjectLoad? (projectData: unknown, extensions: Record<string, string>): void;
    /**
     * This event is triggered when the editor is saving an project.
     * @param data Project's original data.
     */
    beforeProjectSave? (data: unknown): void;
}

/**
 * Types of block
 * @enum {number}
 */
export enum BlockType {
    COMMAND = 1,
    REPORTER = 2,
    BOOLEAN = 3,
    // BRANCH = 4, /* deleted */
    HAT = 5
}

/**
 * Types of parameter
 * @enum {number}
 */
export enum ParameterType {
    NUMBER = 1,
    STRING = 2,
    BOOLEAN = 3,
    COLOR = 5,
    MATRIX = 6,
    NOTE = 7,
    ANGLE = 8
}

/**
 * Extension's manifest (info.json)'s format.
 * The info.json in the root directory inside the extension file is the basic info
 * of the extension, and the fields in this file must be filled in as specified below.
 * If a required field is missing, the extension should be refused to load; if there
 * is a useless field, no response will be made to the useless field.
 */
export interface ExtensionInfo {
    /**
     * The ID of the extension, which must be unique, is recommended to be written as 
     * ``[Author's ID].[Plugin Name]``, where the whole ID must satisfy [a-zA-Z0-9_-]+.
     *  It is not recommended to use multiple . Split ID, if necessary, each ``.`` must
     * have at least one legal character between them.
     */
    id: string;
    /**
     * Extension's version, Follow [semver](https://semver.org/).
     */
    version: string;
    /**
     * The name of the author, either as a string or as a list.
     */
    author: string | string[];
    /**
     * Extension's banner path.
     */
    icon: string;
    /**
     * Extension's inset icon path.
     */
    inset_icon: string;
    /**
     * API version identifier (standard version), if the current 
     * editor does not support this API, the extension should be
     * refused to be loaded.
     */
    api: number;
    /**
     * If or not the extension is optional, the default is false,
     * if it is set to true it means the extension is optional and
     * not loaded will not affect the artwork file. If false, it
     * means the extension must be loaded for the work to open
     * properly, for example, if it adds a new module.
     */
    optional?: boolean;
    /**
     * Whether can be hot-reload. You can set him to ``true``
     * without causing irreversible modifications to the editor and
     * with a correct response to the ``onUninit`` event.
     */
    hot_reload?: boolean;
    /**
     * Whether should be run in sandboxed mode, it's ``true`` by default.
     * All sandboxed extension cannot access vm by``getVmInstance()`` and
     * access blockly by ``getBlockInstance()``, and all API are asynchronous.
     */
    sandboxed?: boolean;
    /**
     * Extension's dependencies. Extensions are allowed to have one or more
     * dependencies, and all extensions that an extension depends on must be
     * loaded before that extension. If there is no direct or indirect
     * dependency between two extensions, the order in which the two extensions
     * are loaded is randomized.
     */
    dependency: { [key: string]: string };
}

export interface SettingsItemBoolean {
    id: string;
    type: 'boolean';
    default: boolean;
}

export interface SettingsItemNumber {
    id: string;
    type: 'number';
    default: number;
    max?: number;
    min?: number;
    precision?: number;
}

export interface SettingsItemSelector {
    id: string;
    type: 'selector';
    default: string;
    items: string[];
}

export type SettingsItem = SettingsItemBoolean | SettingsItemNumber | SettingsItemSelector;

export interface BlockPrototype {
    opcode: string;
    type: BlockType;
    option?: BlockOption;
    branchCount?: number;
    param?: Record<string, ParameterPrototype>;
    messageId: string;
    categoryId: string;
    /**
     * Block functions in CCX do not bind scopes to functions like Scratch
     * Standard Extension does, so you need to manually use``this.funcName =
     * this.funcName.bind(this)`` or use arrow functions to avoid the scoping
     * problem.
     */
    function: (args: Record<string, unknown>, util?: unknown) => unknown;
}

export interface BlockOption {
    terminal?: boolean;
    monitor?: boolean;
    filter?: typeof FilterType[keyof typeof FilterType];
}

export const FilterType = {
    SPRITE: ['sprite'],
    STAGE: ['stage'],
    ALL: ['sprite', 'stage'],
    HIDE: []
} as const;

export interface ParameterPrototype {
    type: ParameterType;
    default?: string;
    menu?: MenuItemPrototype[] | (() => MenuItemPrototype[]);
    menuId?: string;
    field?: boolean;
    shadow?: ShadowPrototype;
}

export interface MenuItemPrototype {
    messageId: string;
    value: unknown;
}

export interface ShadowPrototype {
    type: string;
    fieldName: string;
}

export interface CategoryPrototype {
    categoryId: string;
    messageId: string;
    color: `#${string}`;
}

export interface ButtonPrototype {
    categoryId: string;
    messageId: string;
    callback: () => void;
}

export type BaseBlockPrim = (args: Record<string, unknown>, util?: unknown) => unknown;

export type VmInstance = unknown;
export type BlockInstance = unknown;
export type Project = unknown;

