/* eslint-disable @typescript-eslint/no-require-imports */
let _TextEncoder: typeof TextEncoder;
if (typeof TextEncoder === 'undefined') {
    // eslint-disable-next-line global-require
    _TextEncoder = require('fastestsmallesttextencoderdecoder').TextEncoder;
} else {
    _TextEncoder = TextEncoder;
}
import EventEmitter from 'events';
import JSZip from 'jszip';
import {Buffer} from 'buffer';
import centralDispatch from './dispatch/central-dispatch';
import ExtensionManager from './extension-support/extension-manager.js';
import log from './util/log';
import MathUtil from './util/math-util';
import Runtime, {type ScratchLinkSocketFactory, type IODevices} from './engine/runtime';
import StringUtil from './util/string-util';
import formatMessage from 'format-message';
import Variable from './engine/variable';
import newBlockIds from './util/new-block-ids';
import {loadCostume} from './import/load-costume';
import {loadSound} from './import/load-sound';
import {serializeSounds, serializeCostumes} from './serialization/serialize-assets';
import uid from './util/uid';
import 'canvas-toBlob';

const RESERVED_NAMES = ['_mouse_', '_stage_', '_edge_', '_myself_', '_random_'];

const CORE_EXTENSIONS: string[] = [
    // 'motion',
    // 'looks',
    // 'sound',
    // 'events',
    // 'control',
    // 'sensing',
    // 'operators',
    // 'variables',
    // 'myBlocks'
];

import type RenderedTarget from './sprites/rendered-target';
import type AudioEngine from 'clipcc-audio';
import type RenderWebGL from 'clipcc-render';
import type {Asset, AssetData, ScratchStorage} from 'clipcc-storage';
import type * as ClipCCBlocks from 'clipcc-block';
import type {VideoProvider} from './io/video';
import type {CloudProvider} from './io/cloud';
import type {OrderedMap, RecordOf} from 'immutable';
import type {CategoryInfo} from './extension-support/extension-metadata';
import type {ImportedExtensionsInfo, ProcedureMutation, SB3Project, SB3Target, VMBlock} from './serialization/schema';
import type {SB2Project} from './serialization/sb2';
import type {Costume, Sound} from './sprites/sprite';
import type {BitmapAdapter} from 'clipcc-svg-renderer';
import type {RenderedTargetJSON, SpriteInfoData} from './sprites/rendered-target';
import type {MonitorRecordProps} from './engine/monitor-record';
import type Blocks from './engine/blocks';

interface LimitOptions {
    infiniteCloning: boolean;
    edgelessStage: boolean;
    unlimitedListLength: boolean;
    unlimitedPenSize: boolean;
    accurateCoordinates: boolean;
    unlimitedSoundStuffs: boolean;
}

/**
 * A file descriptor, representing a file to be written.
 */
interface FileDesc {
    /** The name of the file, including extension. */
    fileName: string;
    /** The content of the file, as a string. */
    fileContent: AssetData | undefined;
}

/**
 * Events that can be emitted by VirtualMachine.
 */
interface VMEvents {
    /**
     * Emitted when the stage size changes.
     * @param width The new stage width in pixels.
     * @param height The new stage height in pixels.
     */
    'STAGE_SIZE_UPDATE': [width: number, height: number];

    /**
     * Emitted when a script should be highlighted (e.g. it is running).
     * @param glowData An object containing the ID of the script block.
     */
    'SCRIPT_GLOW_ON': [glowData: {id: string}];

    /**
     * Emitted when a script should stop being highlighted.
     * @param glowData An object containing the ID of the script block.
     */
    'SCRIPT_GLOW_OFF': [glowData: {id: string}];

    /**
     * Emitted when a single block should be highlighted (e.g. it is executing).
     * @param glowData An object containing the ID of the block.
     */
    'BLOCK_GLOW_ON': [glowData: {id: string}];

    /**
     * Emitted when a single block should stop being highlighted.
     * @param glowData An object containing the ID of the block.
     */
    'BLOCK_GLOW_OFF': [glowData: {id: string}];

    /**
     * Emitted when the runtime tick loop has been started.
     */
    'RUNTIME_STARTED': [];

    /**
     * Emitted when the project has started (threads may not necessarily be running).
     */
    'PROJECT_START': [];

    /**
     * Emitted when threads start running.
     * Used by the UI to indicate running status.
     */
    'PROJECT_RUN_START': [];

    /**
     * Emitted when threads stop running.
     * Used by the UI to indicate not-running status.
     */
    'PROJECT_RUN_STOP': [];

    /**
     * Emitted when turbo mode is enabled.
     */
    'TURBO_MODE_ON': [];

    /**
     * Emitted when turbo mode is disabled.
     */
    'TURBO_MODE_OFF': [];

    /**
     * Emitted when the project has changed (a saveable change was made).
     */
    'PROJECT_CHANGED': [];

    /**
     * Emitted when a block reports a value visually (e.g. "say" bubble).
     * @param visualReport An object containing the block ID and the reported value.
     */
    'VISUAL_REPORT': [visualReport: {id: string, value: string}];

    /**
     * Emitted when the list of monitors should be updated.
     * @param monitorList The current monitor state map, keyed by monitor ID.
     */
    'MONITORS_UPDATE': [monitorList: OrderedMap<string, RecordOf<MonitorRecordProps>>];

    /**
     * Emitted when a block drag operation updates.
     * @param areBlocksOverGui Whether blocks are currently being dragged over the GUI.
     */
    'BLOCK_DRAG_UPDATE': [areBlocksOverGui: boolean];

    /**
     * Emitted when a block drag operation ends (blocks were dropped from the flyout).
     * @param blocks The blocks that were dragged.
     * @param topBlockId The ID of the top-level block from the dragged stack.
     */
    'BLOCK_DRAG_END': [blocks: VMBlock[], topBlockId: string];

    /**
     * Emitted when a Scratch extension has been added/loaded.
     * @param categoryInfo The category info metadata for the loaded extension.
     */
    'EXTENSION_ADDED': [categoryInfo: CategoryInfo];

    /**
     * Emitted when an extension requests a custom field to be added.
     * @param fieldName The name of the custom field.
     * @param fieldImplementation The implementation of the custom field.
     */
    'EXTENSION_FIELD_ADDED': [fieldName: string, fieldImplementation: unknown];

    /**
     * Emitted when the blocks category info has been updated and should be re-rendered.
     * @param categoryInfo The updated category info.
     */
    'BLOCKSINFO_UPDATE': [categoryInfo: CategoryInfo];

    /**
     * Emitted when the microphone listening state changes.
     * @param listening Whether the microphone is currently listening.
     */
    'MIC_LISTENING': [listening: boolean];

    /**
     * Emitted when the cloud data status for this project has changed.
     * @param hasCloudData Whether the project currently has cloud variables.
     */
    'HAS_CLOUD_DATA_UPDATE': [hasCloudData: boolean];

    /**
     * Emitted when the list of available peripheral devices has been updated.
     * Causes the peripheral connection modal to update a list of available peripherals.
     * @param info The available peripherals, keyed by peripheral ID.
     */
    'PERIPHERAL_LIST_UPDATE': [info: Record<number, unknown>];

    /**
     * Emitted when the user picks a Bluetooth device to connect to
     * via the Companion Device Manager (CDM).
     * @param info The chosen peripheral info.
     */
    'USER_PICKED_PERIPHERAL': [info: Record<number, unknown>];

    /**
     * Emitted when a peripheral has been successfully connected.
     * Causes the status button in the blocks menu to indicate "connected".
     */
    'PERIPHERAL_CONNECTED': [];

    /**
     * Emitted when a peripheral has encountered a request error.
     * Causes the peripheral connection modal to switch to an error state.
     */
    'PERIPHERAL_REQUEST_ERROR': [];

    /**
     * Emitted when a peripheral has been intentionally disconnected.
     * Causes the status button in the blocks menu to indicate "disconnected".
     */
    'PERIPHERAL_DISCONNECTED': [];

    /**
     * Emitted when the connection to a peripheral has been lost unexpectedly.
     * Causes a "peripheral connection lost" error alert to display.
     * @param data An object containing the error message and the extension ID.
     */
    'PERIPHERAL_CONNECTION_LOST_ERROR': [data: {message: string, extensionId: string}];

    /**
     * Emitted when the scan for a peripheral has timed out.
     * Causes the peripheral connection modal to show a timeout state.
     */
    'PERIPHERAL_SCAN_TIMEOUT': [];

    /**
     * Emitted when the list of targets (sprites / stage) has been updated.
     * @param data An object containing the list of target snapshots and the editing target ID.
     * @param data.targetList Array of target state snapshots (only original sprites, no clones).
     * @param data.editingTarget The ID of the currently editing target, or null.
     */
    'targetsUpdate': [data: {
        targetList: Array<RenderedTargetJSON>;
        editingTarget: string | null;
    }];

