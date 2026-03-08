import bindAll from 'lodash.bindall';
import debounce from 'lodash.debounce';
import defaultsDeep from 'lodash.defaultsdeep';
import makeToolbox from '../lib/make-toolbox';
import PropTypes from 'prop-types';
import React from 'react';
import {injectBlock} from '../lib/blocks-loader-hoc.tsx';
import VMScratchBlocks from '../lib/blocks';
import VM from 'clipcc-vm';

import log from '../lib/log.js';
import Prompt from './prompt.jsx';
import BlocksComponent from '../components/blocks/blocks.jsx';
import ExtensionLibrary from './extension-library.jsx';
import extensionData from '../lib/libraries/extensions/index.jsx';
import CustomProcedures from './custom-procedures.jsx';
import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import {BLOCKS_DEFAULT_SCALE, STAGE_DISPLAY_SIZES} from '../lib/layout-constants';
import DropAreaHOC from '../lib/drop-area-hoc.jsx';
import DragConstants from '../lib/drag-constants';
import defineDynamicBlock from '../lib/define-dynamic-block';
import {DEFAULT_THEME, DARK_THEME, HIGH_CONTRAST_THEME, getColorsForTheme, themeMap} from '../lib/themes';
import {defineBlockThemes} from '../lib/themes/blockThemeHelpers';
import {injectExtensionBlockTheme, injectExtensionCategoryTheme} from '../lib/themes/blockHelpers';

import {connect} from 'react-redux';
import {updateToolbox} from '../reducers/toolbox';
import {activateColorPicker} from '../reducers/color-picker';
import {closeExtensionLibrary, openSoundRecorder, openConnectionModal} from '../reducers/modals';
import {activateCustomProcedures, deactivateCustomProcedures} from '../reducers/custom-procedures';
import {setConnectionModalExtensionId} from '../reducers/connection-modal';
import {updateMetrics} from '../reducers/workspace-metrics';

import {
    activateTab,
    SOUNDS_TAB_INDEX
} from '../reducers/editor-tab';

const addFunctionListener = (object, property, callback) => {
    const oldFn = object[property];
    object[property] = function (...args) {
        const result = oldFn.apply(this, args);
        callback.apply(this, result);
        return result;
    };
};

const DroppableBlocks = DropAreaHOC([
    DragConstants.BACKPACK_CODE
])(BlocksComponent);

