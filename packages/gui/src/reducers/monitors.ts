import {OrderedMap} from 'immutable';
import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const UPDATE_MONITORS = 'scratch-gui/monitors/UPDATE_MONITORS';

export type MonitorsState = OrderedMap<string, unknown>;

const initialState: MonitorsState = OrderedMap<string, unknown>();

interface UpdateMonitorsAction extends BaseAction<typeof UPDATE_MONITORS> {
    monitors: MonitorsState;
    meta: {
        throttle: number;
    };
};

const reducer = function (state = initialState, action: AnyAction): MonitorsState {
    switch (action.type) {
    case UPDATE_MONITORS:
        return action.monitors;
    default:
        return state;
    }
};

const updateMonitors = function (monitors: MonitorsState): UpdateMonitorsAction {
    return {
        type: UPDATE_MONITORS,
        monitors: monitors,
        meta: {
            throttle: 30
        }
    };
};

export {
    reducer as default,
    initialState as monitorsInitialState,
    updateMonitors
};
