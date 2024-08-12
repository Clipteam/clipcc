const CHANGE_BOOLOPT_MODE = 'scratch-paint/boolopt/CHANGE_BOOLOPT_MODE';
const initialState = 'unite';

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case CHANGE_BOOLOPT_MODE:
        if (!action.mode) return state;
        return action.mode;
    default:
        return state;
    }
};

// Action creators ==================================
const changeBoolOptMode = function (mode) {
    return {
        type: CHANGE_BOOLOPT_MODE,
        mode: mode
    };
};

export {
    reducer as default,
    changeBoolOptMode
};
