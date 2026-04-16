import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const SET_AUTOSAVE_TIMEOUT_ID = 'timeout/SET_AUTOSAVE_TIMEOUT_ID';

export interface TimeoutState {
    autoSaveTimeoutId: ReturnType<typeof setTimeout> | null;
};

const initialState: TimeoutState = {
    autoSaveTimeoutId: null
};

interface SetAutoSaveTimeoutIdAction extends BaseAction<typeof SET_AUTOSAVE_TIMEOUT_ID> {
    id: ReturnType<typeof setTimeout> | null;
};

const reducer = function (state = initialState, action: AnyAction): TimeoutState {
    switch (action.type) {
    case SET_AUTOSAVE_TIMEOUT_ID:
        return Object.assign({}, state, {
            autoSaveTimeoutId: action.id
        });
    default:
        return state;
    }
};
const setAutoSaveTimeoutId = (id: ReturnType<typeof setTimeout> | null): SetAutoSaveTimeoutIdAction => ({
    type: SET_AUTOSAVE_TIMEOUT_ID,
    id
});

export {
    reducer as default,
    initialState as timeoutInitialState,
    setAutoSaveTimeoutId
};
