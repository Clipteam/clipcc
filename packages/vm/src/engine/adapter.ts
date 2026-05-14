import mutationAdapter from './mutation-adapter';
import * as html from 'htmlparser2';
import type {DataNode, Element} from 'domhandler';
import uid from '../util/uid';
import type * as ClipCCBlocks from 'clipcc-block';
import type {VMBlock, VMField, VMMutation} from '../serialization/schema';

type BlockState = ClipCCBlocks.serialization.blocks.State;

/**
 * Convert and an individual block DOM to the representation tree.
 * Based on Blockly's `domToBlockHeadless_`.
 * @param blockDOM DOM tree for an individual block.
 * @param blocks Collection of blocks to add to.
 * @param isTopBlock Whether blocks at this level are "top blocks."
 * @param parent Parent block ID.
 */
const domToBlock = function (
    blockDOM: Element,
    blocks: Record<string, VMBlock>,
    isTopBlock: boolean,
    parent: string | null
) {
    if (!blockDOM.attribs.id) {
        blockDOM.attribs.id = uid();
    }

    // Block skeleton.
    const block: VMBlock = {
        id: blockDOM.attribs.id, // Block ID
        opcode: blockDOM.attribs.type, // For execution, "event_whengreenflag".
        inputs: {}, // Inputs to this block and the blocks they point to.
        fields: {}, // Fields on this block and their values.
        next: null, // Next block in the stack, if one exists.
        topLevel: isTopBlock, // If this block starts a stack.
        parent: parent, // Parent block ID, if available.
        shadow: blockDOM.name === 'shadow', // If this represents a shadow/slot.
        // X position of script, if top-level.
        // eslint-disable-next-line no-negated-condition
        x: typeof blockDOM.attribs.x !== 'undefined' ? Number(blockDOM.attribs.x) : undefined,
        // Y position of script, if top-level.
        // eslint-disable-next-line no-negated-condition
        y: typeof blockDOM.attribs.y !== 'undefined' ? Number(blockDOM.attribs.y) : undefined
    };

    // Add the block to the representation tree.
    blocks[block.id] = block;

    // Process XML children and find enclosed blocks, fields, etc.
    for (let i = 0; i < blockDOM.children.length; i++) {
        const xmlChild = blockDOM.children[i] as Element;
        // Enclosed blocks and shadows
        let childBlockNode: Element | null = null;
        let childShadowNode: Element | null = null;
        for (let j = 0; j < xmlChild.children.length; j++) {
            const grandChildNode = xmlChild.children[j];
            if (!(grandChildNode as Element).name) {
                // Non-XML tag node.
                continue;
            }
            const grandChildNodeName = (grandChildNode as Element).name.toLowerCase();
            if (grandChildNodeName === 'block') {
                childBlockNode = grandChildNode as Element;
            } else if (grandChildNodeName === 'shadow') {
                childShadowNode = grandChildNode as Element;
            }
        }

        // Use shadow block only if there's no real block node.
        if (!childBlockNode && childShadowNode) {
            childBlockNode = childShadowNode;
        }

        // Not all Blockly-type blocks are handled here,
        // as we won't be using all of them for Scratch.
        switch (xmlChild.name.toLowerCase()) {
        case 'field':
        {
            // Add the field to this block.
            const fieldName = xmlChild.attribs.name;
            // Add id in case it is a variable field
            const fieldId = xmlChild.attribs.id;
            let fieldData = '';
            if (xmlChild.children.length > 0 && (xmlChild.children[0] as { data?: string }).data) {
                fieldData = (xmlChild.children[0] as DataNode).data;
            } else {
                fieldData = '';
            }
            block.fields[fieldName] = {
                name: fieldName,
                id: fieldId,
                value: fieldData
            };
            const fieldVarType = xmlChild.attribs.variabletype;
            if (typeof fieldVarType === 'string') {
                block.fields[fieldName].variableType = fieldVarType;
            }
            break;
        }
        case 'comment':
        {
            block.comment = xmlChild.attribs.id;
            break;
        }
        case 'value':
        case 'statement':
        {
            // Recursively generate block structure for input block.
            domToBlock(childBlockNode!, blocks, false, block.id);
            if (childShadowNode && childBlockNode !== childShadowNode) {
                // Also generate the shadow block.
                domToBlock(childShadowNode, blocks, false, block.id);
            }
            // Link this block's input to the child block.
            const inputName = xmlChild.attribs.name;
            block.inputs[inputName] = {
                name: inputName,
                block: childBlockNode!.attribs.id,
                shadow: childShadowNode ? childShadowNode.attribs.id : null
            };
            break;
        }
        case 'next':
        {
            if (!childBlockNode || !childBlockNode.attribs) {
                // Invalid child block.
                continue;
            }
            // Recursively generate block structure for next block.
            domToBlock(childBlockNode, blocks, false, block.id);
            // Link next block to this block.
            block.next = childBlockNode.attribs.id;
            break;
        }
        case 'mutation':
        {
            block.mutation = mutationAdapter(xmlChild);
            break;
        }
        }
    }
};

/**
 * Convert outer blocks DOM from a Blockly CREATE event
 * to a usable form for the Scratch runtime.
 * This structure is based on Blockly xml.js:`domToWorkspace` and `domToBlock`.
 * @param blocksDOM DOM tree for this event.
 * @returns Usable list of blocks from this CREATE event.
 */
