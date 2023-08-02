import PropTypes from 'prop-types';
import React from 'react';
import {addLocales, updateLocale} from '../reducers/locales';
import {addNewSetting} from '../reducers/settings';
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
            bindAll(this, ['handleAddLocale', 'handleAddSettings']);
        }
        componentDidMount () {
            if (!this.props.extensionManager.vm) {
                this.props.extensionManager.attachVM(this.props.vm);
            }
            this.props.extensionManager.ccxAdapter.guiSettings = this.props.settings;
            this.props.extensionManager.setLocale(this.props.locale, this.props.messages);
            this.props.extensionManager.on('EXTENSION_LOADING', this.props.onShowLoading);
            this.props.extensionManager.on('SETTINGS_ADDED', this.handleAddSettings);
            this.props.extensionManager.on('LOCALE_ADDED', this.handleAddLocale);
            this.props.extensionManager.on('EXTENSION_LOADED', this.props.onCloseLoading);
            this.props.extensionManager.on('EXTENSION_LOAD_ERROR', this.props.onCloseLoading);
        }
        componentDidUpdate () {
            this.props.extensionManager.setLocale(this.props.locale, this.props.messages);
            this.props.extensionManager.ccxAdapter.guiSettings = this.props.settings;
        }
        componentWillUnmount () {
            this.props.extensionManager.off('EXTENSION_LOADING', this.props.onShowLoading);
            this.props.extensionManager.off('SETTINGS_ADDED', this.handleAddSettings);
            this.props.extensionManager.off('LOCALE_ADDED', this.handleAddLocale);
            this.props.extensionManager.off('EXTENSION_LOADED', this.props.onCloseLoading);
            this.props.extensionManager.off('EXTENSION_LOAD_ERROR', this.props.onCloseLoading);
        }
        handleAddLocale (locales) {
            this.props.addLocale(locales);
        }
        handleAddSettings (id, settings) {
            this.props.loadSettings(id, settings);
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
        locale: PropTypes.string,
        messages: PropTypes.objectOf(PropTypes.string),
        settings: PropTypes.object,
        addLocale: PropTypes.func.isRequired,
        loadSettings: PropTypes.func.isRequired,
        onCloseLoading: PropTypes.func.isRequired,
        onShowLoading: PropTypes.func.isRequired,
        vm: PropTypes.instanceOf(VM).isRequired,
        extensionManager: PropTypes.instanceOf(ClipCCExtensionManager).isRequired
    };

    const mapStateToProps = state => ({
        locale: state.locales.locale,
        messages: state.locales.messages,
        settings: state.scratchGui.settings
    });

    const mapDispatchToProps = dispatch => ({
        loadSettings: (id, settings) => {
            if (!Array.isArray(settings)) {
                throw Error('Bad settings format: Expect an array.');
            }

            for (const item of settings) {
                item.message = `${id}.settings.${item.id}`;
                item.id = `${id}.${item.id}`;
                dispatch(addNewSetting(item.id, item.default));
            }
        },
        addLocale: locale => {
            dispatch(addLocales(locale));
            dispatch(updateLocale());
        },
        onCloseLoading: () => dispatch(closeAlertWithId('loadingExtension')),
        onShowLoading: () => dispatch(showStandardAlert('loadingExtension'))
    });

    return connect(
        // eslint-disable-next-line no-undefined
        mapStateToProps,
        mapDispatchToProps
    )(ExtensionManager);
};

export default extensionManagerHOC;
