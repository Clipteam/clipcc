import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const UPDATE_METRICS = 'scratch-gui/workspace-metrics/UPDATE_METRICS';

interface TargetMetric {
    scrollX: number;
    scrollY: number;
    scale: number;
};

export interface WorkspaceMetricsState {
    targets: Record<string, TargetMetric>;
};

const initialState: WorkspaceMetricsState = {
    targets: {}
};

interface UpdateMetricsPayload {
    targetID: string;
    scrollX: number;
    scrollY: number;
    scale: number;
};

type UpdateMetricsAction = BaseAction<typeof UPDATE_METRICS> & UpdateMetricsPayload;

const reducer = function (state = initialState, action: AnyAction): WorkspaceMetricsState {
    switch (action.type) {
    case UPDATE_METRICS:
        return Object.assign({}, state, {
            targets: Object.assign({}, state.targets, {
                [action.targetID]: {
                    scrollX: action.scrollX,
                    scrollY: action.scrollY,
                    scale: action.scale
                }
            })
        });
    default:
        return state;
    }
};

const updateMetrics = function (metrics: UpdateMetricsPayload): UpdateMetricsAction {
    return {
        type: UPDATE_METRICS,
        ...metrics
    };
};

export {
    reducer as default,
    initialState as workspaceMetricsInitialState,
    updateMetrics
};