    /**
     * Emitted when the workspace (blocks for the editing target) should be updated.
     * Triggered on editing target change, block changes, variable changes, etc.
     * @param data An object containing the workspace JSON used to rebuild the Blockly workspace.
     */
    'workspaceUpdate': [data: Record<string, unknown>];

    /**
     * Emitted when playground data is requested via `getPlaygroundData()`.
     * @param data The playground data containing blocks and serialized thread info.
     * @param data.blocks The blocks of the editing target (if any).
     * @param data.threads A JSON-stringified representation of threads on the editing target.
     */
    'playgroundData': [data: {blocks: Blocks | undefined, threads: string}];
}

/**
 * Handles connections between blocks, stage, and extensions.
 * @class
 */
class VirtualMachine extends EventEmitter<VMEvents> {
    /**
     * VM runtime, to store blocks, I/O devices, sprites/targets, etc.
     */
    runtime = new Runtime();

    /**
     * The "currently editing"/selected target ID for the VM.
     * Block events from any Blockly workspace are routed to this target.
     */
    editingTarget: RenderedTarget | null = null;

    /**
     * Whether the VM is currently in the process of loading a workspace.
     * When true, block events from Blockly will not trigger changes to VM.
     */
    loadingWorkspace = false;

    /**
     * The currently dragging target, for redirecting IO data.
     */
    _dragTarget: RenderedTarget | null = null;

    extensionManager: ExtensionManager;
    constructor () {
        super();

        centralDispatch.setService('runtime', this.runtime).catch(e => {
            log.error(`Failed to register runtime service: ${JSON.stringify(e)}`);
        });

        this.extensionManager = new ExtensionManager(this.runtime);
        // Runtime emits are passed along as VM emits.
        this.runtime.on(Runtime.SCRIPT_GLOW_ON, glowData => {
            this.emit(Runtime.SCRIPT_GLOW_ON, glowData);
        });
        this.runtime.on(Runtime.SCRIPT_GLOW_OFF, glowData => {
            this.emit(Runtime.SCRIPT_GLOW_OFF, glowData);
        });
        this.runtime.on(Runtime.BLOCK_GLOW_ON, glowData => {
            this.emit(Runtime.BLOCK_GLOW_ON, glowData);
        });
        this.runtime.on(Runtime.BLOCK_GLOW_OFF, glowData => {
            this.emit(Runtime.BLOCK_GLOW_OFF, glowData);
        });
        this.runtime.on(Runtime.PROJECT_START, () => {
            this.emit(Runtime.PROJECT_START);
        });
        this.runtime.on(Runtime.PROJECT_RUN_START, () => {
            this.emit(Runtime.PROJECT_RUN_START);
        });
        this.runtime.on(Runtime.PROJECT_RUN_STOP, () => {
            this.emit(Runtime.PROJECT_RUN_STOP);
        });
        this.runtime.on(Runtime.PROJECT_CHANGED, () => {
            this.emit(Runtime.PROJECT_CHANGED);
        });
        this.runtime.on(Runtime.VISUAL_REPORT, visualReport => {
            this.emit(Runtime.VISUAL_REPORT, visualReport);
        });
        this.runtime.on(Runtime.TARGETS_UPDATE, emitProjectChanged => {
            this.emitTargetsUpdate(emitProjectChanged);
        });
        this.runtime.on(Runtime.MONITORS_UPDATE, monitorList => {
            this.emit(Runtime.MONITORS_UPDATE, monitorList);
        });
        this.runtime.on(Runtime.BLOCK_DRAG_UPDATE, areBlocksOverGui => {
            this.emit(Runtime.BLOCK_DRAG_UPDATE, areBlocksOverGui);
        });
        this.runtime.on(Runtime.BLOCK_DRAG_END, (blocks, topBlockId) => {
            this.emit(Runtime.BLOCK_DRAG_END, blocks, topBlockId);
        });
        this.runtime.on(Runtime.EXTENSION_ADDED, categoryInfo => {
            this.emit(Runtime.EXTENSION_ADDED, categoryInfo);
        });
        this.runtime.on(Runtime.EXTENSION_FIELD_ADDED, ({name: fieldName, implementation: fieldImplementation}) => {
            this.emit(Runtime.EXTENSION_FIELD_ADDED, fieldName, fieldImplementation);
        });
        this.runtime.on(Runtime.BLOCKSINFO_UPDATE, categoryInfo => {
            this.emit(Runtime.BLOCKSINFO_UPDATE, categoryInfo);
        });
        this.runtime.on(Runtime.BLOCKS_NEED_UPDATE, () => {
            this.emitWorkspaceUpdate();
        });
        this.runtime.on(Runtime.TOOLBOX_EXTENSIONS_NEED_UPDATE, () => {
            this.extensionManager.refreshBlocks();
        });
        this.runtime.on(Runtime.PERIPHERAL_LIST_UPDATE, info => {
            this.emit(Runtime.PERIPHERAL_LIST_UPDATE, info);
        });
        this.runtime.on(Runtime.USER_PICKED_PERIPHERAL, info => {
            this.emit(Runtime.USER_PICKED_PERIPHERAL, info);
        });
        this.runtime.on(Runtime.PERIPHERAL_CONNECTED, () =>
            this.emit(Runtime.PERIPHERAL_CONNECTED)
        );
        this.runtime.on(Runtime.PERIPHERAL_REQUEST_ERROR, () =>
            this.emit(Runtime.PERIPHERAL_REQUEST_ERROR)
        );
        this.runtime.on(Runtime.PERIPHERAL_DISCONNECTED, () =>
            this.emit(Runtime.PERIPHERAL_DISCONNECTED)
        );
        this.runtime.on(Runtime.PERIPHERAL_CONNECTION_LOST_ERROR, data =>
            this.emit(Runtime.PERIPHERAL_CONNECTION_LOST_ERROR, data)
        );
        this.runtime.on(Runtime.PERIPHERAL_SCAN_TIMEOUT, () =>
            this.emit(Runtime.PERIPHERAL_SCAN_TIMEOUT)
        );
        this.runtime.on(Runtime.MIC_LISTENING, listening => {
            this.emit(Runtime.MIC_LISTENING, listening);
        });
        this.runtime.on(Runtime.RUNTIME_STARTED, () => {
            this.emit(Runtime.RUNTIME_STARTED);
        });
        this.runtime.on(Runtime.HAS_CLOUD_DATA_UPDATE, hasCloudData => {
            this.emit(Runtime.HAS_CLOUD_DATA_UPDATE, hasCloudData);
        });
        this.runtime.on(Runtime.STAGE_SIZE_UPDATE, (width, height) => {
            this.emit(Runtime.STAGE_SIZE_UPDATE, width, height);
        });

        // Load core extensions
        for (const id of CORE_EXTENSIONS) {
            this.extensionManager.loadExtensionIdSync(id);
        }

        this.blockListener = this.blockListener.bind(this);
        this.flyoutBlockListener = this.flyoutBlockListener.bind(this);
        this.monitorBlockListener = this.monitorBlockListener.bind(this);
        this.variableListener = this.variableListener.bind(this);
    }

    /**
     * Start running the VM - do this before anything else.
     */
    start () {
        this.runtime.start();
    }

    /**
     * Quit the VM, clearing any handles which might keep the process alive.
     * Do not use the runtime after calling this method. This method is meant for test shutdown.
     */
    quit () {
        this.runtime.quit();
    }

    /**
     * "Green flag" handler - start all threads starting with a green flag.
     */
    greenFlag () {
        this.runtime.greenFlag();
    }

    /**
     * Set whether the VM is in "turbo mode."
     * When true, loops don't yield to redraw.
     * @param turboModeOn Whether turbo mode should be set.
     */
    setTurboMode (turboModeOn: boolean) {
        this.runtime.turboMode = !!turboModeOn;
        if (this.runtime.turboMode) {
            this.emit(Runtime.TURBO_MODE_ON);
        } else {
            this.emit(Runtime.TURBO_MODE_OFF);
        }
    }

    /**
     * Set whether the VM is in 2.0 "compatibility mode."
     * When true, ticks go at 2.0 speed (30 TPS).
     * @deprecated Use setFramerate(30) (compatibility mode) or setFramerate(60) instead.
     * @param compatibilityModeOn Whether compatibility mode is set.
     */
    setCompatibilityMode (compatibilityModeOn: boolean) {
        this.runtime.setCompatibilityMode(!!compatibilityModeOn);
    }

    /**
     * Set the framerate (also called TPS in VM).
     * @param framerate Frames per seconde
     */
    setFramerate (framerate: number) {
        this.runtime.setFramerate(framerate);
    }

    /**
     * Set the limit options.
     * @param options Limit options
     */
    setLimitOptions (options: LimitOptions) {
        this.runtime.limitOptions = Object.assign({}, this.runtime.limitOptions, options);
        if (Object.prototype.hasOwnProperty.call(options, 'edgelessStage') && this.runtime.renderer) {
            this.runtime.renderer.setEdgelessStage(options.edgelessStage);
        }
        if (Object.prototype.hasOwnProperty.call(options, 'accurateCoordinates') && this.runtime.renderer) {
            this.runtime.renderer.setAccurateCoordinates(options.accurateCoordinates);
        }
    }

