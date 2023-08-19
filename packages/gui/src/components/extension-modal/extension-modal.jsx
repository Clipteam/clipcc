/* eslint-disable react/no-multi-comp */
import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';

import Modal from '../../containers/modal.jsx';
import Divider from '../divider/divider.jsx';
import Filter from '../filter/filter.jsx';
import Switch from '../switch/switch.jsx';
import Button from '../button/button.jsx';
import TagButton from '../../containers/tag-button.jsx';
import Spinner from '../spinner/spinner.jsx';
import Select from '../select/select.jsx';
import Input from '../forms/input.jsx';
import BufferedInputHOC from '../forms/buffered-input-hoc.jsx';

import styles from './extension-modal.css';

import bluetoothIconURL from './bluetooth.svg';
import internetConnectionIconURL from './internet-connection.svg';
import extensionIconURL from './inset-icon.svg';

const BufferedInput = BufferedInputHOC(Input);

const messages = defineMessages({
    title: {
        id: 'gui.extensionModal.title',
        defaultMessage: 'Extension Management',
        description: 'Title of extension modal'
    },
    filterPlaceholder: {
        id: 'gui.extensionModal.filterPlaceholder',
        defaultMessage: 'Search',
        description: 'Placeholder text for extension modal search field'
    },
    offlineTag: {
        id: 'gui.extensionModal.offlineTag',
        defaultMessage: 'Offline',
        description: 'Label for extension modal tag to revert to offline extensions after filtering by tag.'
    },
    onlineTag: {
        id: 'gui.extensionModal.onlineTag',
        defaultMessage: 'Online',
        description: 'Label for extension modal tag to revert to online extensions after filtering by tag.'
    }
});

const tagListPrefix = [
    {tag: 'offline', intlLabel: messages.offlineTag},
    {tag: 'online', intlLabel: messages.onlineTag}
];

