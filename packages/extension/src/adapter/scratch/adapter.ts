/**
 * @license
 * Copyright 2017 Massachusetts Institute of Technology
 * SPDX-License-Identifier: BSD-3-Clause
 */

import formatMessage from 'format-message';
import type {IExtension} from '../../interfaces/i_extension';
import logger from '../../utils/logger';
import BlockType from './types/block-type';
import {
    isSimpleMenuMetadata,
    type ExtensionBlockMetadata,
    type ExtensionMenuItems,
    type ExtensionMenuMetadata,
    type ExtensionMetadata
} from './types/extension-metadata';
import type ExtensionManifest from './types/manifest';
import type ArgumentType from './types/argument-type';

interface ScratchExtension {
    /**
     * Get metadata of the extension.
     * @returns Metadata for this extension and its blocks.
     */
    getInfo(): ExtensionMetadata;

    /** Other methods and properties. */
    [key: string]: unknown;
}

type ScratchExtensionClass = new (runtime: any) => ScratchExtension;

/**
 * Information about an extension block argument.
 */
interface ArgumentInfo {
    /** The type of value this argument can take. */
    type: ArgumentType;
    /** The default value of this argument (default: blank). */
    default?: any;
}

/**
 * Raw extension block data paired with processed data ready for scratch-blocks.
 */
interface ConvertedBlockInfo {
    /** The raw block info. */
    info: ExtensionBlockMetadata;
    /** The scratch-blocks JSON definition for this block. */
    json: object;
    /** The scratch-blocks XML definition for this block. */
    xml: string;
}

/**
 * Information about a block category.
 */
interface CategoryInfo {
    /** The unique ID of this category. */
    id: string;
    /** The human-readable name of this category. */
    name: string;
    /** Optional URI for the block icon image. */
    blockIconURI?: string;
    /** The primary color for this category, in '#rrggbb' format. */
    color1: string;
    /** The secondary color for this category, in '#rrggbb' format. */
    color2: string;
    /** The tertiary color for this category, in '#rrggbb' format. */
    color3: string;
    /** The blocks, separators, etc. in this category. */
    blocks: ConvertedBlockInfo[];
    /** The menus provided by this category. */
    menus: any[];
}

/**
 * Check if `maybeMessage` looks like a message object, and if so pass it to `formatMessage`.
 * Otherwise, return `maybeMessage` as-is.
 * @param maybeMessage Something that might be a message descriptor object.
 * @param args The arguments to pass to `formatMessage` if it gets called.
 * @param locale The locale to pass to `formatMessage` if it gets called.
 * @returns The formatted message OR the original `maybeMessage` input.
 */
function maybeFormatMessage(maybeMessage: any, args?: object, locale?: string): any {
    if (maybeMessage && maybeMessage.id && maybeMessage.default) {
        return formatMessage(maybeMessage, args, locale);
    }
    return maybeMessage;
}

/**
 * Adapter to load scratch extension.
 */
export class ScratchExtensionAdapter implements IExtension {
    /** Whether the extension is enabled. */
    private enabled: boolean = false;

    private instance: ScratchExtension | null = null;

    constructor(
        private manifest: ExtensionManifest,
        private extensionModule: () => ScratchExtensionClass,
        private runtime: any
    ) {}

    /**
     * Get ID of the extension.
     * @returns ID of the extension.
     */
    getId(): string {
        return this.manifest.extensionId;
    }

    /**
     * Check whether the extension is enabled.
     * @returns True if the extension is enabled.
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Enable the extension.
     */
    enable(): void {
        const ExtensionClass = this.extensionModule();
        this.instance = new ExtensionClass(this.runtime);
        try {
            const info = this.prepareExtensionInfo(this.instance.getInfo());
            this.runtime._registerExtensionPrimitives(info);
        } catch (e) {
            logger.error(`Failed to register primitives for extension ${this.getId()}:`, e);
        }

        this.enabled = true;
    }

    /**
     * Disable the extension.
     */
    disable(): void {
        // @todo support disable extension.
        this.enabled = false;
    }

    /**
     * Get toolbox content for Blockly.
     */
    refreshPrimitives(): void {
        // @todo test only, should be replaced later.
        try {
            const info = this.instance!.getInfo();
            this.runtime._refreshExtensionPrimitives(this.prepareExtensionInfo(info));
        } catch (e) {
            logger.error(`Failed to refresh built-in extension primitives: ${e}`);
        }
    }

    private callExtensionMethod(method: string, ...args: any[]): any {
        if (this.instance && method in this.instance && typeof this.instance[method] === 'function') {
            return this.instance[method](args);
        }

        logger.warn(`Could not find extension block function called ${method}`);
        return undefined;
    }

    /// Methods from scratch-vm/src/extension-support/extension-manager.js

