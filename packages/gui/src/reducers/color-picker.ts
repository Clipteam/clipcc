import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const ACTIVATE_COLOR_PICKER = 'scratch-gui/color-picker/ACTIVATE_COLOR_PICKER';
const DEACTIVATE_COLOR_PICKER = 'scratch-gui/color-picker/DEACTIVATE_COLOR_PICKER';
const SET_CALLBACK = 'scratch-gui/color-picker/SET_CALLBACK';

type ColorPickerCallback = (color: string) => void;

export interface ColorPickerState {
    active: boolean;
    callback: ColorPickerCallback;
};

const initialState: ColorPickerState = {
    active: false,
    callback: () => {
        throw new Error('Color picker callback not initialized');
    }
};

interface ActivateColorPickerAction extends BaseAction<typeof ACTIVATE_COLOR_PICKER> {
    callback: ColorPickerCallback;
};

interface DeactivateColorPickerAction extends BaseAction<typeof DEACTIVATE_COLOR_PICKER> {
    color?: string;
};

interface SetCallbackAction extends BaseAction<typeof SET_CALLBACK> {
    callback: ColorPickerCallback;
};

const reducer = function (state: ColorPickerState = initialState, action: AnyAction): ColorPickerState {
    switch (action.type) {
    case ACTIVATE_COLOR_PICKER:
        return Object.assign({}, state, {active: true, callback: action.callback});
    case DEACTIVATE_COLOR_PICKER:
        // Can be called without a string to deactivate without setting color
        // i.e. when clicking on the modal background
        if (typeof action.color === 'string') {
            state.callback(action.color);
        }
        return Object.assign({}, state, {active: false});
    case SET_CALLBACK:
        return Object.assign({}, state, {callback: action.callback});
    default:
        return state;
    }
};

const activateColorPicker = (callback: ColorPickerCallback): ActivateColorPickerAction => ({type: ACTIVATE_COLOR_PICKER, callback});
const deactivateColorPicker = (color?: string): DeactivateColorPickerAction => ({type: DEACTIVATE_COLOR_PICKER, color});
const setCallback = (callback: ColorPickerCallback): SetCallbackAction => ({type: SET_CALLBACK, callback});

export {
    reducer as default,
    initialState as colorPickerInitialState,
    activateColorPicker,
    deactivateColorPicker,
    setCallback
};