class ExtensionCard extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            expand: false
        };
        bindAll(this, [
            'switchExpand',
            'handleExtensionName',
            'handleSwitch',
            'handleChangeSettingsItem',
            'renderExtensionSettings'
        ]);
    }
    switchExpand () {
        this.setState({expand: !this.state.expand});
    }
    handleExtensionName (dataItem) {
        return dataItem.version ?
            `${dataItem.name} - ${dataItem.version}` :
            dataItem.name;
    }
    handleSwitch (value) {
        this.props.onExtensionStatusChanged(this.props.data.url, value);
    }
    handleChangeSettingsItem (id) {
        return value => {
            this.props.onChangeSettingsItem(id, value);
        };
    }
    renderExtensionSettings () {
        const settings = this.props.data.settings;
        const content = [];
        for (const setting of settings) {
            let element = null;
            switch (setting.type) {
            case 'boolean': {
                element = (<Switch
                    key={`${this.props.data.id}.settings.${setting.id}`}
                    onChange={this.handleChangeSettingsItem(`${this.props.data.id}.settings.${setting.id}`)}
                    value={this.props.settings[`${this.props.data.id}.settings.${setting.id}`] ?? setting.default}
                />);
                break;
            }
            case 'number': {
                element = (<BufferedInput
                    key={`${this.props.data.id}.settings.${setting.id}`}
                    small
                    tabIndex="0"
                    type="number"
                    min={setting.min}
                    max={setting.max}
                    precision={setting.precision}
                    placeholder="6"
                    value={this.props.settings[`${this.props.data.id}.settings.${setting.id}`] ?? setting.default}
                    onSubmit={this.handleChangeSettingsItem(`${this.props.data.id}.settings.${setting.id}`)}
                    className={classNames(styles.input)}
                />);
                break;
            }
            case 'selector': {
                const options = setting.options.map(v => ({
                    id: v.id,
                    text: this.props.intl.formatMessage({id: v.message})
                }));
                element = (<Select
                    options={options}
                    onChange={this.handleChangeSettingsItem(`${this.props.data.id}.settings.${setting.id}`)}
                    value={this.props.settings[`${this.props.data.id}.settings.${setting.id}`] ?? setting.default}
                />);
                break;
            }
            default:
                element = (<p>{'Error Type'}</p>);
            }
            content.push(
                <div className={styles.option}>
                    <span className={styles.label}>
                        {this.props.intl.formatMessage({id: `${this.props.data.id}.settings.${setting.id}`})}
                    </span>
                    {element}
                </div>
            );
        }
        return content;
    }
    render () {
        const {data, key} = this.props;
        return (
            <div
                className={classNames(styles.extensionCard, {
                    [styles.expand]: this.state.expand
                })}
                key={key}
            >
                <div
                    className={styles.header}
                    onClick={this.switchExpand}
                >
                    <img
                        alt={data.name}
                        src={data.insetIconURL || extensionIconURL}
                        className={styles.insetIcon}
                        style={{
                            backgroundColor: data.color1 ? `${data.color1}` : 'var(--clipcc-pen-primary)'
                        }}
                    />
                    <div className={styles.info}>
                        <span className={styles.name}>{this.handleExtensionName(data)}</span>
                        <span className={styles.description}>{data.description}</span>
                    </div>
                    <div
                        className={styles.featuredExtensionMetadataDetail}
                    >
                        {data.bluetoothRequired ? (
                            <img src={bluetoothIconURL} />
                        ) : null}
                        {data.internetConnectionRequired ? (
                            <img src={internetConnectionIconURL} />
                        ) : null}
                    </div>
                    {data.isOnline ? <></> : (
                        <Switch
                            value={data.enabled}
                            disabled={data.unavailable || (data.enabled && !data.hotReload)}
                            onChange={this.handleSwitch}
                        />
                    )}
                </div>
                {this.state.expand && (
                    <>
                        <div className={styles.rowDivider} />
                        <div className={styles.option}>
                            <span className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Extension ID"
                                    description="Label of ExtensionID"
                                    id="gui.extensionModal.extensionID"
                                />
                            </span>
                            <span>{data.id}</span>
                        </div>
                        <div className={styles.option}>
                            <span className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Type"
                                    description="Label of extension type"
                                    id="gui.extensionModal.extensionType"
                                />
                            </span>
                            <span>{data.type === 'scratch' ? (
                                <FormattedMessage
                                    defaultMessage="Scratch Standard"
                                    description="Label of scratch standard extension"
                                    id="gui.extensionModal.scratchStandard"
                                />
                            ) : (
                                <FormattedMessage
                                    defaultMessage="CCX (Version 1)"
                                    description="Label of ccx v1 extension"
                                    id="gui.extensionModal.ccxv1"
                                />
                            )}</span>
                        </div>
                        {data.blocks && (
                            <div className={styles.option}>
                                <span className={styles.label}>
                                    <FormattedMessage
                                        defaultMessage="Total blocks"
                                        description="Label of total blocks"
                                        id="gui.extensionModal.totalBlocks"
                                    />
                                </span>
                                <span>{data.blocks.length}</span>
                            </div>
                        )}
                        {data.docsURI && (
                            <div className={styles.option}>
                                <span className={styles.label}>
                                    <FormattedMessage
                                        defaultMessage="Documentation"
                                        description="Label of documentation"
                                        id="gui.extensionModal.documentation"
                                    />
                                </span>
                                <a
                                    href={data.docsURI}
                                    className={styles.link}
                                >
                                    <FormattedMessage
                                        defaultMessage="Open"
                                        description="Label of open documentation"
                                        id="gui.extensionModal.openDocumentation"
                                    />
                                </a>
                            </div>
                        )}
                        <div className={styles.option}>
                            <span className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Collaborator"
                                    description="Label of collaborator"
                                    id="gui.extensionModal.collaborator"
                                />
                            </span>
                            <span>{data.collaborator}</span>
                        </div>
                        <div className={styles.option}>
                            <span className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Running in sandbox"
                                    description="Label of running in sandbox"
                                    id="gui.extensionModal.runningInSandbox"
                                />
                            </span>
                            <Switch
                                disabled={data.isBuiltin || !data.hotReload}
                                value={data.sandboxed}
                            />
                        </div>
                        {data.settings && this.renderExtensionSettings()}
                    </>
                )}
            </div>
        );
    }
}

ExtensionCard.propTypes = {
    data: PropTypes.shape({
        name: PropTypes.string,
        collaborator: PropTypes.string,
        color1: PropTypes.string,
        blocks: PropTypes.array,
        docsURI: PropTypes.string,
        insetIconURL: PropTypes.string,
        version: PropTypes.string,
        enabled: PropTypes.boolean,
        internetConnectionRequired: PropTypes.bool,
        bluetoothRequired: PropTypes.bool,
        launchPeripheralConnectionFlow: PropTypes.boolean,
        hotReload: PropTypes.boolean,
        unavailable: PropTypes.boolean,
        sandboxed: PropTypes.boolean,
        isOnline: PropTypes.boolean,
        isBuiltin: PropTypes.boolean,
        warning: PropTypes.arrayOf(PropTypes.string),
        url: PropTypes.string,
        id: PropTypes.string,
        key: PropTypes.string,
        description: PropTypes.node,
        settings: PropTypes.array,
        type: PropTypes.oneOf(['scratch', 'ccx'])
    }),
    intl: intlShape.isRequired,
    key: PropTypes.string,
    settings: PropTypes.object,
    onExtensionStatusChanged: PropTypes.func,
    onChangeSettingsItem: PropTypes.func
};

