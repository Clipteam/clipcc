import type * as ClipCCBlock from 'clipcc-block';
import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const ACTIVATE_CUSTOM_PROCEDURES = 'scratch-gui/custom-procedures/ACTIVATE_CUSTOM_PROCEDURES';
const DEACTIVATE_CUSTOM_PROCEDURES = 'scratch-gui/custom-procedures/DEACTIVATE_CUSTOM_PROCEDURES';
const SET_CALLBACK = 'scratch-gui/custom-procedures/SET_CALLBACK';

type ProcedureExtraState = ClipCCBlock.proceduresSerializer.ProcedureExtraState;
type MutatorCallback = (state: ProcedureExtraState) => void;

export interface CustomProceduresState {
    active: boolean;
    state: ProcedureExtraState | null;
    callback: MutatorCallback | null;
    new: boolean;
};

const initialState: CustomProceduresState = {
    active: false,
    state: null,
    callback: null,
    new: false
};

interface ActivateCustomProceduresAction extends BaseAction<typeof ACTIVATE_CUSTOM_PROCEDURES> {
    state: ProcedureExtraState;
    callback: MutatorCallback;
    new: boolean;
};

interface DeactivateCustomProceduresAction extends BaseAction<typeof DEACTIVATE_CUSTOM_PROCEDURES> {
    state: ProcedureExtraState | null;
};

const reducer = function (state: CustomProceduresState = initialState, action: AnyAction): CustomProceduresState {
    switch (action.type) {
    case ACTIVATE_CUSTOM_PROCEDURES:
        return Object.assign({}, state, {
            active: true,
            state: action.state,
            callback: action.callback,
            new: action.new
        });
    case DEACTIVATE_CUSTOM_PROCEDURES:
        // Can be called without a state to deactivate without new procedure
        // i.e. when clicking on the modal background
        if (action.state && state.callback) {
            state.callback(action.state);
        }
        return Object.assign({}, state, {
            active: false,
            state: null,
            callback: null,
            new: false
        });
    case SET_CALLBACK:
        return Object.assign({}, state, {callback: action.callback});
    default:
        return state;
    }
};

/**
 * Action creator to open the custom procedures modal.
 * @param state The Blockly serialized state of the procedure.
 * @param callback The function to call when done editing procedure.
 *     Expect the callback to be a function that takes a new Blockly
 *     serialized state of the procedure as an argument.
 * @param isNew True if the procedure is newly created.
 * @returns An action object with type ACTIVATE_CUSTOM_PROCEDURES.
 */
const activateCustomProcedures = (
    state: ProcedureExtraState,
    callback: MutatorCallback,
    isNew: boolean
): ActivateCustomProceduresAction => ({
    type: ACTIVATE_CUSTOM_PROCEDURES,
    state,
    callback: callback,
    new: isNew
});

/**
 * Action creator to close the custom procedures modal.
 * @param state The new state, or null if the callback should not be called.
 * @returns An action object with type ACTIVATE_CUSTOM_PROCEDURES.
 */
const deactivateCustomProcedures = (state: ProcedureExtraState | null): DeactivateCustomProceduresAction => ({
    type: DEACTIVATE_CUSTOM_PROCEDURES,
    state
});

export {
    reducer as default,
    initialState as customProceduresInitialState,
    activateCustomProcedures,
    deactivateCustomProcedures
};
