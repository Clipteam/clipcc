import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import {defineMessages, injectIntl, intlShape, FormattedMessage} from 'react-intl';
import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
import Input from '../forms/input.jsx';
import BufferedInputHOC from '../forms/buffered-input-hoc.jsx';
import Switch from '../switch/switch.jsx';
import styles from './settings-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Settings',
        description: 'Settings modal title',
        id: 'gui.settingsModal.title'
    },
    appearance: {
        defaultMessage: 'Appearance',
        description: 'Label of appearance',
        id: 'gui.settingsModal.appearance'
    },
    player: {
        defaultMessage: 'Player',
        description: 'Label of player',
        id: 'gui.settingsModal.player'
    },
    project: {
        defaultMessage: 'Project',
        description: 'Label of project',
        id: 'gui.settingsModal.project'
    }
});

const BufferedInput = BufferedInputHOC(Input);

class SettingsModal extends React.Component {
    constructor (props) {
        super(props);
        this.categoryRef = {
            appearance: null, // @todo use React.createRef instead after React 16.3
            player: null,
            project: null
        };
        bindAll(this, [
            'handleJumpToCategoryWrapper'
        ]);
    }
    handleJumpToCategoryWrapper (id) {
        return () => {
            this.categoryRef[id].scrollIntoView({
                behavior: 'smooth'
            });
        };
    }
    render () {
        return (
            <Modal
                className={styles.modalContent}
                contentLabel={this.props.intl.formatMessage(messages.title)}
                id="settingsModal"
                onRequestClose={this.props.onClose}
            >
                <Box className={styles.body}>
                    <Box
                        className={classNames(styles.menu, styles.scrollbar)}
                        justifyContent="space-between"
                    >
                        <p onClick={this.handleJumpToCategoryWrapper('appearance')}>
                            {this.props.intl.formatMessage(messages.appearance)}
                        </p>
                        <p onClick={this.handleJumpToCategoryWrapper('player')}>
                            {this.props.intl.formatMessage(messages.player)}
                        </p>
                        <p onClick={this.handleJumpToCategoryWrapper('project')}>
                            {this.props.intl.formatMessage(messages.project)}
                        </p>
                    </Box>
                    <Box
                        className={classNames(styles.content, styles.scrollbar)}
                        justifyContent="space-between"
                    >
                        <p
                            className={styles.category}
                            ref={ref => this.categoryRef.appearance = ref}
                        >
                            {this.props.intl.formatMessage(messages.appearance)}
                        </p>
                        <div className={styles.item}>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Hide Non-vanilla blocks"
                                    description="Label of hide non-vanilla blocks"
                                    id="gui.settingsModal.hideNonVanillaBlocks"
                                />
                                <FormattedMessage
                                    defaultMessage="Hide clipcc-specific blocks in toolbox."
                                    description="Description of hide non-vanilla blocks"
                                    id="gui.settingsModal.hideNonVanillaBlocksDescription"
                                />
                            </div>
                            <Switch
                                value={this.props.hideNonVanillaBlocks}
                                onChange={this.props.onChangeHideNonVanillaBlocks}
                            />
                        </div>
                        <p
                            className={styles.category}
                            ref={ref => this.categoryRef.player = ref}
                        >
                            {this.props.intl.formatMessage(messages.player)}
                        </p>
                        <div className={styles.item}>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Framerate"
                                    description="Label of framerate"
                                    id="gui.settingsModal.framerate"
                                />
                                <FormattedMessage
                                    defaultMessage="Set the framerate of the project. Some projects depends on framerate will not work properly without 30 fps."
                                    description="Description of framerate"
                                    id="gui.settingsModal.framerateDescription"
                                />
                            </div>
                            <BufferedInput
                                value={this.props.framerate}
                                onSubmit={this.props.onChangeFramerate}
                                className={styles.input}
                                small
                                tabIndex="0"
                                type="number"
                                min="10"
                                max="240"
                                step="1"
                                placeholder="30"
                            />
                        </div>
                        <p
                            className={styles.category}
                            ref={ref => this.categoryRef.project = ref}
                        >
                            {this.props.intl.formatMessage(messages.project)}
                        </p>
                        <div className={styles.item}>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Save via File System Access API"
                                    description="Label of save via File System Access API"
                                    id="gui.settingsModal.saveViaFsa"
                                />
                                <FormattedMessage
                                    defaultMessage="Save your project directly via File System Access API."
                                    description="Description of save via File System Access API"
                                    id="gui.settingsModal.saveViaFsaDescription"
                                />
                            </div>
                            <Switch
                                value={this.props.saveViaFsa}
                                onChange={this.props.onChangeSaveViaFsa}
                                disabled={this.props.enableCommunity}
                            />
                        </div>
                        <div className={styles.item}>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Auto Save"
                                    description="Label of auto save"
                                    id="gui.settingsModal.autoSave"
                                />
                                <FormattedMessage
                                    defaultMessage="Save your project automatically at regular intervals."
                                    description="Description of auto save"
                                    id="gui.settingsModal.autoSaveDescription"
                                />
                            </div>
                            <Switch
                                value={this.props.autoSave}
                                onChange={this.props.onChangeAutoSave}
                            />
                        </div>
                        <div className={styles.item}>
                            <div className={classNames(styles.label, this.props.autoSave ? null : styles.disabled)}>
                                <FormattedMessage
                                    defaultMessage="Auto Save Interval"
                                    description="Label of auto save interval"
                                    id="gui.settingsModal.autoSaveInterval"
                                />
                                <FormattedMessage
                                    defaultMessage="Control the time interval of saving your project automatically. Only applies when Auto Save is enabled."
                                    description="Description of auto save interval"
                                    id="gui.settingsModal.autoSaveIntervalDescription"
                                />
                            </div>
                            <BufferedInput
                                value={this.props.autoSaveInterval}
                                disabled={!this.props.autoSave}
                                onSubmit={this.props.onChangeAutoSaveInterval}
                                className={styles.input}
                                small
                                tabIndex="0"
                                type="number"
                                min="60"
                                max="600"
                                step="1"
                                placeholder="300"
                            />
                        </div>
                    </Box>
                </Box>
            </Modal>
        );
    }
}

SettingsModal.propTypes = {
    enableCommunity: PropTypes.bool.isRequired,
    hideNonVanillaBlocks: PropTypes.bool.isRequired,
    saveViaFsa: PropTypes.bool.isRequired,
    autoSave: PropTypes.bool.isRequired,
    autoSaveInterval: PropTypes.number.isRequired,
    framerate: PropTypes.number.isRequired,
    intl: intlShape.isRequired,
    onClose: PropTypes.func.isRequired,
    onChangeAutoSave: PropTypes.func.isRequired,
    onChangeAutoSaveInterval: PropTypes.func.isRequired,
    onChangeFramerate: PropTypes.func.isRequired,
    onChangeHideNonVanillaBlocks: PropTypes.func.isRequired
};

export default injectIntl(SettingsModal);
