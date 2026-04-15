import {STAGE_DISPLAY_SIZES} from '../lib/layout-constants.js';
import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const SET_STAGE_SIZE = 'scratch-gui/StageSize/SET_STAGE_SIZE';

type StageDisplaySize = typeof STAGE_DISPLAY_SIZES[keyof typeof STAGE_DISPLAY_SIZES];

export interface StageSizeState {
    stageSize: StageDisplaySize;
};

const initialState: StageSizeState = {
    stageSize: STAGE_DISPLAY_SIZES.large
};

interface SetStageSizeAction extends BaseAction<typeof SET_STAGE_SIZE> {
    stageSize: StageDisplaySize;
};

const reducer = function (state = initialState, action: AnyAction): StageSizeState {
    switch (action.type) {
    case SET_STAGE_SIZE:
        return {
            stageSize: action.stageSize
        };
    default:
        return state;
    }
};

const setStageSize = function (stageSize: StageDisplaySize): SetStageSizeAction {
    return {
        type: SET_STAGE_SIZE,
        stageSize: stageSize
    };
};

export {
    reducer as default,
    initialState as stageSizeInitialState,
    setStageSize
};
