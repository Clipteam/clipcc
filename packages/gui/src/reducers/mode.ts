import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const SET_FULL_SCREEN = 'scratch-gui/mode/SET_FULL_SCREEN';
const SET_PLAYER = 'scratch-gui/mode/SET_PLAYER';

export interface ModeState {
    showBranding: boolean;
    isFullScreen: boolean;
    isPlayerOnly: boolean;
    hasEverEnteredEditor: boolean;
};

const initialState: ModeState = {
    showBranding: false,
    isFullScreen: false,
    isPlayerOnly: false,
    hasEverEnteredEditor: true
};

interface SetFullScreenAction extends BaseAction<typeof SET_FULL_SCREEN> {
    isFullScreen: boolean;
};

interface SetPlayerAction extends BaseAction<typeof SET_PLAYER> {
    isPlayerOnly: boolean;
};

const reducer = function (state = initialState, action: AnyAction): ModeState {
    switch (action.type) {
    case SET_FULL_SCREEN:
        return Object.assign({}, state, {
            isFullScreen: action.isFullScreen
        });
    case SET_PLAYER:
        return Object.assign({}, state, {
            isPlayerOnly: action.isPlayerOnly,
            hasEverEnteredEditor: state.hasEverEnteredEditor || !action.isPlayerOnly
        });
    default:
        return state;
    }
};

const setFullScreen = function (isFullScreen: boolean): SetFullScreenAction {
    return {
        type: SET_FULL_SCREEN,
        isFullScreen: isFullScreen
    };
};
const setPlayer = function (isPlayerOnly: boolean): SetPlayerAction {
    return {
        type: SET_PLAYER,
        isPlayerOnly: isPlayerOnly
    };
};

export {
    reducer as default,
    initialState as modeInitialState,
    setFullScreen,
    setPlayer
};
