import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import {defineMessages, injectIntl, intlShape, FormattedMessage} from 'react-intl';
import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
import Input from '../forms/input.jsx';
import Select from '../select/select.jsx';
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
    },
    system: {
        defaultMessage: 'Follow System',
        description: 'Label of follow system',
        id: 'gui.settingsModal.theme.followSystem'
    },
    dark: {
        defaultMessage: 'Dark',
        description: 'Label of dark',
        id: 'gui.settingsModal.theme.dark'
    },
    light: {
        defaultMessage: 'Light',
        description: 'Label of light',
        id: 'gui.settingsModal.theme.light'
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
                                    defaultMessage="Theme"
                                    description="Label of theme"
                                    id="gui.settingsModal.theme"
                                />
                                <FormattedMessage
                                    defaultMessage="Switch between dark and light, or follow system."
                                    description="Description of theme"
                                    id="gui.settingsModal.themeDescription"
                                />
                            </div>
                            <Select
                                value={this.props.theme}
                                onChange={this.props.onChangeTheme}
                                className={styles.selectSmall}
                                options={[{
                                    id: 'system',
                                    text: this.props.intl.formatMessage(messages.system)
                                }, {
                                    id: 'dark',
                                    text: this.props.intl.formatMessage(messages.dark)
                                }, {
                                    id: 'light',
                                    text: this.props.intl.formatMessage(messages.light)
                                }]}
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
    autoSave: PropTypes.bool.isRequired,
    autoSaveInterval: PropTypes.number.isRequired,
    framerate: PropTypes.number.isRequired,
    theme: PropTypes.string.isRequired,
    intl: intlShape.isRequired,
    onClose: PropTypes.func.isRequired,
    onChangeAutoSave: PropTypes.func.isRequired,
    onChangeAutoSaveInterval: PropTypes.func.isRequired,
    onChangeFramerate: PropTypes.func.isRequired,
    onChangeTheme: PropTypes.func.isRequired
};

export default injectIntl(SettingsModal);
