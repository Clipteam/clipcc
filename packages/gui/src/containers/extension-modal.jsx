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
        description: 'Prompt of enter extension url',
    },
    runInSandbox: {
        id: 'gui.extensionModal.runInSandbox',
        defaultMessage: 'Is it running in sandbox?',
        description: 'Prompt of run in sandbox',
    }
});

class ExtensionModal extends React.PureComponent {
    constructor (props) {
        super(props);
        this.extensions = {};
        // Add offline extensions first
        for (const offlineExt of extensionLibraryContent) {
            this.extensions[offlineExt.url] = {
                id: offlineExt.url,
                isoffline: true,
                type: 'scratch',
                ...offlineExt
            };
        }
        this.state = {
            filterQuery: '',
            selectedTag: 'offline',
            contentLoaded: false,
            extensions: Object.values(this.extensions),
            onlineExtensions: []
        };
        bindAll(this, [
            'handleExtensionStatusChanged',
            'handleFilterChange',
            'handleFilterClear',
            'handleTagClick',
            'loadFromURL',
            'upload'
        ]);
    }
    async handleExtensionStatusChanged (url, status) {
        if (status) {
            await this.props.extensionManager.loadExtensionURL(url);
            this.props.onCategorySelected(url);
            this.extensions[url].enabled = true;
        } else {
            // todo
        }
        this.setState({extensions: Object.values(this.extensions)});
    }
    handleFilterChange (e) {
        this.setState({
            filterQuery: e.target.value
        });
    }
    handleFilterClear () {
        this.setState({filterQuery: ''});
    }
    async loadFromURL () {
        const url = prompt(this.props.intl.formatMessage(messages.loadFromURL));
        if (!url.trim()) return;
        const isSandbox = confirm(this.props.intl.formatMessage(messages.runInSandbox));
        await this.props.extensionManager.loadExtensionURL(url, 'scratch', isSandbox ? 'sandboxed' : 'unsandboxed');
    }
    upload () {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', '.js,.ccx');
        input.setAttribute('multiple', true);
        input.onchange = async (event) => {
            const files = event.target.files;
            for (const file of files) {
                const fileName = file.name;
                const fileExt = fileName.substring(fileName.lastIndexOf('.') + 1);

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
                selectedTag={this.state.selectedTag}
                onExtensionStatusChanged={this.handleExtensionStatusChanged}
                onTagClick={this.handleTagClick}
                onFilterChange={this.handleFilterChange}
                onFilterClear={this.handleFilterClear}
                onRequestClose={this.props.onRequestClose}
                loaded={this.state.selectedTag === 'offline' || this.state.contentLoaded}
                onLoadFromURL={this.loadFromURL}
                onUpload={this.upload}
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
