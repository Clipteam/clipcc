import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'clipcc-vm';
import bowser from 'bowser';
import {STAGE_SIZE_MODES} from '../lib/layout-constants';
import {setStageSize} from '../reducers/stage-size';
import {setFullScreen} from '../reducers/mode';

import {connect} from 'react-redux';

import StageHeaderComponent from '../components/stage-header/stage-header.jsx';


// eslint-disable-next-line react/prefer-stateless-function
class StageHeader extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleKeyPress',
            'handleClickFullScreen'
        ]);
    }
    componentDidMount () {
        document.addEventListener('keydown', this.handleKeyPress);
    }
    componentWillUnmount () {
        document.removeEventListener('keydown', this.handleKeyPress);
    }
    toggleFullScreen (fullscreen) {
        if (fullscreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen()
                .then(
                    // Emit resize on window to get blocks to resize
                    () => window.dispatchEvent(new Event('resize'))
                );
        } else if (!fullscreen && document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen()
                .then(
                    // Emit resize on window to get blocks to resize
                    () => window.dispatchEvent(new Event('resize'))
                );
        }
    }
    handleKeyPress (event) {
        if (event.key === 'Escape' && this.props.isFullScreen) {
            this.props.onSetStageUnFull(false);
        }
    }
    handleClickFullScreen (event) {
        const ctrlKey = bowser.mac ? event.metaKey : event.ctrlKey;
        if (this.props.isFullScreen) {
            this.toggleFullScreen(false);
            this.props.onSetStageUnFull();
        } else {
            if (ctrlKey) {
                this.toggleFullScreen(true);
            }
            this.props.onSetStageFull();
        }
    }
    render () {
        const {
            ...props
        } = this.props;
        return (
            <StageHeaderComponent
                {...props}
                onSetStageFull={this.handleClickFullScreen}
                onSetStageUnFull={this.handleClickFullScreen}
                onKeyPress={this.handleKeyPress}
            />
        );
    }
}

StageHeader.propTypes = {
    isFullScreen: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    onSetStageFull: PropTypes.func.isRequired,
    onSetStageUnFull: PropTypes.func.isRequired,
    showBranding: PropTypes.bool,
    stageSizeMode: PropTypes.oneOf(Object.keys(STAGE_SIZE_MODES)),
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    stageSizeMode: state.scratchGui.stageSize.stageSize,
    showBranding: state.scratchGui.mode.showBranding,
    isFullScreen: state.scratchGui.mode.isFullScreen,
    isPlayerOnly: state.scratchGui.mode.isPlayerOnly
});

const mapDispatchToProps = dispatch => ({
    onSetStageLarge: () => dispatch(setStageSize(STAGE_SIZE_MODES.large)),
    onSetStageSmall: () => dispatch(setStageSize(STAGE_SIZE_MODES.small)),
    onSetStageFull: () => dispatch(setFullScreen(true)),
    onSetStageUnFull: () => dispatch(setFullScreen(false))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(StageHeader);
