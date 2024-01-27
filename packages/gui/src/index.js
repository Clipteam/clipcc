import GUI from './containers/gui.jsx';
import AppStateHOC from './lib/app-state-hoc.jsx';
import HashParserHOC from './lib/hash-parser-hoc.jsx';
import GuiReducer, {guiInitialState, guiMiddleware, initEmbedded, initFullScreen, initPlayer} from './reducers/gui';
import LocalesReducer, {localesInitialState, initLocale} from './reducers/locales';
import {ScratchPaintReducer} from 'clipcc-paint';
import {setFullScreen, setPlayer} from './reducers/mode';
import {remixProject} from './reducers/project-state';
import {setAppElement} from 'react-modal';
import {compose} from 'redux';
import totallyNormalStrings from './lib/l10n.js';
import r2wc from '@r2wc/react-to-web-component';

const guiReducers = {
    locales: LocalesReducer,
    scratchGui: GuiReducer,
    scratchPaint: ScratchPaintReducer
};

function addWebComponent () {
    // note that redux's 'compose' function is just being used as a general utility to make
    // the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
    // ability to compose reducers.
    const WrappedGui = compose(
        AppStateHOC,
        HashParserHOC
    )(GUI);
    const WebGUI = r2wc(WrappedGui, {
        props: {
            isPlayerOnly: 'boolean',
            canEditTitle: 'boolean',
            canSave: 'boolean',
            canRemix: 'boolean',
            canShare: 'boolean',
            backpackVisible: 'boolean',
            assetHost: 'string',
            cloudHost: 'string',
            backpackHost: 'string',
            projectHost: 'string',
            onClickLogo: 'function',
            onUpdateProjectId: 'function',
            onVmInit: 'function',
            onStorageInit: 'function',
            onSeeCommunity: 'function'
        }
    });
    class WrappedWebGUI extends WebGUI {
        connectedCallback () {
            super.connectedCallback();
            // Fix web component's display issue
            requestAnimationFrame(() => {
                window.dispatchEvent(new Event('resize'));
                window.dispatchEvent(new Event('wc-after-connected'));
            });
        }
    }
    customElements.define('clipcc-gui', WrappedWebGUI);
}

export {
    GUI as default,
    HashParserHOC,
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
    totallyNormalStrings,
    addWebComponent
};
