const UPDATE = 'scratch-gui/settings/UPDATE';
const NEW_ITEM = 'scratch-gui/settings/NEW_ITEM';
const RESET_DEFAULT = 'scratch-gui/settings/RESET_DEFAULT';

const defaultState = {
    hideNonVanillaBlocks: false,
    autoSave: false,
    infiniteCloning: false,
    edgelessStage: false,
    unlimitedListLength: false,
    unlimitedPenSize: false,
    unlimitedSoundStuffs: false,
    accurateCoordinates: false,
    autoSaveInterval: 120,
    compression: 6,
    framerate: 30,
    theme: 'system'
};

const initialState = JSON.parse(localStorage.getItem('settings')) || {};
let needUpdate = false;
for (const key in defaultState) {
    if (!initialState.hasOwnProperty(key)) {
        initialState[key] = defaultState[key];
        needUpdate = true;
    }
}
if (needUpdate) localStorage.setItem('settings', JSON.stringify(initialState));


const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case UPDATE: {
        const newSettings = Object.assign({}, state, action.settings);
        localStorage.setItem('settings', JSON.stringify(newSettings));
        return newSettings;
    }
    case NEW_ITEM: {
        if (state.hasOwnProperty(action.key)) {
            // if the setting item already exists
            return state;
        }
        const newSettings = Object.assign({}, state, {
            [action.key]: action.defaultValue
        });
        localStorage.setItem('settings', JSON.stringify(newSettings));
        return newSettings;
    }
    case RESET_DEFAULT:
        localStorage.setItem('settings', JSON.stringify(defaultState));
        return defaultValue;
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

const addNewSetting = (key, defaultValue) => ({
    type: NEW_ITEM,
    key,
    defaultValue
});

const resetSettingsToDefault = () => ({
    type: RESET_DEFAULT
});

export {
    reducer as default,
    initialState as settingsInitialState,
    updateSettings,
    addNewSetting,
    resetSettingsToDefault
};