    /**
     * Set stage size.
     * @param width Width of the stage in pixels.
     * @param height Height of the stage in pixels.
     */
    setStageSize (width: number, height: number) {
        const deltaX = width - this.runtime.stageWidth;
        const deltaY = width - this.runtime.stageHeight;
        if (this.runtime._monitorState.size > 0) {
            const offsetX = deltaX / 2;
            const offsetY = deltaY / 2;
            for (const monitor of this.runtime._monitorState.valueSeq()) {
                const newMonitor = monitor
                    .set('x', monitor.get('x')! + offsetX)
                    .set('y', monitor.get('y')! + offsetY);
                this.runtime.requestUpdateMonitor(newMonitor);
            }
            this.runtime.emit(Runtime.MONITORS_UPDATE, this.runtime._monitorState);
        }
        this.runtime.stageWidth = width;
        this.runtime.stageHeight = height;

        if (this.runtime.renderer) {
            this.runtime.renderer.setStageSize(
                -width / 2,
                width / 2,
                -height / 2,
                height / 2
            );
        }
        this.runtime.emit(Runtime.STAGE_SIZE_UPDATE, width, height);
    }

    /**
     * Set stage width.
     * @param width Width of the stage in pixels.
     */
    setStageWidth (width: number) {
        this.setStageSize(width, this.runtime.stageHeight);
    }

    /**
     * Set stage height.
     * @param height Height of the stage in pixels.
     */
    setStageHeight (height: number) {
        this.setStageSize(this.runtime.stageWidth, height);
    }

    /**
     * Stop all threads and running activities.
     */
    stopAll () {
        this.runtime.stopAll();
    }

    /**
     * Clear out current running project data.
     */
    clear () {
        this.runtime.dispose();
        this.editingTarget = null;
        this.emitTargetsUpdate(false /* Don't emit project change */);
    }

    /**
     * Get data for playground. Data comes back in an emitted event.
     */
    getPlaygroundData () {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const instance = this;
        // Only send back thread data for the current editingTarget.
        const threadData = this.runtime.threads.filter(thread => thread.target === instance.editingTarget);
        // Remove the target key, since it's a circular reference.
        const filteredThreadData = JSON.stringify(threadData, (key, value) => {
            if (key === 'target' || key === 'blockContainer') return;
            return value;
        }, 2);
        this.emit('playgroundData', {
            blocks: this.editingTarget?.blocks,
            threads: filteredThreadData
        });
    }

    /**
     * Post I/O data to the virtual devices.
     * @param device Name of virtual I/O device.
     * @param data Any data object to post to the I/O device.
     */
    postIOData<T extends keyof IODevices> (
        device: T,
        data: IODevices[T] extends { postData: infer U } ? U : never
    ) {
        // @ts-expect-error Safe to try call postData here
        this.runtime.ioDevices[device]?.postData?.(data);
    }

    /**
     * Set video provider.
     * @param videoProvider the video provider.
     */
    setVideoProvider (videoProvider: VideoProvider) {
        this.runtime.ioDevices.video.setProvider(videoProvider);
        this.runtime.on(Runtime.STAGE_SIZE_UPDATE, (width, height) => {
            videoProvider.setDimensions(width, height);
        });
    }

    /**
     * Set cloud provider.
     * @param cloudProvider the cloud provider.
     */
    setCloudProvider (cloudProvider: CloudProvider) {
        this.runtime.ioDevices.cloud.setProvider(cloudProvider);
    }

    /**
     * Tell the specified extension to scan for a peripheral.
     * @param extensionId - the id of the extension.
     */
    scanForPeripheral (extensionId: string) {
        this.runtime.scanForPeripheral(extensionId);
    }

    /**
     * Connect to the extension's specified peripheral.
     * @param extensionId - the id of the extension.
     * @param peripheralId - the id of the peripheral.
     */
    connectPeripheral (extensionId: string, peripheralId: number) {
        this.runtime.connectPeripheral(extensionId, peripheralId);
    }

    /**
     * Disconnect from the extension's connected peripheral.
     * @param extensionId - the id of the extension.
     */
    disconnectPeripheral (extensionId: string) {
        this.runtime.disconnectPeripheral(extensionId);
    }

    /**
     * Returns whether the extension has a currently connected peripheral.
     * @param extensionId - the id of the extension.
     * @returns - whether the extension has a connected peripheral.
     */
    getPeripheralIsConnected (extensionId: string) {
        return this.runtime.getPeripheralIsConnected(extensionId);
    }

    /**
     * Load a Scratch project from a .sb, .sb2, .sb3 or json string.
     * @param input A json string, object, or ArrayBuffer representing the project to load.
     * @returns Promise that resolves after targets are installed.
     */
    loadProject (input: string | object | ArrayBuffer | ArrayBufferView<ArrayBufferLike>) {
        if (typeof input === 'object' && !(input instanceof ArrayBuffer) &&
          !ArrayBuffer.isView(input)) {
            // If the input is an object and not any ArrayBuffer
            // or an ArrayBuffer view (this includes all typed arrays and DataViews)
            // turn the object into a JSON string, because we suspect
            // this is a project.json as an object
            // validate expects a string or buffer as input
            // TODO not sure if we need to check that it also isn't a data view
            input = JSON.stringify(input);
        }

        const validationPromise: Promise<[SB3Project | SB3Target | SB2Project, JSZip]> =
            new Promise<[SB3Project | SB3Target | SB2Project, JSZip]>((resolve, reject) => {
            // eslint-disable-next-line global-require
                const validate = require('clipcc-parser');
                // The second argument of false below indicates to the validator that the
                // input should be parsed/validated as an entire project (and not a single sprite)
                validate(input, false, (error: unknown, res: [SB3Project | SB3Target | SB2Project, JSZip]) => {
                    if (error) return reject(error);
                    resolve(res!);
                });
            })
                .catch(error => {
                    const {SB1File, ValidationError}: typeof import('clipcc-sb1-convertor') =
                    // eslint-disable-next-line global-require
                    require('scratch-sb1-converter');

                    try {
                        const sb1 = new SB1File(input);
                        const json = sb1.json;
                        json.projectVersion = 2;
                        return Promise.resolve([json as SB2Project, sb1.zip] as const);
                    } catch (sb1Error) {
                        if (sb1Error instanceof ValidationError) {
                        // The input does not validate as a Scratch 1 file.
                        // Throw original error since the input does not appear to be
                        // an SB1File.
                            return Promise.reject(error);
                        }
                        // The project appears to be a Scratch 1 file but it
                        // could not be successfully translated into a Scratch 2
                        // project.
                        console.error(error);
                        return Promise.reject(sb1Error);
                    }
                });

        return validationPromise
            .then(validatedInput => this.deserializeProject(validatedInput[0], validatedInput[1]))
            .then(() => this.runtime.emitProjectLoaded())
            .catch(error => {
                // Intentionally rejecting here (want errors to be handled by caller)
                if (Object.prototype.hasOwnProperty.call(error, 'validationError')) {
                    return Promise.reject(JSON.stringify(error));
                }
                return Promise.reject(error);
            });
    }

    /**
     * Load a project from the Scratch web site, by ID.
     * @param {string} id - the ID of the project to download, as a string.
     */
    downloadProjectId (id: string) {
        const storage = this.runtime.storage;
        if (!storage) {
            log.error('No storage module present; cannot load project: ', id);
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const vm = this;
        const promise = storage.load(storage.AssetType.Project, id);
        promise.then(projectAsset => {
            if (!projectAsset) {
                log.error(`Failed to fetch project with id: ${id}`);
                return null;
            }
            return vm.loadProject(projectAsset.data!);
        });
    }

    /**
     * Export the current project as a .sb3 file.
     * @returns Project in a Scratch 3.0 JSON representation.
     */
    saveProjectSb3 () {
        const soundDescs = serializeSounds(this.runtime);
        const costumeDescs = serializeCostumes(this.runtime);
        const projectJson = this.toJSON();

        // TODO want to eventually move zip creation out of here, and perhaps
        // into scratch-storage
        const zip = new JSZip();

        // Put everything in a zip file
        zip.file('project.json', projectJson);
        this._addFileDescsToZip(soundDescs.concat(costumeDescs), zip);

        return zip.generateAsync({
            type: 'blob',
            mimeType: 'application/x.scratch.sb3',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 6 // Tradeoff between best speed (1) and best compression (9)
            }
        });
    }

    /*
     * @type {Array<object>} Array of all costumes and sounds currently in the runtime
     */
    get assets () {
        return this.runtime.targets.reduce((acc: Asset[], target) => (
            acc
                .concat(target.sprite.sounds.map(sound => sound.asset))
                .concat(target.sprite.costumes.map(costume => costume.asset))
        ), []);
    }

