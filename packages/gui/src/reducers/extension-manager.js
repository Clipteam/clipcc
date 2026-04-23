import {ExtensionManager} from 'clipcc-extension';

const SET_EXTENSION_MANAGER = 'scratch-gui/extension-manager/SET_EXTENSION_MANAGER';
const defaultExtensionManager = new ExtensionManager();
const initialState = defaultExtensionManager;

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_EXTENSION_MANAGER:
        return action.extensionManager;
    default:
        return state;
    }
};

const setExtensionManager = function (extensionManager) {
    return {
        type: SET_EXTENSION_MANAGER,
        extensionManager: extensionManager
    };
};

export {
    reducer as default,
    initialState as extensionManagerInitialState,
    setExtensionManager
};