class Blocks extends React.Component {
    constructor (props) {
        super(props);
        this.ScratchBlocks = VMScratchBlocks(props.vm, props.blocks);
        bindAll(this, [
            'attachVM',
            'checkoutWsByProccode',
            'detachVM',
            'getToolbox',
            'handleCategorySelected',
            'handleConnectionModalStart',
            'handleDrop',
            'handleStatusButtonUpdate',
            'handleOpenSoundRecorder',
            'handlePromptStart',
            'handlePromptCallback',
            'handlePromptClose',
            'handleCustomProceduresClose',
            'onScriptGlowOn',
            'onScriptGlowOff',
            'onBlockGlowOn',
            'onBlockGlowOff',
            'handleMonitorsUpdate',
            'handleExtensionAdded',
            'handleBlocksInfoUpdate',
            'onTargetsUpdate',
            'onVisualReport',
            'onWorkspaceUpdate',
            'onWorkspaceMetricsChange',
            'setBlocks',
            'setLocale'
        ]);
        this.ScratchBlocks.callbackRegistry.register('showVariablePrompt', this.handlePromptStart);
        this.ScratchBlocks.callbackRegistry.register('statusButtonCallback', this.handleConnectionModalStart);
        this.ScratchBlocks.recordSoundCallback = this.handleOpenSoundRecorder;

        this.state = {
            prompt: null
        };
        this.onTargetsUpdate = debounce(this.onTargetsUpdate, 100);
        this.toolboxUpdateQueue = [];
        defineBlockThemes(this.ScratchBlocks);
        this.themeMapName = {
            [DEFAULT_THEME]: 'scratch',
            [DARK_THEME]: 'dark',
            [HIGH_CONTRAST_THEME]: 'high-contrast'
        };
    }
    componentDidMount () {
        this.ScratchBlocks.FieldColourSlider.activateEyedropper = this.props.onActivateColorPicker;
        this.ScratchBlocks.callbackRegistry.register('externalCheckoutWorkspaceCallback', this.checkoutWsByProccode);
        this.ScratchBlocks.callbackRegistry.register(
            'externalProcedureDefCallback', this.props.onActivateCustomProcedures);
        this.ScratchBlocks.setLocale(this.props.blockMessages);

        const workspaceConfig = defaultsDeep({},
            Blocks.defaultOptions,
            this.props.options,
            {
                rtl: this.props.isRtl,
                toolbox: this.props.toolbox,
                colours: getColorsForTheme(this.props.theme),
                theme: this.themeMapName[this.props.theme] || 'scratch'
            }
        );
        this.workspace = this.ScratchBlocks.inject(this.blocks, workspaceConfig);

        // Register buttons under new callback keys for creating variables,
        // lists, and procedures from extensions.
        // cc - These callbacks are the same as those in blockly, maybe unnecessary to register.

        // const toolboxWorkspace = this.workspace.getFlyout().getWorkspace();

        // const varListButtonCallback = type =>
        //     (() => this.ScratchBlocks.Variables.createVariable(this.workspace, null, type));
        // const procButtonCallback = () => {
        //     this.ScratchBlocks.Procedures.createProcedureDefCallback(this.workspace);
        // };

        // toolboxWorkspace.registerButtonCallback('MAKE_A_VARIABLE', varListButtonCallback(''));
        // toolboxWorkspace.registerButtonCallback('MAKE_A_LIST', varListButtonCallback('list'));
        // toolboxWorkspace.registerButtonCallback('MAKE_A_PROCEDURE', procButtonCallback);

        // Store the toolbox that is actually rendered.
        // This is used in componentDidUpdate instead of prevProps, because
        // the toolbox can change while e.g. on the costumes tab.
        this._renderedToolbox = this.props.toolbox;

        // @todo change this when blockly supports UI events
        addFunctionListener(this.workspace, 'translate', this.onWorkspaceMetricsChange);
        addFunctionListener(this.workspace, 'zoom', this.onWorkspaceMetricsChange);

        this.attachVM();
        // Only update blocks/vm locale when visible to avoid sizing issues
        // If locale changes while not visible it will get handled in didUpdate
        if (this.props.isVisible) {
            this.setLocale();
        }
    }
    shouldComponentUpdate (nextProps, nextState) {
        return (
            this.state.prompt !== nextState.prompt ||
            this.props.isVisible !== nextProps.isVisible ||
            this._renderedToolbox !== nextProps.toolbox ||
            this.props.extensionLibraryVisible !== nextProps.extensionLibraryVisible ||
            this.props.customProceduresVisible !== nextProps.customProceduresVisible ||
            this.props.locale !== nextProps.locale ||
            this.props.theme !== nextProps.theme ||
            this.props.anyModalVisible !== nextProps.anyModalVisible ||
            this.props.hideNonVanillaBlocks !== nextProps.hideNonVanillaBlocks ||
            this.props.stageSize !== nextProps.stageSize
        );
    }
    componentDidUpdate (prevProps) {
        // If any modals are open, call hideChaff to close z-indexed field editors
        if (this.props.anyModalVisible && !prevProps.anyModalVisible) {
            this.ScratchBlocks.common.getMainWorkspace().hideChaff();
        }

        // Only rerender the toolbox when the blocks are visible and the toolbox is
        // different from the previously rendered toolbox.
        // Do not check against prevProps.toolbox because that may not have been rendered.
        if (this.props.isVisible && this.props.toolbox !== this._renderedToolbox) {
            this.requestToolboxUpdate();
        }
        if (this.props.hideNonVanillaBlocks !== prevProps.hideNonVanillaBlocks) {
            const toolbox = this.getToolbox();
            if (toolbox) {
                this.props.updateToolboxState(toolbox);
            }
        }

        if (this.props.isVisible === prevProps.isVisible) {
            if (this.props.stageSize !== prevProps.stageSize) {
                // force workspace to redraw for the new stage size
                window.dispatchEvent(new Event('resize'));
            }
            return;
        }
        // @todo hack to resize blockly manually in case resize happened while hidden
        // @todo hack to reload the workspace due to gui bug #413
        if (this.props.isVisible) { // Scripts tab
            this.workspace.setVisible(true);
            if (prevProps.locale !== this.props.locale || this.props.locale !== this.props.vm.getLocale()) {
                // call setLocale if the locale has changed, or changed while the blocks were hidden.
                // vm.getLocale() will be out of sync if locale was changed while not visible
                this.setLocale();
            // eslint-disable-next-line no-negated-condition
            } else if (this.props.theme !== prevProps.theme) {
                this.ScratchBlocks.Theme.setTheme(this.themeMapName[this.props.theme] || 'scratch', this.workspace);
            } else {
                this.props.vm.refreshWorkspace();
                this.requestToolboxUpdate();
            }

            window.dispatchEvent(new Event('resize'));
        } else {
            this.workspace.setVisible(false);
        }
    }
    componentWillUnmount () {
        this.detachVM();
        this.workspace.dispose();
        clearTimeout(this.toolboxUpdateTimeout);

        // Clear the flyout blocks so that they can be recreated on mount.
        this.props.vm.clearFlyoutBlocks();
    }
    requestToolboxUpdate () {
        clearTimeout(this.toolboxUpdateTimeout);
        this.toolboxUpdateTimeout = setTimeout(() => {
            this.updateToolbox();
        }, 0);
    }
    setLocale () {
        this.ScratchBlocks.setLocale(this.props.blockMessages);
        this.props.vm.setLocale(this.props.locale, this.props.messages)
            .then(() => {
                this.workspace.getFlyout().setRecyclingEnabled(false);
                this.props.vm.refreshWorkspace();
                this.requestToolboxUpdate();
                this.withToolboxUpdates(() => {
                    this.workspace.getFlyout().setRecyclingEnabled(true);
                });
            });
    }

