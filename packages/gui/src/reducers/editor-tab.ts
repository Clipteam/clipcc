import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const ACTIVATE_TAB = 'scratch-gui/navigation/ACTIVATE_TAB';

// Constants use numbers to make it easier to work with react-tabs
const BLOCKS_TAB_INDEX = 0;
const COSTUMES_TAB_INDEX = 1;
const SOUNDS_TAB_INDEX = 2;

type TabIndex = typeof BLOCKS_TAB_INDEX | typeof COSTUMES_TAB_INDEX | typeof SOUNDS_TAB_INDEX;

export interface EditorTabState {
    activeTabIndex: TabIndex;
};

const initialState: EditorTabState = {
    activeTabIndex: BLOCKS_TAB_INDEX
};

interface ActivateTabAction extends BaseAction<typeof ACTIVATE_TAB> {
    activeTabIndex: TabIndex;
};

const reducer = function (state: EditorTabState = initialState, action: AnyAction): EditorTabState {
    switch (action.type) {
    case ACTIVATE_TAB:
        return Object.assign({}, state, {
            activeTabIndex: action.activeTabIndex
        });
    default:
        return state;
    }
};

const activateTab = function (tab: TabIndex): ActivateTabAction {
    return {
        type: ACTIVATE_TAB,
        activeTabIndex: tab
    };
};

export {
    reducer as default,
    initialState as editorTabInitialState,
    activateTab,
    BLOCKS_TAB_INDEX,
    COSTUMES_TAB_INDEX,
    SOUNDS_TAB_INDEX
};
