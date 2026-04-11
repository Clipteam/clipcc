import {connect} from 'react-redux';
import type {AnyAction, Dispatch} from 'redux';
import ElectronStorageHelper from '../../lib/ElectronStorageHelper';
import React from 'react';
import type VM from 'clipcc-vm';
import type {RootState} from 'clipcc-gui/src/lib/app-state-hoc';
import type {PropsOf} from 'clipcc-gui/src/lib/type-traits';
import type {LoadingStateValue} from 'clipcc-gui/src/reducers/project-state';
import type {ScratchStorage} from 'clipcc-storage';

import {
    onLoadedProject,
    defaultProjectId,
    requestNewProject,
    requestProjectUpload,
    setProjectId
} from 'clipcc-gui/src/reducers/project-state';
import {
    openLoadingProject,
    closeLoadingProject,
    openTelemetryModal
} from 'clipcc-gui/src/reducers/modals';
import type AppStateHOC from 'clipcc-gui/src/lib/app-state-hoc';

type InitialProjectData = Parameters<VM['loadProject']>[0];

const getInitialProjectData = (): Promise<InitialProjectData | null> => Promise.resolve(null);

const hasInitialProjectData = (projectData: InitialProjectData | null): projectData is InitialProjectData => {
    if (projectData === null) {
        return false;
    }
    if (typeof projectData === 'string') {
        return projectData.length > 0;
    }
    if (ArrayBuffer.isView(projectData)) {
        return projectData.byteLength > 0;
    }
    if (projectData instanceof ArrayBuffer) {
        return projectData.byteLength > 0;
    }
    return true;
};

const getErrorMessage = (error: Error | string): string => (error instanceof Error ? error.message : error);

const mapStateToProps = (state: RootState) => {
    const loadingState = state.scratchGui.projectState.loadingState;
    return {
        loadingState,
        vm: state.scratchGui.vm
    };
};

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) => ({
    onLoadingStarted: () => {
        dispatch(openLoadingProject());
    },
    onLoadingCompleted: () => {
        dispatch(closeLoadingProject());
    },
    onHasInitialProject: (hasInitialProject: boolean, loadingState: LoadingStateValue) => {
        if (hasInitialProject) {
            // emulate sb-file-uploader
            const action = requestProjectUpload(loadingState);
            if (action) {
                dispatch(action);
            }
            return;
        }

        // `createProject()` might seem more appropriate but it's not a valid state transition here
        // setting the default project ID is a valid transition from NOT_LOADED and acts like "create new"
        dispatch(setProjectId(defaultProjectId));
    },
    onLoadedProject: (loadingState: LoadingStateValue, loadSuccess: boolean) => {
        const canSaveToServer = false;
        const action = onLoadedProject(loadingState, canSaveToServer, loadSuccess);
        if (action) {
            dispatch(action);
        }
    },
    onRequestNewProject: () => {
        dispatch(requestNewProject(false));
    },
    onTelemetrySettingsClicked: () => {
        dispatch(openTelemetryModal());
    }
});

type StatedGUILikeProps = PropsOf<ReturnType<typeof AppStateHOC>>;
type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;
type DesktopGUIComponentProps = StatedGUILikeProps & StateProps & DispatchProps;
type WrappedComponentProps = Omit<DesktopGUIComponentProps, keyof StateProps | keyof DispatchProps>;

/**
 * Higher-order component to add desktop logic to the GUI.
 * @param WrappedComponent - a GUI-like component to wrap.
 * @returns A component similar to GUI with desktop-specific logic added.
 */
const ScratchDesktopGUIHOC = function (
    WrappedComponent: React.ComponentType<WrappedComponentProps>
): React.ComponentType<WrappedComponentProps> {
    interface State {
        projectTitle: string;
    };

    class ScratchDesktopGUIComponent extends React.Component<DesktopGUIComponentProps, State> {
        state = {
            projectTitle: ''
        };

        override componentDidMount () {
            this.props.onLoadingStarted();
            getInitialProjectData().then(initialProjectData => {
                const hasInitialProject = hasInitialProjectData(initialProjectData);
                this.props.onHasInitialProject(hasInitialProject, this.props.loadingState);
                if (!hasInitialProject) {
                    this.props.onLoadingCompleted();
                    return;
                }
                this.props.vm.loadProject(initialProjectData).then(
                    () => {
                        this.props.onLoadingCompleted();
                        this.props.onLoadedProject(this.props.loadingState, true);
                    },
                    (e: Error | string) => {
                        this.props.onLoadingCompleted();
                        this.props.onLoadedProject(this.props.loadingState, false);
                        console.error(
                            `Failed to load project: Invalid or corrupt project file. ${getErrorMessage(e)}`,
                            e
                        );

                        // this effectively sets the default project ID
                        // TODO: maybe setting the default project ID should be implicit in `requestNewProject`
                        this.props.onHasInitialProject(false, this.props.loadingState);

                        // restart as if we didn't have an initial project to load
                        this.props.onRequestNewProject();
                    }
                );
            });
        }

        handleClickAbout = () => {
            window.desktop?.openAboutWindow();
        };

        handleShowPrivacyPolicy = () => {
            window.desktop?.openPrivacyWindow();
        };

        handleProjectTelemetryEvent = () => {
            // ipcRenderer.send(event, metadata);
        };

        handleStorageInit = (storageInstance: ScratchStorage) => {
            storageInstance.addHelper(new ElectronStorageHelper(storageInstance), 50);
        };

        handleUpdateProjectTitle = (newTitle: string) => {
            this.setState({projectTitle: newTitle});
        };

        override render () {
            const {
                /* eslint-disable @typescript-eslint/no-unused-vars */
                loadingState: _loadingState,
                vm: _vm,
                onLoadingStarted: _onLoadingStarted,
                onLoadingCompleted: _onLoadingCompleted,
                onHasInitialProject: _onHasInitialProject,
                onLoadedProject: _onLoadedProject,
                onRequestNewProject: _onRequestNewProject,
                onTelemetrySettingsClicked: _onTelemetrySettingsClicked,
                /* eslint-enable @typescript-eslint/no-unused-vars */
                ...componentProps
            } = this.props;

            const desktopProps = {
                canEditTitle: true,
                canModifyCloudData: false,
                canSave: false,
                isStandalone: true,
                isScratchDesktop: true,
                onClickAbout: [
                    {
                        title: 'About',
                        onClick: () => this.handleClickAbout()
                    },
                    {
                        title: 'Privacy Policy',
                        onClick: () => this.handleShowPrivacyPolicy()
                    },
                    {
                        title: 'Data Settings',
                        onClick: () => this.props.onTelemetrySettingsClicked()
                    }
                ],
                onProjectTelemetryEvent: this.handleProjectTelemetryEvent,
                onShowPrivacyPolicy: this.handleShowPrivacyPolicy,
                onStorageInit: this.handleStorageInit,
                onUpdateProjectTitle: this.handleUpdateProjectTitle
            };

            const wrappedComponentProps = {
                ...componentProps,
                ...desktopProps
            };

            return (<WrappedComponent
                {...wrappedComponentProps}
            />);
        }
    }

    return connect(mapStateToProps, mapDispatchToProps)(ScratchDesktopGUIComponent);
};

export default ScratchDesktopGUIHOC;
