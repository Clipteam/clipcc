export interface CCXExtensionClass {
    onInit ? (): void;
    onUninit ? (): void;
    beforeProjectLoad ? (data: any, extensions: any): void;
    beforeProjectSave ? (data: any): void;
}

export enum BlockType {
    COMMAND = 1,
    REPORTER = 2,
    BOOLEAN = 3,
    // BRANCH = 4, /* deleted */
    HAT = 5
}

export enum ParameterType {
    NUMBER = 1,
    STRING = 2,
    BOOLEAN = 3,
    COLOR = 5,
    MATRIX = 6,
    NOTE = 7,
    ANGLE = 8,
    IMAGE = 99
}

export interface ExtensionInfo {
    id: string;
    version: string;
    author: string | string[];
    icon: string;
    inset_icon: string;
    api: number;
    optional?: boolean;
    hot_reload?: boolean;
    sandboxed?: boolean;
    dependency: { [key: string]: string };
}
export interface SettingsItemBoolean {
    id: string;
    type: "boolean";
    default: boolean;
}

export interface SettingsItemNumber {
    id: string;
    type: "number";
    default: number;
    max?: number;
    min?: number;
    precision?: number;
}

export interface SettingsItemSelector {
    id: string;
    type: "selector";
    default: string;
    items: string[];
}

export type SettingsItem = SettingsItemBoolean | SettingsItemNumber | SettingsItemSelector;

export interface BlockPrototype {
    opcode: string;
    type: BlockType;
    option?: BlockOption;
    branchCount?: number;
    param?: { [key: string]: ParameterPrototype };
    messageId: string;
    categoryId: string;
    function: Function;
}

export interface BlockOption {
    terminal?: boolean;
    monitor?: boolean;
}

export interface ParameterPrototype {
    type: ParameterType;
    default?: any;
    menu?: MenuItemPrototype[];
    menuId?: string;
    field?: boolean;
    shadow?: ShadowPrototype;
}

export interface MenuItemPrototype {
    messageId: string;
    value: any;
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

export type VmInstance = unknown;
export type BlockInstance = unknown;
export type Project = unknown;

