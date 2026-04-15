import type {AnyAction} from 'redux';
import type {BaseAction, Point} from './common';

const DRAG_UPDATE = 'scratch-gui/asset-drag/DRAG_UPDATE';

export interface AssetDragState {
    dragging: boolean;
    currentOffset: Point | null;
    img: string | null;
};

const initialState: AssetDragState = {
    dragging: false,
    currentOffset: null,
    img: null
};

interface DragUpdateAction extends BaseAction<typeof DRAG_UPDATE> {
    state: Partial<AssetDragState>;
};

const reducer = function (state: AssetDragState = initialState, action: AnyAction): AssetDragState {
    switch (action.type) {
    case DRAG_UPDATE:
        return Object.assign({}, state, action.state);
    default:
        return state;
    }
};

const updateAssetDrag = function (state: Partial<AssetDragState>): DragUpdateAction {
    return {
        type: DRAG_UPDATE,
        state: state
    };
};

export {
    reducer as default,
    initialState as assetDragInitialState,
    updateAssetDrag
};
