const uid = require('../util/uid');

/**
 * Convert and an individual block state to the representation tree.
 * Based on Blockly.serialzation.blocks.save`.
 * @param {Object} state Block state for an individual block.
 * @param {object} blocks Collection of blocks to add to.
 * @param {boolean} isTopBlock Whether blocks at this level are "top blocks."
 * @param {?string} parent Parent block ID.
 * @return {undefined}
 */
const stateToBlock = function (state, blocks, isTopBlock, parent) {
    // Block skeleton.
    const block = {
        id: state.id ?? uid(), // Block ID
        opcode: state.type, // For execution, "event_whengreenflag".
        inputs: {}, // Inputs to this block and the blocks they point to.
        fields: {}, // Fields on this block and their values.
        next: null, // Next block in the stack, if one exists.
        topLevel: isTopBlock, // If this block starts a stack.
        parent: parent, // Parent block ID, if available.
        shadow: state.shadow, // If this represents a shadow/slot.
        x: state.x, // X position of script, if top-level.
        y: state.y // Y position of script, if top-level.
    };

    // Add the block to the representation tree.
    blocks[block.id] = block;

    // Add fields
    for (const fieldName in state.fields) {
        const field = state.fields[fieldName];
        block.fields[fieldName] = {
            name: fieldName,
            id: field.id,
            value: field.id ? field.value : field
        };
    }

    // Add inputs
    for (const inputName in state.inputs) {
        const input = state.inputs[inputName];
        stateToBlock(input.block, blocks, false, block.id);
        block.inputs[inputName] = {
            name: inputName,
            block: input.block.id,
            shadow: input.block.shadow ? input.block.id : null
        }
    }
    //Add comments
    if (state.comment) {
        block.comment = state.comment.id;
    }
    // Add next
    if (state.next) {
        stateToBlock(state.next.id, blocks, false, block.id);
        block.next = state.next.id;
    }
    // Add mutation
    if (state.extraState) {
        block.mutation = state.extraState;
    }
};

/**
 * Convert outer blocks state from a Blockly CREATE event
 * to a usable form for the Scratch runtime.
 * This structure is based on Blockly xml.js:`domToWorkspace` and `domToBlock`.
 * @param {Object} state state for this event.
 * @return {Array.<object>} Usable list of blocks from this CREATE event.
 */
const stateToBlocks = function (state) {
    // At this level, there could be multiple blocks adjacent in the DOM tree.
    const blocks = {};
    stateToBlock(state, blocks, true, null);
    // Flatten blocks object into a list.
    const blocksList = [];
    for (const b in blocks) {
        if (!blocks.hasOwnProperty(b)) continue;
        blocksList.push(blocks[b]);
    }
    return blocksList;
};

/**
 * Adapter between block creation events and block representation which can be
 * used by the Scratch runtime.
 * @param {object} e `Blockly.events.create` or `Blockly.events.endDrag`
 * @return {Array.<object>} List of blocks from this CREATE event.
 */
const adapter = function (e) {
    // Validate input
    if (typeof e !== 'object') return;
    if (typeof e.json !== 'object') return;

    return stateToBlocks(e.json);
};

module.exports = adapter;
