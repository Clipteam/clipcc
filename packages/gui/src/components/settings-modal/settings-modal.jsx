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
    default: {
        defaultMessage: 'Default',
        description: 'Label of default',
        id: 'gui.settingsModal.theme.default'
    },
    highContrast: {
        defaultMessage: 'High Contrast',
        description: 'Label of high contrast',
        id: 'gui.settingsModal.theme.highContrast'
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
            'handleJumpToCategoryWrapper',
            'renderExtensionSettings',
            'handleChangeSettingsItem'
        ]);
    }
    handleJumpToCategoryWrapper (id) {
        return () => {
            this.categoryRef[id].scrollIntoView({
                behavior: 'smooth'
            });
        };
    }
    handleChangeSettingsItem (id) {
        return value => {
            this.props.onChangeSettingsItem(id, value);
        };
    }
    renderExtensionSettings () {
        const ids = Object.keys(this.props.extensionSettings);
        const content = [];
        for (const id of ids) {
            const settings = this.props.extensionSettings[id];
            if (!this.categoryRef.hasOwnProperty(id)) {
                this.categoryRef[id] = null;
            }
            const currentContent = [(<p
                key={id}
                className={classNames(styles.category)}
                ref={ref => this.categoryRef[id] = ref}
            >
                {this.props.intl.formatMessage({id: `${id}.name`})}
            </p>)];
            for (const item of settings) {
                let element = null;
                switch (item.type) {
                case 'boolean': {
                    element = (<Switch
                        key={item.id}
                        onChange={this.handleChangeSettingsItem(item.id)}
                        value={this.props.settings[item.id]}
                    />);
                    break;
                }
                case 'number': {
                    element = (<BufferedInput
                        key={item.id}
                        small
                        tabIndex="0"
                        type="number"
                        min={item.min}
                        max={item.max}
                        precision={item.precision}
                        placeholder="6"
                        value={this.props.settings[item.id]}
                        onSubmit={this.handleChangeSettingsItem(item.id)}
                        className={classNames(styles.input)}
                    />);
                    break;
                }
                case 'selector': {
                    const options = item.options.map(v => ({
                        id: v.id,
                        text: this.props.intl.formatMessage({id: v.message})
                    }));
                    element = (<Select
                        options={options}
                        onChange={this.handleChangeSettingsItem(item.id)}
                        value={this.props.settings[item.id]}
                    />);
                    break;
                }
                default: {
                    element = (<p>{'Error Type'}</p>);
                }
                }

                currentContent.push(<div
                    key={item.id}
                    className={classNames(styles.item)}
                >
                    <p className={classNames(styles.label)}>
                        {this.props.intl.formatMessage({id: item.message})}
                    </p>
                    {element}
                </div>);
            }
            content.push(currentContent);
        }
        return content;
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
                        {Object.keys(this.props.extensionSettings).map(id => (
                            <p
                                key={id}
                                onClick={this.handleJumpToCategoryWrapper(id)}
                            >
                                {this.props.intl.formatMessage({ id: `${id}.name` })}
                            </p>
                        ))}
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
                                value={this.props.settings.theme}
                                onChange={this.props.onChangeTheme}
                                className={styles.selectSmall}
                                options={[{
                                    id: 'system',
                                    text: this.props.intl.formatMessage(messages.system)
                                }, {
                                    id: 'default',
                                    text: this.props.intl.formatMessage(messages.default)
                                }, {
                                    id: 'dark',
                                    text: this.props.intl.formatMessage(messages.dark)
                                }, {
                                    id: 'high-contrast',
                                    text: this.props.intl.formatMessage(messages.highContrast)
                                }]}
                            />
                        </div>
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
                                value={this.props.settings.hideNonVanillaBlocks}
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
                                value={this.props.settings.framerate}
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
                        <div className={styles.item}>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Infinite Cloning"
                                    description="Label of infinite cloning"
                                    id="gui.settingsModal.infiniteCloning"
                                />
                                <FormattedMessage
                                    defaultMessage="Remove the limit of up to 300 clones for Scratch."
                                    description="Description of infinite cloning"
                                    id="gui.settingsModal.infiniteCloningDescription"
                                />
                            </div>
                            <Switch
                                value={this.props.settings.infiniteCloning}
                                onChange={this.props.onChangeInfiniteCloning}
                            />
                        </div>
                        <div className={styles.item}>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Edgeless Stage"
                                    description="Label of edgeless stage"
                                    id="gui.settingsModal.edgelessStage"
                                />
                                <FormattedMessage
                                    defaultMessage="Allow sprites to move out of the stage area and change size freely."
                                    description="Description of edgeless stage"
                                    id="gui.settingsModal.edgelessStageDescription"
                                />
                            </div>
                            <Switch
                                value={this.props.settings.edgelessStage}
                                onChange={this.props.onChangeEdgelessStage}
                            />
                        </div>
                        <div className={styles.item}>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Unlimited List Length"
                                    description="Label of unlimited list length"
                                    id="gui.settingsModal.unlimitedListLength"
                                />
                                <FormattedMessage
                                    defaultMessage="Remove the maximum list length limit."
                                    description="Description of unlimited list length"
                                    id="gui.settingsModal.unlimitedListLengthDescription"
                                />
                            </div>
                            <Switch
                                value={this.props.settings.unlimitedListLength}
                                onChange={this.props.onChangeUnlimitedListLength}
                            />
                        </div>
                        <div className={styles.item}>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Unlimited Pen Size"
                                    description="Label of unlimited pen size"
                                    id="gui.settingsModal.unlimitedPenSize"
                                />
                                <FormattedMessage
                                    defaultMessage="Allow change pen size freely."
                                    description="Description of unlimited pen size"
                                    id="gui.settingsModal.unlimitedPenSizeDescription"
                                />
                            </div>
                            <Switch
                                value={this.props.settings.unlimitedPenSize}
                                onChange={this.props.onChangeUnlimitedPenSize}
                            />
                        </div>
                        <div className={styles.item}>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Unlimited Sound Stuffs"
                                    description="Label of Unlimited Sound Stuffs"
                                    id="gui.settingsModal.unlimitedSoundStuffs"
                                />
                                <FormattedMessage
                                    defaultMessage="Allow change sound stuffs (Eg: effects, note, tempo) freely."
                                    description="Description of unlimited sound stuffs"
                                    id="gui.settingsModal.unlimitedSoundStuffsDescription"
                                />
                            </div>
                            <Switch
                                value={this.props.settings.unlimitedSoundStuffs}
                                onChange={this.props.onChangeUnlimitedSoundStuffs}
                            />
                        </div>
                        <div className={styles.item}>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Accurate Coordinates"
                                    description="Label of accurate coordinates"
                                    id="gui.settingsModal.accurateCoordinates"
                                />
                                <FormattedMessage
                                    defaultMessage="Don't round coordinates."
                                    description="Description of accurate coordinates"
                                    id="gui.settingsModal.accurateCoordinatesDescription"
                                />
                            </div>
                            <Switch
                                value={this.props.settings.accurateCoordinates}
                                onChange={this.props.onChangeAccurateCoordinates}
                            />
                        </div>
                        <div className={styles.item}>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Stage Size"
                                    description="Label of stage size"
                                    id="gui.settingsModal.resolution"
                                />
                                <FormattedMessage
                                    defaultMessage="Change stage size, width must not be greater than 480."
                                    description="Description of stage size"
                                    id="gui.settingsModal.resolutionDescription"
                                />
                            </div>
                            <div className={styles.group}>
                                <BufferedInput
                                    small
                                    tabIndex="0"
                                    type="number"
                                    precision={0}
                                    placeholder={480}
                                    value={this.props.settings.stageWidth}
                                    onSubmit={this.props.onChangeStageWidth}
                                    className={classNames(styles.input)}
                                />
                                <div style={{margin: '0 1rem'}}>
                                    {'×'}
                                </div>
                                <BufferedInput
                                    small
                                    tabIndex="0"
                                    type="number"
                                    precision={0}
                                    placeholder={360}
                                    value={this.props.settings.stageHeight}
                                    onSubmit={this.props.onChangeStageHeight}
                                    className={classNames(styles.input)}
                                />
                            </div>
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
                                value={this.props.settings.autoSave}
                                onChange={this.props.onChangeAutoSave}
                            />
                        </div>
                        <div className={styles.item}>
                            <div className={classNames(styles.label, this.props.settings.autoSave ? null : styles.disabled)}>
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
                                value={this.props.settings.autoSaveInterval}
                                disabled={!this.props.settings.autoSave}
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
                        <div className={styles.item}>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Save ClipCC Extensions In Project"
                                    description="Label of save extensions in project"
                                    id="gui.settingsModal.saveExtensionsInProject"
                                />
                                <FormattedMessage
                                    defaultMessage="Save loaded ClipCC extensions in your project."
                                    description="Description of save ClipCC extensions in project"
                                    id="gui.settingsModal.saveCCXInProjectDescription"
                                />
                            </div>
                            <Switch
                                value={this.props.settings.saveCCXInProject}
                                onChange={this.props.onChangeSaveCCXInProject}
                            />
                        </div>
                        <div className={styles.item}>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Persistent Uploaded ClipCC Extensions"
                                    description="Label of persistent uploaded ClipCC extensions"
                                    id="gui.settingsModal.persistentCCX"
                                />
                                <FormattedMessage
                                    defaultMessage="Persistent uploaded ClipCC extensions in IndexedDB."
                                    description="Description of persistent uploaded ClipCC extensions"
                                    id="gui.settingsModal.persistentCCXDescription"
                                />
                            </div>
                            <Switch
                                value={this.props.settings.persistentCCX}
                                onChange={this.props.onChangePersistentCCX}
                            />
                        </div>
                        {this.renderExtensionSettings()}
                    </Box>
                </Box>
            </Modal>
        );
    }
}

SettingsModal.propTypes = {
    extensionSettings: PropTypes.object.isRequired,
    settings: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    onClose: PropTypes.func.isRequired,
    onChangeSettings: PropTypes.func.isRequired,
    onChangeAutoSave: PropTypes.func.isRequired,
    onChangeInfiniteCloning: PropTypes.func.isRequired,
    onChangeEdgelessStage: PropTypes.func.isRequired,
    onChangeUnlimitedListLength: PropTypes.func.isRequired,
    onChangeUnlimitedPenSize: PropTypes.func.isRequired,
    onChangeSaveCCXInProject:PropTypes.func.isRequired,
    onChangePersistentCCX: PropTypes.func.isRequired,
    onChangeUnlimitedSoundStuffs: PropTypes.func.isRequired,
    onChangeAccurateCoordinates: PropTypes.func.isRequired,
    onChangeAutoSaveInterval: PropTypes.func.isRequired,
    onChangeFramerate: PropTypes.func.isRequired,
    onChangeTheme: PropTypes.func.isRequired,
    onChangeHideNonVanillaBlocks: PropTypes.func.isRequired
};

export default injectIntl(SettingsModal);
