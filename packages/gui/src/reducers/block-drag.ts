import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const BLOCK_DRAG_UPDATE = 'scratch-gui/block-drag/BLOCK_DRAG_UPDATE';

export type BlockDragState = boolean;

const initialState: BlockDragState = false;

interface BlockDragUpdateAction extends BaseAction<typeof BLOCK_DRAG_UPDATE> {
    areBlocksOverGui: boolean;
    meta: {
        throttle: number;
    };
};

const reducer = function (state = initialState, action: AnyAction): BlockDragState {
    switch (action.type) {
    case BLOCK_DRAG_UPDATE:
        return action.areBlocksOverGui;
    default:
        return state;
    }
};

const updateBlockDrag = function (areBlocksOverGui: boolean): BlockDragUpdateAction {
    return {
        type: BLOCK_DRAG_UPDATE,
        areBlocksOverGui: areBlocksOverGui,
        meta: {
            throttle: 30
        }
    };
};

export {
    reducer as default,
    initialState as blockDragInitialState,
    updateBlockDrag
};
