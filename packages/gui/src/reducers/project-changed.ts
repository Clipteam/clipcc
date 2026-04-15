import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const SET_PROJECT_CHANGED = 'scratch-gui/project-changed/SET_PROJECT_CHANGED';

export type ProjectChangedState = boolean;

const initialState: ProjectChangedState = false;

interface SetProjectChangedAction extends BaseAction<typeof SET_PROJECT_CHANGED> {
    changed: boolean;
};

const reducer = function (state = initialState, action: AnyAction): ProjectChangedState {
    switch (action.type) {
    case SET_PROJECT_CHANGED:
        return action.changed;
    default:
        return state;
    }
};
const setProjectChanged = (): SetProjectChangedAction => ({
    type: SET_PROJECT_CHANGED,
    changed: true
});
const setProjectUnchanged = (): SetProjectChangedAction => ({
    type: SET_PROJECT_CHANGED,
    changed: false
});

export {
    reducer as default,
    initialState as projectChangedInitialState,
    setProjectChanged,
    setProjectUnchanged
};
