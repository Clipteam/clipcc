import VirtualMachine, { ImportedExtensionsInfo, Target } from 'clipcc-vm';
import { BlockType, ParameterType, FilterType } from './enum';
import type { Store } from 'redux';
import { Emitter } from '../util/event-emitter';

type ScratchBlocks = any;

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

    interface SettingsItemBase {
        id: string;
        message?: string;
    }

    interface SettingsItemBoolean extends SettingsItemBase {
        type: 'boolean';
        default: boolean;
    }

    interface SettingsItemNumber extends SettingsItemBase {
        type: 'number';
        default: number;
        max?: number;
        min?: number;
        precision?: number;
    }

    interface SettingsItemText extends SettingsItemBase {
        type: 'text';
        default: string;
    }
    
    interface SettingsItemSelector extends SettingsItemBase {
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
        color: `#${string}`;
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
        function getBlockInstance(): ScratchBlocks | null;
        function getReduxStore(): Store;
    }
    
    interface EventMap {
        onInit: [];
        beforeProjectLoad: [VirtualMachine.Target[], VirtualMachine.ImportedExtensionsInfo];
    }

    interface Context {
        api: ContextAPI;
        type: {
            BlockType: typeof BlockType;
            ParameterType: typeof ParameterType;
            FilterType: typeof FilterType;
        };
        Extension: Function
    }
}

interface ContextAPI extends Emitter<CCX.EventMap> {
    addCategory: typeof CCX.API.addCategory;
    addBlock: typeof CCX.API.addBlock;
    addBlocks: typeof CCX.API.addBlocks;
    addButton: typeof CCX.API.addButton;
    removeCategory: typeof CCX.API.removeCategory;
    removeBlock: typeof CCX.API.removeBlock;
    removeBlocks: typeof CCX.API.removeBlocks;
    removeButton: typeof CCX.API.removeButton;
    getSettings: typeof CCX.API.getSettings;
    registerGlobalFunction: typeof CCX.API.registerGlobalFunction;
    unregisterGlobalFunction: typeof CCX.API.unregisterGlobalFunction;
    callGlobalFunction: typeof CCX.API.callGlobalFunction;
    getVmInstance: typeof CCX.API.getVmInstance;
    getBlockInstance: typeof CCX.API.getBlockInstance;
    getReduxStore: typeof CCX.API.getReduxStore;
}

export { CCX };
