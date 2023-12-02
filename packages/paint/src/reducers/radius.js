import log from '../log/log';

const CHANGE_RADIUS = 'scratch-paint/rect/CHANGE_RADIUS';
const initialState = 0;

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case CHANGE_RADIUS:
        if (isNaN(action.radius)) {
            log.warn(`Invalid radius: ${action.radius}`);
            return state;
        }
        return Math.max(0, action.radius);
    default:
        return state;
    }
};

// Action creators ==================================
const changeRadius = function (radius) {
    return {
        type: CHANGE_RADIUS,
        radius: radius
    };
};

export {
    reducer as default,
    changeRadius
};
