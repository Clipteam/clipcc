import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';

import VM from 'clipcc-vm';
import ClipCCExtensionManager from 'clipcc-extension';

/*
 * Higher Order Component to manage extension manager.
 * @param {React.Component} WrappedComponent component to manage extensiom manager events for
 * @returns {React.Component} connected component with extension manager events bound to redux
 */
const extensionManagerHOC = function (WrappedComponent) {
    class ExtensionManager extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'loadExtensionByURL'
            ]);
        }
        componentDidMount () {
            if (!this.props.extensionManager.vm) {
                this.props.extensionManager.attachVM(this.props.vm);
            }
        }
        loadExtensionByURL (url) {
            return this.props.extensionManager.loadExtensionURL(url)
                .then(id => id)
                .catch(e => {
                    this.props.onError(e);
                });
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
        vm: PropTypes.instanceOf(VM).isRequired,
        extensionManager: PropTypes.instanceOf(ClipCCExtensionManager).isRequired
    };

    return ExtensionManager;
};

export default extensionManagerHOC;