const domToBlocks = function (blocksDOM: Element[]): VMBlock[] {
    // At this level, there could be multiple blocks adjacent in the DOM tree.
    const blocks: Record<string, VMBlock> = {};
    for (let i = 0; i < blocksDOM.length; i++) {
        const block = blocksDOM[i];
        if (!block.name || !block.attribs) {
            continue;
        }
        const tagName = block.name.toLowerCase();
        if (tagName === 'block' || tagName === 'shadow') {
            domToBlock(block, blocks, true, null);
        }
    }
    // Flatten blocks object into a list.
    const blocksList: VMBlock[] = [];
    for (const b in blocks) {
        if (!Object.prototype.hasOwnProperty.call(blocks, b)) continue;
        blocksList.push(blocks[b]);
    }
    return blocksList;
};

/**
 * Convert an individual block State to the representation tree.
 * @param blockState JSON State for an individual block.
 * @param blocks Collection of blocks to add to.
 * @param isTopBlock Whether blocks at this level are "top blocks."
 * @param parent Parent block ID.
 * @param isShadow Whether this block is a shadow.
 */
const stateToBlock = function (
    blockState: BlockState,
    blocks: Record<string, VMBlock>,
    isTopBlock: boolean,
    parent: string | null,
    isShadow?: boolean
) {
    if (!blockState.id) {
        blockState.id = uid();
    }

    // Block skeleton.
    const block: VMBlock = {
        id: blockState.id, // Block ID
        opcode: blockState.type, // For execution, "event_whengreenflag".
        inputs: {}, // Inputs to this block and the blocks they point to.
        fields: {}, // Fields on this block and their values.
        next: null, // Next block in the stack, if one exists.
        topLevel: isTopBlock, // If this block starts a stack.
        parent: parent, // Parent block ID, if available.
        shadow: isShadow || false, // If this represents a shadow/slot.
        x: blockState.x, // X position of script, if top-level.
        y: blockState.y // Y position of script, if top-level.
    };

    // Add the block to the representation tree.
    blocks[block.id] = block;

    // Process fields
    if (blockState.fields) {
        for (const fieldName in blockState.fields) {
            if (!Object.prototype.hasOwnProperty.call(blockState.fields, fieldName)) continue;
            const fieldData = blockState.fields[fieldName];
            const field: VMField = {
                name: fieldName
            };
            if (typeof fieldData === 'object' && fieldData !== null && fieldData.id) {
                field.value = fieldData.name || fieldData.id;
                field.id = fieldData.id;
                if (fieldData.variableType) {
                    field.variableType = fieldData.variableType;
                }
            } else {
                field.value = fieldData;
            }
            block.fields[fieldName] = field;
        }
    }

    // Process inputs
    if (blockState.inputs) {
        for (const inputName in blockState.inputs) {
            if (!Object.prototype.hasOwnProperty.call(blockState.inputs, inputName)) continue;
            const connection = blockState.inputs[inputName];
            let childBlockId: string | null = null;
            let childShadowId: string | null = null;

            if (connection.block) {
                stateToBlock(connection.block, blocks, false, block.id, false);
                childBlockId = connection.block.id!;
            }
            if (connection.shadow) {
                stateToBlock(connection.shadow, blocks, false, block.id, true);
                childShadowId = connection.shadow.id!;
            }

            // Link this block's input to the child block.
            let targetBlockId = childBlockId;
            // Use shadow block only if there's no real block node.
            if (!targetBlockId && childShadowId) {
                targetBlockId = childShadowId;
            }

            block.inputs[inputName] = {
                name: inputName,
                block: targetBlockId,
                shadow: childShadowId
            };
        }
    }

    // Process next
    if (blockState.next) {
        const nextConnection = blockState.next;
        if (nextConnection.block) {
            stateToBlock(nextConnection.block, blocks, false, block.id, false);
            block.next = nextConnection.block.id!;
        }
    }

    // Process mutation
    if (blockState.extraState) {
        block.mutation = blockState.extraState as VMMutation;
    }

    // Process comments
    if (blockState.icons?.comment) {
        const commentState = blockState.icons.comment;
        block.comment = commentState.id;
        // This won't belongs to VM representation but need for BlockCreate. should omit further.
        block.commentData = commentState;
    }
};

/**
 * Blockly blocks JSON state to Scratch VM blocks representation.
 * @param blocksState The JSON state of the blocks to convert.
 * @returns Usable list of blocks from this CREATE event.
 */
const stateToBlocks = function (blocksState: BlockState | BlockState[]): VMBlock[] {
    const blocks: Record<string, VMBlock> = {};
    if (Array.isArray(blocksState)) {
        blocksState.forEach(blockState => {
            stateToBlock(blockState, blocks, true, null);
        });
    } else {
        stateToBlock(blocksState, blocks, true, null);
    }

    // Flatten blocks object into a list.
    const blocksList: VMBlock[] = [];
    for (const b in blocks) {
        if (!Object.prototype.hasOwnProperty.call(blocks, b)) continue;
        blocksList.push(blocks[b]);
    }
    return blocksList;
};

export type AdaptableEvents =
    (ClipCCBlocks.Events.BlockCreate | ClipCCBlocks.BlockDragEnd) & {xml?: { outerHTML: string }};

/**
 * Adapter between block creation events and block representation which can be
 * used by the Scratch runtime.
 * @param e `Blockly.events.create` or `Blockly.events.endDrag`
 * @returns List of blocks from this CREATE event.
 */
const adapter = function (e: AdaptableEvents): VMBlock[] | undefined {
    // Validate input
    if (typeof e !== 'object') return;

    // Prefer using JSON serialization
    if (e.json && typeof e.json === 'object') {
        return stateToBlocks(e.json);
    }
    if (typeof e.xml !== 'object') return;
    return domToBlocks(html.parseDOM(e.xml.outerHTML, {decodeEntities: true}) as Element[]);
};

export default adapter;
