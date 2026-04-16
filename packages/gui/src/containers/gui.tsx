import React from 'react';
import {compose, type AnyAction, type Dispatch} from 'redux';
import {connect} from 'react-redux';
import VM from 'clipcc-vm';

import ErrorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import {
    getIsError,
    getIsShowingProject
} from '../reducers/project-state';
import {
    activateTab,
    BLOCKS_TAB_INDEX,
    COSTUMES_TAB_INDEX,
    SOUNDS_TAB_INDEX,
    type TabIndex
} from '../reducers/editor-tab';

import {
    closeCostumeLibrary,
    closeBackdropLibrary,
    closeTelemetryModal,
    openExtensionLibrary
} from '../reducers/modals';

import FontLoaderHOC from '../lib/font-loader-hoc.jsx';
import LocalizationHOC from '../lib/localization-hoc.jsx';
import SBFileUploaderHOC from '../lib/sb-file-uploader-hoc.jsx';
import ProjectFetcherHOC from '../lib/project-fetcher-hoc.jsx';
import TitledHOC from '../lib/titled-hoc.jsx';
import ProjectSaverHOC from '../lib/project-saver-hoc.jsx';
import QueryParserHOC from '../lib/query-parser-hoc.jsx';
import storage from '../lib/storage';
import vmListenerHOC from '../lib/vm-listener-hoc.jsx';
import vmManagerHOC from '../lib/vm-manager-hoc.jsx';
import cloudManagerHOC from '../lib/cloud-manager-hoc.jsx';
import themeManagerHOC from '../lib/theme-manager-hoc.jsx';

import GUIComponent from '../components/gui/gui';
import {setIsScratchDesktop} from '../lib/isScratchDesktop';
import type {RootState} from '../lib/app-state-hoc';
import type {PropsOf} from '../lib/type-traits';

type ComponentProps = PropsOf<typeof GUIComponent>;

interface StorageWithOfficialStores {
    addOfficialScratchWebStores: () => void;
}

interface OwnProps extends ComponentProps {
    assetHost?: string;
    cloudHost?: string;
    fetchingProject?: boolean;
    isLoading?: boolean;
    isScratchDesktop?: boolean;
    projectHost?: string;
    showTelemetryModal?: boolean;
    onProjectLoaded?: () => void;
    onStorageInit?: (storageInstance: StorageWithOfficialStores) => void;
    onUpdateProjectId?: (projectId: string | number) => void;
    onVmInit?: (vm: VM) => void;
}

const mapStateToProps = (state: RootState) => {
    const loadingState = state.scratchGui.projectState.loadingState;
    return {
        activeTabIndex: state.scratchGui.editorTab.activeTabIndex,
        alertsVisible: state.scratchGui.alerts.visible,
        backdropLibraryVisible: state.scratchGui.modals.backdropLibrary,
        blocksTabVisible: state.scratchGui.editorTab.activeTabIndex === BLOCKS_TAB_INDEX,
        connectionModalVisible: state.scratchGui.modals.connectionModal,
        costumeLibraryVisible: state.scratchGui.modals.costumeLibrary,
        costumesTabVisible: state.scratchGui.editorTab.activeTabIndex === COSTUMES_TAB_INDEX,
        error: state.scratchGui.projectState.error,
        isError: getIsError(loadingState),
        isFullScreen: state.scratchGui.mode.isFullScreen,
        isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
        isRtl: state.locales.isRtl,
        isShowingProject: getIsShowingProject(loadingState),
        loadingStateVisible: state.scratchGui.modals.loadingProject,
        projectId: state.scratchGui.projectState.projectId,
        settingsModalVisible: state.scratchGui.modals.settingsModal,
        soundsTabVisible: state.scratchGui.editorTab.activeTabIndex === SOUNDS_TAB_INDEX,
        targetIsStage:
            state.scratchGui.targets.stage &&
            state.scratchGui.targets.stage.id === state.scratchGui.targets.editingTarget,
        telemetryModalVisible: state.scratchGui.modals.telemetryModal,
        vm: state.scratchGui.vm
    };
};

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) => ({
    onExtensionButtonClick: () => dispatch(openExtensionLibrary()),
    onActivateTab: (tab: TabIndex) => dispatch(activateTab(tab)),
    onActivateCostumesTab: () => dispatch(activateTab(COSTUMES_TAB_INDEX)),
    onActivateSoundsTab: () => dispatch(activateTab(SOUNDS_TAB_INDEX)),
    onRequestCloseBackdropLibrary: () => dispatch(closeBackdropLibrary()),
    onRequestCloseCostumeLibrary: () => dispatch(closeCostumeLibrary()),
    onRequestCloseTelemetryModal: () => dispatch(closeTelemetryModal())
});

type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;

type GUIProps = OwnProps & StateProps & DispatchProps;

class GUI extends React.Component<GUIProps> {
    static defaultProps = {
        isScratchDesktop: false,
        onStorageInit:
            (storageInstance: StorageWithOfficialStores) => storageInstance.addOfficialScratchWebStores(),
        onProjectLoaded: () => {},
        onUpdateProjectId: () => {},
        onVmInit: () => {}
    };

    override componentDidMount () {
        setIsScratchDesktop(!!this.props.isScratchDesktop);
        this.props.onStorageInit!(storage);
        this.props.onVmInit!(this.props.vm);
    }
    override componentDidUpdate (prevProps: GUIProps) {
        if (this.props.projectId !== prevProps.projectId && this.props.projectId !== null) {
            this.props.onUpdateProjectId!(this.props.projectId);
        }
        if (this.props.isShowingProject && !prevProps.isShowingProject) {
            // this only notifies container when a project changes from not yet loaded to loaded
            // At this time the project view in www doesn't need to know when a project is unloaded
            this.props.onProjectLoaded!();
        }
    }
    override render () {
        if (this.props.isError) {
            throw new Error(
                `Error in Scratch GUI [location=${window.location}]: ${this.props.error}`);
        }
        const {
            /* eslint-disable @typescript-eslint/no-unused-vars */
            assetHost,
            cloudHost,
            error,
            isError,
            isScratchDesktop,
            isShowingProject,
            onProjectLoaded,
            onStorageInit,
            onUpdateProjectId,
            onVmInit,
            projectHost,
            projectId,
            /* eslint-enable @typescript-eslint/no-unused-vars */
            children,
            fetchingProject,
            isLoading,
            loadingStateVisible,
            ...componentProps
        } = this.props;
        return (
            <GUIComponent
                loading={fetchingProject || isLoading || loadingStateVisible}
                {...componentProps}
            >
                {children}
            </GUIComponent>
        );
    }
}

const ConnectedGUI = connect(
    mapStateToProps,
    mapDispatchToProps
)(GUI);

// note that redux's 'compose' function is just being used as a general utility to make
// the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
// ability to compose reducers.
const WrappedGui = compose<React.ComponentType<PropsOf<typeof ConnectedGUI>>>(
    LocalizationHOC,
    ErrorBoundaryHOC('Top Level App'),
    FontLoaderHOC,
    QueryParserHOC,
    ProjectFetcherHOC,
    TitledHOC,
    ProjectSaverHOC,
    vmListenerHOC,
    vmManagerHOC,
    SBFileUploaderHOC,
    cloudManagerHOC,
    themeManagerHOC
)(ConnectedGUI);


export default WrappedGui;
