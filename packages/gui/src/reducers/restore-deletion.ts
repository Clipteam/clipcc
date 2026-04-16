import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const RESTORE_UPDATE = 'scratch-gui/restore-deletion/RESTORE_UPDATE';

export interface RestoreState {
    restoreFun: (() => void) | null;
    deletedItem: string;
};

const initialState: RestoreState = {
    restoreFun: null,
    deletedItem: ''
};

interface RestoreUpdateAction extends BaseAction<typeof RESTORE_UPDATE> {
    state: RestoreState;
};

const reducer = function (state: RestoreState = initialState, action: AnyAction): RestoreState {
    switch (action.type) {
    case RESTORE_UPDATE:
        return Object.assign({}, state, action.state);
    default:
        return state;
    }
};

const setRestore = function (state: RestoreState): RestoreUpdateAction {
    return {
        type: RESTORE_UPDATE,
        state: {
            restoreFun: state.restoreFun,
            deletedItem: state.deletedItem
        }
    };
};

export {
    reducer as default,
    initialState as restoreDeletionInitialState,
    setRestore
};
