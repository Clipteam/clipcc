import bindAll from 'lodash.bindall';
import React from 'react';
import type {AnyAction, Dispatch} from 'redux';
import {connect} from 'react-redux';

import collectMetadata from '../lib/collect-metadata';
import log from '../lib/log';
import storage from '../lib/storage';
import dataURItoBlob from '../lib/data-uri-to-blob';
import saveProjectToServer from '../lib/save-project-to-server';

import {
    showAlertWithTimeout,
    showStandardAlert
} from '../reducers/alerts';
import {setAutoSaveTimeoutId} from '../reducers/timeout';
import {setProjectUnchanged} from '../reducers/project-changed';
import {
    autoUpdateProject,
    createProject,
    doneCreatingProject,
    doneUpdatingProject,
    getIsAnyCreatingNewState,
    getIsCreatingCopy,
    getIsCreatingNew,
    getIsLoading,
    getIsManualUpdating,
    getIsRemixing,
    getIsShowingWithId,
    getIsShowingWithoutId,
    getIsUpdating,
    projectError,
    type LoadingStateValue
} from '../reducers/project-state';
import type {RootState} from './app-state-hoc';
import type {Asset} from 'clipcc-storage';

type SaveProjectRequestParams = Parameters<typeof saveProjectToServer>[2];

type TelemetryEvent =
    | 'projectWasCreated'
    | 'projectDidLoad'
    | 'projectDidSave'
    | 'projectWasUploaded';

interface OwnProps {
    autoSaveIntervalSecs?: number;
    canCreateNew?: boolean;
    canSave?: boolean;
    isShared?: boolean;
    onProjectTelemetryEvent?: (event: TelemetryEvent, metadata: ReturnType<typeof collectMetadata>) => void;
    onRemixing?: (isRemixing: boolean) => void;
    onSetProjectSaver?: (projectSaver?: () => void) => void;
    onSetProjectThumbnailer?: (
        thumbnailer?: (callback: (dataURI: string) => void) => void
    ) => void;
    onUpdateProjectData?: typeof saveProjectToServer;
    onUpdateProjectThumbnail?: (projectId: string, blob: Blob) => void;
}

const mapStateToProps = (state: RootState, ownProps: OwnProps) => {
    const loadingState = state.scratchGui.projectState.loadingState;
    const isShowingWithId = getIsShowingWithId(loadingState);
    return {
        autoSaveTimeoutId: state.scratchGui.timeout.autoSaveTimeoutId,
        isAnyCreatingNewState: getIsAnyCreatingNewState(loadingState),
        isLoading: getIsLoading(loadingState),
        isCreatingCopy: getIsCreatingCopy(loadingState),
        isCreatingNew: getIsCreatingNew(loadingState),
        isRemixing: getIsRemixing(loadingState),
        isShowingSaveable: !!ownProps.canSave && isShowingWithId,
        isShowingWithId,
        isShowingWithoutId: getIsShowingWithoutId(loadingState),
        isUpdating: getIsUpdating(loadingState),
        isManualUpdating: getIsManualUpdating(loadingState),
        loadingState,
        locale: state.locales.locale,
        projectChanged: state.scratchGui.projectChanged,
        reduxProjectId: state.scratchGui.projectState.projectId,
        reduxProjectTitle: state.scratchGui.projectTitle,
        vm: state.scratchGui.vm
    };
};

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) => ({
    onAutoUpdateProject: () => dispatch(autoUpdateProject()),
    onCreatedProject: (projectId: string, loadingState: LoadingStateValue) => {
        const action = doneCreatingProject(projectId, loadingState);
        if (!action) return;
        dispatch(action);

    },
    onCreateProject: () => dispatch(createProject()),
    onProjectError: (error: unknown) => dispatch(projectError(error)),
    onSetProjectUnchanged: () => dispatch(setProjectUnchanged()),
    onShowAlert: (alertType: string) => dispatch(showStandardAlert(alertType)),
    onShowCopySuccessAlert: () => showAlertWithTimeout(dispatch, 'createCopySuccess'),
    onShowRemixSuccessAlert: () => showAlertWithTimeout(dispatch, 'createRemixSuccess'),
    onShowCreatingCopyAlert: () => showAlertWithTimeout(dispatch, 'creatingCopy'),
    onShowCreatingRemixAlert: () => showAlertWithTimeout(dispatch, 'creatingRemix'),
    onShowSaveSuccessAlert: () => showAlertWithTimeout(dispatch, 'saveSuccess'),
    onShowSavingAlert: () => showAlertWithTimeout(dispatch, 'saving'),
    onUpdatedProject: (loadingState: LoadingStateValue) => {
        const action = doneUpdatingProject(loadingState);
        if (!action) return;
        dispatch(action);
    },
    setAutoSaveTimeoutId: (id: ReturnType<typeof setTimeout> | null) => dispatch(setAutoSaveTimeoutId(id))
});

