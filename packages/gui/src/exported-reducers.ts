import {ScratchPaintReducer} from 'clipcc-paint';
import LocalesReducer, {localesInitialState, initLocale} from './reducers/locales.js';
import GuiReducer, {
    buildInitialState,
    guiMiddleware,
    initEmbedded,
    initFullScreen,
    initPlayer
} from './reducers/gui';
import {setFullScreen, setPlayer, setEmbedded} from './reducers/mode.js';
import {remixProject} from './reducers/project-state.js';

export const guiReducers = {
    locales: LocalesReducer,
    scratchGui: GuiReducer,
    scratchPaint: ScratchPaintReducer
};

export {
    buildInitialState,
    guiMiddleware,
    initEmbedded,
    initPlayer,
    initFullScreen,
    initLocale,
    localesInitialState,
    setFullScreen,
    setPlayer,
    setEmbedded,
    remixProject
};
