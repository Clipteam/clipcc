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
            'handleChangeFramerate',
            'handleChangeInfiniteCloning',
            'handleChangeEdgelessStage',
            'handleChangeUnlimitedListLength',
            'handleChangeUnlimitedPenSize',
            'handleChangeUnlimitedSoundEffects',
            'handleChangeAccurateMouseCoordinates'
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
            this.props.vm.setFramerate(value);
        }
    }
    handleChangeInfiniteCloning (value) {
        this.props.updateSettings({infiniteCloning: value});
        this.props.vm.setLimitOptions({
            infiniteCloning: !!value
        });
    }
    handleChangeEdgelessStage (value) {
        this.props.updateSettings({edgelessStage: value});
        // @todo
    }
    handleChangeUnlimitedListLength (value) {
        this.props.updateSettings({unlimitedListLength: value});
        this.props.vm.setLimitOptions({
            unlimitedListLength: !!value
        });
    }
    handleChangeUnlimitedPenSize (value) {
        this.props.updateSettings({unlimitedPenSize: value});
        // @todo
    }
    handleChangeUnlimitedSoundEffects (value) {
        this.props.updateSettings({unlimitedSoundEffects: value});
        // @todo
    }
    handleChangeAccurateMouseCoordinates (value) {
        this.props.updateSettings({accurateMouseCoordinates: value});
        // @todo
    }
    render () {
        return (
            <SettingsModalComponent
                autoSave={this.props.autoSave}
                autoSaveInterval={this.props.autoSaveInterval}
                framerate={this.props.framerate}
                infiniteCloning={this.props.infiniteCloning}
                edgelessStage={this.props.edgelessStage}
                unlimitedListLength={this.props.unlimitedListLength}
                unlimitedPenSize={this.props.unlimitedPenSize}
                unlimitedSoundEffects={this.props.unlimitedSoundEffects}
                accurateMouseCoordinates={this.props.accurateMouseCoordinates}
                onClose={this.handleClose}
                onChangeAutoSave={this.handleChangeAutoSave}
                onChangeAutoSaveInterval={this.handleChangeAutoSaveInterval}
                onChangeFramerate={this.handleChangeFramerate}
                onChangeInfiniteCloning={this.handleChangeInfiniteCloning}
                onChangeEdgelessStage={this.handleChangeEdgelessStage}
                onChangeUnlimitedListLength={this.handleChangeUnlimitedListLength}
                onChangeUnlimitedPenSize={this.handleChangeUnlimitedPenSize}
                onChangeUnlimitedSoundEffects={this.handleChangeUnlimitedSoundEffects}
                onChangeAccurateMouseCoordinates={this.handleChangeAccurateMouseCoordinates}
            />
        );
    }
}

SettingsModal.propTypes = {
    autoSave: PropTypes.bool.isRequired,
    infiniteCloning: PropTypes.bool.isRequired,
    edgelessStage: PropTypes.bool.isRequired,
    unlimitedListLength: PropTypes.bool.isRequired,
    unlimitedPenSize: PropTypes.bool.isRequired,
    unlimitedSoundEffects: PropTypes.bool.isRequired,
    accurateMouseCoordinates: PropTypes.bool.isRequired,
    autoSaveInterval: PropTypes.number.isRequired,
    framerate: PropTypes.number.isRequired,
    onClose: PropTypes.func.isRequired,
    updateSettings: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    autoSave: state.scratchGui.settings.autoSave,
    infiniteCloning: state.scratchGui.settings.infiniteCloning,
    edgelessStage: state.scratchGui.settings.edgelessStage,
    unlimitedListLength: state.scratchGui.settings.unlimitedListLength,
    unlimitedPenSize: state.scratchGui.settings.unlimitedPenSize,
    unlimitedSoundEffects: state.scratchGui.settings.unlimitedSoundEffects,
    accurateMouseCoordinates: state.scratchGui.settings.accurateMouseCoordinates,
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
