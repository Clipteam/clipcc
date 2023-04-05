const UPDATE = 'scratch-gui/settings/UPDATE';

const defaultState = {
    autoSave: false,
    autoSaveInterval: 120,
    compression: 6,
    framerate: 30
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
