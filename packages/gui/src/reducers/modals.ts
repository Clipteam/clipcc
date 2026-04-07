import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const OPEN_MODAL = 'scratch-gui/modals/OPEN_MODAL';
const CLOSE_MODAL = 'scratch-gui/modals/CLOSE_MODAL';

const MODAL_BACKDROP_LIBRARY = 'backdropLibrary';
const MODAL_COSTUME_LIBRARY = 'costumeLibrary';
const MODAL_EXTENSION_LIBRARY = 'extensionLibrary';
const MODAL_LOADING_PROJECT = 'loadingProject';
const MODAL_TELEMETRY = 'telemetryModal';
const MODAL_SOUND_LIBRARY = 'soundLibrary';
const MODAL_SPRITE_LIBRARY = 'spriteLibrary';
const MODAL_SOUND_RECORDER = 'soundRecorder';
const MODAL_CONNECTION = 'connectionModal';
const MODAL_SETTINGS = 'settingsModal';

type ModalName =
    | typeof MODAL_BACKDROP_LIBRARY
    | typeof MODAL_COSTUME_LIBRARY
    | typeof MODAL_EXTENSION_LIBRARY
    | typeof MODAL_LOADING_PROJECT
    | typeof MODAL_TELEMETRY
    | typeof MODAL_SOUND_LIBRARY
    | typeof MODAL_SPRITE_LIBRARY
    | typeof MODAL_SOUND_RECORDER
    | typeof MODAL_CONNECTION
    | typeof MODAL_SETTINGS;

export type ModalsState = Record<ModalName, boolean>;

const initialState: ModalsState = {
    [MODAL_BACKDROP_LIBRARY]: false,
    [MODAL_COSTUME_LIBRARY]: false,
    [MODAL_EXTENSION_LIBRARY]: false,
    [MODAL_LOADING_PROJECT]: false,
    [MODAL_TELEMETRY]: false,
    [MODAL_SOUND_LIBRARY]: false,
    [MODAL_SPRITE_LIBRARY]: false,
    [MODAL_SOUND_RECORDER]: false,
    [MODAL_CONNECTION]: false,
    [MODAL_SETTINGS]: false
};

interface OpenModalAction extends BaseAction<typeof OPEN_MODAL> {
    modal: ModalName;
};

interface CloseModalAction extends BaseAction<typeof CLOSE_MODAL> {
    modal: ModalName;
};

const reducer = function (state: ModalsState = initialState, action: AnyAction): ModalsState {
    switch (action.type) {
    case OPEN_MODAL:
        return Object.assign({}, state, {
            [action.modal]: true
        });
    case CLOSE_MODAL:
        return Object.assign({}, state, {
            [action.modal]: false
        });
    default:
        return state;
    }
};
const openModal = function (modal: ModalName): OpenModalAction {
    return {
        type: OPEN_MODAL,
        modal: modal
    };
};
const closeModal = function (modal: ModalName): CloseModalAction {
    return {
        type: CLOSE_MODAL,
        modal: modal
    };
};
const openBackdropLibrary = function (): OpenModalAction {
    return openModal(MODAL_BACKDROP_LIBRARY);
};
const openCostumeLibrary = function (): OpenModalAction {
    return openModal(MODAL_COSTUME_LIBRARY);
};
const openExtensionLibrary = function (): OpenModalAction {
    return openModal(MODAL_EXTENSION_LIBRARY);
};
const openLoadingProject = function (): OpenModalAction {
    return openModal(MODAL_LOADING_PROJECT);
};
const openTelemetryModal = function (): OpenModalAction {
    return openModal(MODAL_TELEMETRY);
};
const openSoundLibrary = function (): OpenModalAction {
    return openModal(MODAL_SOUND_LIBRARY);
};
const openSpriteLibrary = function (): OpenModalAction {
    return openModal(MODAL_SPRITE_LIBRARY);
};
const openSoundRecorder = function (): OpenModalAction {
    return openModal(MODAL_SOUND_RECORDER);
};
const openConnectionModal = function (): OpenModalAction {
    return openModal(MODAL_CONNECTION);
};
const openSettingsModal = function (): OpenModalAction {
    return openModal(MODAL_SETTINGS);
};
const closeBackdropLibrary = function (): CloseModalAction {
    return closeModal(MODAL_BACKDROP_LIBRARY);
};
const closeCostumeLibrary = function (): CloseModalAction {
    return closeModal(MODAL_COSTUME_LIBRARY);
};
const closeExtensionLibrary = function (): CloseModalAction {
    return closeModal(MODAL_EXTENSION_LIBRARY);
};
const closeLoadingProject = function (): CloseModalAction {
    return closeModal(MODAL_LOADING_PROJECT);
};
const closeTelemetryModal = function (): CloseModalAction {
    return closeModal(MODAL_TELEMETRY);
};
const closeSpriteLibrary = function (): CloseModalAction {
    return closeModal(MODAL_SPRITE_LIBRARY);
};
const closeSoundLibrary = function (): CloseModalAction {
    return closeModal(MODAL_SOUND_LIBRARY);
};
const closeSoundRecorder = function (): CloseModalAction {
    return closeModal(MODAL_SOUND_RECORDER);
};
const closeConnectionModal = function (): CloseModalAction {
    return closeModal(MODAL_CONNECTION);
};
const closeSettingsModal = function (): CloseModalAction {
    return closeModal(MODAL_SETTINGS);
};
export {
    reducer as default,
    initialState as modalsInitialState,
    openBackdropLibrary,
    openCostumeLibrary,
    openExtensionLibrary,
    openLoadingProject,
    openSoundLibrary,
    openSpriteLibrary,
    openSoundRecorder,
    openTelemetryModal,
    openConnectionModal,
    openSettingsModal,
    closeBackdropLibrary,
    closeCostumeLibrary,
    closeExtensionLibrary,
    closeLoadingProject,
    closeSpriteLibrary,
    closeSoundLibrary,
    closeSoundRecorder,
    closeTelemetryModal,
    closeConnectionModal,
    closeSettingsModal
};
