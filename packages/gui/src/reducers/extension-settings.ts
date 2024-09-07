import type { CCX } from 'clipcc-extension';

const NEW_EXTENSION = 'clipcc-gui/extension-settings/NEW_EXTENSION' as const;

interface ExtensionSettings {
    [id: CCX.Manifest['id']]: CCX.Settings
}

interface Action {
    type: typeof NEW_EXTENSION;
    id: CCX.Manifest['id'];
    options: CCX.Settings;
}

const initialState: ExtensionSettings = {};

const reducer = function (state: ExtensionSettings, action: Action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
        case NEW_EXTENSION:
            state[action.id] = action.options;
            return Object.assign({}, state);
        default:
            return state;
    }
};

const newExtensionSettings = (id: CCX.Manifest['id'], options: CCX.Settings) => ({
    type: NEW_EXTENSION,
    id,
    options
});

export {
    reducer as default,
    initialState as extensionSettingsInitialState,
    newExtensionSettings
};
