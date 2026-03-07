const UPDATE_TOOLBOX = 'scratch-gui/toolbox/UPDATE_TOOLBOX';
import makeToolbox from '../lib/make-toolbox';

const initialState = {
    toolbox: makeToolbox(true)
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case UPDATE_TOOLBOX:
        return Object.assign({}, state, {
            toolbox: action.toolbox
        });
    default:
        return state;
    }
};

const updateToolbox = function (toolbox) {
    return {
        type: UPDATE_TOOLBOX,
        toolbox: toolbox
    };
};

export {
    reducer as default,
    initialState as toolboxInitialState,
    updateToolbox
};
