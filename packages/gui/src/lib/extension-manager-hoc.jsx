import PropTypes from 'prop-types';
import React from 'react';
import {addLocales, updateLocale} from '../reducers/locales';
import bindAll from 'lodash.bindall';
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
        constructor (props) {
            super(props);
            bindAll(this, ['handleLoaded']);
        }
        componentDidMount () {
            if (!this.props.extensionManager.vm) {
                this.props.extensionManager.attachVM(this.props.vm);
            }
            this.props.extensionManager.on('EXTENSION_LOADING', this.props.onShowLoading);
            this.props.extensionManager.on('EXTENSION_LOADED', this.handleLoaded);
            this.props.extensionManager.on('EXTENSION_LOAD_ERROR', this.props.onCloseLoading);
        }
        componentWillUnmount () {
            this.props.extensionManager.off('EXTENSION_LOADING', this.props.onShowLoading);
            this.props.extensionManager.off('EXTENSION_LOADED', this.handleLoaded);
            this.props.extensionManager.off('EXTENSION_LOAD_ERROR', this.props.onCloseLoading);
        }
        handleLoaded (url, extension) {
            // add locales
            if (extension.type === 'ccx') {
                this.props.addLocale(extension.locales);
            }
            this.props.onCloseLoading();
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
        addLocale: PropTypes.func.isRequired,
        onCloseLoading: PropTypes.func.isRequired,
        onShowLoading: PropTypes.func.isRequired,
        vm: PropTypes.instanceOf(VM).isRequired,
        extensionManager: PropTypes.instanceOf(ClipCCExtensionManager).isRequired
    };

    const mapDispatchToProps = dispatch => ({
        addLocale: locale => {
            dispatch(addLocales(locale));
            dispatch(updateLocale());
        },
        onCloseLoading: () => dispatch(closeAlertWithId('loadingExtension')),
        onShowLoading: () => dispatch(showStandardAlert('loadingExtension'))
    });

    return connect(
        // eslint-disable-next-line no-undefined
        undefined,
        mapDispatchToProps
    )(ExtensionManager);
};

export default extensionManagerHOC;
