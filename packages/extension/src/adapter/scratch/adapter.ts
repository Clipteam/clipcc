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
    type ProcessedExtensionBlockMetadata,
    type ProcessedExtensionMenuMetadata,
    type ProcessedExtensionMetadata,
    type ExtensionBlockMetadata,
    type ExtensionMenuItems,
    type ExtensionMenuMetadata,
    type ExtensionMetadata
} from './types/extension-metadata';
import type ExtensionManifest from '../../interfaces/extension-manifest';
import type ArgumentType from './types/argument-type';
import type {ExtensionManager} from '../../extension-manager';
import TargetType from './types/target-type';
import {UpdateBlocksEvent, UpdatePrimitivesEvent} from '../../events';
import defineDynamicBlock from './define-dynamic-block';

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
    json: any;
    /** The scratch-blocks XML definition for this block. */
    xml: string;
}

interface CustomFieldInfo {
    fieldName: string;
    extendedName: string;
    argumentTypeInfo: object;
    scratchBlocksDefinition: {
        json: object;
    };
    fieldImplementation: object;
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

    showStatusButton?: boolean;
    menuIconURI?: string;
    customFieldTypes?: any;
    menuInfo?: Record<string, object>;
}

const DEFAULT_COLORS = ['#0FBD8C', '#0DA57A', '#0B8E69'];

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
 * Define a block with given JSON content.
 * @param json JSON content of block.
 * @returns Block definition.
 */
function defineStaticBlock(json: any) {
    return {
        init(this: any) {
            this.jsonInit(json);
        }
    };
}

/**
 * Adapter to load scratch extension.
 */
export abstract class ScratchBaseAdapter implements IExtension {
    /** Extension manager. */
    private manager!: ExtensionManager;

    /** Whether the extension is enabled. */
    private enabled: boolean = false;

    /** Cache for CategoryInfo. */
    private cachedCategoryInfo: CategoryInfo | null = null;

    /**
     * @param manifest Manifest for extension library to display info.
     * @param runtime Runtime object of virtual machine.
     */
    constructor(
        protected manifest: ExtensionManifest,
        protected runtime: any
    ) {}

    /**
     * Attach the extension to given manager.
     * The method will be called when loading the extension.
     * @param manager Extension manager instance.
     * @internal
     */
    attachManager(manager: ExtensionManager): void {
        this.manager = manager;
    }

    /**
     * Get ID of the extension.
     * @returns ID of the extension.
     */
    getId(): string {
        return this.manifest.extensionId;
    }