type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;

type ProjectSaverComponentProps<P> = P & OwnProps & StateProps & DispatchProps;

/**
 * Higher Order Component to provide behavior for saving projects.
 * @param WrappedComponent the component to add project saving functionality to
 * @returns WrappedComponent with project saving functionality added
 *
 * <ProjectSaverHOC>
 *     <WrappedComponent />
 * </ProjectSaverHOC>
 */
const ProjectSaverHOC = function <P extends Record<string, unknown>> (
    WrappedComponent: React.ComponentType<P>
) {
    class ProjectSaverComponent extends React.Component<ProjectSaverComponentProps<P>> {
        static defaultProps = {
            autoSaveIntervalSecs: 120,
            onUpdateProjectData: saveProjectToServer
        };

        constructor (props: ProjectSaverComponentProps<P>) {
            super(props);
            bindAll(this, [
                'getProjectThumbnail',
                'leavePageConfirm',
                'tryToAutoSave'
            ]);
        }

        override componentDidMount () {
            if (typeof window === 'object') {
                // Note: it might be better to use a listener instead of assigning onbeforeunload;
                // but then it'd be hard to turn this listening off in our tests
                window.onbeforeunload = event => this.leavePageConfirm(event);
            }

            // Allow the GUI consumer to pass in a function to receive a trigger
            // for triggering thumbnail or whole project saves.
            // These functions are called with null on unmount to prevent stale references.
            this.props.onSetProjectThumbnailer?.(this.getProjectThumbnail);
            this.props.onSetProjectSaver?.(this.tryToAutoSave);
        }

        override componentDidUpdate (prevProps: Readonly<ProjectSaverComponentProps<P>>) {
            if (!this.props.isAnyCreatingNewState && prevProps.isAnyCreatingNewState) {
                this.reportTelemetryEvent('projectWasCreated');
            }
            if (!this.props.isLoading && prevProps.isLoading) {
                this.reportTelemetryEvent('projectDidLoad');
            }

            if (this.props.projectChanged && !prevProps.projectChanged) {
                this.scheduleAutoSave();
            }
            if (this.props.isUpdating && !prevProps.isUpdating) {
                this.updateProjectToStorage();
            }
            if (this.props.isCreatingNew && !prevProps.isCreatingNew) {
                this.createNewProjectToStorage();
            }
            if (this.props.isCreatingCopy && !prevProps.isCreatingCopy) {
                this.createCopyToStorage();
            }
            if (this.props.isRemixing && !prevProps.isRemixing) {
                this.props.onRemixing?.(true);
                this.createRemixToStorage();
            } else if (!this.props.isRemixing && prevProps.isRemixing) {
                this.props.onRemixing?.(false);
            }

            // see if we should "create" the current project on the server
            //
            // don't try to create or save immediately after trying to create
            if (prevProps.isCreatingNew) return;
            // if we're newly able to create this project, create it!
            if (this.isShowingCreatable(this.props) && !this.isShowingCreatable(prevProps)) {
                this.props.onCreateProject();
            }

            // see if we should save/update the current project on the server
            //
            // don't try to save immediately after trying to save
            if (prevProps.isUpdating) return;
            // if we're newly able to save this project, save it!
            const becameAbleToSave = !!this.props.canSave && !prevProps.canSave;
            const becameShared = !!this.props.isShared && !prevProps.isShared;
            if (this.props.isShowingSaveable && (becameAbleToSave || becameShared)) {
                this.props.onAutoUpdateProject();
            }
        }

        override componentWillUnmount () {
            this.clearAutoSaveTimeout();
            // Cant unset the beforeunload because it might no longer belong to this component
            // i.e. if another of this component has been mounted before this one gets unmounted
            // which happens when going from project to editor view.
            // window.onbeforeunload = undefined;
            // Remove project thumbnailer function since the components are unmounting
            this.props.onSetProjectThumbnailer?.();
            this.props.onSetProjectSaver?.();
        }

        leavePageConfirm (e?: BeforeUnloadEvent) {
            if (this.props.projectChanged) {
                // both methods of returning a value may be necessary for browser compatibility
                if (!e) e = window.event;
                if (e) e.returnValue = true;
                return true;
            }
            return; // Returning undefined prevents the prompt from coming up
        }

        clearAutoSaveTimeout () {
            if (this.props.autoSaveTimeoutId !== null) {
                clearTimeout(this.props.autoSaveTimeoutId);
                this.props.setAutoSaveTimeoutId(null);
            }
        }

        scheduleAutoSave () {
            if (this.props.isShowingSaveable && this.props.autoSaveTimeoutId === null) {
                const timeoutId = setTimeout(this.tryToAutoSave,
                    this.props.autoSaveIntervalSecs! * 1000);
                this.props.setAutoSaveTimeoutId(timeoutId);
            }
        }

        tryToAutoSave () {
            if (this.props.projectChanged && this.props.isShowingSaveable) {
                this.props.onAutoUpdateProject();
            }
        }

        isShowingCreatable (props: Readonly<ProjectSaverComponentProps<P>>) {
            return !!props.canCreateNew && props.isShowingWithoutId;
        }

        async updateProjectToStorage () {
            this.props.onShowSavingAlert();
            try {
                await this.storeProject(this.props.reduxProjectId);
                // there's an http response object available here, but we don't need to examine
                // it, because there are no values contained in it that we care about
                this.props.onUpdatedProject(this.props.loadingState);
                this.props.onShowSaveSuccessAlert();
            } catch (err) {
                // Always show the savingError alert because it gives the
                // user the chance to download or retry the save manually.
                this.props.onShowAlert('savingError');
                this.props.onProjectError(err);
            }
        }

        async createNewProjectToStorage () {
            try {
                const response = await this.storeProject(null);
                this.props.onCreatedProject(response.id.toString(), this.props.loadingState);
            } catch (err) {
                this.props.onShowAlert('creatingError');
                this.props.onProjectError(err);
            }
        }

        async createCopyToStorage () {
            this.props.onShowCreatingCopyAlert();
            const requestParams: SaveProjectRequestParams = {
                isCopy: true,
                title: this.props.reduxProjectTitle
            };
            const originalId = this.props.reduxProjectId;
            if (originalId !== null) {
                requestParams.originalId = originalId;
            }

            try {
                const response = await this.storeProject(null, requestParams);
                this.props.onCreatedProject(response.id.toString(), this.props.loadingState);
                this.props.onShowCopySuccessAlert();
            } catch (err) {
                this.props.onShowAlert('creatingError');
                this.props.onProjectError(err);
            }
        }

        async createRemixToStorage () {
            this.props.onShowCreatingRemixAlert();
            const requestParams: SaveProjectRequestParams = {
                isRemix: true,
                title: this.props.reduxProjectTitle
            };
            const originalId = this.props.reduxProjectId;
            if (originalId !== null) {
                requestParams.originalId = originalId;
            }

            try {
                const response = await this.storeProject(null, requestParams);
                this.props.onCreatedProject(response.id.toString(), this.props.loadingState);
                this.props.onShowRemixSuccessAlert();
            } catch (err) {
                this.props.onShowAlert('creatingError');
                this.props.onProjectError(err);
            }
        }

        /**
         * storeProject:
         * @param projectId - defined value will PUT/update; undefined/null will POST/create
         * @returns resolves with json object containing project's existing or new id
         * @param requestParams - params to add to request body
         */
        storeProject (
            projectId: number | string | null,
            requestParams: SaveProjectRequestParams = {}
        ) {
            this.clearAutoSaveTimeout();
            // Serialize VM state now before embarking on
            // the asynchronous journey of storing assets to
            // the server. This ensures that assets don't update
            // while in the process of saving a project (e.g. the
            // serialized project refers to a newer asset than what
            // we just finished saving).
            const savedVMState = this.props.vm.toJSON();
            return Promise.all((this.props.vm.assets as Asset[])
                .filter(asset => !asset.clean)
                .map(asset => storage.store(
                    asset.assetType,
                    asset.dataFormat!,
                    asset.data!,
                    asset.assetId
                ).then(() => {
                    asset.clean = true;
                }))
            )
                .then(() => this.props.onUpdateProjectData!(projectId, savedVMState, requestParams))
                .then(response => {
                    this.props.onSetProjectUnchanged();
                    const id = response.id.toString();
                    if (id && this.props.onUpdateProjectThumbnail) {
                        this.storeProjectThumbnail(id);
                    }
                    this.reportTelemetryEvent('projectDidSave');
                    return response;
                })
                .catch(err => {
                    log.error(err);
                    throw err; // pass the error up the chain
                });
        }

        /**
         * Store a snapshot of the project once it has been saved/created.
         * Needs to happen _after_ save because the project must have an ID.
         * @param projectId - id of the project, must be defined.
         */
        storeProjectThumbnail (projectId: string) {
            try {
                this.getProjectThumbnail(dataURI => {
                    this.props.onUpdateProjectThumbnail?.(projectId, dataURItoBlob(dataURI));
                });
            } catch (error) {
                log.error('Project thumbnail save error', error);
                // This is intentionally fire/forget because a failure
                // to save the thumbnail is not vitally important to the user.
            }
        }

        getProjectThumbnail (callback: (dataURI: string) => void) {
            this.props.vm.postIOData('video', {forceTransparentPreview: true});
            this.props.vm.renderer.requestSnapshot((dataURI: string) => {
                this.props.vm.postIOData('video', {forceTransparentPreview: false});
                callback(dataURI);
            });
            this.props.vm.renderer.draw();
        }

        /**
         * Report a telemetry event.
         * @param event - one of `projectWasCreated`, `projectDidLoad`, `projectDidSave`, `projectWasUploaded`
         */
        // TODO make a telemetry HOC and move this stuff there
        reportTelemetryEvent (event: TelemetryEvent) {
            try {
                if (this.props.onProjectTelemetryEvent) {
                    const metadata = collectMetadata(this.props.vm, this.props.reduxProjectTitle, this.props.locale);
                    this.props.onProjectTelemetryEvent(event, metadata);
                }
            } catch (error) {
                log.error('Telemetry error', event, error);
                // This is intentionally fire/forget because a failure
                // to report telemetry should not block saving
            }
        }

        override render () {
            /* eslint-disable @typescript-eslint/no-unused-vars */
            const {
                autoSaveTimeoutId,
                autoSaveIntervalSecs,
                canCreateNew,
                canSave,
                isCreatingCopy,
                isCreatingNew,
                projectChanged,
                isAnyCreatingNewState,
                isLoading,
                isManualUpdating,
                isRemixing,
                isShared,
                isShowingSaveable,
                isShowingWithId,
                isShowingWithoutId,
                isUpdating,
                loadingState,
                locale,
                onAutoUpdateProject,
                onCreatedProject,
                onCreateProject,
                onProjectError,
                onProjectTelemetryEvent,
                onRemixing,
                onSetProjectUnchanged,
                onSetProjectThumbnailer,
                onSetProjectSaver,
                onShowAlert,
                onShowCopySuccessAlert,
                onShowRemixSuccessAlert,
                onShowCreatingCopyAlert,
                onShowCreatingRemixAlert,
                onShowSaveSuccessAlert,
                onShowSavingAlert,
                onUpdatedProject,
                onUpdateProjectData,
                onUpdateProjectThumbnail,
                reduxProjectId,
                reduxProjectTitle,
                setAutoSaveTimeoutId: setAutoSaveTimeoutIdProp,
                vm,
                ...componentProps
            } = this.props;
            /* eslint-enable @typescript-eslint/no-unused-vars */
            return (
                <WrappedComponent
                    isCreating={isAnyCreatingNewState}
                    {...(componentProps as P)}
                />
            );
        }
    }

    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (
        stateProps: StateProps,
        dispatchProps: DispatchProps,
        ownProps: P & OwnProps
    ): ProjectSaverComponentProps<P> => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );

    return connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    // @ts-expect-error bypass default props error
    )(ProjectSaverComponent);
};

export default ProjectSaverHOC;
