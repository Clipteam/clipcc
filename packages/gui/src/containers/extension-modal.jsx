import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import ExtensionManager from 'clipcc-extension';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {updateSettings} from '../reducers/settings';

import extensionLibraryContent from '../lib/libraries/extensions/index.jsx';

import ExtensionModalComponent from '../components/extension-modal/extension-modal.jsx';

const messages = defineMessages({
    loadFromURL: {
        id: 'gui.extensionModal.enterURL',
        defaultMessage: 'Enter your extension\'s URL',
        description: 'Prompt of enter extension url'
    },
    runInUnsandboxedMode: {
        id: 'gui.extensionModal.runInUnsandboxedMode',
        defaultMessage: 'Is it running in unsandboxed mode?',
        description: 'Prompt of run in unsandboxed mode'
    }
});

class ExtensionModal extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'addExtension',
            'handleExtensionStatusChanged',
            'handleFilterChange',
            'handleFilterEnter',
            'handleFilterClear',
            'handleTagClick',
            'handleLoadFromURL',
            'handleUpload',
            'handleExtensionAdded',
            'handleChangeSettingsItem'
        ]);
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
        for (const id in loadedExtensions) {
            const ext = Object.assign({}, loadedExtensions[id]);
            this.addExtension(id, ext);
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
    }
    componentWillUnmount () {
        this.props.extensionManager.off('EXTENSION_LOADED', this.handleExtensionAdded);
    }
    addExtension (id, extension) {
        // Don't use extension info for built-in extensions;
        if (this.extensions.hasOwnProperty(id) && this.extensions[id].isBuiltin) {
            extension.info = this.extensions[id];
        } else {
            extension.info.type = extension.type;
            extension.info.sandboxed = extension.env === 'sandboxed';
            // unnecessary for extension modal
            delete extension.instance;
        }

        if (extension.type === 'scratch') {
            // scratch extension always enabled.
            extension.info.enabled = true;
            // placeholder
            if (!extension.info.insetIconURL) extension.info.insetIconURL = extension.info.blockIconURI;
        } else if (extension.type === 'ccx') {
            extension.info.enabled = extension.enabled;
            extension.info.collaborator = extension.info.author;
            extension.info.name = this.props.intl.formatMessage({id: `${extension.info.id}.name`});
            extension.info.description = this.props.intl.formatMessage({id: `${extension.info.id}.description`});
            extension.info.insetIconURL = extension.info.inset_icon;
        }
        this.extensions[id] = extension.info;
    }
    handleExtensionAdded (id, extension) {
        this.addExtension(id, Object.assign({}, extension));
        this.setState({extensions: Object.values(this.extensions)});
    }
    async handleExtensionStatusChanged (url, status) {
        if (status) {
            await this.props.extensionManager.loadExtensionURL(id);
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
        const isUnsandbox = confirm(this.props.intl.formatMessage(messages.runInUnsandboxedMode));
        await this.props.extensionManager.loadExtensionURL(url, 'scratch', isUnsandbox ? 'unsandboxed' : 'sandboxed');
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
                const formatted = this.props.intl.formatMessage(messages.runInUnsandboxedMode);
                const isSandbox = confirm(formatted) ? 'unsandboxed' : undefined;

                await this.props.extensionManager.loadExtensionURL(
                    url,
                    fileName.endsWith('.ccx') ? 'ccx' : 'scratch',
                    isSandbox
                );
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
    handleChangeSettingsItem (id, value) {
        this.props.updateSettings({[id]: value});
    }
    render () {
        return (
            <ExtensionModalComponent
                allowExtDev={this.props.allowExtDev}
                data={this.state.selectedTag === 'offline' ? this.state.extensions : this.state.onlineExtensions}
                settings={this.props.settings}
                filterQuery={this.state.filterQuery}
                filter={this.state.filter}
                selectedTag={this.state.selectedTag}
                onExtensionStatusChanged={this.handleExtensionStatusChanged}
                onTagClick={this.handleTagClick}
                onFilterChange={this.handleFilterChange}
                onFilterClear={this.handleFilterClear}
                onChangeSettingsItem={this.handleChangeSettingsItem}
                onFilterEnter={this.handleFilterEnter}
                onRequestClose={this.props.onRequestClose}
                loaded={this.state.selectedTag === 'offline' || this.state.contentLoaded}
                onLoadFromURL={this.handleLoadFromURL}
                onUpload={this.handleUpload}
            />
        );
    }
}

const mapStateToProps = state => ({
    settings: state.scratchGui.settings
});

const mapDispatchToProps = dispatch => ({
    updateSettings: (settings) => dispatch(updateSettings(settings))
});

ExtensionModal.propTypes = {
    intl: intlShape.isRequired,
    settings: PropTypes.object,
    onCategorySelected: PropTypes.func,
    onRequestClose: PropTypes.func,
    updateSettings: PropTypes.func,
    extensionManager: PropTypes.instanceOf(ExtensionManager).isRequired // eslint-disable-line react/no-unused-prop-types
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(injectIntl(ExtensionModal));
