import bindAll from 'lodash.bindall';
import React from 'react';
import type {AnyAction, Dispatch} from 'redux';
import {connect} from 'react-redux';

import {
    defaultProjectId,
    getIsFetchingWithoutId,
    setProjectId
} from '../reducers/project-state';
import type AppStateHOC from './app-state-hoc';
import type {RootState} from './app-state-hoc';
import type {PropsOf} from './type-traits';

const mapStateToProps = (state: RootState) => {
    const loadingState = state.scratchGui.projectState.loadingState;
    return {
        isFetchingWithoutId: getIsFetchingWithoutId(loadingState),
        reduxProjectId: state.scratchGui.projectState.projectId
    };
};

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) => ({
    setProjectId: (projectId: string): void => {
        dispatch(setProjectId(projectId));
    }
});

type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;

type StatedGUILikeProps = PropsOf<ReturnType<typeof AppStateHOC>>;
type HashParserComponentProps = StatedGUILikeProps & StateProps & DispatchProps;


/* Higher Order Component to get the project id from location.hash
 * @param {React.Component} WrappedComponent: component to render
 * @returns {React.Component} component with hash parsing behavior
 */
const HashParserHOC = function <P extends StatedGUILikeProps> (
    WrappedComponent: React.ComponentType<P>
): React.ComponentType<HashParserComponentProps> {

    class HashParserComponent extends React.Component<HashParserComponentProps> {
        constructor (props: HashParserComponentProps) {
            super(props);
            bindAll(this, [
                'handleHashChange'
            ]);
        }

        override componentDidMount () {
            window.addEventListener('hashchange', this.handleHashChange);
            this.handleHashChange();
        }

        override componentDidUpdate (prevProps: Readonly<HashParserComponentProps>) {
            // if we are newly fetching a non-hash project...
            if (this.props.isFetchingWithoutId && !prevProps.isFetchingWithoutId) {
                // ...clear the hash from the url
                window.history.pushState(
                    'new-project',
                    'new-project',
                    window.location.pathname + window.location.search
                );
            }
        }

        override componentWillUnmount () {
            window.removeEventListener('hashchange', this.handleHashChange);
        }

        handleHashChange () {
            const hashMatch = window.location.hash.match(/#(\d+)/);
            const hashProjectId = hashMatch === null ? defaultProjectId : hashMatch[1];
            this.props.setProjectId(hashProjectId);
        }

        override render () {
            const {
                /* eslint-disable @typescript-eslint/no-unused-vars */
                isFetchingWithoutId: _isFetchingWithoutId,
                reduxProjectId: _reduxProjectId,
                setProjectId: _setProjectId,
                /* eslint-enable @typescript-eslint/no-unused-vars */
                ...componentProps
            } = this.props;
            const wrappedComponentProps = componentProps;
            return (
                <WrappedComponent
                    {...(wrappedComponentProps as P)}
                />
            );
        }
    }

    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (
        stateProps: StateProps,
        dispatchProps: DispatchProps,
        ownProps: PropsOf<typeof HashParserComponent>
    ): HashParserComponentProps => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );

    return connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(HashParserComponent);
};

export default HashParserHOC;
