import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const UPDATE_TARGET_LIST = 'scratch-gui/targets/UPDATE_TARGET_LIST';
const HIGHLIGHT_TARGET = 'scratch-gui/targets/HIGHLIGHT_TARGET';

interface TargetData {
    id: string;
    isStage: boolean;
    [key: string]: unknown;
}

interface SpriteTargetData extends TargetData {
    order: number;
}

export interface TargetsState {
    sprites: Record<string, SpriteTargetData>;
    stage: TargetData | Record<string, never>;
    editingTarget?: unknown;
    highlightedTargetId: string | null;
    highlightedTargetTime: number | null;
};

const initialState: TargetsState = {
    sprites: {},
    stage: {},
    highlightedTargetId: null,
    highlightedTargetTime: null
};

interface UpdateTargetListAction extends BaseAction<typeof UPDATE_TARGET_LIST> {
    targets: TargetData[];
    editingTarget: unknown;
}

interface HighlightTargetAction extends BaseAction<typeof HIGHLIGHT_TARGET> {
    targetId: string;
    updateTime: number;
};

const isUpdateTargetListAction = function (action: AnyAction): action is UpdateTargetListAction {
    return action.type === UPDATE_TARGET_LIST && Array.isArray(action.targets);
};

const reducer = function (state = initialState, action: AnyAction): TargetsState {
    switch (action.type) {
    case UPDATE_TARGET_LIST:
        if (!isUpdateTargetListAction(action)) {
            return state;
        }

        return Object.assign({}, state, {
            sprites: action.targets
                .filter((target: TargetData) => !target.isStage)
                .reduce<Record<string, SpriteTargetData>>(
                    (targets: Record<string, SpriteTargetData>, target: TargetData, listId: number) => Object.assign(
                        targets,
                        {[target.id]: {order: listId, ...target}}
                    ),
                    {}
                ),
            stage: action.targets
                .filter((target: TargetData) => target.isStage)[0] || {},
            editingTarget: action.editingTarget
        });
    case HIGHLIGHT_TARGET:
        return Object.assign({}, state, {
            highlightedTargetId: action.targetId,
            highlightedTargetTime: action.updateTime
        });
    default:
        return state;
    }
};
const updateTargets = function (targetList: TargetData[], editingTarget: unknown): UpdateTargetListAction {
    return {
        type: UPDATE_TARGET_LIST,
        targets: targetList,
        editingTarget: editingTarget
    };
};
const highlightTarget = function (targetId: string): HighlightTargetAction {
    return {
        type: HIGHLIGHT_TARGET,
        targetId: targetId,
        updateTime: Date.now()
    };
};
export {
    reducer as default,
    initialState as targetsInitialState,
    updateTargets,
    highlightTarget
};
