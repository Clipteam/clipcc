import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import {
    defaultProjectId,
    getIsFetchingWithoutId,
    setProjectId
} from '../reducers/project-state';

/* Higher Order Component to handle stuffs related to Codingclip.
 * @param {React.Component} WrappedComponent: component to render
 * @returns {React.Component} component with hash parsing behavior
 */
const CommunityHOC = function (WrappedComponent) {
    class CommunityComponent extends React.Component {
        constructor(props) {
            super(props);
        }
        componentDidMount() {
            let projectId = defaultProjectId;
            if (this.props.projectId) {
                projectId = this.props.projectId;
            }
            this.props.setProjectId(projectId);
        }
        componentDidUpdate (prevProps) {
            if (prevProps.projectId !== this.props.projectId) {
                this.props.setProjectId(projectId);
            }
        }
        render() {
            const {
                /* eslint-disable no-unused-vars */
                isFetchingWithoutId: isFetchingWithoutIdProp,
                reduxProjectId,
                projectId,
                setProjectId: setProjectIdProp,
                /* eslint-enable no-unused-vars */
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    {...componentProps}
                />
            );
        }
    }
    CommunityComponent.propTypes = {
        projectId: PropTypes.number,
        isFetchingWithoutId: PropTypes.bool,
        reduxProjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        setProjectId: PropTypes.func
    };
    const mapStateToProps = state => {
        const loadingState = state.scratchGui.projectState.loadingState;
        return {
            isFetchingWithoutId: getIsFetchingWithoutId(loadingState),
            reduxProjectId: state.scratchGui.projectState.projectId
        };
    };
    const mapDispatchToProps = dispatch => ({
        setProjectId: projectId => {
            dispatch(setProjectId(projectId));
        }
    });
    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );
    return connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(CommunityComponent);
};

export {
    CommunityHOC as default
};
