import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const SET_FONTS_LOADED = 'fontsLoaded/SET_FONTS_LOADED';

export type FontsLoadedState = boolean;

const initialState: FontsLoadedState = false;

interface SetFontsLoadedAction extends BaseAction<typeof SET_FONTS_LOADED> {
    loaded: true;
};

const reducer = function (state = initialState, action: AnyAction): FontsLoadedState {
    switch (action.type) {
    case SET_FONTS_LOADED:
        return action.loaded;
    default:
        return state;
    }
};
const setFontsLoaded = (): SetFontsLoadedAction => ({
    type: SET_FONTS_LOADED,
    loaded: true
});

export {
    reducer as default,
    initialState as fontsLoadedInitialState,
    setFontsLoaded
};
