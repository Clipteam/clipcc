import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';

import Modal from '../../containers/modal.jsx';
import Divider from '../divider/divider.jsx';
import Filter from '../filter/filter.jsx';
import Switch from '../switch/switch.jsx';
import TagButton from '../../containers/tag-button.jsx';
import Spinner from '../spinner/spinner.jsx';

import styles from './extension-modal.css';

import bluetoothIconURL from './bluetooth.svg';
import internetConnectionIconURL from './internet-connection.svg';

const messages = defineMessages({
    title: {
        id: 'gui.extensionModal.title',
        defaultMessage: 'Extension Management',
        description: 'Title of extension modal',
    },
    filterPlaceholder: {
        id: 'gui.extensionModal.filterPlaceholder',
        defaultMessage: 'Search',
        description: 'Placeholder text for extension modal search field',
    },
    offlineTag: {
        id: 'gui.extensionModal.offlineTag',
        defaultMessage: 'Offline',
        description: 'Label for extension modal tag to revert to offline extensions after filtering by tag.',
    },
    onlineTag: {
        id: 'gui.extensionModal.onlineTag',
        defaultMessage: 'Online',
        description: 'Label for extension modal tag to revert to online extensions after filtering by tag.',
    },
});

const tagListPrefix = [
    { tag: 'offline', intlLabel: messages.offlineTag },
    { tag: 'online', intlLabel: messages.onlineTag },
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
            'handleSwitch'
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
    render () {
        const { data, key } = this.props;
        return (
            <div
                className={classNames(styles.extensionCard, {
                    [styles.expand]: this.state.expand
                })}
                onClick={this.switchExpand}
                key={key}
            >
                <div className={styles.header}>
                    <img
                        alt={data.name}
                        src={data.insetIconURL}
                        className={styles.insetIcon}
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
                            disabled={data.unavailable}
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
                            <Switch disabled={data.isoffline} />
                        </div>
                    </>
                )}
            </div>
        )
    }
}

class ExtensionModalComponent extends React.Component {
    constructor(props) {
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
    render() {
        return (
            <Modal
                fullScreen
                contentLabel={this.props.intl.formatMessage(messages.title)}
                id='extensionModal'
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
                </div>
                <div
                    className={classNames(
                        styles.libraryScrollGrid,
                        styles.withFilterBar
                    )}
                    ref={this.setFilteredDataRef}
                >
                    {this.props.loaded ? (
                        this.props.data.map((dataItem, index) => (
                            <ExtensionCard
                                key={index}
                                data={dataItem}
                                onExtensionStatusChanged={this.props.onExtensionStatusChanged}
                            />
                        ))
                    ) : (
                        <div className={styles.spinnerWrapper}>
                            <Spinner large level='primary' />
                        </div>
                    )}
                </div>
            </Modal>
        );
    }
}

ExtensionModalComponent.propTypes = {
    filterQuery: PropTypes.string,
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
            isoffline: PropTypes.boolean,
            warning: PropTypes.arrayOf(PropTypes.string),
            url: PropTypes.string,
            id: PropTypes.string,
            description: PropTypes.node,
            type: PropTypes.oneOf(['scratch', 'ccx'])
        })
        /* eslint-enable react/no-unused-prop-types, lines-around-comment */
    ),
    intl: intlShape.isRequired,
    onFilterChange: PropTypes.func,
    onFilterClear: PropTypes.func,
    onExtensionStatusChanged: PropTypes.func,
    onRequestClose: PropTypes.func,
    onTagClick: PropTypes.func
};

export default injectIntl(ExtensionModalComponent);
