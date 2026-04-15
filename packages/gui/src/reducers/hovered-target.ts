import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const SET_HOVERED_SPRITE = 'scratch-gui/hovered-target/SET_HOVERED_SPRITE';
const SET_RECEIVED_BLOCKS = 'scratch-gui/hovered-target/SET_RECEIVED_BLOCKS';

export interface HoveredTargetState {
    sprite: string | null;
    receivedBlocks: boolean;
};

const initialState: HoveredTargetState = {
    sprite: null,
    receivedBlocks: false
};

interface SetHoveredSpriteAction extends BaseAction<typeof SET_HOVERED_SPRITE> {
    spriteId: string | null;
    meta: {
        throttle: number;
    };
};

interface SetReceivedBlocksAction extends BaseAction<typeof SET_RECEIVED_BLOCKS> {
    receivedBlocks: boolean;
};

const reducer = function (state: HoveredTargetState = initialState, action: AnyAction): HoveredTargetState {
    switch (action.type) {
    case SET_HOVERED_SPRITE:
        return {
            sprite: action.spriteId,
            receivedBlocks: false
        };
    case SET_RECEIVED_BLOCKS:
        return {
            sprite: state.sprite,
            receivedBlocks: action.receivedBlocks
        };
    default:
        return state;
    }
};

const setHoveredSprite = function (spriteId: string | null): SetHoveredSpriteAction {
    return {
        type: SET_HOVERED_SPRITE,
        spriteId: spriteId,
        meta: {
            throttle: 30
        }
    };
};

const setReceivedBlocks = function (receivedBlocks: boolean): SetReceivedBlocksAction {
    return {
        type: SET_RECEIVED_BLOCKS,
        receivedBlocks: receivedBlocks
    };
};

export {
    reducer as default,
    initialState as hoveredTargetInitialState,
    setHoveredSprite,
    setReceivedBlocks
};
