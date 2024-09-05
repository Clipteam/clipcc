import { Manager } from 'clipcc-extension';

const SET_MANAGER = 'scratch-gui/ccx/SET_MANAGER';
const defaultManager = new Manager();
const initialState = defaultManager;

interface Action {
    type: string;
    manager?: Manager;
}

const reducer = function (state = initialState, action: Action) {
    switch (action.type) {
        case SET_MANAGER:
            return action.manager as Manager;
        default:
            return state;
    }
};

const setManager = function (manager: Manager) {
    return {
        type: SET_MANAGER,
        manager
    };
};

export {
    reducer as default,
    initialState as ccxInitialState,
    setManager
};
