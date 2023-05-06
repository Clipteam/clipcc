import {ExtensionManager} from 'clipcc-extension';

const SET_EXTENSION_MANAGER = 'scratch-gui/vm/SET_EXTENSION_MANAGER';
const defaultManager = new ExtensionManager();
const initialState = defaultManager;

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_EXTENSION_MANAGER:
        return action.manager;
    default:
        return state;
    }
};
const setExtensionManager = function (manager) {
    return {
        type: SET_EXTENSION_MANAGER,
        manager: manager
    };
};

export {
    reducer as default,
    initialState as extensionManagerInitialState,
    setExtensionManager
};