    updateToolbox () {
        this.toolboxUpdateTimeout = false;

        const toolbox = this.workspace.getToolbox();
        const flyout = this.workspace.getFlyout();
        if (!flyout.isVisible()) {
            flyout.setVisible(true);
        }
        const flyoutWs = flyout.getWorkspace();

        flyout.setRecyclingEnabled(false);
        const selectedItem = toolbox.getSelectedItem();
        const selectedCategoryId = selectedItem?.getId();
        let offsetWithinCategory = 0;

        if (selectedCategoryId) {
            const categoryPos = flyout.getCategoryScrollPosition(selectedCategoryId);
            if (typeof categoryPos === 'number') {
                offsetWithinCategory = -flyoutWs.scrollY / flyoutWs.scale - categoryPos;
            }
        }

        this.workspace.updateToolbox(this.props.toolbox);
        this._renderedToolbox = this.props.toolbox;

        toolbox.forceRerender().then(() => {
            flyout.setRecyclingEnabled(true);
            if (selectedCategoryId) {
                const newCategoryPos = flyout.getCategoryScrollPosition(selectedCategoryId);
                if (typeof newCategoryPos === 'number') {
                    const newViewTop = newCategoryPos + offsetWithinCategory;
                    if (flyoutWs.scrollbar) {
                        flyoutWs.scrollbar.setY(newViewTop * flyoutWs.scale);
                    }
                }
            }
            const queue = this.toolboxUpdateQueue;
            this.toolboxUpdateQueue = [];
            queue.forEach(fn => fn());
        });
    }

    withToolboxUpdates (fn) {
        // if there is a queued toolbox update, we need to wait
        if (this.toolboxUpdateTimeout) {
            this.toolboxUpdateQueue.push(fn);
        } else {
            fn();
        }
    }

