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
            'handleChangeStageWidth',
            'handleChangeStageHeight',
            'handleChangeTranslateServiceUrl',
            'handleChangeTTSServiceUrl',
            'handleChangeUseScratchOfficialApi'
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
    handleChangeTranslateServiceUrl (url) {
        this.props.updateSettings({translateServiceUrl: url.trim().replace(/\/+$/, '')});
    }
    handleChangeTTSServiceUrl (url) {
        this.props.updateSettings({ttsServiceUrl: url.trim().replace(/\/+$/, '')});
    }
    handleChangeUseScratchOfficialApi (value) {
        this.props.updateSettings({useScratchOfficialApi: value});
    }
    render () {
        return (
            <SettingsModalComponent
                hideNonVanillaBlocks={this.props.hideNonVanillaBlocks}
                autoSave={this.props.autoSave}
                autoSaveInterval={this.props.autoSaveInterval}
                framerate={this.props.framerate}
                theme={this.props.theme}
                infiniteCloning={this.props.infiniteCloning}
                edgelessStage={this.props.edgelessStage}
                unlimitedListLength={this.props.unlimitedListLength}
                unlimitedPenSize={this.props.unlimitedPenSize}
                unlimitedSoundStuffs={this.props.unlimitedSoundStuffs}
                accurateCoordinates={this.props.accurateCoordinates}
                stageHeight={this.props.stageHeight}
                stageWidth={this.props.stageWidth}
                translateServiceUrl={this.props.translateServiceUrl}
                ttsServiceUrl={this.props.ttsServiceUrl}
                useScratchOfficialApi={this.props.useScratchOfficialApi}
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
                onChangeStageWidth={this.handleChangeStageWidth}
                onChangeStageHeight={this.handleChangeStageHeight}
                onChangeTranslateServiceUrl={this.handleChangeTranslateServiceUrl}
                onChangeTTSServiceUrl={this.handleChangeTTSServiceUrl}
                onChangeUseScratchOfficialApi={this.handleChangeUseScratchOfficialApi}
            />
        );
    }
}

SettingsModal.propTypes = {
    hideNonVanillaBlocks: PropTypes.bool.isRequired,
    autoSave: PropTypes.bool.isRequired,
    infiniteCloning: PropTypes.bool.isRequired,
    edgelessStage: PropTypes.bool.isRequired,
    unlimitedListLength: PropTypes.bool.isRequired,
    unlimitedPenSize: PropTypes.bool.isRequired,
    unlimitedSoundStuffs: PropTypes.bool.isRequired,
    accurateCoordinates: PropTypes.bool.isRequired,
    autoSaveInterval: PropTypes.number.isRequired,
    framerate: PropTypes.number.isRequired,
    theme: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    updateSettings: PropTypes.func.isRequired,
    stageHeight: PropTypes.number.isRequired,
    stageWidth: PropTypes.number.isRequired,
    translateServiceUrl: PropTypes.string.isRequired,
    ttsServiceUrl: PropTypes.string.isRequired,
    useScratchOfficialApi: PropTypes.bool.isRequired
};

const mapStateToProps = state => ({
    hideNonVanillaBlocks: state.scratchGui.settings.hideNonVanillaBlocks,
    autoSave: state.scratchGui.settings.autoSave,
    infiniteCloning: state.scratchGui.settings.infiniteCloning,
    edgelessStage: state.scratchGui.settings.edgelessStage,
    unlimitedListLength: state.scratchGui.settings.unlimitedListLength,
    unlimitedPenSize: state.scratchGui.settings.unlimitedPenSize,
    unlimitedSoundStuffs: state.scratchGui.settings.unlimitedSoundStuffs,
    accurateCoordinates: state.scratchGui.settings.accurateCoordinates,
    autoSaveInterval: state.scratchGui.settings.autoSaveInterval,
    framerate: state.scratchGui.settings.framerate,
    theme: state.scratchGui.settings.theme,
    stageHeight: state.scratchGui.settings.stageHeight,
    stageWidth: state.scratchGui.settings.stageWidth,
    translateServiceUrl: state.scratchGui.settings.translateServiceUrl,
    ttsServiceUrl: state.scratchGui.settings.ttsServiceUrl,
    useScratchOfficialApi: state.scratchGui.settings.useScratchOfficialApi
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeSettingsModal()),
    updateSettings: settings => dispatch(updateSettings(settings))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SettingsModal);
