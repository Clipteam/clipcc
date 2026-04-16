import makeToolbox from '../lib/make-toolbox';
import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const UPDATE_TOOLBOX = 'scratch-gui/toolbox/UPDATE_TOOLBOX';

type ToolboxContent = ReturnType<typeof makeToolbox>;

export interface ToolboxState {
    toolbox: ToolboxContent;
};

const initialState: ToolboxState = {
    toolbox: makeToolbox(true, true, null)
};

interface UpdateToolboxAction extends BaseAction<typeof UPDATE_TOOLBOX> {
    toolbox: ToolboxContent;
};

const reducer = function (state = initialState, action: AnyAction): ToolboxState {
    switch (action.type) {
    case UPDATE_TOOLBOX:
        return Object.assign({}, state, {
            toolbox: action.toolbox
        });
    default:
        return state;
    }
};

const updateToolbox = function (toolbox: ToolboxContent): UpdateToolboxAction {
    return {
        type: UPDATE_TOOLBOX,
        toolbox: toolbox
    };
};

export {
    reducer as default,
    initialState as toolboxInitialState,
    updateToolbox
};