    /**
     * Add file descs to zip
     * @param fileDescs The array of file descs.
     * @param zip the JSZip instance.
     */
    _addFileDescsToZip (fileDescs: FileDesc[], zip: JSZip) {
        for (let i = 0; i < fileDescs.length; i++) {
            const currFileDesc = fileDescs[i];
            zip.file(currFileDesc.fileName, currFileDesc.fileContent!);
        }
    }

    /**
     * Exports a sprite in the sprite3 format.
     * @param targetId ID of the target to export
     * @param optZipType Optional type that the resulting
     * zip should be outputted in. Options are: base64, binarystring,
     * array, uint8array, arraybuffer, blob, or nodebuffer. Defaults to
     * blob if argument not provided.
     * See https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html#type-option
     * for more information about these options.
     * @returns A generated zip of the sprite and its assets in the format
     * specified by optZipType or blob by default.
     */
    exportSprite (targetId: string, optZipType?: JSZip.OutputType) {
        const soundDescs = serializeSounds(this.runtime, targetId);
        const costumeDescs = serializeCostumes(this.runtime, targetId);
        const spriteJson = this.toJSON(targetId);

        const zip = new JSZip();
        zip.file('sprite.json', spriteJson);
        this._addFileDescsToZip(soundDescs.concat(costumeDescs), zip);

        return zip.generateAsync({
            type: typeof optZipType === 'string' ? optZipType : 'blob',
            mimeType: 'application/x.scratch.sprite3',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 6
            }
        });
    }

    /**
     * Export project or sprite as a Scratch 3.0 JSON representation.
     * @param optTargetId - Optional id of a sprite to serialize
     * @returns Serialized state of the runtime.
     */
    toJSON (optTargetId?: string) {
        // eslint-disable-next-line global-require
        const sb3: typeof import('./serialization/sb3') = require('./serialization/sb3');
        return StringUtil.stringify(sb3.serialize(this.runtime, optTargetId));
    }

    // TODO do we still need this function? Keeping it here so as not to introduce
    // a breaking change.
    /**
     * Load a project from a Scratch JSON representation.
     * @param json JSON string representing a project.
     * @returns Promise that resolves after the project has loaded
     */
    fromJSON (json: string) {
        log.warning('fromJSON is now just a wrapper around loadProject, please use that function instead.');
        return this.loadProject(json);
    }

    /**
     * Load a project from a Scratch JSON representation.
     * @param projectJSON JSON string representing a project.
     * @param zip Optional zipped project containing assets to be loaded.
     * @returns Promise that resolves after the project has loaded
     */
    async deserializeProject (projectJSON: SB3Project | SB3Target | SB2Project, zip?: JSZip) {
        // Clear the current runtime
        this.clear();

        if (typeof performance !== 'undefined') {
            performance.mark('scratch-vm-deserialize-start');
        }
        const runtime = this.runtime;
        const deserializePromise = function () {
            const projectVersion = projectJSON.projectVersion;
            if (projectVersion === 2) {
                // eslint-disable-next-line global-require
                const sb2: typeof import('./serialization/sb2') = require('./serialization/sb2');
                return sb2.deserialize(projectJSON, runtime, false, zip);
            }
            if (projectVersion === 3) {
                // eslint-disable-next-line global-require
                const sb3: typeof import('./serialization/sb3') = require('./serialization/sb3');
                return sb3.deserialize(projectJSON, runtime, zip);
            }
            return Promise.reject('Unable to verify Scratch Project version.');
        };
        const {targets, extensions} = await deserializePromise();
        if (typeof performance !== 'undefined') {
            performance.mark('scratch-vm-deserialize-end');
            performance.measure('scratch-vm-deserialize',
                'scratch-vm-deserialize-start', 'scratch-vm-deserialize-end');
        }
        return this.installTargets(targets, extensions, true);
    }

    /**
     * Install `deserialize` results: zero or more targets after the extensions (if any) used by those targets.
     * @param targets - the targets to be installed
     * @param extensions - metadata about extensions used by these targets
     * @param wholeProject - set to true if installing a whole project, as opposed to a single sprite.
     * @returns resolved once targets have been installed
     */
    installTargets (targets: RenderedTarget[], extensions: ImportedExtensionsInfo, wholeProject: boolean) {
        const extensionPromises: Promise<void>[] = [];

        extensions.extensionIDs.forEach(extensionID => {
            if (!this.extensionManager.isExtensionLoaded(extensionID)) {
                const extensionURL = extensions.extensionURLs.get(extensionID) || extensionID;
                extensionPromises.push(this.extensionManager.loadExtensionURL(extensionURL));
            }
        });

        targets = targets.filter(target => !!target);

        return Promise.all(extensionPromises).then(() => {
            targets.forEach(target => {
                this.runtime.addTarget(target);
                target.updateAllDrawableProperties();
                // Ensure unique sprite name
                if (target.isSprite()) this.renameSprite(target.id, target.getName());
            });
            // Sort the executable targets by layerOrder.
            // Remove layerOrder property after use.
            // @ts-expect-error layerOrder is added in deserialization, safe to use here
            this.runtime.executableTargets.sort((a, b) => a.layerOrder - b.layerOrder);
            targets.forEach(target => {
                // @ts-expect-error layerOrder is added in deserialization, safe to use here
                delete target.layerOrder;
            });

            // Select the first target for editing, e.g., the first sprite.
            if (wholeProject && (targets.length > 1)) {
                this.editingTarget = targets[1];
            } else {
                this.editingTarget = targets[0];
            }

            if (!wholeProject) {
                this.editingTarget.fixUpVariableReferences();
            }

            // Update the VM user's knowledge of targets and blocks on the workspace.
            this.emitTargetsUpdate(false /* Don't emit project change */);
            this.emitWorkspaceUpdate();
            this.runtime.setEditingTarget(this.editingTarget);
            this.runtime.ioDevices.cloud.setStage(this.runtime.getTargetForStage()!);
        });
    }

    /**
     * Add a sprite, this could be .sprite2 or .sprite3. Unpack and validate
     * such a file first.
     * @param input A json string, object, or ArrayBuffer representing the project to load.
     * @returns Promise that resolves after targets are installed.
     */
    addSprite (input: string | object | ArrayBuffer | ArrayBufferView<ArrayBufferLike>) {
        const errorPrefix = 'Sprite Upload Error:';
        if (typeof input === 'object' && !(input instanceof ArrayBuffer) &&
          !ArrayBuffer.isView(input)) {
            // If the input is an object and not any ArrayBuffer
            // or an ArrayBuffer view (this includes all typed arrays and DataViews)
            // turn the object into a JSON string, because we suspect
            // this is a project.json as an object
            // validate expects a string or buffer as input
            // TODO not sure if we need to check that it also isn't a data view
            input = JSON.stringify(input);
        }

        const validationPromise = new Promise<[SB3Target | SB2Project, JSZip]>((resolve, reject) => {
            // eslint-disable-next-line global-require
            const validate = require('clipcc-parser');
            // The second argument of true below indicates to the parser/validator
            // that the given input should be treated as a single sprite and not
            // an entire project
            validate(input, true, (error: unknown, res: [SB3Target | SB2Project, JSZip]) => {
                if (error) return reject(error);
                resolve(res);
            });
        });

        return validationPromise
            .then(validatedInput => {
                const projectVersion = validatedInput[0].projectVersion;
                if (projectVersion === 2) {
                    return this._addSprite2(validatedInput[0], validatedInput[1]);
                }
                if (projectVersion === 3) {
                    return this._addSprite3(validatedInput[0], validatedInput[1]);
                }
                return Promise.reject(`${errorPrefix} Unable to verify sprite version.`);
            })
            .then(() => this.runtime.emitProjectChanged())
            .catch(error => {
                // Intentionally rejecting here (want errors to be handled by caller)
                if (Object.prototype.hasOwnProperty.call(error, 'validationError')) {
                    return Promise.reject(JSON.stringify(error));
                }
                return Promise.reject(`${errorPrefix} ${error}`);
            });
    }

    /**
     * Add a single sprite from the "Sprite2" (i.e., SB2 sprite) format.
     * @param sprite Object representing 2.0 sprite to be added.
     * @param zip Optional zip of assets being referenced by json
     * @returns Promise that resolves after the sprite is added
     */
    _addSprite2 (sprite: SB2Project, zip?: JSZip) {
        // Validate & parse

        // eslint-disable-next-line global-require
        const sb2: typeof import('./serialization/sb2') = require('./serialization/sb2');
        return sb2.deserialize(sprite, this.runtime, true, zip)
            .then(({targets, extensions}) =>
                this.installTargets(targets, extensions, false));
    }

    /**
     * Add a single sb3 sprite.
     * @param sprite Object rperesenting 3.0 sprite to be added.
     * @param zip Optional zip of assets being referenced by target json
     * @returns Promise that resolves after the sprite is added
     */
    _addSprite3 (sprite: SB3Target, zip?: JSZip) {
        // Validate & parse
        // eslint-disable-next-line global-require
        const sb3: typeof import('./serialization/sb3') = require('./serialization/sb3');
        return sb3
            .deserialize(sprite, this.runtime, zip, true)
            .then(({targets, extensions}) => this.installTargets(targets, extensions, false));
    }

    /**
     * Add a costume to the current editing target.
     * @param md5ext - the MD5 and extension of the costume to be loaded.
     * @param costumeObject Object representing the costume.
     * @param optTargetId - the id of the target to add to, if not the editing target.
     * @param optVersion - if this is 2, load costume as sb2, otherwise load costume as sb3.
     * @returns A promise that resolves when the costume has been added
     */
    addCostume (md5ext: string, costumeObject: Costume, optTargetId?: string, optVersion?: number) {
        const target = optTargetId ? this.runtime.getTargetById(optTargetId) :
            this.editingTarget;
        if (target) {
            return loadCostume(md5ext, costumeObject, this.runtime, optVersion).then(() => {
                target.addCostume(costumeObject);
                target.setCostume(
                    target.getCostumes().length - 1
                );
                this.runtime.emitProjectChanged();
            });
        }
        // If the target cannot be found by id, return a rejected promise
        return Promise.reject(new Error(`Target with id ${optTargetId} not found`));
    }

    /**
     * Add a costume loaded from the library to the current editing target.
     * @param md5ext - the MD5 and extension of the costume to be loaded.
     * @param costumeObject Object representing the costume.
     * @returns A promise that resolves when the costume has been added
     */
    addCostumeFromLibrary (md5ext: string, costumeObject: Costume) {
        if (!this.editingTarget) return Promise.reject(new Error('No editing target found'));
        return this.addCostume(md5ext, costumeObject, this.editingTarget.id, 2 /* optVersion */);
    }

    /**
     * Duplicate the costume at the given index. Add it at that index + 1.
     * @param costumeIndex Index of costume to duplicate
     * @returns A promise that resolves when the costume has been decoded and added
     */
    async duplicateCostume (costumeIndex: number) {
        if (!this.editingTarget) throw new Error('No editing target found');
        const originalCostume = this.editingTarget.getCostumes()[costumeIndex];
        const clone = Object.assign({}, originalCostume);
        const md5ext = `${clone.assetId}.${clone.dataFormat}`;
        await loadCostume(md5ext, clone, this.runtime);
        this.editingTarget.addCostume(clone, costumeIndex + 1);
        this.editingTarget.setCostume(costumeIndex + 1);
        this.emitTargetsUpdate();
    }

    /**
     * Duplicate the sound at the given index. Add it at that index + 1.
     * @param soundIndex Index of sound to duplicate
     * @returns A promise that resolves when the sound has been decoded and added
     */
    async duplicateSound (soundIndex: number) {
        if (!this.editingTarget) throw new Error('No editing target found');
        const originalSound = this.editingTarget.getSounds()[soundIndex];
        const clone = Object.assign({}, originalSound);
        await loadSound(clone, this.runtime, this.editingTarget.sprite.soundBank);
        this.editingTarget.addSound(clone, soundIndex + 1);
        this.emitTargetsUpdate();
    }

    /**
     * Rename a costume on the current editing target.
     * @param costumeIndex - the index of the costume to be renamed.
     * @param newName - the desired new name of the costume (will be modified if already in use).
     */
    renameCostume (costumeIndex: number, newName: string) {
        if (!this.editingTarget) throw new Error('No editing target found');
        this.editingTarget.renameCostume(costumeIndex, newName);
        this.emitTargetsUpdate();
    }

    /**
     * Delete a costume from the current editing target.
     * @param costumeIndex - the index of the costume to be removed.
     * @returns A function to restore the deleted costume, or null,
     * if no costume was deleted.
     */
    deleteCostume (costumeIndex: number) {
        const deletedCostume = this.editingTarget?.deleteCostume(costumeIndex);
        if (deletedCostume) {
            const target = this.editingTarget;
            this.runtime.emitProjectChanged();
            return () => {
                target!.addCostume(deletedCostume);
                this.emitTargetsUpdate();
            };
        }
        return null;
    }

    /**
     * Add a sound to the current editing target.
     * @param soundObject Object representing the costume.
     * @param optTargetId - the id of the target to add to, if not the editing target.
     * @returns A promise that resolves when the sound has been decoded and added
     */
    async addSound (soundObject: Sound, optTargetId?: string): Promise<void> {
        const target = optTargetId ? this.runtime.getTargetById(optTargetId) :
            this.editingTarget;
        if (target) {
            await loadSound(soundObject, this.runtime, target.sprite.soundBank);
            target.addSound(soundObject);
            this.emitTargetsUpdate();
            return;
        }
        // If the target cannot be found by id, return a rejected promise
        throw new Error(`Target with id ${optTargetId} not found`);
    }

    /**
     * Rename a sound on the current editing target.
     * @param soundIndex - the index of the sound to be renamed.
     * @param newName - the desired new name of the sound (will be modified if already in use).
     */
    renameSound (soundIndex: number, newName: string) {
        if (!this.editingTarget) throw new Error('No editing target found');
        this.editingTarget.renameSound(soundIndex, newName);
        this.emitTargetsUpdate();
    }

    /**
     * Get a sound buffer from the audio engine.
     * @param soundIndex - the index of the sound to be got.
     * @returns the sound's audio buffer.
     */
    getSoundBuffer (soundIndex: number): AudioBuffer | null {
        const id = this.editingTarget?.sprite.sounds[soundIndex].soundId;
        if (id && this.runtime?.audioEngine) {
            return this.editingTarget!.sprite.soundBank!.getSoundPlayer(id).buffer;
        }
        return null;
    }

    /**
     * Update a sound buffer.
     * @param soundIndex - the index of the sound to be updated.
     * @param newBuffer - new audio buffer for the audio engine.
     * @param soundEncoding - the new (wav) encoded sound to be stored
     */
    updateSoundBuffer (soundIndex: number, newBuffer: AudioBuffer, soundEncoding: AssetData) {
        const sound = this.editingTarget?.sprite.sounds[soundIndex];
        if (sound && sound.broken) delete sound.broken;
        const id = sound ? sound.soundId : null;
        if (id && this.runtime?.audioEngine) {
            this.editingTarget!.sprite.soundBank!.getSoundPlayer(id).buffer = newBuffer;
        }
        // Update sound in runtime
        if (soundEncoding && this.runtime.storage) {
            // Now that we updated the sound, the format should also be updated
            // so that the sound can eventually be decoded the right way.
            // Sounds that were formerly 'adpcm', but were updated in sound editor
            // will not get decoded by the audio engine correctly unless the format
            // is updated as below.
            sound!.format = '';
            const storage = this.runtime.storage;
            sound!.asset = storage.createAsset(
                storage.AssetType.Sound,
                storage.DataFormat.WAV,
                soundEncoding,
                null,
                true // generate md5
            );
            sound!.assetId = sound!.asset.assetId;
            sound!.dataFormat = storage.DataFormat.WAV;
            sound!.md5 = `${sound!.assetId}.${sound!.dataFormat}`;
            sound!.sampleCount = newBuffer.length;
            sound!.rate = newBuffer.sampleRate;
        }
        // If soundEncoding is null, it's because gui had a problem
        // encoding the updated sound. We don't want to store anything in this
        // case, and gui should have logged an error.

        this.emitTargetsUpdate();
    }

    /**
     * Delete a sound from the current editing target.
     * @param soundIndex - the index of the sound to be removed.
     * @returns A function to restore the sound that was deleted,
     * or null, if no sound was deleted.
     */
    deleteSound (soundIndex: number) {
        const target = this.editingTarget;
        const deletedSound = this.editingTarget?.deleteSound(soundIndex);
        if (deletedSound) {
            this.runtime.emitProjectChanged();
            const restoreFun = () => {
                target!.addSound(deletedSound);
                this.emitTargetsUpdate();
            };
            return restoreFun;
        }
        return null;
    }

    /**
     * Get a string representation of the image from storage.
     * @param costumeIndex - the index of the costume to be got.
     * @returns the costume's SVG string if it's SVG,
     *     a dataURI if it's a PNG or JPG, or null if it couldn't be found or decoded.
     */
    getCostume (costumeIndex: number) {
        const asset = this.editingTarget?.getCostumes()[costumeIndex]?.asset;
        if (!asset || !this.runtime || !this.runtime.storage) return null;
        const format = asset.dataFormat;
        if (format === this.runtime.storage.DataFormat.SVG) {
            return asset.decodeText();
        } else if (format === this.runtime.storage.DataFormat.PNG ||
                format === this.runtime.storage.DataFormat.JPG) {
            return asset.encodeDataURI();
        }
        log.error(`Unhandled format: ${asset.dataFormat}`);
        return null;
    }

    /**
     * Update a costume with the given bitmap
     * @param costumeIndex - the index of the costume to be updated.
     * @param bitmap - new bitmap for the renderer.
     * @param rotationCenterX x of point about which the costume rotates, relative to its upper left corner
     * @param rotationCenterY y of point about which the costume rotates, relative to its upper left corner
     * @param bitmapResolution 1 for bitmaps that have 1 pixel per unit of stage,
     *     2 for double-resolution bitmaps
     */
    updateBitmap (
        costumeIndex: number,
        // It's weird since sourceWidth/Height not appears other than here (even in lib.dom.dts or MDN)
        // just ignore now, need to check later.
        bitmap: ImageData & {sourceWidth?: number, sourceHeight?: number},
        rotationCenterX: number,
        rotationCenterY: number,
        bitmapResolution: number
    ) {
        const costume = this.editingTarget?.getCostumes()[costumeIndex];
        if (!(costume && this.runtime?.renderer)) return;
        if (costume && costume.broken) delete costume.broken;

        costume.rotationCenterX = rotationCenterX;
        costume.rotationCenterY = rotationCenterY;

        // If the bitmap originally had a zero width or height, use that value
        const bitmapWidth = bitmap.sourceWidth === 0 ? 0 : bitmap.width;
        const bitmapHeight = bitmap.sourceHeight === 0 ? 0 : bitmap.height;
        // @todo: updateBitmapSkin does not take ImageData
        const canvas = document.createElement('canvas');
        canvas.width = bitmapWidth;
        canvas.height = bitmapHeight;
        const context = canvas.getContext('2d')!;
        context.putImageData(bitmap, 0, 0);

        // Divide by resolution because the renderer's definition of the rotation center
        // is the rotation center divided by the bitmap resolution
        this.runtime.renderer.updateBitmapSkin(
            costume.skinId,
            canvas,
            bitmapResolution,
            [rotationCenterX / bitmapResolution, rotationCenterY / bitmapResolution]
        );

        // @todo there should be a better way to get from ImageData to a decodable storage format
        canvas.toBlob(blob => {
            const reader = new FileReader();
            reader.addEventListener('loadend', () => {
                const storage = this.runtime.storage;
                if (!storage) throw new Error('No storage module present; cannot update costume');
                costume.dataFormat = storage.DataFormat.PNG;
                costume.bitmapResolution = bitmapResolution;
                costume.size = [bitmapWidth, bitmapHeight];
                costume.asset = storage.createAsset(
                    storage.AssetType.ImageBitmap,
                    costume.dataFormat,
                    Buffer.from(reader.result as unknown as ArrayLike<number>),
                    null, // id
                    true // generate md5
                );
                costume.assetId = costume.asset.assetId;
                costume.md5 = `${costume.assetId}.${costume.dataFormat}`;
                this.emitTargetsUpdate();
            });
            // Bitmaps with a zero width or height return null for their blob
            if (blob){
                reader.readAsArrayBuffer(blob);
            }
        });
    }

    /**
     * Update a costume with the given SVG
     * @param costumeIndex - the index of the costume to be updated.
     * @param svg - new SVG for the renderer.
     * @param rotationCenterX x of point about which the costume rotates, relative to its upper left corner
     * @param rotationCenterY y of point about which the costume rotates, relative to its upper left corner
     */
    updateSvg (costumeIndex: number, svg: string, rotationCenterX: number, rotationCenterY: number) {
        const costume = this.editingTarget?.getCostumes()[costumeIndex];
        if (!costume) return;
        if (costume.broken) delete costume.broken;
        if (this.runtime && this.runtime.renderer) {
            costume.rotationCenterX = rotationCenterX;
            costume.rotationCenterY = rotationCenterY;
            this.runtime.renderer.updateSVGSkin(costume.skinId, svg, [rotationCenterX, rotationCenterY]);
            costume.size = this.runtime.renderer.getSkinSize(costume.skinId);
        }
        const storage = this.runtime.storage;
        if (!storage) throw new Error('No storage module present; cannot update costume');
        // If we're in here, we've edited an svg in the vector editor,
        // so the dataFormat should be 'svg'
        costume.dataFormat = storage.DataFormat.SVG;
        costume.bitmapResolution = 1;
        costume.asset = storage.createAsset(
            storage.AssetType.ImageVector,
            costume.dataFormat,
            (new _TextEncoder()).encode(svg),
            null,
            true // generate md5
        );
        costume.assetId = costume.asset.assetId;
        costume.md5 = `${costume.assetId}.${costume.dataFormat}`;
        this.emitTargetsUpdate();
    }

    /**
     * Add a backdrop to the stage.
     * @param md5ext - the MD5 and extension of the backdrop to be loaded.
     * @param backdropObject Object representing the backdrop.
     * @returns A promise that resolves when the backdrop has been added
     */
    async addBackdrop (md5ext: string, backdropObject: Costume) {
        await loadCostume(md5ext, backdropObject, this.runtime);
        const stage = this.runtime.getTargetForStage();
        if (!stage) throw new Error('Stage not found');
        stage.addCostume(backdropObject);
        stage.setCostume(stage.getCostumes().length - 1);
        this.runtime.emitProjectChanged();
    }

    /**
     * Rename a sprite.
     * @param targetId ID of a target whose sprite to rename.
     * @param newName New name of the sprite.
     */
    renameSprite (targetId: string, newName: string) {
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            if (!target.isSprite()) {
                throw new Error('Cannot rename non-sprite targets.');
            }
            const sprite = target.sprite;
            if (!sprite) {
                throw new Error('No sprite associated with this target.');
            }
            if (newName && RESERVED_NAMES.indexOf(newName) === -1) {
                const names = this.runtime.targets
                    .filter(runtimeTarget => runtimeTarget.isSprite() && runtimeTarget.id !== target.id)
                    .map(runtimeTarget => runtimeTarget.sprite.name);
                const oldName = sprite.name;
                const newUnusedName = StringUtil.unusedName(newName, names);
                sprite.name = newUnusedName;
                const allTargets = this.runtime.targets;
                for (let i = 0; i < allTargets.length; i++) {
                    const currTarget = allTargets[i];
                    currTarget.blocks.updateAssetName(oldName, newName, 'sprite');
                }

                if (newUnusedName !== oldName) this.emitTargetsUpdate();
            }
        } else {
            throw new Error('No target with the provided id.');
        }
    }

    /**
     * Delete a sprite and all its clones.
     * @param targetId ID of a target whose sprite to delete.
     * @returns Returns a function to restore the sprite that was deleted
     */
    deleteSprite (targetId: string) {
        const target = this.runtime.getTargetById(targetId);

        if (target) {
            const targetIndexBeforeDelete = this.runtime.targets.map(t => t.id).indexOf(target.id);
            if (!target.isSprite()) {
                throw new Error('Cannot delete non-sprite targets.');
            }
            const sprite = target.sprite;
            if (!sprite) {
                throw new Error('No sprite associated with this target.');
            }
            const spritePromise = this.exportSprite(targetId, 'uint8array');
            const restoreSprite = () => spritePromise.then(spriteBuffer => this.addSprite(spriteBuffer));
            // Remove monitors from the runtime state and remove the
            // target-specific monitored blocks (e.g. local variables)
            target.deleteMonitors();
            const currentEditingTarget = this.editingTarget;
            for (let i = 0; i < sprite.clones.length; i++) {
                const clone = sprite.clones[i];
                this.runtime.stopForTarget(sprite.clones[i]);
                this.runtime.disposeTarget(sprite.clones[i]);
                // Ensure editing target is switched if we are deleting it.
                if (clone === currentEditingTarget) {
                    const nextTargetIndex = Math.min(this.runtime.targets.length - 1, targetIndexBeforeDelete);
                    if (this.runtime.targets.length > 0){
                        this.setEditingTarget(this.runtime.targets[nextTargetIndex].id);
                    } else {
                        this.editingTarget = null;
                    }
                }
            }
            // Sprite object should be deleted by GC.
            this.emitTargetsUpdate();
            return restoreSprite;
        }

        throw new Error('No target with the provided id.');
    }

    /**
     * Duplicate a sprite.
     * @param targetId ID of a target whose sprite to duplicate.
     * @returns Promise that resolves when duplicated target has
     *     been added to the runtime.
     */
    duplicateSprite (targetId: string): Promise<void> {
        const target = this.runtime.getTargetById(targetId);
        if (!target) {
            throw new Error('No target with the provided id.');
        } else if (!target.isSprite()) {
            throw new Error('Cannot duplicate non-sprite targets.');
        } else if (!target.sprite) {
            throw new Error('No sprite associated with this target.');
        }
        return target.duplicate().then(newTarget => {
            this.runtime.addTarget(newTarget);
            newTarget.goBehindOther(target);
            this.setEditingTarget(newTarget.id);
        });
    }

    /**
     * Set the audio engine for the VM/runtime
     * @param audioEngine The audio engine to attach
     */
    attachAudioEngine (audioEngine: AudioEngine) {
        this.runtime.attachAudioEngine(audioEngine);
    }

    /**
     * Set the renderer for the VM/runtime
     * @param renderer The renderer to attach
     */
    attachRenderer (renderer: RenderWebGL) {
        this.runtime.attachRenderer(renderer);
    }

    /**
     * Get the renderer attached to the VM/runtime
     * @returns The renderer attached to the vm
     */
    get renderer () {
        return this.runtime?.renderer;
    }

    // @deprecated
    attachV2SVGAdapter () {
    }

    /**
     * Set the bitmap adapter for the VM/runtime, which converts scratch 2
     * bitmaps to scratch 3 bitmaps. (Scratch 3 bitmaps are all bitmap resolution 2)
     * @param bitmapAdapter The adapter to attach
     */
    attachV2BitmapAdapter (bitmapAdapter: BitmapAdapter) {
        this.runtime.attachV2BitmapAdapter(bitmapAdapter);
    }

    /**
     * Set the storage module for the VM/runtime
     * @param storage The storage module to attach
     */
    attachStorage (storage: ScratchStorage) {
        this.runtime.attachStorage(storage);
    }

    /**
     * set the current locale and builtin messages for the VM
     * @param locale       current locale
     * @param messages     builtin messages map for current locale
     * @returns Promise that resolves when all the blocks have been
     *     updated for a new locale (or empty if locale hasn't changed.)
     */
    setLocale (locale: string, messages: Record<string, string | formatMessage.Translation>) {
        if (locale !== formatMessage.setup().locale) {
            formatMessage.setup({locale: locale, translations: {[locale]: messages}});
        }
        return this.extensionManager.refreshBlocks();
    }

    /**
     * get the current locale for the VM
     * @returns the current locale in the VM
     */
    getLocale () {
        return formatMessage.setup().locale;
    }

    /**
     * Handle a Blockly event for the current editing target.
     * @param e Any Blockly event.
     */
    blockListener (e: ClipCCBlocks.Events.Abstract) {
        if (e.type === 'finished_loading') {
            this.loadingWorkspace = false;
            return;
        }

        // Blockly's state should consistent with the VM's state. If the VM
        // is loading a workspace, ignore Blockly events.
        // This also fix scratchfoundation/scratch-gui#9552
        if (this.loadingWorkspace) {
            return;
        }

        if (this.editingTarget) {
            this.editingTarget.blocks.blocklyListen(e);
        }
    }

    /**
     * Handle a Blockly event for the flyout.
     * @param e Any Blockly event.
     */
    flyoutBlockListener (e: ClipCCBlocks.Events.Abstract) {
        this.runtime.flyoutBlocks.blocklyListen(e);
    }

    /**
     * Handle a Blockly event for the flyout to be passed to the monitor container.
     * @param e Any Blockly event.
     */
    monitorBlockListener (e: ClipCCBlocks.Events.Abstract) {
        // Filter events by type, since monitor blocks only need to listen to these events.
        // Monitor blocks shouldn't be destroyed when flyout blocks are deleted.
        if (['create', 'change'].indexOf(e.type) !== -1) {
            this.runtime.monitorBlocks.blocklyListen(e);
        }
    }

    /**
     * Handle a Blockly event for the variable map.
     * @param e Any Blockly event.
     */
    variableListener (e: ClipCCBlocks.Events.Abstract) {
        // Filter events by type, since blocks only needs to listen to these
        // var events.
        if (['var_create', 'var_rename', 'var_delete'].indexOf(e.type) !== -1) {
            this.runtime.getTargetForStage()!.blocks.blocklyListen(e);
        }
    }

    /**
     * Delete all of the flyout blocks.
     */
    clearFlyoutBlocks () {
        this.runtime.flyoutBlocks.deleteAllBlocks();
    }

    /**
     * Set an editing target. An editor UI can use this function to switch
     * between editing different targets, sprites, etc.
     * After switching the editing target, the VM may emit updates
     * to the list of targets and any attached workspace blocks
     * (see `emitTargetsUpdate` and `emitWorkspaceUpdate`).
     * @param targetId Id of target to set as editing.
     */
    setEditingTarget (targetId: string) {
        // Has the target id changed? If not, exit.
        if (this.editingTarget && targetId === this.editingTarget.id) {
            return;
        }
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            this.editingTarget = target;
            // Emit appropriate UI updates.
            this.emitTargetsUpdate(false /* Don't emit project change */);
            this.emitWorkspaceUpdate();
            this.runtime.setEditingTarget(target);
        }
    }

    /**
     * Called when blocks are dragged from one sprite to another. Adds the blocks to the
     * workspace of the given target.
     * @param blocks Blocks to add.
     * @param targetId Id of target to add blocks to.
     * @param optFromTargetId Optional target id indicating that blocks are being
     * shared from that target. This is needed for resolving any potential variable conflicts.
     * @returns Promise that resolves when the extensions and blocks have been added.
     */
    shareBlocksToTarget (blocks: VMBlock[], targetId: string, optFromTargetId?: string) {
        // eslint-disable-next-line global-require
        const sb3 = require('./serialization/sb3');

        const copiedBlocks: VMBlock[] = JSON.parse(JSON.stringify(blocks));
        newBlockIds(copiedBlocks);
        const target = this.runtime.getTargetById(targetId);
        if (!target) return;

        if (optFromTargetId) {
            // If the blocks are being shared from another target,
            // resolve any possible variable conflicts that may arise.
            const fromTarget = this.runtime.getTargetById(optFromTargetId);
            const copiedBlocksRecord = copiedBlocks.reduce((record, block) => {
                record[block.id] = block;
                return record;
            }, {} as Record<string, VMBlock>);
            fromTarget?.resolveVariableSharingConflictsWithTarget(copiedBlocksRecord, target);
        }

        // Create a unique set of extensionIds that are not yet loaded
        const extensionIDs = new Set(copiedBlocks
            .map(b => sb3.getExtensionIdForOpcode(b.opcode))
            .filter(id => !!id) // Remove ids that do not exist
            .filter(id => !this.extensionManager.isExtensionLoaded(id)) // and remove loaded extensions
        );

        // Create an array promises for extensions to load
        const extensionPromises = Array.from(extensionIDs,
            id => this.extensionManager.loadExtensionURL(id)
        );

        return Promise.all(extensionPromises).then(() => {
            copiedBlocks.forEach(block => {
                let commentData = null;
                if (block.commentData) {
                    commentData = block.commentData;
                    delete block.commentData;
                    commentData.id = (block.comment = uid());
                }
                target.blocks.createBlock(block);
                if (commentData) {
                    target.createComment(
                        commentData.id,
                        block.id,
                        commentData.text,
                        commentData.x,
                        commentData.y,
                        commentData.width,
                        commentData.height,
                        commentData.collapsed
                    );
                }
            });
            target.blocks.updateTargetSpecificBlocks(target.isStage);
        });
    }

    /**
     * Called when costumes are dragged from editing target to another target.
     * Sets the newly added costume as the current costume.
     * @param costumeIndex Index of the costume of the editing target to share.
     * @param targetId Id of target to add the costume.
     * @returns Promise that resolves when the new costume has been loaded.
     */
    async shareCostumeToTarget (costumeIndex: number, targetId: string): Promise<void> {
        const originalCostume = this.editingTarget!.getCostumes()[costumeIndex];
        const clone = Object.assign({}, originalCostume);
        const md5ext = `${clone.assetId}.${clone.dataFormat}`;
        await loadCostume(md5ext, clone, this.runtime);
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            target.addCostume(clone);
            target.setCostume(target.getCostumes().length - 1);
            this.emitTargetsUpdate();
        }
    }

    /**
     * Called when sounds are dragged from editing target to another target.
     * @param soundIndex Index of the sound of the editing target to share.
     * @param targetId Id of target to add the sound.
     * @returns Promise that resolves when the new sound has been loaded.
     */
    async shareSoundToTarget (soundIndex: number, targetId: string) {
        const originalSound = this.editingTarget!.getSounds()[soundIndex];
        const clone = Object.assign({}, originalSound);
        const target = this.runtime.getTargetById(targetId);
        if (!target) return;
        await loadSound(clone, this.runtime, target.sprite.soundBank);
        target.addSound(clone);
        this.emitTargetsUpdate();
    }

    /**
     * Repopulate the workspace with the blocks of the current editingTarget. This
     * allows us to get around bugs like gui#413.
     */
    refreshWorkspace () {
        if (this.editingTarget) {
            this.emitWorkspaceUpdate();
            this.runtime.setEditingTarget(this.editingTarget);
            this.emitTargetsUpdate(false /* Don't emit project change */);
        }
    }

    /**
     * Emit metadata about available targets.
     * An editor UI could use this to display a list of targets and show
     * the currently editing one.
     * @param triggerProjectChange If true, also emit a project changed event.
     * Disabled selectively by updates that don't affect project serialization.
     * Defaults to true.
     */
    emitTargetsUpdate (triggerProjectChange?: boolean) {
        if (typeof triggerProjectChange === 'undefined') triggerProjectChange = true;
        this.emit('targetsUpdate', {
            // [[target id, human readable target name], ...].
            targetList: this.runtime.targets
                .filter(
                    // Don't report clones.
                    target => !Object.prototype.hasOwnProperty.call(target, 'isOriginal') || target.isOriginal
                ).map(
                    target => target.toJSON()
                ),
            // Currently editing target id.
            editingTarget: this.editingTarget ? this.editingTarget.id : null
        });
        if (triggerProjectChange) {
            this.runtime.emitProjectChanged();
        }
    }

    /**
     * Emit an Blockly/scratch-blocks compatible XML representation
     * of the current editing target's blocks.
     */
    emitWorkspaceUpdate () {
        if (!this.editingTarget) throw new Error('No editing target found');
        this.loadingWorkspace = true;
        // Create a list of broadcast message Ids according to the stage variables
        const stageVariables = this.runtime.getTargetForStage()!.variables;
        let messageIds = [];
        for (const varId in stageVariables) {
            if (stageVariables[varId].type === Variable.BROADCAST_MESSAGE_TYPE) {
                messageIds.push(varId);
            }
        }
        // Go through all blocks on all targets, removing referenced
        // broadcast ids from the list.
        for (let i = 0; i < this.runtime.targets.length; i++) {
            const currTarget = this.runtime.targets[i];
            const currBlocks = currTarget.blocks._blocks;
            for (const blockId in currBlocks) {
                if (currBlocks[blockId].fields.BROADCAST_OPTION) {
                    const id = currBlocks[blockId].fields.BROADCAST_OPTION.id;
                    const index = messageIds.indexOf(id!);
                    if (index !== -1) {
                        messageIds = messageIds.slice(0, index)
                            .concat(messageIds.slice(index + 1));
                    }
                }
            }
        }
        // Anything left in messageIds is not referenced by a block, so delete it.
        for (let i = 0; i < messageIds.length; i++) {
            const id = messageIds[i];
            delete this.runtime.getTargetForStage()!.variables[id];
        }
        const globalVarMap = Object.assign({}, this.runtime.getTargetForStage()!.variables);
        const localVarMap = this.editingTarget.isStage ?
            Object.create(null) :
            Object.assign({}, this.editingTarget.variables);

        const globalVariables = Object.keys(globalVarMap).map(k => globalVarMap[k]);
        const localVariables = Object.keys(localVarMap).map(k => localVarMap[k]);

        const procedures = this.runtime.targets.reduce((acc, target) => {
            const defs = target.blocks.getAllProcedureDefinitions(target !== this.editingTarget);
            return acc.concat(defs);
        }, [] as ProcedureMutation[]);

        const workspaceComments = Object.keys(this.editingTarget.comments)
            .map(k => this.editingTarget!.comments[k])
            .filter(c => c.blockId === null)
            .map(c => c.toState());

        const variables = ([] as ClipCCBlocks.variableModel.ScratchVariableState[])
            .concat(globalVariables.map(v => v.toState(false)))
            .concat(localVariables.map(v => v.toState(true)));

        const blocks = {
            languageVersion: 0,
            blocks: this.editingTarget.blocks.toState(this.editingTarget.comments)
        };

        this.emit('workspaceUpdate', {
            json: {
                blocks,
                variables,
                procedures,
                workspaceComments
            }
        });
    }

    /**
     * Get a target id for a drawable id. Useful for interacting with the renderer
     * @param drawableId The drawable id to request the target id for
     * @returns The target id, if found. Will also be null if the target found is the stage.
     */
    getTargetIdForDrawableId (drawableId: number) {
        const target = this.runtime.getTargetByDrawableId(drawableId);
        if (target &&
            Object.prototype.hasOwnProperty.call(target, 'id') &&
            Object.prototype.hasOwnProperty.call(target, 'isStage') && !target.isStage
        ) {
            return target.id;
        }
        return null;
    }

    /**
     * Reorder target by index. Return whether a change was made.
     * @param targetIndex Index of the target.
     * @param newIndex index that the target should be moved to.
     * @returns Whether a target was reordered.
     */
    reorderTarget (targetIndex: number, newIndex: number) {
        let targets = this.runtime.targets;
        targetIndex = MathUtil.clamp(targetIndex, 0, targets.length - 1);
        newIndex = MathUtil.clamp(newIndex, 0, targets.length - 1);
        if (targetIndex === newIndex) return false;
        const target = targets[targetIndex];
        targets = targets.slice(0, targetIndex).concat(targets.slice(targetIndex + 1));
        targets.splice(newIndex, 0, target);
        this.runtime.targets = targets;
        this.emitTargetsUpdate();
        return true;
    }

    /**
     * Reorder the costumes of a target if it exists. Return whether it succeeded.
     * @param targetId ID of the target which owns the costumes.
     * @param costumeIndex index of the costume to move.
     * @param newIndex index that the costume should be moved to.
     * @returns Whether a costume was reordered.
     */
    reorderCostume (targetId: string, costumeIndex: number, newIndex: number) {
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            const reorderSuccessful = target.reorderCostume(costumeIndex, newIndex);
            if (reorderSuccessful) {
                this.runtime.emitProjectChanged();
            }
            return reorderSuccessful;
        }
        return false;
    }

    /**
     * Reorder the sounds of a target if it exists. Return whether it occured.
     * @param targetId ID of the target which owns the sounds.
     * @param soundIndex index of the sound to move.
     * @param newIndex index that the sound should be moved to.
     * @returns Whether a sound was reordered.
     */
    reorderSound (targetId: string, soundIndex: number, newIndex: number) {
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            const reorderSuccessful = target.reorderSound(soundIndex, newIndex);
            if (reorderSuccessful) {
                this.runtime.emitProjectChanged();
            }
            return reorderSuccessful;
        }
        return false;
    }

    /**
     * Put a target into a "drag" state, during which its X/Y positions will be unaffected
     * by blocks.
     * @param targetId The id for the target to put into a drag state
     */
    startDrag (targetId: string) {
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            this._dragTarget = target;
            target.startDrag();
        }
    }

    /**
     * Remove a target from a drag state, so blocks may begin affecting X/Y position again
     * @param targetId The id for the target to remove from the drag state
     */
    stopDrag (targetId: string) {
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            this._dragTarget = null;
            target.stopDrag();
            this.setEditingTarget(target.sprite && target.sprite.clones[0] ?
                target.sprite.clones[0].id : target.id);
        }
    }

    /**
     * Post/edit sprite info for the current editing target or the drag target.
     * @param data An object with sprite info data to set.
     */
    postSpriteInfo (data: Partial<SpriteInfoData>) {
        if (this._dragTarget) {
            this._dragTarget.postSpriteInfo(data);

            // Post sprite info means the gui has changed something about a sprite,
            // either through the sprite info pane fields (e.g. direction, size) or
            // through dragging a sprite on the stage
            // Emit a project changed event.
            this.runtime.emitProjectChanged();
        } else if (this.editingTarget) {
            this.editingTarget.postSpriteInfo(data);

            // Post sprite info means the gui has changed something about a sprite,
            // either through the sprite info pane fields (e.g. direction, size) or
            // through dragging a sprite on the stage
            // Emit a project changed event.
            this.runtime.emitProjectChanged();
        }
    }

    /**
     * Set a target's variable's value. Return whether it succeeded.
     * @param targetId ID of the target which owns the variable.
     * @param variableId ID of the variable to set.
     * @param value The new value of that variable.
     * @returns whether the target and variable were found and updated.
     */
    setVariableValue (targetId: string, variableId: string, value: unknown) {
        const target = this.runtime.getTargetById(targetId);
        if (!target) return false;
        const variable = target.lookupVariableById(variableId);
        if (!variable) return false;
        variable.value = value;

        if (variable.isCloud) {
            this.runtime.ioDevices.cloud.requestUpdateVariable(variable.name, variable.value);
        }

        return true;
    }

    /**
     * Get a target's variable's value. Return null if the target or variable does not exist.
     * @param targetId ID of the target which owns the variable.
     * @param  variableId ID of the variable to set.
     * @returns The value of the variable, or null if it could not be looked up.
     */
    getVariableValue (targetId: string, variableId: string) {
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            const variable = target.lookupVariableById(variableId);
            if (variable) {
                return variable.value;
            }
        }
        return null;
    }

    /**
     * Allow VM consumer to configure the ScratchLink socket creator.
     * @param factory The custom ScratchLink socket factory.
     */
    configureScratchLinkSocketFactory (factory: ScratchLinkSocketFactory) {
        this.runtime.configureScratchLinkSocketFactory(factory);
    }
}

export default VirtualMachine;
