import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const SET_THEME = 'scratch-gui/theme/SET_THEME';

export interface ThemeState {
    theme: string | null;
};

const initialState: ThemeState = {
    theme: null
};

interface SetThemeAction extends BaseAction<typeof SET_THEME> {
    theme: string;
};

const reducer = (state = initialState, action: AnyAction): ThemeState => {
    switch (action.type) {
    case SET_THEME:
        return {...state, theme: action.theme};
    default:
        return state;
    }
};

const setTheme = (theme: string): SetThemeAction => ({
    type: SET_THEME,
    theme
});

export {
    reducer as default,
    initialState as themeInitialState,
    setTheme
};