class ExtensionModalComponent extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'scrollToTop',
            'setFilteredDataRef'
        ]);
    }
    componentDidUpdate (prevProps) {
        if (prevProps.filterQuery !== this.props.filterQuery ||
            prevProps.selectedTag !== this.props.selectedTag) {
            this.scrollToTop();
        }
    }
    scrollToTop () {
        this.filteredDataRef.scrollTop = 0;
    }
    setFilteredDataRef (ref) {
        this.filteredDataRef = ref;
    }
    getFilteredItem (data) {
        if (this.props.filter.trim() === '') return data;
        return data.filter(item => {
            const name = item.name ? (typeof item.name === 'string' ?
                // Use the name if it is a string, else use formatMessage to get the translated name
                item.name : this.props.intl.formatMessage(item.name.props)
            ) : null;
            if (name.includes(this.props.filter)) return item;
            if (item.id && item.id.includes(this.props.filter)) return item;
            if (item.collaborator && item.collaborator.includes(this.props.filter)) return item;
        });
    }
    render () {
        return (
            <Modal
                fullScreen
                contentLabel={this.props.intl.formatMessage(messages.title)}
                id="extensionModal"
                onRequestClose={this.props.onRequestClose}
            >
                <div className={styles.filterBar}>
                    <Filter
                        className={classNames(
                            styles.filterBarItem,
                            styles.filter
                        )}
                        filterQuery={this.props.filterQuery}
                        inputClassName={styles.filterInput}
                        placeholderText={this.props.intl.formatMessage(messages.filterPlaceholder)}
                        onChange={this.props.onFilterChange}
                        onEnter={this.props.onFilterEnter}
                        onClear={this.props.onFilterClear}
                    />
                    <Divider
                        className={classNames(
                            styles.filterBarItem,
                            styles.divider
                        )}
                    />
                    <div className={styles.tagWrapper}>
                        {tagListPrefix.map((tagProps, id) => (
                            <TagButton
                                active={
                                    this.props.selectedTag ===
                                        tagProps.tag.toLowerCase()
                                }
                                className={classNames(
                                    styles.filterBarItem,
                                    styles.tagButton,
                                    tagProps.className
                                )}
                                key={`tag-button-${id}`}
                                onClick={this.props.onTagClick}
                                {...tagProps}
                            />
                        ))}
                    </div>
                    {this.props.allowExtDev && (
                        <>
                            <Button
                                className={styles.loadButton}
                                onClick={this.props.onUpload}
                            >
                                <FormattedMessage
                                    defaultMessage="Upload"
                                    description="Label of upload extension"
                                    id="gui.extensionModal.upload"
                                />
                            </Button>
                            <div className={styles.spacer} />
                            <Button
                                className={styles.loadButton}
                                onClick={this.props.onLoadFromURL}
                            >
                                <FormattedMessage
                                    defaultMessage="Load from URL"
                                    description="Label of load extension from URL"
                                    id="gui.extensionModal.loadFromURL"
                                />
                            </Button>
                        </>
                    )}
                </div>
                <div
                    className={classNames(
                        styles.libraryScrollGrid,
                        styles.withFilterBar
                    )}
                    ref={this.setFilteredDataRef}
                >
                    {this.props.loaded ? (
                        this.getFilteredItem(this.props.data).map((dataItem, index) => (
                            <ExtensionCard
                                key={index}
                                data={dataItem}
                                intl={this.props.intl}
                                settings={this.props.settings}
                                onExtensionStatusChanged={this.props.onExtensionStatusChanged}
                                onChangeSettingsItem={this.props.onChangeSettingsItem}
                            />
                        ))
                    ) : (
                        <div className={styles.spinnerWrapper}>
                            <Spinner
                                large
                                level="primary"
                            />
                        </div>
                    )}
                </div>
            </Modal>
        );
    }
}

ExtensionModalComponent.propTypes = {
    allowExtDev: PropTypes.bool,
    filterQuery: PropTypes.string,
    filter: PropTypes.string,
    selectedTag: PropTypes.string,
    data: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string,
            collaborator: PropTypes.string,
            insetIconURL: PropTypes.string,
            version: PropTypes.string,
            enabled: PropTypes.boolean,
            internetConnectionRequired: PropTypes.bool,
            bluetoothRequired: PropTypes.bool,
            launchPeripheralConnectionFlow: PropTypes.boolean,
            hotReload: PropTypes.boolean,
            unavailable: PropTypes.boolean,
            sandboxed: PropTypes.boolean,
            isOnline: PropTypes.boolean,
            isBuiltin: PropTypes.boolean,
            warning: PropTypes.arrayOf(PropTypes.string),
            url: PropTypes.string,
            id: PropTypes.string,
            description: PropTypes.node,
            type: PropTypes.oneOf(['scratch', 'ccx'])
        })
        /* eslint-enable react/no-unused-prop-types, lines-around-comment */
    ),
    loaded: PropTypes.bool.isRequired,
    intl: intlShape.isRequired,
    onFilterChange: PropTypes.func,
    onFilterEnter: PropTypes.func,
    onFilterClear: PropTypes.func,
    onExtensionStatusChanged: PropTypes.func,
    onRequestClose: PropTypes.func,
    onTagClick: PropTypes.func,
    settings: PropTypes.object,
    onLoadFromURL: PropTypes.func,
    onChangeSettingsItem: PropTypes.func,
    onUpload: PropTypes.func
};

export default injectIntl(ExtensionModalComponent);
