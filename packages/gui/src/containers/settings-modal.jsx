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
            'handleChangeInfiniteCloning',
            'handleChangeEdgelessStage',
            'handleChangeUnlimitedListLength',
            'handleChangeUnlimitedPenSize',
            'handleChangeUnlimitedSoundStuffs',
            'handleChangeAccurateCoordinates',
            'handleChangeHideNonVanillaBlocks',
            'handleChangeSaveCCXInProject',
            'handleChangePersistentCCX',
            'handleChangeStageWidth',
            'handleChangeStageHeight'
        ]);
    }
    handleClose () {
        this.props.onClose();
    }
    handleChangeSettings (id, value) {
        this.props.updateSettings({ [id]: value });
    }
    handleChangeAutoSave (value) {
        this.props.updateSettings({autoSave: value});
    }
    handleChangeSaveCCXInProject (value) {
        this.props.updateSettings({saveCCXInProject: value});
    }
    handleChangePersistentCCX(value) {
        this.props.updateSettings({ persistentCCX: value });
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
    handleChangeInfiniteCloning (value) {
        this.props.updateSettings({infiniteCloning: value});
    }
    handleChangeEdgelessStage (value) {
        this.props.updateSettings({edgelessStage: value});
    }
    handleChangeUnlimitedListLength (value) {
        this.props.updateSettings({unlimitedListLength: value});
    }
    handleChangeUnlimitedPenSize (value) {
        this.props.updateSettings({unlimitedPenSize: value});
    }
    handleChangeUnlimitedSoundStuffs (value) {
        this.props.updateSettings({unlimitedSoundStuffs: value});
    }
    handleChangeAccurateCoordinates (value) {
        this.props.updateSettings({accurateCoordinates: value});
    }
    handleChangeHideNonVanillaBlocks (value) {
        this.props.updateSettings({hideNonVanillaBlocks: value});
    }
    handleChangeStageWidth (width) {
        if (width >= 480) {
            this.props.updateSettings({stageWidth: Math.round(width)});
        }
    }
    handleChangeStageHeight (height) {
        this.props.updateSettings({stageHeight: Math.round(height)});
    }
    render () {
        return (
            <SettingsModalComponent
                extensionSettings={this.props.extensionSettings}
                settings={this.props.settings}
                onClose={this.handleClose}
                onChangeAutoSave={this.handleChangeAutoSave}
                onChangeAutoSaveInterval={this.handleChangeAutoSaveInterval}
                onChangeFramerate={this.handleChangeFramerate}
                onChangeTheme={this.handleChangeTheme}
                onChangeInfiniteCloning={this.handleChangeInfiniteCloning}
                onChangeEdgelessStage={this.handleChangeEdgelessStage}
                onChangeUnlimitedListLength={this.handleChangeUnlimitedListLength}
                onChangeUnlimitedPenSize={this.handleChangeUnlimitedPenSize}
                onChangeUnlimitedSoundStuffs={this.handleChangeUnlimitedSoundStuffs}
                onChangeAccurateCoordinates={this.handleChangeAccurateCoordinates}
                onChangeHideNonVanillaBlocks={this.handleChangeHideNonVanillaBlocks}
                onChangeSaveCCXInProject={this.handleChangeSaveCCXInProject}
                onChangePersistentCCX={this.handleChangePersistentCCX}
                onChangeStageWidth={this.handleChangeStageWidth}
                onChangeStageHeight={this.handleChangeStageHeight}
                onChangeSettings={this.handleChangeSettings}
            />
        );
    }
}

SettingsModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    updateSettings: PropTypes.func.isRequired,
    settings: PropTypes.object.isRequired,
    extensionSettings: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
    settings: state.scratchGui.settings,
    extensionSettings: state.scratchGui.extensionSettings
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeSettingsModal()),
    updateSettings: (settings) => dispatch(updateSettings(settings))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SettingsModal);
