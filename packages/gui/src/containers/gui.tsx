import React from 'react';
import {compose, type AnyAction, type Dispatch} from 'redux';
import {connect} from 'react-redux';
import ReactModal from 'react-modal';
import VM from 'clipcc-vm';
import {injectIntl} from 'react-intl';

import ErrorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import {
    getIsError,
    getIsShowingProject
} from '../reducers/project-state';
import {
    activateTab,
    BLOCKS_TAB_INDEX,
    COSTUMES_TAB_INDEX,
    SOUNDS_TAB_INDEX
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

import GUIComponent from '../components/gui/gui.jsx';
import {setIsScratchDesktop} from '../lib/isScratchDesktop.js';
import type {GuiState} from '../reducers/gui';
import type {LocalesState} from '../reducers/locales';

const TypedGUIComponent = GUIComponent as React.ComponentType<{
    loading: boolean;
    children?: React.ReactNode;
} & Record<string, unknown>>;

interface RootState {
    scratchGui: GuiState;
    locales: LocalesState;
}

interface StorageWithOfficialStores {
    addOfficialScratchWebStores: () => void;
}

interface OwnProps {
    theme?: string;
    assetHost?: string;
    children?: React.ReactNode;
    cloudHost?: string;
    fetchingProject?: boolean;
    isLoading?: boolean;
    isScratchDesktop?: boolean;
    onSeeCommunity?: () => void;
    projectHost?: string;
    intl?: unknown;
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
            state.scratchGui.targets.stage.id === state.scratchGui.targets.editingTarget
        ,
        telemetryModalVisible: state.scratchGui.modals.telemetryModal,
        vm: state.scratchGui.vm
    };
};

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) => ({
    onExtensionButtonClick: () => dispatch(openExtensionLibrary()),
    onActivateTab: (tab: typeof BLOCKS_TAB_INDEX | typeof COSTUMES_TAB_INDEX | typeof SOUNDS_TAB_INDEX) => dispatch(activateTab(tab)),
    onActivateCostumesTab: () => dispatch(activateTab(COSTUMES_TAB_INDEX)),
    onActivateSoundsTab: () => dispatch(activateTab(SOUNDS_TAB_INDEX)),
    onRequestCloseBackdropLibrary: () => dispatch(closeBackdropLibrary()),
    onRequestCloseCostumeLibrary: () => dispatch(closeCostumeLibrary()),
    onRequestCloseTelemetryModal: () => dispatch(closeTelemetryModal())
});

type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;

interface GUIProps extends OwnProps, StateProps, DispatchProps {
    onProjectLoaded?: () => void;
    onStorageInit?: (storageInstance: StorageWithOfficialStores) => void;
    onUpdateProjectId?: (projectId: string | number) => void;
    onVmInit?: (vm: VM) => void;
}

class GUI extends React.Component<GUIProps> {
    static defaultProps = {
        isScratchDesktop: false,
        onStorageInit: (storageInstance: StorageWithOfficialStores): void => storageInstance.addOfficialScratchWebStores(),
        onProjectLoaded: (): void => {},
        onUpdateProjectId: (): void => {},
        onVmInit: (): void => {}
    };

    componentDidMount () {
        setIsScratchDesktop(!!this.props.isScratchDesktop);
        if (this.props.onStorageInit) {
            this.props.onStorageInit(storage as StorageWithOfficialStores);
        }
        if (this.props.onVmInit) {
            this.props.onVmInit(this.props.vm);
        }
    }
    componentDidUpdate (prevProps: GUIProps) {
        if (this.props.projectId !== prevProps.projectId && this.props.projectId !== null) {
            if (this.props.onUpdateProjectId) {
                this.props.onUpdateProjectId(this.props.projectId);
            }
        }
        if (this.props.isShowingProject && !prevProps.isShowingProject) {
            // this only notifies container when a project changes from not yet loaded to loaded
            // At this time the project view in www doesn't need to know when a project is unloaded
            if (this.props.onProjectLoaded) {
                this.props.onProjectLoaded();
            }
        }
    }
    render () {
        if (this.props.isError) {
            throw new Error(
                `Error in Scratch GUI [location=${window.location}]: ${String(this.props.error)}`);
        }
        const {
            /* eslint-disable no-unused-vars */
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
            /* eslint-enable no-unused-vars */
            children,
            fetchingProject,
            isLoading,
            loadingStateVisible,
            ...componentProps
        } = this.props;
        return (
            <TypedGUIComponent
                loading={fetchingProject || isLoading || loadingStateVisible}
                {...componentProps}
            >
                {children}
            </TypedGUIComponent>
        );
    }
}

const ConnectedGUI = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(GUI));

// note that redux's 'compose' function is just being used as a general utility to make
// the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
// ability to compose reducers.
const WrappedGui = compose(
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

(WrappedGui as typeof WrappedGui & {setAppElement: typeof ReactModal.setAppElement}).setAppElement = ReactModal.setAppElement;
export default WrappedGui as typeof WrappedGui & {setAppElement: typeof ReactModal.setAppElement};