    attachVM () {
        this.workspace.addChangeListener(this.props.vm.blockListener);
        this.flyoutWorkspace = this.workspace
            .getFlyout()
            .getWorkspace();
        this.flyoutWorkspace.addChangeListener(this.props.vm.flyoutBlockListener);
        this.flyoutWorkspace.addChangeListener(this.props.vm.monitorBlockListener);
        this.props.vm.on('SCRIPT_GLOW_ON', this.onScriptGlowOn);
        this.props.vm.on('SCRIPT_GLOW_OFF', this.onScriptGlowOff);
        this.props.vm.on('BLOCK_GLOW_ON', this.onBlockGlowOn);
        this.props.vm.on('BLOCK_GLOW_OFF', this.onBlockGlowOff);
        this.props.vm.on('VISUAL_REPORT', this.onVisualReport);
        this.props.vm.on('workspaceUpdate', this.onWorkspaceUpdate);
        this.props.vm.on('targetsUpdate', this.onTargetsUpdate);
        this.props.vm.on('MONITORS_UPDATE', this.handleMonitorsUpdate);
        this.props.vm.on('EXTENSION_ADDED', this.handleExtensionAdded);
        this.props.vm.on('BLOCKSINFO_UPDATE', this.handleBlocksInfoUpdate);
        this.props.vm.on('PERIPHERAL_CONNECTED', this.handleStatusButtonUpdate);
        this.props.vm.on('PERIPHERAL_DISCONNECTED', this.handleStatusButtonUpdate);
    }
    detachVM () {
        this.workspace.removeChangeListener(this.props.vm.blockListener);
        this.flyoutWorkspace = this.workspace
            .getFlyout()
            .getWorkspace();
        this.flyoutWorkspace.removeChangeListener(this.props.vm.flyoutBlockListener);
        this.flyoutWorkspace.removeChangeListener(this.props.vm.monitorBlockListener);
        this.props.vm.off('SCRIPT_GLOW_ON', this.onScriptGlowOn);
        this.props.vm.off('SCRIPT_GLOW_OFF', this.onScriptGlowOff);
        this.props.vm.off('BLOCK_GLOW_ON', this.onBlockGlowOn);
        this.props.vm.off('BLOCK_GLOW_OFF', this.onBlockGlowOff);
        this.props.vm.off('VISUAL_REPORT', this.onVisualReport);
        this.props.vm.off('workspaceUpdate', this.onWorkspaceUpdate);
        this.props.vm.off('targetsUpdate', this.onTargetsUpdate);
        this.props.vm.off('MONITORS_UPDATE', this.handleMonitorsUpdate);
        this.props.vm.off('EXTENSION_ADDED', this.handleExtensionAdded);
        this.props.vm.off('BLOCKSINFO_UPDATE', this.handleBlocksInfoUpdate);
        this.props.vm.off('PERIPHERAL_CONNECTED', this.handleStatusButtonUpdate);
        this.props.vm.off('PERIPHERAL_DISCONNECTED', this.handleStatusButtonUpdate);
    }

    updateToolboxBlockValue (id, value) {
        this.withToolboxUpdates(() => {
            const block = this.workspace
                .getFlyout()
                .getWorkspace()
                .getBlockById(id);
            if (block) {
                block.inputList[0].fieldRow[0].setValue(value);
            }
        });
    }

