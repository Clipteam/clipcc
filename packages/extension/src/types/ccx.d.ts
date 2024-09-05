import VirtualMachine, { ImportedExtensionsInfo, Target } from 'clipcc-vm';
import { BlockType, ParameterType, FilterType } from './enum';

declare namespace CCX {
    interface Manifest {
        id: string;
        author: string | string[];
        version: string;
        api: number;
        icon: string;
        inset_icon: string;
        optional?: boolean;
        default_language?: string;
        dependency?: Record<string, string>;
    }

    type LocaleMap = Record<string, string>;

    interface SettingsItemBoolean {
        id: string;
        type: 'boolean';
        default: boolean;
    }

    interface SettingsItemNumber {
        id: string;
        type: 'number';
        default: number;
        max?: number;
        min?: number;
        precision?: number;
    }

    interface SettingsItemText {
        id: string;
        type: 'text';
        default: string;
    }

    interface SettingsItemSelector {
        id: string;
        type: 'selector';
        default: string;
        items: string[];
    }

    type SettingsItem = SettingsItemBoolean | SettingsItemNumber | SettingsItemText | SettingsItemSelector;
    type SettingsValue = SettingsItem['default'];

    type Settings = SettingsItem[];

    type SafeScratchValue = string | number;

    interface BlockPrototype {
        opcode: string;
        type: BlockType;
        option?: BlockOption;
        param?: Record<string, ParameterPrototype>;
        messageId: string;
        categoryId: string;
        function: (args: Record<string, unknown>, util?: unknown) => SafeScratchValue;
    }

    interface BlockOption {
        terminal?: boolean;
        monitor?: boolean;
        filter?: FilterType[]
    }

    interface ParameterPrototype {
        type: ParameterType;
        default?: SafeScratchValue;
        menu?: MenuItemPrototype[] | (() => MenuItemPrototype[]);
        menuId?: string;
        field?: boolean;
        shadow?: ShadowPrototype;
    }

    interface MenuItemPrototype {
        messageId: string;
        value: SafeScratchValue;
    }

    interface ShadowPrototype {
        type: string;
        fieldName: string;
    }

    interface CategoryPrototype {
        categoryId: string;
        messageId: string;
        color: string;
    }

    interface ButtonPrototype {
        categoryId: string;
        messageId: string;
        callback: () => void;
    }

    interface Class {
        onInit?(): void;
        beforeProjectLoadExtension?(targets: Target[], extensions: ImportedExtensionsInfo): void;
        beforeProjectLoad?(targets: Target[], extensions: ImportedExtensionsInfo): void;
        beforeProjectSave?(data: object): void;
    }

    namespace API {
        function addCategory(category: CategoryPrototype): void;
        function addBlock(block: BlockPrototype): void;
        function addBlocks(blocks: BlockPrototype[]): void;
        function addButton(button: ButtonPrototype): void;

        function removeCategory(categoryId: string): void;
        function removeBlock(opcode: string): void;
        function removeBlocks(opcodes: string[]): void;
        function removeButton(buttonId: string): void;

        function getSettings(id: string): SettingsValue;

        function registerGlobalFunction(name: string, func: (...args: unknown[]) => unknown): void;
        function unregisterGlobalFunction(name: string): void;
        function callGlobalFunction(name: string, ...args: unknown[]): unknown;

        function getVmInstance(): VirtualMachine;
        function getBlockInstance(): ScratchBlocks;
    }

    interface Context {
        api: {
            addCategory: typeof API.addCategory;
            addBlock: typeof API.addBlock;
            addBlocks: typeof API.addBlocks;
            addButton: typeof API.addButton;
            removeCategory: typeof API.removeCategory;
            removeBlock: typeof API.removeBlock;
            removeBlocks: typeof API.removeBlocks;
            removeButton: typeof API.removeButton;
            getSettings: typeof API.getSettings;
            registerGlobalFunction: typeof API.registerGlobalFunction;
            unregisterGlobalFunction: typeof API.unregisterGlobalFunction;
            callGlobalFunction: typeof API.callGlobalFunction;
            getVmInstance: typeof API.getVmInstance;
            getBlockInstance: typeof API.getBlockInstance;
        };
        type: {
            BlockType: typeof BlockType;
            ParameterType: typeof ParameterType;
            FilterType: typeof FilterType;
        };
    }
}
