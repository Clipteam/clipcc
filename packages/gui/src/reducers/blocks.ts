const SET_BLOCKS = 'scratch-gui/blocks/SET_BLOCKS';
const initialState = null;

// @todo migrating clipcc-block to TypeScript
type ScratchBlocks = any;

interface Action {
    type: string;
    blocks?: ScratchBlocks;
}

const reducer = function (state = initialState, action: Action) {
    switch (action.type) {
    case SET_BLOCKS:
        return action.blocks;
    default:
        return state;
    }
};
const setScratchBlocks = function (blocks: ScratchBlocks) {
    return {
        type: SET_BLOCKS,
        blocks
    };
};

export {
    reducer as default,
    initialState as blocksInitialState,
    setScratchBlocks
};