    onTargetsUpdate () {
        if (this.props.vm.editingTarget && this.workspace.getFlyout()) {
            ['glide', 'move', 'set'].forEach(prefix => {
                this.updateToolboxBlockValue(`${prefix}x`, Math.round(this.props.vm.editingTarget.x).toString());
                this.updateToolboxBlockValue(`${prefix}y`, Math.round(this.props.vm.editingTarget.y).toString());
            });
        }
    }
    onWorkspaceMetricsChange () {
        const target = this.props.vm.editingTarget;
        if (target && target.id) {
            // Dispatch updateMetrics later, since onWorkspaceMetricsChange may be (very indirectly)
            // called from a reducer, i.e. when you create a custom procedure.
            // TODO: Is this a vehement hack?
            setTimeout(() => {
                this.props.updateMetrics({
                    targetID: target.id,
                    scrollX: this.workspace.scrollX,
                    scrollY: this.workspace.scrollY,
                    scale: this.workspace.scale
                });
            }, 0);
        }
    }
    onScriptGlowOn (data) {
        this.ScratchBlocks.glowStack(data.id, true);
    }
    onScriptGlowOff (data) {
        this.ScratchBlocks.glowStack(data.id, false);
    }
    // block glow never used and removed in spork, just leave the functions here for potential future use
    // eslint-disable-next-line no-unused-vars
    onBlockGlowOn (data) {
        // this.workspace.glowBlock(data.id, true);
    }
    // eslint-disable-next-line no-unused-vars
    onBlockGlowOff (data) {
        // this.workspace.glowBlock(data.id, false);
    }
    onVisualReport (data) {
        this.ScratchBlocks.reportValue(data.id, data.value);
    }
    getToolbox () {
        // Use try/catch because this requires digging pretty deep into the VM
        // Code inside intentionally ignores several error situations (no stage, etc.)
        // Because they would get caught by this try/catch
        try {
            let {editingTarget: target, runtime} = this.props.vm;
            const stage = runtime.getTargetForStage();
            if (!target) target = stage; // If no editingTarget, use the stage

            const stageCostumes = stage.getCostumes();
            const targetCostumes = target.getCostumes();
            const targetSounds = target.getSounds();
            const dynamicBlocksXML = injectExtensionCategoryTheme(
                this.props.vm.runtime.getBlocksXML(target),
                this.props.theme
            );
            return makeToolbox(false, target.isStage, target.id, dynamicBlocksXML,
                targetCostumes[targetCostumes.length - 1].name,
                stageCostumes[stageCostumes.length - 1].name,
                targetSounds.length > 0 ? targetSounds[targetSounds.length - 1].name : '',
                this.props.hideNonVanillaBlocks
            );
        } catch {
            return null;
        }
    }
    onWorkspaceUpdate (data) {
        // When we change sprites, update the toolbox to have the new sprite's blocks
        const toolbox = this.getToolbox();
        if (toolbox) {
            this.props.updateToolboxState(toolbox);
        }

        if (this.props.vm.editingTarget && !this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id]) {
            this.onWorkspaceMetricsChange();
        }

        try {
            this.ScratchBlocks.loadWorkspace(data.json, this.workspace);
        } catch (error) {
            // The workspace is likely incomplete. What did update should be
            // functional.
            //
            // Instead of throwing the error, by logging it and continuing as
            // normal lets the other workspace update processes complete in the
            // gui and vm, which lets the vm run even if the workspace is
            // incomplete. Throwing the error would keep things like setting the
            // correct editing target from happening which can interfere with
            // some blocks and processes in the vm.
            if (error.message) {
                error.message = `Workspace Update Error: ${error.message}`;
            }
            log.error(error);
        }

