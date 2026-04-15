import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const SET_ID = 'scratch-gui/connection-modal/setId';

export interface ConnectionModalState {
    extensionId: string | null;
};

const initialState: ConnectionModalState = {
    extensionId: null
};

interface SetIdAction extends BaseAction<typeof SET_ID> {
    extensionId: string | null;
};

const reducer = function (state: ConnectionModalState = initialState, action: AnyAction): ConnectionModalState {
    switch (action.type) {
    case SET_ID:
        return Object.assign({}, state, {
            extensionId: action.extensionId
        });
    default:
        return state;
    }
};

const setConnectionModalExtensionId = function (extensionId: string | null): SetIdAction {
    return {
        type: SET_ID,
        extensionId: extensionId
    };
};

export {
    reducer as default,
    initialState as connectionModalInitialState,
    setConnectionModalExtensionId
};
