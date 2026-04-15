import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const SET_RUNNING_STATE = 'scratch-gui/vm-status/SET_RUNNING_STATE';
const SET_TURBO_STATE = 'scratch-gui/vm-status/SET_TURBO_STATE';
const SET_STARTED_STATE = 'scratch-gui/vm-status/SET_STARTED_STATE';

export interface VmStatusState {
    running: boolean;
    started: boolean;
    turbo: boolean;
};

const initialState: VmStatusState = {
    running: false,
    started: false,
    turbo: false
};

interface SetStartedStateAction extends BaseAction<typeof SET_STARTED_STATE> {
    started: boolean;
};

interface SetRunningStateAction extends BaseAction<typeof SET_RUNNING_STATE> {
    running: boolean;
};

interface SetTurboStateAction extends BaseAction<typeof SET_TURBO_STATE> {
    turbo: boolean;
};

const reducer = function (state = initialState, action: AnyAction): VmStatusState {
    switch (action.type) {
    case SET_STARTED_STATE:
        return Object.assign({}, state, {
            started: action.started
        });
    case SET_RUNNING_STATE:
        return Object.assign({}, state, {
            running: action.running
        });
    case SET_TURBO_STATE:
        return Object.assign({}, state, {
            turbo: action.turbo
        });
    default:
        return state;
    }
};

const setStartedState = function (started: boolean): SetStartedStateAction {
    return {
        type: SET_STARTED_STATE,
        started: started
    };
};


const setRunningState = function (running: boolean): SetRunningStateAction {
    return {
        type: SET_RUNNING_STATE,
        running: running
    };
};

const setTurboState = function (turbo: boolean): SetTurboStateAction {
    return {
        type: SET_TURBO_STATE,
        turbo: turbo
    };
};

export {
    reducer as default,
    initialState as vmStatusInitialState,
    setRunningState,
    setStartedState,
    setTurboState
};