    /**
     * Get info to display in extension library.
     * @returns Manifest of the extension.
     */
    getManifest(): ExtensionManifest {
        return this.manifest;
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
     * Derived adapters should override this function to instantiate the extension.
     */
    enable(): Promise<void> {
        this.enabled = true;
        return this.refreshInfo();
    }

    /**
     * Disable the extension.
     */
    async disable(): Promise<void> {
        // @todo support disable extension.
        this.enabled = false;
    }

    /**
     * Refresh and cache the category info.
     */
    abstract refreshInfo(): Promise<void>;

    /**
     * Get toolbox content for Blockly.
     * The method should only be called when extension is enabled.
     */
    getToolboxContents(isStage: boolean): any {
        const categoryInfo = this.cachedCategoryInfo;
        return {
            id: this.getId(),
            xml: categoryInfo ? this.buildToolboxXML(categoryInfo, isStage) : ''
        };
    }

    /**
     * Call method by name and given arguments. Will only be called after instantiated.
     * Should be implemented by derived adapters.
     * @param method Method name.
     * @param args Arguments passed to method.
     * @returns Result of calling the method, or undefined if no valid method is found.
     */
    protected abstract callMethod<R, Args extends any[]>(method: string, ...args: Args): R | undefined;

    /**
     * Refresh and cache the category info. Should be called after calling getInfo.
     * An error might be thrown if info is invalid.
     * @param info Object returned from getInfo.
     */
    protected processInfo(info: ExtensionMetadata) {
        const extensionInfo = this.prepareExtensionInfo(info);
        const categoryInfo = this.buildCategoryInfo(extensionInfo);
        this.cachedCategoryInfo = categoryInfo;
        this.registerExtensionPrimitives(extensionInfo, categoryInfo);
        this.registerBlocks(categoryInfo);
    }

    private buildCategoryInfo(extensionInfo: ProcessedExtensionMetadata): CategoryInfo {
        const categoryInfo = {
            id: extensionInfo.id,
            name: maybeFormatMessage(extensionInfo.name),
            showStatusButton: extensionInfo.showStatusButton,
            blockIconURI: extensionInfo.blockIconURI,
            menuIconURI: extensionInfo.menuIconURI,
            color1: extensionInfo.color1 ? extensionInfo.color1! : DEFAULT_COLORS[0],
            color2: extensionInfo.color1 ? extensionInfo.color2! : DEFAULT_COLORS[1],
            color3: extensionInfo.color1 ? extensionInfo.color3! : DEFAULT_COLORS[2],
            blocks: [] as ConvertedBlockInfo[],
            menus: [] as object[],
            customFieldTypes: {} as Record<string, CustomFieldInfo>,
            menuInfo: {} as Record<string, object>
        } satisfies CategoryInfo;

        // Menus.
        for (const menuName in extensionInfo.menus) {
            if (Object.prototype.hasOwnProperty.call(extensionInfo.menus, menuName)) {
                const menuInfo = extensionInfo.menus[menuName];
                const convertedMenu = this.runtime._buildMenuForScratchBlocks(menuName, menuInfo, categoryInfo);
                categoryInfo.menus.push(convertedMenu);
                categoryInfo.menuInfo[menuName] = menuInfo;
            }
        }

        // Custom field types.
        for (const fieldTypeName in extensionInfo.customFieldTypes) {
            if (Object.prototype.hasOwnProperty.call(extensionInfo.customFieldTypes, fieldTypeName)) {
                const fieldType = extensionInfo.customFieldTypes[fieldTypeName];
                const fieldTypeInfo = this.runtime._buildCustomFieldInfo(
                    fieldTypeName,
                    fieldType,
                    extensionInfo.id,
                    categoryInfo
                );

                categoryInfo.customFieldTypes[fieldTypeName] = fieldTypeInfo;
            }
        }

        // Blocks.
        for (const blockInfo of extensionInfo.blocks) {
            try {
                const convertedBlock = this.runtime._convertForScratchBlocks(blockInfo, categoryInfo);
                categoryInfo.blocks.push(convertedBlock);
            } catch (e) {
                logger.error('Error parsing block: ', {block: blockInfo, error: e});
            }
        }

        return categoryInfo;
    }

    private registerExtensionPrimitives(extensionInfo: ProcessedExtensionMetadata, categoryInfo: CategoryInfo): void {
        const updatePrimitivesPayload: Required<UpdatePrimitivesEvent> = {
            type: 'UPDATE_PRIMITIVES',
            primitives: Object.create(null),
            hats: Object.create(null)
        };

        for (const blockInfo of extensionInfo.blocks) {
            try {
                const convertedBlock = this.runtime._convertForScratchBlocks(blockInfo, categoryInfo);
                if (convertedBlock.json) {
                    const opcode = convertedBlock.json.type;
                    const block = blockInfo as ExtensionBlockMetadata;
                    const blockType = block.blockType;

                    if (blockType !== BlockType.EVENT) {
                        updatePrimitivesPayload.primitives[opcode] = convertedBlock.info.func;
                    }

                    if (blockType === BlockType.EVENT || blockType === BlockType.HAT) {
                        updatePrimitivesPayload.hats[opcode] = {
                            edgeActivated: block.isEdgeActivated,
                            restartExistingThreads: block.shouldRestartExistingThreads
                        };
                    }
                }
            } catch (e) {
                logger.error('Error parsing block: ', {block: blockInfo, error: e});
            }
        }

        this.manager.emitEvent(updatePrimitivesPayload);
    }

    private registerBlocks(categoryInfo: CategoryInfo): void {
        // scratch-blocks implements a menu or custom field as a special kind of block ("shadow" block)
        // these actually define blocks and MUST run regardless of the UI state
        const blockInfoArray = categoryInfo.blocks.concat(categoryInfo.menus).concat(
            Object.getOwnPropertyNames(categoryInfo.customFieldTypes).map(
                fieldTypeName => categoryInfo.customFieldTypes[fieldTypeName].scratchBlocksDefinition
            )
        );

        const payload: UpdateBlocksEvent = {
            type: 'UPDATE_BLOCKS',
            blocks: Object.create(null),
            fields: Object.create(null)
        };

        if (blockInfoArray.length > 0) {
            blockInfoArray.forEach(blockInfo => {
                if (blockInfo.info && blockInfo.info.isDynamic) {
                    // This is creating the block factory / constructor -- NOT a specific instance of the block.
                    // The factory should only know static info about the block: the category info and the opcode.
                    // Anything else will be picked up from the XML attached to the block instance.
                    const extendedOpcode = `${categoryInfo.id}_${blockInfo.info.opcode}`;
                    payload.blocks[extendedOpcode] = defineDynamicBlock(categoryInfo, blockInfo, extendedOpcode);
                } else if (blockInfo.json) {
                    // Static blocks.
                    payload.blocks[blockInfo.json.type] = defineStaticBlock(blockInfo.json);
                }
                // otherwise it's a non-block entry such as '---'
            });
        }

        for (const fieldTypeName in categoryInfo.customFieldTypes) {
            const fieldTypeInfo: CustomFieldInfo = categoryInfo.customFieldTypes[fieldTypeName];
            const fieldName = `field_${fieldTypeInfo.extendedName}`;
            payload.fields[fieldName] = fieldTypeInfo.fieldImplementation;
        }

        this.manager.emitEvent(payload);
    }

    private buildToolboxXML(categoryInfo: CategoryInfo, isStage: boolean): string {
        const {name, color1, color2} = categoryInfo;
        // Filter out blocks that aren't supposed to be shown on this target, as determined by the block info's
        // `hideFromPalette` and `filter` properties.
        const paletteBlocks = categoryInfo.blocks.filter(block => {
            let blockFilterIncludesTarget = true;
            // If the block info doesn't include a `filter` property, always include it
            if (block.info.filter) {
                blockFilterIncludesTarget = block.info.filter.includes(
                    isStage ? TargetType.STAGE : TargetType.SPRITE
                );
            }
            // If the block info's `hideFromPalette` is true, then filter out this block
            return blockFilterIncludesTarget && !block.info.hideFromPalette;
        });

        const colorXML = `colour="${color1}" secondaryColour="${color2}"`;

        // Use a menu icon if there is one. Otherwise, use the block icon. If there's no icon,
        // the category menu will show its default colored circle.
        let menuIconURI = '';
        if (categoryInfo.menuIconURI) {
            menuIconURI = categoryInfo.menuIconURI;
        } else if (categoryInfo.blockIconURI) {
            menuIconURI = categoryInfo.blockIconURI;
        }
        const menuIconXML = menuIconURI ?
            `iconURI="${menuIconURI}"` : '';

        let statusButtonXML = '';
        if (categoryInfo.showStatusButton) {
            statusButtonXML = 'showStatusButton="true"';
        }

        const xml = `<category name="${name}" toolboxitemid="${categoryInfo.id}" ` +
            `${statusButtonXML} ${colorXML} ${menuIconXML}>` +
            `${paletteBlocks.map(block => block.xml).join('')}</category>`;
        return xml;
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
    private prepareExtensionInfo(extensionInfo: ExtensionMetadata): ProcessedExtensionMetadata {
        const info = Object.assign({}, extensionInfo) as unknown as ProcessedExtensionMetadata;
        if (!/^[a-z0-9]+$/i.test(info.id)) {
            throw new Error('Invalid extension id');
        }
        info.name = extensionInfo.name || extensionInfo.id;
        info.targetTypes = extensionInfo.targetTypes || [];
        info.blocks = extensionInfo.blocks.reduce<typeof info.blocks>((results, blockInfo) => {
            try {
                let result: '---' | ProcessedExtensionBlockMetadata;
                switch (blockInfo) {
                case '---': // separator
                    result = '---';
                    break;
                default: // an ExtensionBlockMetadata object
                    result = this.prepareBlockInfo(blockInfo);
                    break;
                }
                results.push(result);
            } catch (e) {
                // TODO: more meaningful error reporting
                logger.error(`Error processing block: ${(e as Error).message}, Block:\n${JSON.stringify(blockInfo)}`);
            }
            return results;
        }, []);
        info.menus = this.prepareMenuInfo(extensionInfo.menus || {});
        return info;
    }

    /**
     * Prepare extension menus. e.g. setup binding for dynamic menu functions.
     * @param menus The menu defined by the extension.
     * @returns A menuInfo object with all preprocessing done.
     */
    private prepareMenuInfo(
        menus: Record<string, ExtensionMenuMetadata>
    ): Record<string, ProcessedExtensionMenuMetadata> {
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
                (menuInfo as unknown as ProcessedExtensionMenuMetadata).items = this.getExtensionMenuItems.bind(this, menuItemFunctionName);
            }
        }
        return menus as unknown as Record<string, ProcessedExtensionMenuMetadata>;
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

        const menuItems = this.callMethod<ExtensionMenuItems, [any]>(menuItemFunctionName, editingTargetID)!
            .map<[string, string]>((item) => {
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
    private prepareBlockInfo(blockInfo: ExtensionBlockMetadata): ProcessedExtensionBlockMetadata {
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
                return this.callMethod(funcName, args, util, realBlockInfo);
            };

            (blockInfo as ProcessedExtensionBlockMetadata).func = (args: Record<string, any>, util: any) => {
                const realBlockInfo = getBlockInfo(args);
                // TODO: filter args using the keys of realBlockInfo.arguments? maybe only if sandboxed?
                return callBlockFunc(args, util, realBlockInfo);
            };
            break;
        }
        }

        return blockInfo as ProcessedExtensionBlockMetadata;
    }
}
