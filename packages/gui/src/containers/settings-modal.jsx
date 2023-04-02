import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {connect} from 'react-redux';

import SettingsModalComponent from '../components/settings-modal/settings-modal.jsx';

import {
    closeSettingsModal
} from '../reducers/modals';
import {
    updateSettings
} from '../reducers/settings';

class SettingsModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClose',
            'handleChangeAutoSave',
            'handleChangeAutoSaveInterval',
            'handleChangeFramerate'
        ]);
    }
    handleClose () {
        this.props.onClose();
    }
    handleChangeAutoSave (value) {
        this.props.updateSettings({autoSave: value});
    }
    handleChangeAutoSaveInterval (value) {
        value = Math.round(value);
        if (value >= 60 && value <= 600) {
            this.props.updateSettings({autoSaveInterval: value});
        }
    }
    handleChangeFramerate (value) {
        value = Math.round(value);
        if (value >= 10 && value <= 240) {
            this.props.updateSettings({framerate: value});
        }
    }
    render () {
        return (
            <SettingsModalComponent
                autoSave={this.props.autoSave}
                autoSaveInterval={this.props.autoSaveInterval}
                framerate={this.props.framerate}
                onClose={this.handleClose}
                onChangeAutoSave={this.handleChangeAutoSave}
                onChangeAutoSaveInterval={this.handleChangeAutoSaveInterval}
                onChangeFramerate={this.handleChangeFramerate}
            />
        );
    }
}

SettingsModal.propTypes = {
    autoSave: PropTypes.bool.isRequired,
    autoSaveInterval: PropTypes.number.isRequired,
    framerate: PropTypes.number.isRequired,
    onClose: PropTypes.func.isRequired,
    updateSettings: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    autoSave: state.scratchGui.settings.autoSave,
    autoSaveInterval: state.scratchGui.settings.autoSaveInterval,
    framerate: state.scratchGui.settings.framerate,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeSettingsModal()),
    updateSettings: (settings) => dispatch(updateSettings(settings))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SettingsModal);