        if (this.props.vm.editingTarget && this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id]) {
            const {scrollX, scrollY, scale} = this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id];
            this.workspace.scrollX = scrollX;
            this.workspace.scrollY = scrollY;
            this.workspace.scale = scale;
            this.workspace.resize();
        }

        // Clear the undo state of the workspace since this is a
        // fresh workspace and we don't want any changes made to another sprites
        // workspace to be 'undone' here.
        this.workspace.clearUndo();
    }
    handleMonitorsUpdate (monitors) {
        // Update the checkboxes of the relevant monitors.
        // TODO: What about monitors that have fields? See todo in scratch-vm blocks.js changeBlock:
        // https://github.com/LLK/scratch-vm/blob/2373f9483edaf705f11d62662f7bb2a57fbb5e28/src/engine/blocks.js#L569-L576
        const flyout = this.workspace.getFlyout();
        for (const monitor of monitors.values()) {
            const blockId = monitor.get('id');
            const isVisible = monitor.get('visible');
            flyout.setCheckboxState(blockId, isVisible);
            // We also need to update the isMonitored flag for this block on the VM, since it's used to determine
            // whether the checkbox is activated or not when the checkbox is re-displayed (e.g. local variables/blocks
            // when switching between sprites).
            const block = this.props.vm.runtime.monitorBlocks.getBlock(blockId);
            if (block) {
                block.isMonitored = isVisible;
            }
        }
    }
    handleExtensionAdded (categoryInfo) {
        const defineBlocks = blockInfoArray => {
            if (blockInfoArray && blockInfoArray.length > 0) {
                const staticBlocksJson = [];
                const dynamicBlocksInfo = [];
                blockInfoArray.forEach(blockInfo => {
                    if (blockInfo.info && blockInfo.info.isDynamic) {
                        dynamicBlocksInfo.push(blockInfo);
                    } else if (blockInfo.json) {
                        staticBlocksJson.push(injectExtensionBlockTheme(blockInfo.json, this.props.theme));
                    }
                    // otherwise it's a non-block entry such as '---'
                });

                this.ScratchBlocks.defineBlocksWithJsonArray(staticBlocksJson);
                dynamicBlocksInfo.forEach(blockInfo => {
                    // This is creating the block factory / constructor -- NOT a specific instance of the block.
                    // The factory should only know static info about the block: the category info and the opcode.
                    // Anything else will be picked up from the XML attached to the block instance.
                    const extendedOpcode = `${categoryInfo.id}_${blockInfo.info.opcode}`;
                    const blockDefinition =
                        defineDynamicBlock(this.ScratchBlocks, categoryInfo, blockInfo, extendedOpcode);
                    this.ScratchBlocks.Blocks[extendedOpcode] = blockDefinition;
                });
            }
        };

        // scratch-blocks implements a menu or custom field as a special kind of block ("shadow" block)
        // these actually define blocks and MUST run regardless of the UI state
        defineBlocks(
            Object.getOwnPropertyNames(categoryInfo.customFieldTypes)
                .map(fieldTypeName => categoryInfo.customFieldTypes[fieldTypeName].scratchBlocksDefinition));
        defineBlocks(categoryInfo.menus);
        defineBlocks(categoryInfo.blocks);

        // Update the toolbox with new blocks if possible
        const toolbox = this.getToolbox();
        if (toolbox) {
            this.props.updateToolboxState(toolbox);
        }
    }
    handleBlocksInfoUpdate (categoryInfo) {
        // @todo Later we should replace this to avoid all the warnings from redefining blocks.
        this.handleExtensionAdded(categoryInfo);
    }
    handleCategorySelected (categoryId) {
        const extension = extensionData.find(ext => ext.extensionId === categoryId);
        if (extension && extension.launchPeripheralConnectionFlow) {
            this.handleConnectionModalStart(categoryId);
        }

        this.withToolboxUpdates(() => {
            const toolbox = this.workspace.getToolbox();
            const category = toolbox.getToolboxCategoryById(categoryId);
            if (category) {
                toolbox.setSelectedItem(category);
            }
        });
    }
    setBlocks (blocks) {
        this.blocks = blocks;
    }
    handlePromptStart (message, defaultValue, callback, optTitle, optVarType) {
        const p = {prompt: {callback, message, defaultValue}};
        p.prompt.title = optTitle ? optTitle :
            this.ScratchBlocks.Msg.VARIABLE_MODAL_TITLE;
        p.prompt.varType = typeof optVarType === 'string' ?
            optVarType : this.ScratchBlocks.constants.SCALAR_VARIABLE_TYPE;
        p.prompt.showVariableOptions = // This flag means that we should show variable/list options about scope
            optVarType !== this.ScratchBlocks.constants.BROADCAST_MESSAGE_VARIABLE_TYPE &&
            p.prompt.title !== this.ScratchBlocks.Msg.RENAME_VARIABLE_MODAL_TITLE &&
            p.prompt.title !== this.ScratchBlocks.Msg.RENAME_LIST_MODAL_TITLE;
        p.prompt.showCloudOption =
            (optVarType === this.ScratchBlocks.constants.SCALAR_VARIABLE_TYPE) && this.props.canUseCloud;
        this.setState(p);
    }
    handleConnectionModalStart (extensionId) {
        this.props.onOpenConnectionModal(extensionId);
    }
    handleStatusButtonUpdate () {
        this.workspace.getFlyout().refreshStatusButtons();
    }
    handleOpenSoundRecorder () {
        this.props.onOpenSoundRecorder();
    }

    /*
     * Pass along information about proposed name and variable options (scope and isCloud)
     * and additional potentially conflicting variable names from the VM
     * to the variable validation prompt callback used in scratch-blocks.
     */
    handlePromptCallback (input, variableOptions) {
        this.state.prompt.callback(
            input,
            this.props.vm.runtime.getAllVarNamesOfType(this.state.prompt.varType),
            variableOptions);
        this.handlePromptClose();
    }
    handlePromptClose () {
        this.setState({prompt: null});
    }
    handleCustomProceduresClose (data) {
        this.props.onRequestCloseCustomProcedures(data);
        if (data) {
            const ws = this.workspace;
            ws.refreshToolboxSelection();
            ws.getFlyout().scrollToCategoryById('myBlocks');
        }
    }
    handleDrop (dragInfo) {
        fetch(dragInfo.payload.bodyUrl)
            .then(response => response.json())
            .then(blocks => this.props.vm.shareBlocksToTarget(blocks, this.props.vm.editingTarget.id))
            .then(() => {
                this.props.vm.refreshWorkspace();
                this.updateToolbox(); // To show new variables/custom blocks
            });
    }
    checkoutWsByProccode (proccode) {
        const [target] = this.props.vm.runtime.getProcedureDefinition(proccode);
        if (!target) return;
        this.props.vm.setEditingTarget(target.id);
    }
    render () {
        /* eslint-disable no-unused-vars */
        const {
            anyModalVisible,
            blockMessages,
            hideNonVanillaBlocks,
            canUseCloud,
            customProceduresVisible,
            extensionLibraryVisible,
            options,
            stageSize,
            vm,
            isRtl,
            isVisible,
            onActivateColorPicker,
            onOpenConnectionModal,
            onOpenSoundRecorder,
            updateToolboxState,
            onActivateCustomProcedures,
            onRequestCloseExtensionLibrary,
            onRequestCloseCustomProcedures,
            toolbox,
            updateMetrics: updateMetricsProp,
            workspaceMetrics,
            ...props
        } = this.props;
        /* eslint-enable no-unused-vars */
        return (
            <React.Fragment>
                <DroppableBlocks
                    componentRef={this.setBlocks}
                    onDrop={this.handleDrop}
                    {...props}
                />
                {this.state.prompt ? (
                    <Prompt
                        defaultValue={this.state.prompt.defaultValue}
                        isStage={vm.runtime.getEditingTarget().isStage}
                        showListMessage={this.state.prompt.varType === this.ScratchBlocks.constants.LIST_VARIABLE_TYPE}
                        label={this.state.prompt.message}
                        showCloudOption={this.state.prompt.showCloudOption}
                        showVariableOptions={this.state.prompt.showVariableOptions}
                        title={this.state.prompt.title}
                        vm={vm}
                        onCancel={this.handlePromptClose}
                        onOk={this.handlePromptCallback}
                    />
                ) : null}
                {extensionLibraryVisible ? (
                    <ExtensionLibrary
                        vm={vm}
                        onCategorySelected={this.handleCategorySelected}
                        onRequestClose={onRequestCloseExtensionLibrary}
                    />
                ) : null}
                {customProceduresVisible ? (
                    <CustomProcedures
                        options={{
                            media: options.media
                        }}
                        onRequestClose={this.handleCustomProceduresClose}
                    />
                ) : null}
            </React.Fragment>
        );
    }
}

