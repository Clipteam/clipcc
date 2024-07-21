// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import bindAll from "lodash.bindall";
import omit from "lodash.omit";
import PropTypes from "prop-types";
import React, {Component} from 'react'
import { connect } from "react-redux";
// import { loadExtensionFromFile } from "clipcc-gui/src/index";

import {
    LoadingStates,
    onFetchedProjectData,
    onLoadedProject,
    defaultProjectId,
    requestNewProject,
    requestProjectUpload,
    setProjectId,
} from "clipcc-gui/src/reducers/project-state";
import {
    openLoadingProject,
    closeLoadingProject,
    openTelemetryModal,
} from "clipcc-gui/src/reducers/modals";
import { setProjectTitle } from "clipcc-gui/src/reducers/project-title";




const DesktopHOC = function (WrappedComponent: Component): Component {
    class ScratchDesktopGUIComponent extends Component {
        constructor(props: unknown) {
            super(props);
            bindAll(this, [
                "handleProjectTelemetryEvent",
                "handleSetTitleFromSave",
                "handleGetExtension",
                "handleLoadExtension",
                "handleUpdateProjectTitle",
            ]);
            this.props.onLoadingStarted();
            window.gui.getInitialFile()
                .then(({projectData, projectName}) => {
                    const hasInitialProject =
                    projectData && projectData.length > 0;
                    this.props.onHasInitialProject(
                        hasInitialProject,
                        this.props.loadingState
                    );
                    if (!hasInitialProject) {
                        this.props.onLoadingCompleted();
                        return;
                    }
                    this.props.vm.loadProject(projectData).then(
                        () => {
                            this.props.onLoadingCompleted();
                            this.props.onSetProjectTitle(projectName)
                            console.log(`project name: ${projectName}`)
                            this.props.onLoadedProject(this.props.loadingState, true);
                        }).catch((e) => {
                            this.props.onLoadingCompleted();
                            this.props.onLoadedProject(this.props.loadingState, false);
                            window.dialog.showDialog({
                                type: "error",
                                title: "Failed to load project",
                                message: "Invalid or corrupt project file.",
                                detail: e.message,
                            })
                            // this effectively sets the default project ID
                            // TODO: maybe setting the default project ID should be implicit in `requestNewProject`
                            this.props.onHasInitialProject(false, this.props.loadingState);

                            // restart as if we didn't have an initial project to load
                            this.props.onRequestNewProject();
                        }
                    )
                });
            // ipcRenderer.invoke("get-local-extension-files").then((extensionFiles) => {
            //     for (const file of extensionFiles) {
            //         this.props.loadExtensionFromFile(file, "ccx");
            //     }
            // });
        }
        componentDidMount() {
            // ipcRenderer.on("setTitleFromSave", this.handleSetTitleFromSave);
            // ipcRenderer.on("loadExtensionFromFile", this.handleLoadExtension);
            // ipcRenderer.on("getExtension", this.handleGetExtension);
        }

        componentWillUnmount() {
            // ipcRenderer.removeListener(
            //     "setTitleFromSave",
            //     this.handleSetTitleFromSave
            // );
            // ipcRenderer.removeListener(
            //     "loadExtensionFromFile",
            //     this.handleLoadExtension
            // );
            // ipcRenderer.removeListener("getExtension", this.handleGetExtension);
        }
        handleClickAbout() {
            gui.openAbout()
        }
        handleProjectTelemetryEvent(event, metadata) {
            // ipcRenderer.send(event, metadata);
        }
        handleSetTitleFromSave(event, args) {
            this.handleUpdateProjectTitle(args.title);
        }
        handleLoadExtension(event, args) {
            this.props.loadExtensionFromFile(args.extension, "ccx");
        }
        handleGetExtension() {
            // ipcRenderer.invoke("set-extension", this.props.extension);
        }
        handleUpdateProjectTitle(newTitle) {
            this.setState({ projectTitle: newTitle });
        }
        render() {
            const childProps = omit(
                this.props,
                Object.keys(ScratchDesktopGUIComponent.propTypes)
            );

            return (
                <WrappedComponent
                    basePath='gui://'
                    canEditTitle
                    canModifyCloudData={false}
                    canSave={false}
                    isStandalone
                    isScratchDesktop
                    onClickAbout={[
                        {
                            title: "About",
                            onClick: () => this.handleClickAbout(),
                        },
                        // {
                        //     title: "Privacy Policy",
                        //     onClick: () => showPrivacyPolicy(),
                        // },
                        {
                            title: "Data Settings",
                            onClick: () => this.props.onTelemetrySettingsClicked(),
                        },
                    ]}
                    // onProjectTelemetryEvent={this.handleProjectTelemetryEvent}
                    // onShowPrivacyPolicy={showPrivacyPolicy}
                    // onStorageInit={this.handleStorageInit}
                    onUpdateProjectTitle={this.handleUpdateProjectTitle}
                    // allow passed-in props to override any of the above
                    {...childProps}
                />
            );
        }
    }

    ScratchDesktopGUIComponent.propTypes = {
        extension: PropTypes.shape({
            extensionId: PropTypes.string,
            iconURL: PropTypes.string,
            insetIconURL: PropTypes.string,
            author: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.arrayOf(PropTypes.string),
            ]),
            name: PropTypes.string,
            description: PropTypes.string,
            requirement: PropTypes.arrayOf(PropTypes.string),
        }),
        loadingState: PropTypes.oneOf(LoadingStates),
        loadExtensionFromFile: PropTypes.func,
        onFetchedInitialProjectData: PropTypes.func,
        onHasInitialProject: PropTypes.func,
        onLoadedProject: PropTypes.func,
        onLoadingCompleted: PropTypes.func,
        onLoadingStarted: PropTypes.func,
        onRequestNewProject: PropTypes.func,
        onTelemetrySettingsClicked: PropTypes.func,
        // using PropTypes.instanceOf(VM) here will cause prop type warnings due to VM mismatch
        // vm: GUIComponent.WrappedComponent.propTypes.vm
        vm: PropTypes.shape({}),
    };
    const mapStateToProps = (state: any) => {
        const loadingState = state.scratchGui.projectState.loadingState;
        return {
            loadingState: loadingState,
            vm: state.scratchGui.vm,
        };
    };
    const mapDispatchToProps = (dispatch: (arg0: any) => void) => ({
        onLoadingStarted: () => dispatch(openLoadingProject()),
        onLoadingCompleted: () => dispatch(closeLoadingProject()),
        onHasInitialProject: (hasInitialProject: boolean, loadingState: string) => {
            if (hasInitialProject) {
                // emulate sb-file-uploader
                return dispatch(requestProjectUpload(loadingState));
            }

            // `createProject()` might seem more appropriate but it's not a valid state transition here
            // setting the default project ID is a valid transition from NOT_LOADED and acts like "create new"
            return dispatch(setProjectId(defaultProjectId));
        },
        onFetchedInitialProjectData: (projectData: object, loadingState: string) =>
            dispatch(onFetchedProjectData(projectData, loadingState)),
        onLoadedProject: (loadingState: string, loadSuccess: boolean) => {
            const canSaveToServer = false;
            return dispatch(
                onLoadedProject(loadingState, canSaveToServer, loadSuccess)
            );
        },
        onRequestNewProject: () => dispatch(requestNewProject(false)),
        onTelemetrySettingsClicked: () => dispatch(openTelemetryModal()),
        onSetProjectTitle: (title: string) => dispatch(setProjectTitle(title)),
        loadExtensionFromFile: (file: any, type: any) =>
            loadExtensionFromFile(dispatch, file, type),
    });

    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(ScratchDesktopGUIComponent);
};

export default DesktopHOC;
