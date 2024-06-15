const UPDATE_TOOLBOX = 'scratch-gui/toolbox/UPDATE_TOOLBOX';
import makeToolboxContents from '../lib/make-toolbox';

const initialState = {
    toolboxContents: makeToolboxContents(true)
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case UPDATE_TOOLBOX:
        return Object.assign({}, state, {
            toolboxContents: action.toolboxContents
        });
    default:
        return state;
    }
};

const updateToolbox = function (toolboxContents) {
    return {
        type: UPDATE_TOOLBOX,
        toolboxContents: toolboxContents
    };
};

export {
    reducer as default,
    initialState as toolboxInitialState,
    updateToolbox
};