Blocks.propTypes = {
    anyModalVisible: PropTypes.bool,
    blocks: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    hideNonVanillaBlocks: PropTypes.bool.isRequired,
    canUseCloud: PropTypes.bool,
    customProceduresVisible: PropTypes.bool,
    extensionLibraryVisible: PropTypes.bool,
    isRtl: PropTypes.bool,
    isVisible: PropTypes.bool,
    locale: PropTypes.string.isRequired,
    messages: PropTypes.objectOf(PropTypes.string),
    blockMessages: PropTypes.objectOf(PropTypes.string),
    onActivateColorPicker: PropTypes.func,
    onActivateCustomProcedures: PropTypes.func,
    onOpenConnectionModal: PropTypes.func,
    onOpenSoundRecorder: PropTypes.func,
    onRequestCloseCustomProcedures: PropTypes.func,
    onRequestCloseExtensionLibrary: PropTypes.func,
    options: PropTypes.shape({
        media: PropTypes.string,
        zoom: PropTypes.shape({
            controls: PropTypes.bool,
            wheel: PropTypes.bool,
            startScale: PropTypes.number
        }),
        comments: PropTypes.bool,
        collapse: PropTypes.bool
    }),
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired,
    theme: PropTypes.oneOf(Object.keys(themeMap)),
    toolbox: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    updateMetrics: PropTypes.func,
    updateToolboxState: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired,
    workspaceMetrics: PropTypes.shape({
        // eslint-disable-next-line react/forbid-prop-types
        targets: PropTypes.objectOf(PropTypes.object)
    })
};

