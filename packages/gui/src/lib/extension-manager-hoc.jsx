import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import VM from 'clipcc-vm';
import ClipCCExtensionManager from 'clipcc-extension';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';

/*
 * Higher Order Component to manage extension manager.
 * @param {React.Component} WrappedComponent component to manage extensiom manager events for
 * @returns {React.Component} connected component with extension manager events bound to redux
 */
const extensionManagerHOC = function (WrappedComponent) {
    class ExtensionManager extends React.Component {
        componentDidMount () {
            if (!this.props.extensionManager.vm) {
                this.props.extensionManager.attachVM(this.props.vm);
            }
            this.props.extensionManager.on('EXTENSION_LOADING', this.props.onShowLoading);
            this.props.extensionManager.on('EXTENSION_LOADED', this.props.onCloseLoading);
            this.props.extensionManager.on('EXTENSION_LOAD_ERROR', this.props.onCloseLoading);
        }
        componentWillUnmount () {
            this.props.extensionManager.off('EXTENSION_LOADING', this.props.onShowLoading);
            this.props.extensionManager.off('EXTENSION_LOADED', this.props.onCloseLoading);
            this.props.extensionManager.off('EXTENSION_LOAD_ERROR', this.props.onCloseLoading);
        }
        render () {
            return (
                <WrappedComponent
                    extensionManager={this.props.extensionManager}
                    {...this.props}
                />
            );
        }
    }

    ExtensionManager.propTypes = {
        onCloseLoading: PropTypes.func.isRequired,
        onShowLoading: PropTypes.func.isRequired,
        vm: PropTypes.instanceOf(VM).isRequired,
        extensionManager: PropTypes.instanceOf(ClipCCExtensionManager).isRequired
    };

    const mapDispatchToProps = dispatch => ({
        onCloseLoading: () => dispatch(closeAlertWithId('loadingExtension')),
        onShowLoading: () => dispatch(showStandardAlert('loadingExtension'))
    });

    return connect(
        undefined,
        mapDispatchToProps
    )(ExtensionManager);
};

export default extensionManagerHOC;
