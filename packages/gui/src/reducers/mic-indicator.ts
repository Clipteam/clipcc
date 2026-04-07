import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const UPDATE = 'scratch-gui/mic-indicator/UPDATE';

export type MicIndicatorState = boolean;

const initialState: MicIndicatorState = false;

type UpdateMicIndicatorAction = BaseAction<typeof UPDATE> & {
    visible: boolean;
};

const reducer = function (state = initialState, action: AnyAction): MicIndicatorState {
    switch (action.type) {
    case UPDATE:
        return action.visible;
    default:
        return state;
    }
};

const updateMicIndicator = function (visible: boolean): UpdateMicIndicatorAction {
    return {
        type: UPDATE,
        visible: visible
    };
};

export {
    reducer as default,
    initialState as micIndicatorInitialState,
    updateMicIndicator
};
