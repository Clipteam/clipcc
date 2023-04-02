const UPDATE = 'scratch-gui/settings/UPDATE';

const initialState = {
    autoSave: false,
    infiniteCloning: false,
    edgelessStage: false,
    unlimitedListLength: false,
    unlimitedPenSize: false,
    unlimitedSoundStuffs: false,
    accurateMouseCoordinates: false,
    autoSaveInterval: 120,
    compression: 6,
    framerate: 30
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case UPDATE:
        return Object.assign({}, state, action.settings);
    default:
        return state;
    }
};

const updateSettings = function (settings) {
    return {
        type: UPDATE,
        settings: settings
    };
};

export {
    reducer as default,
    initialState as settingsInitialState,
    updateSettings
};