    /**
     * Modify the provided text as necessary to ensure that it may be used as an attribute value in valid XML.
     * @param text The text to be sanitized.
     * @returns The sanitized text.
     */
    private sanitizeID(text: string): string {
        return text.toString().replace(/[<"&]/, '_');
    }

    /**
     * Apply minor cleanup and defaults for optional extension fields.
     * TODO: make the ID unique in cases where two copies of the same extension are loaded.
     * @param extensionInfo The extension info to be sanitized.
     * @returns A new extension info object with cleaned-up values.
     */
    private prepareExtensionInfo(extensionInfo: ExtensionMetadata): ExtensionMetadata {
        extensionInfo = Object.assign({}, extensionInfo);
        if (!/^[a-z0-9]+$/i.test(extensionInfo.id)) {
            throw new Error('Invalid extension id');
        }
        extensionInfo.name = extensionInfo.name || extensionInfo.id;
        extensionInfo.blocks = extensionInfo.blocks || [];
        extensionInfo.targetTypes = extensionInfo.targetTypes || [];
        extensionInfo.blocks = extensionInfo.blocks.reduce<typeof extensionInfo.blocks>((results, blockInfo) => {
            try {
                let result;
                switch (blockInfo) {
                case '---': // separator
                    result = '---';
                    break;
                default: // an ExtensionBlockMetadata object
                    result = this.prepareBlockInfo(blockInfo as ExtensionBlockMetadata);
                    break;
                }
                results.push(result);
            } catch (e) {
                // TODO: more meaningful error reporting
                logger.error(`Error processing block: ${(e as Error).message}, Block:\n${JSON.stringify(blockInfo)}`);
            }
            return results;
        }, []);
        extensionInfo.menus = extensionInfo.menus || {};
        extensionInfo.menus = this.prepareMenuInfo(extensionInfo.menus);
        return extensionInfo;
    }

    /**
     * Prepare extension menus. e.g. setup binding for dynamic menu functions.
     * @param menus The menu defined by the extension.
     * @returns A menuInfo object with all preprocessing done.
     */
    private prepareMenuInfo(
        menus: Record<string, ExtensionMenuMetadata>
    ): Record<string, ExtensionMenuMetadata> {
        const menuNames = Object.getOwnPropertyNames(menus);
        for (const menuName of menuNames) {
            let menuInfo = menus[menuName];

            // If the menu description is in short form (items only) then normalize it to general form: an object with
            // its items listed in an `items` property.
            if (isSimpleMenuMetadata(menuInfo)) {
                menuInfo = {
                    items: menuInfo
                };
                menus[menuName] = menuInfo;
            }

            // If `items` is a string, it should be the name of a function in the extension object. Calling the
            // function should return an array of items to populate the menu when it is opened.
            if (typeof menuInfo.items === 'string') {
                const menuItemFunctionName = menuInfo.items;
                // Bind the function here so we can pass a simple item generation function to Scratch Blocks later.
                menuInfo.items = this.getExtensionMenuItems.bind(this, menuItemFunctionName);
            }
        }
        return menus;
    }

    /**
     * Fetch the items for a particular extension menu, providing the target ID for context.
     * @param menuItemFunctionName The name of the menu function to call.
     * @returns Menu items ready for scratch-blocks.
     */
    private getExtensionMenuItems(
        menuItemFunctionName: string
    ): [string, string][] {
        // Fetch the items appropriate for the target currently being edited. This assumes that menus only
        // collect items when opened by the user while editing a particular target.
        const editingTarget = this.runtime.getEditingTarget() || this.runtime.getTargetForStage();
        const editingTargetID = editingTarget ? editingTarget.id : null;
        const extensionMessageContext = this.runtime.makeMessageContextForTarget(editingTarget);

        // TODO: Fix this to use dispatch.call when extensions are running in workers.
        const menuFunc = this.instance![menuItemFunctionName] as (...args: any) => ExtensionMenuItems;
        const menuItems = menuFunc.call(this.instance, editingTargetID).map<[string, string]>(
            (item) => {
                item = maybeFormatMessage(item, extensionMessageContext);
                switch (typeof item) {
                case 'object':
                    return [
                        maybeFormatMessage(item.text, extensionMessageContext),
                        item.value
                    ];
                case 'string':
                    return [item, item];
                default:
                    return item;
                }
            });

        if (!menuItems || menuItems.length < 1) {
            throw new Error(`Extension menu returned no items: ${menuItemFunctionName}`);
        }
        return menuItems;
    }

    /**
     * Apply defaults for optional block fields.
     * @param blockInfo The block info from the extension.
     * @returns A new block info object which has values for all relevant optional fields.
     * @private
     */
    private prepareBlockInfo(blockInfo: ExtensionBlockMetadata): ExtensionBlockMetadata {
        blockInfo = Object.assign({}, {
            blockType: BlockType.COMMAND,
            terminal: false,
            blockAllThreads: false,
            arguments: {}
        }, blockInfo);
        blockInfo.opcode = blockInfo.opcode && this.sanitizeID(blockInfo.opcode);
        blockInfo.text = blockInfo.text || blockInfo.opcode;

        switch (blockInfo.blockType) {
        case BlockType.EVENT:
            if (blockInfo.func) {
                logger.warn(`Ignoring function "${blockInfo.func}" for event block ${blockInfo.opcode}`);
            }
            break;
        case BlockType.BUTTON:
            if (blockInfo.opcode) {
                logger.warn(`Ignoring opcode "${blockInfo.opcode}" for button with text: ${blockInfo.text}`);
            }
            break;
        default: {
            if (!blockInfo.opcode) {
                throw new Error('Missing opcode for block');
            }

            const funcName = blockInfo.func ? this.sanitizeID(blockInfo.func as string) : blockInfo.opcode;

            const getBlockInfo = blockInfo.isDynamic ?
                (args: Record<string, any>) => args && args.mutation && args.mutation.blockInfo :
                () => blockInfo;
            const callBlockFunc = (args: Record<string, any>, util: any, realBlockInfo: ExtensionBlockMetadata) => {
                return this.callExtensionMethod(funcName, args, util, realBlockInfo);
            };

            blockInfo.func = (args: Record<string, any>, util: any) => {
                const realBlockInfo = getBlockInfo(args);
                // TODO: filter args using the keys of realBlockInfo.arguments? maybe only if sandboxed?
                return callBlockFunc(args, util, realBlockInfo);
            };
            break;
        }
        }

        return blockInfo;
    }
}
