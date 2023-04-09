import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
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
            'handleChangeFramerate',
            'handleChangeTheme',
            'handleChangeHideNonVanillaBlocks'
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
    handleChangeTheme (value) {
        this.props.updateSettings({theme: value});
    }
    handleChangeHideNonVanillaBlocks (value) {
        this.props.updateSettings({hideNonVanillaBlocks: value});
    }
    render () {
        return (
            <SettingsModalComponent
                hideNonVanillaBlocks={this.props.hideNonVanillaBlocks}
                autoSave={this.props.autoSave}
                autoSaveInterval={this.props.autoSaveInterval}
                framerate={this.props.framerate}
                theme={this.props.theme}
                onClose={this.handleClose}
                onChangeAutoSave={this.handleChangeAutoSave}
                onChangeAutoSaveInterval={this.handleChangeAutoSaveInterval}
                onChangeFramerate={this.handleChangeFramerate}
                onChangeTheme={this.handleChangeTheme}
                onChangeHideNonVanillaBlocks={this.handleChangeHideNonVanillaBlocks}
            />
        );
    }
}

SettingsModal.propTypes = {
    hideNonVanillaBlocks: PropTypes.bool.isRequired,
    autoSave: PropTypes.bool.isRequired,
    autoSaveInterval: PropTypes.number.isRequired,
    framerate: PropTypes.number.isRequired,
    theme: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    updateSettings: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    hideNonVanillaBlocks: state.scratchGui.settings.hideNonVanillaBlocks,
    autoSave: state.scratchGui.settings.autoSave,
    autoSaveInterval: state.scratchGui.settings.autoSaveInterval,
    framerate: state.scratchGui.settings.framerate,
    theme: state.scratchGui.settings.theme
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeSettingsModal()),
    updateSettings: (settings) => dispatch(updateSettings(settings))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SettingsModal);
