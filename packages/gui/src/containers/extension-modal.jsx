import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import ExtensionManager from 'clipcc-extension';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import extensionLibraryContent from '../lib/libraries/extensions/index.jsx';

import ExtensionModalComponent from '../components/extension-modal/extension-modal.jsx';
import extensionIcon from '../components/action-menu/icon--sprite.svg';

const messages = defineMessages({
    loadFromURL: {
        id: 'gui.extensionModal.enterURL',
        defaultMessage: 'Enter your extension\'s URL',
        description: 'Prompt of enter extension url'
    },
    runInSandbox: {
        id: 'gui.extensionModal.runInSandbox',
        defaultMessage: 'Is it running in sandbox?',
        description: 'Prompt of run in sandbox'
    }
});

class ExtensionModal extends React.PureComponent {
    constructor (props) {
        super(props);
        this.extensions = {};
        // Add builtin extensions first
        for (const offlineExt of extensionLibraryContent) {
            this.extensions[offlineExt.url] = {
                id: offlineExt.url,
                isBuiltin: true,
                type: 'scratch',
                ...offlineExt
            };
        }
        // Add loaded extensions
        const loadedExtensions = this.props.extensionManager.getLoadedExtensions();
        for (const extUrl in loadedExtensions) {
            const ext = loadedExtensions[extUrl];
            // Don't use extension info for built-in extensions;
            if (this.extensions.hasOwnProperty(extUrl) && this.extensions[extUrl].isBuiltin) {
                ext.info = this.extensions[extUrl];
            } else {
                ext.info.type = ext.type;
                // unnecessary for extension modal
                delete ext.class;
            }

            if (ext.type === 'scratch') {
                ext.info.sandboxed = ext.env === 'sandboxed';
                // scratch extension always enabled.
                ext.info.enabled = true;
                // placeholder
                if (!ext.info.insetIconURL) ext.info.insetIconURL = ext.info.blockIconURI;
            }
            this.extensions[extUrl] = ext.info;
        }
        this.props.extensionManager.on('EXTENSION_LOADED', this.handleExtensionAdded.bind(this));
        this.state = {
            filterQuery: '',
            filter: '',
            selectedTag: 'offline',
            contentLoaded: false,
            extensions: Object.values(this.extensions),
            onlineExtensions: []
        };
        bindAll(this, [
            'handleExtensionStatusChanged',
            'handleFilterChange',
            'handleFilterEnter',
            'handleFilterClear',
            'handleTagClick',
            'handleLoadFromURL',
            'handleUpload',
            'handleExtensionAdded'
        ]);
    }
    componentWillUnmount () {
        this.props.extensionManager.off('EXTENSION_LOADED', this.handleExtensionAdded);
    }
    handleExtensionAdded (url, extension) {
        // Don't use extension info for built-in extensions;
        if (this.extensions.hasOwnProperty(url) && this.extensions[url].isBuiltin) {
            extension.info = this.extensions[url];
        } else {
            extension.info.type = extension.type;
            // unnecessary for extension modal
            delete extension.class;
        }

        if (extension.type === 'scratch') {
            extension.info.sandboxed = extension.env === 'sandboxed';
            // scratch extension always enabled.
            extension.info.enabled = true;
            // placeholder
            if (!extension.info.insetIconURL) extension.info.insetIconURL = extension.info.blockIconURI;
        }
        this.extensions[url] = extension.info;
        this.setState({extensions: Object.values(this.extensions)});
    }
    async handleExtensionStatusChanged (url, status) {
        if (status) {
            await this.props.extensionManager.loadExtensionURL(url);
            this.props.onCategorySelected(url);
        } else {
            // todo
        }
    }
    handleFilterChange (e) {
        this.setState({
            filterQuery: e.target.value
        });
    }
    handleFilterEnter () {
        this.setState({
            filter: this.state.filterQuery
        });
    }
    handleFilterClear () {
        this.setState({
            filterQuery: '',
            filter: ''
        });
    }
    async handleLoadFromURL () {
        const url = prompt(this.props.intl.formatMessage(messages.loadFromURL));
        if (!url.trim()) return;
        const isSandbox = confirm(this.props.intl.formatMessage(messages.runInSandbox));
        await this.props.extensionManager.loadExtensionURL(url, 'scratch', isSandbox ? 'sandboxed' : 'unsandboxed');
    }
    handleUpload () {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', '.js,.ccx');
        input.setAttribute('multiple', true);
        input.onchange = async event => {
            const files = event.target.files;
            for (const file of files) {
                const fileName = file.name;

                const url = URL.createObjectURL(file);
                const isSandbox = confirm(fileName + this.props.intl.formatMessage(messages.runInSandbox));
                await this.props.extensionManager.loadExtensionURL(url, 'scratch', isSandbox ? 'sandboxed' : 'unsandboxed');
            }
        };
        input.click();
    }
    handleTagClick (tag) {
        this.setState({
            filterQuery: '',
            selectedTag: tag
        });
        if (tag === 'online') {
            // @todo fetch online extensions
            this.setState({loaded: true});
        } else {
            this.setState({loaded: false});
        }
    }
    render () {
        return (
            <ExtensionModalComponent
                data={this.state.selectedTag === 'offline' ? this.state.extensions : this.state.onlineExtensions}
                filterQuery={this.state.filterQuery}
                filter={this.state.filter}
                selectedTag={this.state.selectedTag}
                onExtensionStatusChanged={this.handleExtensionStatusChanged}
                onTagClick={this.handleTagClick}
                onFilterChange={this.handleFilterChange}
                onFilterClear={this.handleFilterClear}
                onFilterEnter={this.handleFilterEnter}
                onRequestClose={this.props.onRequestClose}
                loaded={this.state.selectedTag === 'offline' || this.state.contentLoaded}
                onLoadFromURL={this.handleLoadFromURL}
                onUpload={this.handleUpload}
            />
        );
    }
}


ExtensionModal.propTypes = {
    intl: intlShape.isRequired,
    onCategorySelected: PropTypes.func,
    onRequestClose: PropTypes.func,
    extensionManager: PropTypes.instanceOf(ExtensionManager).isRequired // eslint-disable-line react/no-unused-prop-types
};

export default injectIntl(ExtensionModal);
