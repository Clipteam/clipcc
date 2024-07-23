import keyMirror from 'keymirror';
import defaults from 'lodash.defaultsdeep';

const Types = keyMirror({
    SET_INFO: 'clipcc-gui/session/SET_INFO',
    SET_PERMISSIONS: 'clipcc-gui/session/SET_PERMISSIONS',
    SET_TOKEN: 'clipcc-gui/session/SET_TOKEN'
});

const initialState = {
    info: {},
    permissions: [],
    token: null
};

const reducer = (state, action) => {
    // Reducer for handling changes to session state
    if (typeof state === 'undefined') {
        state = initialState;
    }
    switch (action.type) {
    case Types.SET_INFO:
        return defaults({info: action.info}, state);
    case Types.SET_TOKEN:
        return defaults({token: action.token}, state);
    case Types.SET_PERMISSIONS:
        return defaults({permissions: action.permissions}, state);
    default:
        return state;
    }
};


const setInfo = info => ({
    type: Types.SET_INFO,
    info
});

const setPermissions = permissions => ({
    type: Types.SET_PERMISSIONS,
    permissions
});

const setToken = token => ({
    type: Types.SET_TOKEN,
    token
});

export {
    reducer as default,
    initialState as sessionInitialState,
    setToken,
    setPermissions,
    setInfo
};
