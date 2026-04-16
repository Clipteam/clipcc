import GUI from './containers/gui.tsx';
import AppStateHOC from './lib/app-state-hoc.tsx';
import GuiReducer, {guiInitialState, guiMiddleware, initEmbedded, initFullScreen, initPlayer} from './reducers/gui';
import LocalesReducer, {localesInitialState, initLocale} from './reducers/locales';
import {ScratchPaintReducer} from 'clipcc-paint';
import {setFullScreen, setPlayer} from './reducers/mode';
import {remixProject} from './reducers/project-state';
import {setAppElement} from 'react-modal';
import totallyNormalStrings from './lib/l10n.js';

const guiReducers = {
    locales: LocalesReducer,
    scratchGui: GuiReducer,
    scratchPaint: ScratchPaintReducer
};

export {
    GUI as default,
    AppStateHOC,
    setAppElement,
    guiReducers,
    guiInitialState,
    guiMiddleware,
    initEmbedded,
    initPlayer,
    initFullScreen,
    initLocale,
    localesInitialState,
    remixProject,
    setFullScreen,
    setPlayer,
    totallyNormalStrings
};
