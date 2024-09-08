import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'clipcc-vm';
import { update } from 'idb-keyval';
import { defineMessages, injectIntl, intlShape } from 'react-intl';

import extensionLibraryContent from '../lib/libraries/extensions/index.jsx';

import LibraryComponent from '../components/library/library.jsx';
import extensionIcon from '../components/action-menu/icon--sprite.svg';
import extensionTag from '../lib/libraries/extension-tag';
import { connect } from 'react-redux';

const messages = defineMessages({
    extensionTitle: {
        defaultMessage: 'Choose an Extension',
        description: 'Heading for the extension library',
        id: 'gui.extensionLibrary.chooseAnExtension'
    },
    extensionUrl: {
        defaultMessage: 'Enter the URL of the extension',
        description: 'Prompt for unoffical extension url',
        id: 'gui.extensionLibrary.extensionUrl'
    },
    enabled: {
        defaultMessage: 'Enabled',
        id: 'gui.extensionLibrary.enabled'
    },
    disabled: {
        defaultMessage: 'Disabled',
        id: 'gui.extensionLibrary.disabled'
    }
});

class ExtensionLibrary extends React.PureComponent {
    constructor(props) {
        super(props);
        bindAll(this, [
            'refreshExtensionLibraryThumbnailData',
            'handleItemSelect',
            'handleUpload'
        ]);
        this.manifests = Object.values(props.manager.manifests);
        this.state = {
            extensionLibraryThumbnailData: extensionLibraryContent.map(extension => ({
                rawURL: extension.iconURL || extensionIcon,
                ...extension
            }))
        }
    }
    componentDidMount () {
        this.refreshExtensionLibraryThumbnailData();
    }
    refreshExtensionLibraryThumbnailData () {
        this.setState({
            extensionLibraryThumbnailData: [
                ...extensionLibraryContent.map(extension => ({
                    rawURL: extension.iconURL || extensionIcon,
                    category: this.props.vm.extensionManager.isExtensionLoaded(extension.extensionId) ?
                        this.props.intl.formatMessage(messages.enabled) :
                        this.props.intl.formatMessage(messages.disabled),
                    ...extension
                })),
                ...this.manifests.map(manifest => ({
                    name: this.props.intl.formatMessage({ id: `${manifest.id}.name`, defaultMessage: `${manifest.id}.name` }),
                    description: this.props.intl.formatMessage({ id: `${manifest.id}.description`, defaultMessage: `${manifest.id}.description` }),
                    extensionId: manifest.id,
                    rawURL: manifest.icon,
                    iconURL: manifest.icon,
                    insetIconURL: manifest.inset_icon,
                    deletable: !this.props.manager.isEnabled(manifest.id),
                    version: manifest.version,
                    author: Array.isArray(manifest.author) ? manifest.author.join(', ') : manifest.author,
                    tags: ['clipcc'],
                    category: this.props.manager.isEnabled(manifest.id) ?
                        this.props.intl.formatMessage(messages.enabled) : 
                        this.props.intl.formatMessage(messages.disabled),
                    featured: true
                }))
            ]
        });
    }
    componentDidUpdate (prevProps) {
        if (prevProps.locale !== this.props.locale) {
            this.refreshExtensionLibraryThumbnailData();
        }
    }
    handleItemSelect(item) {
        const id = item.extensionId;
        let url = item.extensionURL ? item.extensionURL : id;
        if (!item.disabled && !id) {
            // eslint-disable-next-line no-alert
            url = prompt(this.props.intl.formatMessage(messages.extensionUrl));
        }
        if (id && !item.disabled) {
            if (item.tags.includes('clipcc')) {
                this.props.manager.enable(id);
            } else if (this.props.vm.extensionManager.isExtensionLoaded(url)) {
                this.props.onCategorySelected(id);
            } else {
                this.props.vm.extensionManager.loadExtensionURL(url).then(() => {
                    this.props.onCategorySelected(id);
                });
            }
        }

        this.refreshExtensionLibraryThumbnailData();
    }
    handleUpload() {
        const input = document.createElement('input');
        input.style = 'display: none';
        input.type = 'file';
        input.multiple = true;
        input.accept = '.js,.ccx';

        input.onchange = async (e) => {
            const files = e.target.files;
            const errors = [];

            for (let file of files) {
                try {
                    if (file.name.endsWith('.js')) {
                        const dataURI = await this.fileToDataURI(file);
                        await this.props.vm.extensionManager.loadExtensionURL(dataURI);
                    } else if (file.name.endsWith('.ccx')) {
                        const arrayBuffer = await this.fileToArrayBuffer(file);

                        const manifests = await this.props.manager.loadFromArrayBuffer(arrayBuffer);
                        if (!manifests.length) return;

                        this.manifests.push(...manifests);
                        this.refreshExtensionLibraryThumbnailData();
                        update('persistentCCX', (persistentCCXs) => {
                            if (!persistentCCXs) persistentCCXs = {};
                            return Object.assign(persistentCCXs, ...manifests.map(({id}) => ({[id]: arrayBuffer})));
                        });
                    }
                } catch (error) {
                    errors.push({ file: file.name, error });
                }
            }
        };

        input.click();
    }

    fileToDataURI(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }

    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(file);
        });
    }

    render() {
        return (
            <LibraryComponent
                data={this.state.extensionLibraryThumbnailData}
                filterable
                categorized
                tags={extensionTag}
                id="extensionLibrary"
                title={this.props.intl.formatMessage(messages.extensionTitle)}
                visible={this.props.visible}
                onUpload={this.handleUpload}
                onItemSelected={this.handleItemSelect}
                onRequestClose={this.props.onRequestClose}
            />
        );
    }
}

ExtensionLibrary.propTypes = {
    manager: PropTypes.object,
    intl: intlShape.isRequired,
    locale: PropTypes.string.isRequired,
    onCategorySelected: PropTypes.func,
    onRequestClose: PropTypes.func,
    visible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired // eslint-disable-line react/no-unused-prop-types
};

const mapStateToProps = (state) => ({
    persistentCCX: state.scratchGui.settings.persistentCCX,
    manager: state.scratchGui.ccx.manager,
    locale: state.locales.locale
});

export default injectIntl(
    connect(mapStateToProps)(ExtensionLibrary)
);
