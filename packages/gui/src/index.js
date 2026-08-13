import GUI from './containers/gui.tsx';
import AppStateHOC from './lib/app-state-hoc.tsx';
import GuiReducer, {guiInitialState, guiMiddleware, initEmbedded, initFullScreen, initPlayer} from './reducers/gui';
import LocalesReducer, {localesInitialState, initLocale} from './reducers/locales';
import {
    defaultProjectId,
    LoadingState,
    onLoadedProject,
    requestNewProject,
    requestProjectUpload,
    setProjectId,
    remixProject
} from './reducers/project-state';
import {
    openLoadingProject,
    closeLoadingProject,
    openTelemetryModal
} from './reducers/modals';
import {ScratchPaintReducer} from 'clipcc-paint';
import {setFullScreen, setPlayer} from './reducers/mode';
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
    defaultProjectId,
    LoadingState,
    onLoadedProject,
    requestNewProject,
    requestProjectUpload,
    setProjectId,
    openLoadingProject,
    closeLoadingProject,
    openTelemetryModal,
    localesInitialState,
    remixProject,
    setFullScreen,
    setPlayer,
    totallyNormalStrings
};
