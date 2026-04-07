import {applyMiddleware, compose, combineReducers} from 'redux';
import alertsReducer, {alertsInitialState} from './alerts';
import assetDragReducer, {assetDragInitialState} from './asset-drag';
import colorPickerReducer, {colorPickerInitialState} from './color-picker';
import connectionModalReducer, {connectionModalInitialState} from './connection-modal';
import customProceduresReducer, {customProceduresInitialState} from './custom-procedures';
import blockDragReducer, {blockDragInitialState} from './block-drag';
import editorTabReducer, {editorTabInitialState} from './editor-tab';
import hoveredTargetReducer, {hoveredTargetInitialState} from './hovered-target';
import menuReducer, {menuInitialState} from './menus';
import micIndicatorReducer, {micIndicatorInitialState} from './mic-indicator';
import modalReducer, {modalsInitialState} from './modals';
import modeReducer, {modeInitialState} from './mode';
import monitorReducer, {monitorsInitialState} from './monitors';
import monitorLayoutReducer, {monitorLayoutInitialState} from './monitor-layout';
import projectChangedReducer, {projectChangedInitialState} from './project-changed';
import projectStateReducer, {projectStateInitialState} from './project-state';
import projectTitleReducer, {projectTitleInitialState} from './project-title';
import fontsLoadedReducer, {fontsLoadedInitialState} from './fonts-loaded';
import restoreDeletionReducer, {restoreDeletionInitialState} from './restore-deletion';
import settingsReducer, {settingsInitialState} from './settings';
import stageSizeReducer, {stageSizeInitialState} from './stage-size';
import targetReducer, {targetsInitialState} from './targets';
import themeReducer, {themeInitialState} from './theme';
import timeoutReducer, {timeoutInitialState} from './timeout';
import toolboxReducer, {toolboxInitialState} from './toolbox';
import vmReducer, {vmInitialState} from './vm';
import vmStatusReducer, {vmStatusInitialState} from './vm-status';
import workspaceMetricsReducer, {workspaceMetricsInitialState} from './workspace-metrics';
import throttle from 'redux-throttle';


const guiMiddleware = compose(applyMiddleware(throttle(300, {leading: true, trailing: true})));

const guiInitialState = {
    alerts: alertsInitialState,
    assetDrag: assetDragInitialState,
    blockDrag: blockDragInitialState,
    colorPicker: colorPickerInitialState,
    connectionModal: connectionModalInitialState,
    customProcedures: customProceduresInitialState,
    editorTab: editorTabInitialState,
    mode: modeInitialState,
    hoveredTarget: hoveredTargetInitialState,
    settings: settingsInitialState,
    stageSize: stageSizeInitialState,
    menus: menuInitialState,
    micIndicator: micIndicatorInitialState,
    modals: modalsInitialState,
    monitors: monitorsInitialState,
    monitorLayout: monitorLayoutInitialState,
    projectChanged: projectChangedInitialState,
    projectState: projectStateInitialState,
    projectTitle: projectTitleInitialState,
    fontsLoaded: fontsLoadedInitialState,
    restoreDeletion: restoreDeletionInitialState,
    targets: targetsInitialState,
    theme: themeInitialState,
    timeout: timeoutInitialState,
    toolbox: toolboxInitialState,
    vm: vmInitialState,
    vmStatus: vmStatusInitialState,
    workspaceMetrics: workspaceMetricsInitialState
};

export type GuiState = typeof guiInitialState;

const initPlayer = function (currentState: GuiState): GuiState {
    return Object.assign(
        {},
        currentState,
        {mode: {
            isFullScreen: currentState.mode.isFullScreen,
            isPlayerOnly: true,
            // When initializing in player mode, make sure to reset
            // hasEverEnteredEditorMode
            hasEverEnteredEditor: false,
            showBranding: currentState.mode.showBranding
        }}
    );
};
const initFullScreen = function (currentState: GuiState): GuiState {
    return Object.assign(
        {},
        currentState,
        {mode: {
            isFullScreen: true,
            isPlayerOnly: currentState.mode.isPlayerOnly,
            hasEverEnteredEditor: currentState.mode.hasEverEnteredEditor,
            showBranding: currentState.mode.showBranding
        }}
    );
};

const initEmbedded = function (currentState: GuiState): GuiState {
    return Object.assign(
        {},
        currentState,
        {mode: {
            showBranding: true,
            isFullScreen: true,
            isPlayerOnly: true,
            hasEverEnteredEditor: false
        }}
    );
};


const initTelemetryModal = function (currentState: GuiState): GuiState {
    return Object.assign(
        {},
        currentState,
        {
            modals: {
                telemetryModal: true // this key must match `MODAL_TELEMETRY` in modals.js
            }
        }
    );
};

const guiReducer = combineReducers<GuiState>({
    alerts: alertsReducer,
    assetDrag: assetDragReducer,
    blockDrag: blockDragReducer,
    colorPicker: colorPickerReducer,
    connectionModal: connectionModalReducer,
    customProcedures: customProceduresReducer,
    editorTab: editorTabReducer,
    mode: modeReducer,
    hoveredTarget: hoveredTargetReducer,
    settings: settingsReducer,
    stageSize: stageSizeReducer,
    menus: menuReducer,
    micIndicator: micIndicatorReducer,
    modals: modalReducer,
    monitors: monitorReducer,
    monitorLayout: monitorLayoutReducer,
    projectChanged: projectChangedReducer,
    projectState: projectStateReducer,
    projectTitle: projectTitleReducer,
    fontsLoaded: fontsLoadedReducer,
    restoreDeletion: restoreDeletionReducer,
    targets: targetReducer,
    theme: themeReducer,
    timeout: timeoutReducer,
    toolbox: toolboxReducer,
    vm: vmReducer,
    vmStatus: vmStatusReducer,
    workspaceMetrics: workspaceMetricsReducer
});

export {
    guiReducer as default,
    guiInitialState,
    guiMiddleware,
    initEmbedded,
    initFullScreen,
    initPlayer,
    initTelemetryModal
};