Blocks.defaultOptions = {
    move: {
        scrollbars: true,
        wheel: true
    },
    zoom: {
        controls: true,
        wheel: true,
        startScale: BLOCKS_DEFAULT_SCALE
    },
    grid: {
        spacing: 40,
        length: 2,
        colour: '#ddd'
    },
    rendererOverrides: {
        flyoutCollapseAnimation: true
    },
    toolboxPosition: 'left',
    disable: false,
    horizontalLayout: false,
    comments: true,
    collapse: false,
    sounds: false,
    trashcan: false,
    modalInputs: false
};

Blocks.defaultProps = {
    isVisible: true,
    options: Blocks.defaultOptions,
    theme: DEFAULT_THEME
};

const mapStateToProps = state => ({
    anyModalVisible: (
        Object.keys(state.scratchGui.modals).some(key => state.scratchGui.modals[key]) ||
        state.scratchGui.mode.isFullScreen
    ),
    hideNonVanillaBlocks: state.scratchGui.settings.hideNonVanillaBlocks,
    extensionLibraryVisible: state.scratchGui.modals.extensionLibrary,
    isRtl: state.locales.isRtl,
    locale: state.locales.locale,
    messages: state.locales.editorMessages,
    blockMessages: state.locales.blockMessages,
    toolbox: state.scratchGui.toolbox.toolbox,
    customProceduresVisible: state.scratchGui.customProcedures.active,
    workspaceMetrics: state.scratchGui.workspaceMetrics
});

const mapDispatchToProps = dispatch => ({
    onActivateColorPicker: callback => dispatch(activateColorPicker(callback)),
    onActivateCustomProcedures: (data, callback, isNew) => dispatch(activateCustomProcedures(data, callback, isNew)),
    onOpenConnectionModal: id => {
        dispatch(setConnectionModalExtensionId(id));
        dispatch(openConnectionModal());
    },
    onOpenSoundRecorder: () => {
        dispatch(activateTab(SOUNDS_TAB_INDEX));
        dispatch(openSoundRecorder());
    },
    onRequestCloseExtensionLibrary: () => {
        dispatch(closeExtensionLibrary());
    },
    onRequestCloseCustomProcedures: data => {
        dispatch(deactivateCustomProcedures(data));
    },
    updateToolboxState: toolbox => {
        dispatch(updateToolbox(toolbox));
    },
    updateMetrics: metrics => {
        dispatch(updateMetrics(metrics));
    }
});

export default errorBoundaryHOC('Blocks')(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(injectBlock(Blocks))
);
