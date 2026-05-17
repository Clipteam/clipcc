import EventEmitter from 'events';
import {OrderedMap, Map} from 'immutable';
import type {RecordOf, Map as ImmutableMap} from 'immutable';
import ArgumentType from '../extension-support/argument-type';
import Blocks from './blocks';
import {getScripts as getCachedScriptsByOpcode, RuntimeScriptCache} from './blocks-runtime-cache';
import BlockType from '../extension-support/block-type';
import Profiler, {type FrameCallback} from './profiler';
import Sequencer from './sequencer';
import execute from './execute';
import ScratchBlocksConstants from './scratch-blocks-constants';
import TargetType from '../extension-support/target-type';
import Thread from './thread';
import log from '../util/log';
import maybeFormatMessage from '../util/maybe-format-message';
import StageLayering from './stage-layering';
import Variable, {type VariableType} from './variable';
import xmlEscape from '../util/xml-escape';
import ScratchLinkWebSocket from '../util/scratch-link-websocket';

// Virtual I/O devices.
import Clock from '../io/clock';

import Cloud from '../io/cloud';
import Keyboard from '../io/keyboard';
import Mouse from '../io/mouse';
import MouseWheel from '../io/mouseWheel';
import UserData from '../io/userData';
import Video from '../io/video';
import Joystick from '../io/joystick';
import StringUtil from '../util/string-util';
import uid from '../util/uid';
import control from '../blocks/scratch3_control';
import event from '../blocks/scratch3_event';
import looks from '../blocks/scratch3_looks';
import motion from '../blocks/scratch3_motion';
import operators from '../blocks/scratch3_operators';
import sound from '../blocks/scratch3_sound';
import sensing from '../blocks/scratch3_sensing';
import data from '../blocks/scratch3_data';
import procedures from '../blocks/scratch3_procedures';

import type RenderedTarget from '../sprites/rendered-target';
import type AudioEngine from 'clipcc-audio';
import type RenderWebGL from 'clipcc-render';
import type {ScratchStorage} from 'clipcc-storage';
import type {BitmapAdapter} from 'clipcc-svg-renderer';
import type * as ClipCCBlocks from 'clipcc-block';
import type {BlockFunction} from '../blocks/category_prototype';
import type {VMBlock, VMField} from '../serialization/schema';
import type {
    CategoryInfo,
    ExtensionArgumentMetadata,
    ExtensionBlockMetadata,
    ExtensionButtonMetadata,
    ExtensionCustomFieldTypeMetadata,
    ExtensionImageMetadata,
    PeripheralExtensionClass,
    ShortExtensionMenuItem,
    NormalizedExtensionMetadata,
    NormalizedExtensionMenuItem,
    ExtensionMenuItemObject
} from '../extension-support/extension-metadata';
import type {FieldDropdownArg, JsonBlockArg, JsonBlockDefinition} from '../types/json-block-definitions';
import type {MonitorRecordProps} from './monitor-record';

type MenuGenerator = ClipCCBlocks.MenuOption[];

const defaultBlockPackages = {
    scratch3_control: control,
    scratch3_event: event,
    scratch3_looks: looks,
    scratch3_motion: motion,
    scratch3_operators: operators,
    scratch3_sound: sound,
    scratch3_sensing: sensing,
    scratch3_data: data,
    scratch3_procedures: procedures
};


const defaultExtensionColors = ['#0FBD8C', '#0DA57A', '#0B8E69'];

type ScriptCallback = (script: string, target: RenderedTarget) => void;
type ScriptByOpcodeCallback = (script: RuntimeScriptCache, target: RenderedTarget) => void;
export type ScratchLinkSocketFactory = (type: string) => ScratchLinkWebSocket;

export interface HatMetadata {
    edgeActivated?: boolean;
    restartExistingThreads?: boolean;
}

export interface MonitorBlockInfo {
    isSpriteSpecific?: boolean;
    getId: (targetId?: string, fields?: Record<string, VMField>) => string;
}

/**
 * Information used for converting Scratch argument types into scratch-blocks data.
 */
const ArgumentTypeMap = {
    [ArgumentType.ANGLE]: {
        shadow: {
            type: 'math_angle',
            // We specify fieldNames here so that we can pick
            // create and populate a field with the defaultValue
            // specified in the extension.
            // When the `fieldName` property is not specified,
            // the <field></field> will be left out of the XML and
            // the scratch-blocks defaults for that field will be
            // used instead (e.g. default of 0 for number fields)
            fieldName: 'NUM'
        }
    },
    [ArgumentType.COLOR]: {
        shadow: {
            type: 'colour_picker',
            fieldName: 'COLOUR'
        }
    },
    [ArgumentType.NUMBER]: {
        shadow: {
            type: 'math_number',
            fieldName: 'NUM'
        }
    },
    [ArgumentType.STRING]: {
        shadow: {
            type: 'text',
            fieldName: 'TEXT'
        }
    },
    [ArgumentType.BOOLEAN]: {
        check: 'Boolean'
    },
    [ArgumentType.MATRIX]: {
        shadow: {
            type: 'matrix',
            fieldName: 'MATRIX'
        }
    },
    [ArgumentType.NOTE]: {
        shadow: {
            type: 'note',
            fieldName: 'NOTE'
        }
    },
    [ArgumentType.IMAGE]: {
        // Inline images are weird because they're not actually "arguments".
        // They are more analagous to the label on a block.
        fieldType: 'field_image'
    }
};

interface PlaceholderContext {
    argsMap: Record<string, unknown>;
    blockJSON: JsonBlockDefinition
    categoryInfo: CategoryInfo;
    blockInfo: ExtensionBlockMetadata;
    inputList: string[];
    outLineNum?: number;
}

/**
 * Creates and manages cloud variable limit in a project,
 * and returns two functions to be used to add a new
 * cloud variable (while checking that it can be added)
 * and remove an existing cloud variable.
 * These are to be called whenever attempting to create or delete
 * a cloud variable.
 * @returns The functions to be used when adding or removing a
 * cloud variable.
 */
const cloudDataManager = () => {
    const limit = 10;
    let count = 0;

    const canAddCloudVariable = () => count < limit;

    const addCloudVariable = () => {
        count++;
    };

    const removeCloudVariable = () => {
        count--;
    };

    const hasCloudVariables = () => count > 0;

    return {
        canAddCloudVariable,
        addCloudVariable,
        removeCloudVariable,
        hasCloudVariables
    };
};

type CloudDataManager = ReturnType<typeof cloudDataManager>;

/**
 * Numeric ID for Runtime._step in Profiler instances.
 */
let stepProfilerId = -1;

/**
 * Numeric ID for Sequencer.stepThreads in Profiler instances.
 */
let stepThreadsProfilerId = -1;

/**
 * Numeric ID for RenderWebGL.draw in Profiler instances.
 */
let rendererDrawProfilerId = -1;

/**
 * Events that can be emitted by Runtime.
 */
interface RuntimeEvents {
    'STAGE_SIZE_UPDATE': [width: number, height: number];
    'SCRIPT_GLOW_ON': [{id: string}];
    'SCRIPT_GLOW_OFF': [{id: string}];
    'BLOCK_GLOW_ON': [{id: string}];
    'BLOCK_GLOW_OFF': [{id: string}];
    'HAS_CLOUD_DATA_UPDATE': [hasCloudData: boolean];
    'TURBO_MODE_ON': [];
    'TURBO_MODE_OFF': [];
    'PROJECT_START': [];
    'PROJECT_RUN_START': [];
    'PROJECT_RUN_STOP': [];
    'PROJECT_STOP_ALL': [];
    'STOP_FOR_TARGET': [target: RenderedTarget, optThreadException?: Thread];
    'VISUAL_REPORT': [{id: string, value: string}];
    'PROJECT_LOADED': [];
    'PROJECT_CHANGED': [];
    'TOOLBOX_EXTENSIONS_NEED_UPDATE': [];
    'TARGETS_UPDATE': [isForceRefresh: boolean];
    'MONITORS_UPDATE': [monitorState: OrderedMap<string, RecordOf<MonitorRecordProps>>];
    'BLOCK_DRAG_UPDATE': [areBlocksOverGui: boolean];
    'BLOCK_DRAG_END': [blocks: VMBlock[], topBlockId: string];
    'EXTENSION_ADDED': [categoryInfo: CategoryInfo];
    'EXTENSION_FIELD_ADDED': [{name: string, implementation: unknown}];
    'PERIPHERAL_LIST_UPDATE': [availablePeripherals: Record<number, unknown>];
    'USER_PICKED_PERIPHERAL': [availablePeripherals: Record<number, unknown>];
    'PERIPHERAL_CONNECTED': [];
    'PERIPHERAL_DISCONNECTED': [];
    'PERIPHERAL_REQUEST_ERROR': [{message: string, extensionId: string}];
    'PERIPHERAL_CONNECTION_LOST_ERROR': [{message: string, extensionId: string}];
    'PERIPHERAL_SCAN_TIMEOUT': [];
    'MIC_LISTENING': [listening: boolean];
    'BLOCKSINFO_UPDATE': [categoryInfo: CategoryInfo];
    'RUNTIME_STARTED': [];
    'RUNTIME_DISPOSED': [];
    'BLOCKS_NEED_UPDATE': [];
    'ANSWER': [answer: string];
    'SAY': [target: RenderedTarget, variant: 'say' | 'think', text: string];
    'KEY_PRESSED': [key: string];
    'QUESTION': [text: string | null];
    'PLAY_NOTE': [noteNum: number, extensionId: string];
    /**
     * Event fired after a new target has been created, possibly by cloning an existing target.
     * @param newTarget - the newly created target.
     * @param sourceTarget - the target used as a source for the new clone, if any.
     */
    'targetWasCreated': [newTarget: RenderedTarget, sourceTarget?: RenderedTarget];
    'targetWasRemoved': [target: RenderedTarget];
}

/**
 * Manages targets, scripts, and the sequencer.
 * @class
 */
class Runtime extends EventEmitter<RuntimeEvents> {
    /**
     * Current time in milliseconds, used for determining elapsed time and for scheduling future tasks.
     */
    currentMSecs = 0;

    /**
     * Target management and storage.
     */
    targets: RenderedTarget[] = [];

    /**
     * Targets in reverse order of execution. Shares its order with drawables.
     */
    executableTargets: RenderedTarget[] = [];

    /**
     * A list of threads that are currently running in the VM.
     * Threads are added when execution starts and pruned when execution ends.
     */
    threads: Thread[] = [];

    sequencer = new Sequencer(this);

    /**
     * Storage container for flyout blocks.
     * These will execute on `_editingTarget.`
     */
    flyoutBlocks = new Blocks(this, true /* force no glow */);

    /**
     * Storage container for monitor blocks.
     * These will execute on a target maybe
     */
    monitorBlocks = new Blocks(this, true /* force no glow */);

    /**
     * Currently known editing target for the VM.
     */
    _editingTarget: RenderedTarget | null = null;

    /**
     * Map to look up a block primitive's implementation function by its opcode.
     * This is a two-step lookup: package name first, then primitive name.
     */
    _primitives: Record<string, BlockFunction> = {};

    /**
     * Array that stores all extension block's information.
     * @private
     */
    _blockInfo: CategoryInfo[] = [];

    /**
     * Map to look up hat blocks' metadata.
     * Keys are opcode for hat, values are metadata objects.
     */
    _hats: Record<string, HatMetadata> = {};

    /**
     * Map to look up a block's execution order.
     * Keys are opcode for block, values are order array of its arguments.
     */
    _orders: Record<string, (string | {execute: string})[]> = {};

    /**
     * A list of script block IDs that were glowing during the previous frame.
     */
    _scriptGlowsPreviousFrame: string[] = [];

    /**
     * Number of non-monitor threads running during the previous frame.
     */
    _nonMonitorThreadCount = 0;

    /**
     * All threads that finished running and were removed from this.threads
     * by behaviour in Sequencer.stepThreads.
     */
    _lastStepDoneThreads: Thread[] | null = null;

    /**
     * Currently known number of clones, used to enforce clone limit.
     */
    _cloneCounter = 0;

    /**
     * Flag to emit a targets update at the end of a step. When target data
     * changes, this flag is set to true.
     */
    _refreshTargets = false;

    /**
     * Map to look up all monitor block information by opcode.
     */
    monitorBlockInfo: Record<string, MonitorBlockInfo> = {};

    /**
     * Ordered map of all monitors, which are MonitorReporter objects.
     */
    _monitorState = OrderedMap<string, RecordOf<MonitorRecordProps>>();

    /**
     * Monitor state from last tick
     */
    _prevMonitorState = OrderedMap<string, RecordOf<MonitorRecordProps>>();

    /**
     * Whether the project is in "turbo mode."
     */
    turboMode = false;

    /**
     * Whether the project is in "compatibility mode" (30 TPS).
     * @deprecated Use framerate instead.
     */
    compatibilityMode = false;

    /**
     * The limit options.
     */
    limitOptions = {
        infiniteCloning: false,
        edgelessStage: false,
        unlimitedListLength: false,
        unlimitedPenSize: false,
        accurateCoordinates: false,
        unlimitedSoundStuffs: false
    };

    /**
     * A reference to the current runtime stepping interval, set
     * by a `setInterval`.
     */
    _steppingInterval: ReturnType<typeof setInterval> | null = null;

    /**
     * Configured framerate.
     */
    framerate = 60;

    /**
     * Current length of a step. Equals to 1000 / this.framerate.
     * Changes as mode switches, and used by the sequencer to calculate
     * WORK_TIME.
     */
    currentStepTime: number | null = null;

    /**
     * Whether any primitive has requested a redraw.
     * Affects whether `Sequencer.stepThreads` will yield
     * after stepping each thread.
     * Reset on every frame.
     */
    redrawRequested = false;

    /**
     * Get stage width.
     */
    stageWidth = 480;

    /**
     * Get stage height.
     */
    stageHeight = 360;

    // Register and initialize "IO devices", containers for processing
    // I/O related data.
    ioDevices = {
        clock: new Clock(this),
        cloud: new Cloud(this),
        keyboard: new Keyboard(this),
        mouse: new Mouse(this),
        joystick: new Joystick(this),
        mouseWheel: new MouseWheel(this),
        userData: new UserData(),
        video: new Video(this)
    };

    /**
     * A list of extensions, used to manage hardware connection.
     */
    peripheralExtensions: Record<string, PeripheralExtensionClass> = {};

    /**
     * A runtime profiler that records timed events for later playback to
     * diagnose Scratch performance.
     */
    profiler: Profiler | null = null;

    /**
     * A string representing the origin of the current project from outside of the
     * Scratch community, such as CSFirst.
     */
    origin: string | null = null;

    /**
     * Check wether the runtime has any cloud data.
     * @returns {boolean} Whether or not the runtime currently has any
     * cloud variables.
     */
    hasCloudData: () => boolean;
    /**
     * A function which checks whether a new cloud variable can be added
     * to the runtime.
     * @returns {boolean} Whether or not a new cloud variable can be added
     * to the runtime.
     */
    canAddCloudVariable: () => boolean;
    /**
     * A function that tracks a new cloud variable in the runtime,
     * updating the cloud variable limit. Calling this function will
     * emit a cloud data update event if this is the first cloud variable
     * being added.
     */
    addCloudVariable: () => void;
    /**
     * A function which updates the runtime's cloud variable limit
     * when removing a cloud variable and emits a cloud update event
     * if the last of the cloud variables is being removed.
     */
    removeCloudVariable: () => void;
    audioEngine?: AudioEngine;
    renderer?: RenderWebGL;
    v2BitmapAdapter?: BitmapAdapter;
    storage?: ScratchStorage;

    _linkSocketFactory: ScratchLinkSocketFactory | null = null;
    constructor () {
        super();
        // Set an intial value for this.currentMSecs
        this.updateCurrentMSecs();

        // Register all given block packages.
        this._registerBlockPackages();

        const newCloudDataManager = cloudDataManager();
        this.hasCloudData = newCloudDataManager.hasCloudVariables;
        this.canAddCloudVariable = newCloudDataManager.canAddCloudVariable;
        this.addCloudVariable = this._initializeAddCloudVariable(newCloudDataManager);
        this.removeCloudVariable = this._initializeRemoveCloudVariable(newCloudDataManager);

        this._initScratchLink();
    }

    /**
     * Stage width in pixels.
     * @deprecated Use `runtime.stageWidth` instead.
     * @returns The stage width in pixels.
     */
    static get STAGE_WIDTH () {
        return 480 as const;
    }

    /**
     * Stage height in pixels.
     * @deprecated Use `runtime.stageHeight` instead.
     * @returns The stage height in pixels.
     */
    static get STAGE_HEIGHT () {
        return 360 as const;
    }

    /**
     * Event name for stage size update.
     * @returns The event name.
     */
    static get STAGE_SIZE_UPDATE () {
        return 'STAGE_SIZE_UPDATE' as const;
    }

    /**
     * Event name for glowing a script.
     * @returns The event name.
     */
    static get SCRIPT_GLOW_ON () {
        return 'SCRIPT_GLOW_ON' as const;
    }

    /**
     * Event name for unglowing a script.
     * @returns The event name.
     */
    static get SCRIPT_GLOW_OFF () {
        return 'SCRIPT_GLOW_OFF' as const;
    }

    /**
     * Event name for glowing a block.
     * @returns The event name.
     */
    static get BLOCK_GLOW_ON () {
        return 'BLOCK_GLOW_ON' as const;
    }

    /**
     * Event name for unglowing a block.
     * @returns The event name.
     */
    static get BLOCK_GLOW_OFF () {
        return 'BLOCK_GLOW_OFF' as const;
    }

    /**
     * Event name for a cloud data update
     * to this project.
     * @returns The event name.
     */
    static get HAS_CLOUD_DATA_UPDATE () {
        return 'HAS_CLOUD_DATA_UPDATE' as const;
    }

    /**
     * Event name for turning on turbo mode.
     * @returns The event name.
     */
    static get TURBO_MODE_ON () {
        return 'TURBO_MODE_ON' as const;
    }

    /**
     * Event name for turning off turbo mode.
     * @returns The event name.
     */
    static get TURBO_MODE_OFF () {
        return 'TURBO_MODE_OFF' as const;
    }

    /**
     * Event name when the project is started (threads may not necessarily be
     * running).
     * @returns The event name.
     */
    static get PROJECT_START () {
        return 'PROJECT_START' as const;
    }

    /**
     * Event name when threads start running.
     * Used by the UI to indicate running status.
     * @returns The event name.
     */
    static get PROJECT_RUN_START () {
        return 'PROJECT_RUN_START' as const;
    }

    /**
     * Event name when threads stop running
     * Used by the UI to indicate not-running status.
     * @returns The event name.
     */
    static get PROJECT_RUN_STOP () {
        return 'PROJECT_RUN_STOP' as const;
    }

    /**
     * Event name for project being stopped or restarted by the user.
     * Used by blocks that need to reset state.
     * @returns The event name.
     */
    static get PROJECT_STOP_ALL () {
        return 'PROJECT_STOP_ALL' as const;
    }

    /**
     * Event name for target being stopped by a stop for target call.
     * Used by blocks that need to stop individual targets.
     * @returns The event name.
     */
    static get STOP_FOR_TARGET () {
        return 'STOP_FOR_TARGET' as const;
    }

    /**
     * Event name for visual value report.
     * @returns The event name.
     */
    static get VISUAL_REPORT () {
        return 'VISUAL_REPORT' as const;
    }

    /**
     * Event name for project loaded report.
     * @returns The event name.
     */
    static get PROJECT_LOADED () {
        return 'PROJECT_LOADED' as const;
    }

    /**
     * Event name for report that a change was made that can be saved
     * @returns The event name.
     */
    static get PROJECT_CHANGED () {
        return 'PROJECT_CHANGED' as const;
    }

    /**
     * Event name for report that a change was made to an extension in the toolbox.
     * @returns The event name.
     */
    static get TOOLBOX_EXTENSIONS_NEED_UPDATE () {
        return 'TOOLBOX_EXTENSIONS_NEED_UPDATE' as const;
    }

    /**
     * Event name for targets update report.
     * @returns The event name.
     */
    static get TARGETS_UPDATE () {
        return 'TARGETS_UPDATE' as const;
    }

    /**
     * Event name for monitors update.
     * @returns The event name.
     */
    static get MONITORS_UPDATE () {
        return 'MONITORS_UPDATE' as const;
    }

    /**
     * Event name for block drag update.
     * @returns The event name.
     */
    static get BLOCK_DRAG_UPDATE () {
        return 'BLOCK_DRAG_UPDATE' as const;
    }

    /**
     * Event name for block drag end.
     * @returns The event name.
     */
    static get BLOCK_DRAG_END () {
        return 'BLOCK_DRAG_END' as const;
    }

    /**
     * Event name for reporting that an extension was added.
     * @returns The event name.
     */
    static get EXTENSION_ADDED () {
        return 'EXTENSION_ADDED' as const;
    }

    /**
     * Event name for reporting that an extension as asked for a custom field to be added
     * @returns The event name.
     */
    static get EXTENSION_FIELD_ADDED () {
        return 'EXTENSION_FIELD_ADDED' as const;
    }

    /**
     * Event name for updating the available set of peripheral devices.
     * This causes the peripheral connection modal to update a list of
     * available peripherals.
     * @returns The event name.
     */
    static get PERIPHERAL_LIST_UPDATE () {
        return 'PERIPHERAL_LIST_UPDATE' as const;
    }

    /**
     * Event name for when the user picks a bluetooth device to connect to
     * via Companion Device Manager (CDM)
     * @returns The event name.
     */
    static get USER_PICKED_PERIPHERAL () {
        return 'USER_PICKED_PERIPHERAL' as const;
    }

    /**
     * Event name for reporting that a peripheral has connected.
     * This causes the status button in the blocks menu to indicate 'connected'.
     * @returns The event name.
     */
    static get PERIPHERAL_CONNECTED () {
        return 'PERIPHERAL_CONNECTED' as const;
    }

    /**
     * Event name for reporting that a peripheral has been intentionally disconnected.
     * This causes the status button in the blocks menu to indicate 'disconnected'.
     * @returns The event name.
     */
    static get PERIPHERAL_DISCONNECTED () {
        return 'PERIPHERAL_DISCONNECTED' as const;
    }

    /**
     * Event name for reporting that a peripheral has encountered a request error.
     * This causes the peripheral connection modal to switch to an error state.
     * @returns The event name.
     */
    static get PERIPHERAL_REQUEST_ERROR () {
        return 'PERIPHERAL_REQUEST_ERROR' as const;
    }

    /**
     * Event name for reporting that a peripheral connection has been lost.
     * This causes a 'peripheral connection lost' error alert to display.
     * @returns The event name.
     */
    static get PERIPHERAL_CONNECTION_LOST_ERROR () {
        return 'PERIPHERAL_CONNECTION_LOST_ERROR' as const;
    }

    /**
     * Event name for reporting that a peripheral has not been discovered.
     * This causes the peripheral connection modal to show a timeout state.
     * @returns The event name.
     */
    static get PERIPHERAL_SCAN_TIMEOUT () {
        return 'PERIPHERAL_SCAN_TIMEOUT' as const;
    }

    /**
     * Event name to indicate that the microphone is being used to stream audio.
     * @returns {'MIC_LISTENING'} The event name.
     */
    static get MIC_LISTENING () {
        return 'MIC_LISTENING' as const;
    }

    /**
     * Event name for reporting that blocksInfo was updated.
     * @returns The event name.
     */
    static get BLOCKSINFO_UPDATE () {
        return 'BLOCKSINFO_UPDATE' as const;
    }

    /**
     * Event name when the runtime tick loop has been started.
     * @returns The event name.
     */
    static get RUNTIME_STARTED () {
        return 'RUNTIME_STARTED' as const;
    }

    /**
     * Event name when the runtime dispose has been called.
     * @returns The event name.
     */
    static get RUNTIME_DISPOSED () {
        return 'RUNTIME_DISPOSED' as const;
    }

    /**
     * Event name for reporting that a block was updated and needs to be rerendered.
     */
    static get BLOCKS_NEED_UPDATE () {
        return 'BLOCKS_NEED_UPDATE' as const;
    }

    /**
     * How rapidly we try to step threads by default, in ms.
     * @returns The default thread step interval in milliseconds.
     */
    static get THREAD_STEP_INTERVAL () {
        return 1000 / 60;
    }

    /**
     * In compatibility mode, how rapidly we try to step threads, in ms.
     * @returns The compatibility thread step interval in milliseconds.
     */
    static get THREAD_STEP_INTERVAL_COMPATIBILITY () {
        return 1000 / 30;
    }

    /**
     * How many clones can be created at a time.
     * @returns The maximum number of clones allowed.
     */
    get MAX_CLONES () {
        return this.limitOptions.infiniteCloning ? Infinity : 300;
    }

    // -----------------------------------------------------------------------------
    // -----------------------------------------------------------------------------

    // Helper function for initializing the addCloudVariable function
    _initializeAddCloudVariable (newCloudDataManager: CloudDataManager) {
        // The addCloudVariable function
        return (() => {
            const hadCloudVarsBefore = this.hasCloudData();
            newCloudDataManager.addCloudVariable();
            if (!hadCloudVarsBefore && this.hasCloudData()) {
                this.emit(Runtime.HAS_CLOUD_DATA_UPDATE, true);
            }
        });
    }

    // Helper function for initializing the removeCloudVariable function
    _initializeRemoveCloudVariable (newCloudDataManager: CloudDataManager) {
        return (() => {
            const hadCloudVarsBefore = this.hasCloudData();
            newCloudDataManager.removeCloudVariable();
            if (hadCloudVarsBefore && !this.hasCloudData()) {
                this.emit(Runtime.HAS_CLOUD_DATA_UPDATE, false);
            }
        });
    }

    /**
     * Register default block packages with this runtime.
     * @todo Prefix opcodes with package name.
     * @private
     */
    _registerBlockPackages () {
        for (const packageName in defaultBlockPackages) {
            if (Object.prototype.hasOwnProperty.call(defaultBlockPackages, packageName)) {
                // @todo pass a different runtime depending on package privilege?
                const packageObject =
                    new (defaultBlockPackages[packageName as keyof typeof defaultBlockPackages])(this);
                // Collect primitives from package.
                if ('getPrimitives' in packageObject) {
                    const packagePrimitives = packageObject.getPrimitives();
                    for (const op in packagePrimitives) {
                        if (Object.prototype.hasOwnProperty.call(packagePrimitives, op)) {
                            this._primitives[op] =
                                // @ts-expect-error use bind to ensure correct `this` context for primitives
                                packagePrimitives[op as keyof typeof packagePrimitives].bind(packageObject);
                        }
                    }
                }
                // Collect hat metadata from package.
                if ('getHats' in packageObject) {
                    const packageHats = packageObject.getHats();
                    for (const hatName in packageHats) {
                        if (Object.prototype.hasOwnProperty.call(packageHats, hatName)) {
                            this._hats[hatName] = packageHats[hatName as keyof typeof packageHats];
                        }
                    }
                }
                // Collect monitored from package.
                if ('getMonitored' in packageObject) {
                    this.monitorBlockInfo = Object.assign({}, this.monitorBlockInfo, packageObject.getMonitored());
                }
                // Collect execution orders from package.
                if ('getOrders' in packageObject) {
                    const packageOrders = packageObject.getOrders();
                    for (const op in packageOrders) {
                        if (Object.prototype.hasOwnProperty.call(packageOrders, op)) {
                            this._orders[op] = packageOrders[op as keyof typeof packageOrders];
                        }
                    }
                }
            }
        }
    }

    getMonitorState () {
        return this._monitorState;
    }

    /**
     * Generate an extension-specific menu ID.
     * @param menuName - the name of the menu.
     * @param extensionId - the ID of the extension hosting the menu.
     * @returns the constructed ID.
     * @private
     */
    _makeExtensionMenuId (menuName: string, extensionId: string) {
        return `${extensionId}_menu_${xmlEscape(menuName)}`;
    }

    /**
     * Create a context ("args") object for use with `formatMessage` on messages which might be target-specific.
     * @param target the target to use as context.
     * If a target is not provided, default to the current
     * editing target or the stage.
     */
    makeMessageContextForTarget (target?: RenderedTarget) { // eslint-disable-line @typescript-eslint/no-unused-vars
        // Not implemented
        /*
        target = target || this.getEditingTarget() || this.getTargetForStage();
        if (target) {
            const context = {
                targetType: (target.isStage ? TargetType.STAGE : TargetType.SPRITE)
            };
        }
        */
    }

    /**
     * Register the primitives provided by an extension.
     * @param extensionInfo - information about the extension (id, blocks, etc.)
     * @private
     */
    _registerExtensionPrimitives (extensionInfo: NormalizedExtensionMetadata) {
        const categoryInfo = {
            id: extensionInfo.id,
            name: maybeFormatMessage(extensionInfo.name),
            showStatusButton: extensionInfo.showStatusButton,
            blockIconURI: extensionInfo.blockIconURI,
            menuIconURI: extensionInfo.menuIconURI
        } as CategoryInfo;

        if (extensionInfo.color1) {
            categoryInfo.color1 = extensionInfo.color1;
            categoryInfo.color2 = extensionInfo.color2;
            categoryInfo.color3 = extensionInfo.color3;
        } else {
            categoryInfo.color1 = defaultExtensionColors[0];
            categoryInfo.color2 = defaultExtensionColors[1];
            categoryInfo.color3 = defaultExtensionColors[2];
        }

        this._blockInfo.push(categoryInfo);

        this._fillExtensionCategory(categoryInfo, extensionInfo);

        for (const fieldTypeName in categoryInfo.customFieldTypes) {
            if (Object.prototype.hasOwnProperty.call(extensionInfo.customFieldTypes, fieldTypeName)) {
                const fieldTypeInfo = categoryInfo.customFieldTypes[fieldTypeName];

                // Emit events for custom field types from extension
                this.emit(Runtime.EXTENSION_FIELD_ADDED, {
                    name: `field_${fieldTypeInfo.extendedName}`,
                    implementation: fieldTypeInfo.fieldImplementation
                });
            }
        }

        this.emit(Runtime.EXTENSION_ADDED, categoryInfo);
    }

    /**
     * Reregister the primitives for an extension
     * @param extensionInfo - new info (results of running getInfo) for an extension
     * @private
     */
    _refreshExtensionPrimitives (extensionInfo: NormalizedExtensionMetadata) {
        const categoryInfo = this._blockInfo.find(info => info.id === extensionInfo.id);
        if (categoryInfo) {
            categoryInfo.name = maybeFormatMessage(extensionInfo.name);
            this._fillExtensionCategory(categoryInfo, extensionInfo);

            this.emit(Runtime.BLOCKSINFO_UPDATE, categoryInfo);
        }
    }

    /**
     * Read extension information, convert menus, blocks and custom field types
     * and store the results in the provided category object.
     * @param categoryInfo - the category to be filled
     * @param extensionInfo - the extension metadata to read
     * @private
     */
    _fillExtensionCategory (categoryInfo: CategoryInfo, extensionInfo: NormalizedExtensionMetadata) {
        categoryInfo.blocks = [];
        categoryInfo.customFieldTypes = {};
        categoryInfo.menus = [];
        categoryInfo.menuInfo = {};

        for (const menuName in extensionInfo.menus) {
            if (Object.prototype.hasOwnProperty.call(extensionInfo.menus, menuName)) {
                const menuInfo = extensionInfo.menus[menuName];
                const convertedMenu = this._buildMenuForScratchBlocks(menuName, menuInfo, categoryInfo);
                categoryInfo.menus.push(convertedMenu);
                categoryInfo.menuInfo[menuName] = menuInfo;
            }
        }
        for (const fieldTypeName in extensionInfo.customFieldTypes) {
            if (Object.prototype.hasOwnProperty.call(extensionInfo.customFieldTypes, fieldTypeName)) {
                const fieldType = extensionInfo.customFieldTypes[fieldTypeName];
                const fieldTypeInfo = this._buildCustomFieldInfo(
                    fieldTypeName,
                    fieldType,
                    extensionInfo.id,
                    categoryInfo
                );

                categoryInfo.customFieldTypes[fieldTypeName] = fieldTypeInfo;
            }
        }

        for (const metadata of extensionInfo.blocks) {
            try {
                const convertedBlock = this._convertForScratchBlocks(metadata, categoryInfo);
                categoryInfo.blocks.push(convertedBlock);
                if ('json' in convertedBlock) {
                    const blockInfo = metadata as ExtensionBlockMetadata;
                    const opcode = convertedBlock.json.type;
                    if (blockInfo.blockType !== BlockType.EVENT) {
                        this._primitives[opcode] = convertedBlock.info.func!;
                    }
                    if (blockInfo.blockType === BlockType.EVENT || blockInfo.blockType === BlockType.HAT) {
                        this._hats[opcode] = {
                            edgeActivated: blockInfo.isEdgeActivated,
                            restartExistingThreads: blockInfo.shouldRestartExistingThreads
                        };
                    }
                }
            } catch (e) {
                log.error('Error parsing block: ', {block: metadata, error: e});
            }
        }
    }

    /**
     * Convert the given extension menu items into the scratch-blocks style of list of pairs.
     * If the menu is dynamic (e.g. the passed in argument is a function), return the input unmodified.
     * @param menuItems - An array of menu items or a function
     *     to retrieve them.
     * @returns An array of pairs or the original input function.
     * @private
     */
    _convertMenuItems (menuItems: ShortExtensionMenuItem | string[]): MenuGenerator {
        if (typeof menuItems !== 'function') {
            return menuItems.map(item => {
                const formattedItem = maybeFormatMessage(item);
                switch (typeof formattedItem) {
                case 'string':
                    return [formattedItem, formattedItem];
                case 'object':
                    return [
                        maybeFormatMessage((item as unknown as ExtensionMenuItemObject).text),
                        (item as unknown as ExtensionMenuItemObject).value
                    ];
                default:
                    throw new Error(`Can't interpret menu item: ${JSON.stringify(item)}`);
                }
            });
        }
        // Not sure whether modern blockly still can construct dynamic menu from field json config,
        // just keep original behavior
        return menuItems as unknown as MenuGenerator;
    }

    /**
     * Build the scratch-blocks JSON for a menu. Note that scratch-blocks treats menus as a special kind of block.
     * @param menuName - the name of the menu
     * @param menuInfo - a description of this menu and its items
     * @param categoryInfo - the category for this block
     * @returns The menu block definition for scratch-blocks.
     * @private
     */
    _buildMenuForScratchBlocks (menuName: string, menuInfo: NormalizedExtensionMenuItem, categoryInfo: CategoryInfo) {
        const menuId = this._makeExtensionMenuId(menuName, categoryInfo.id);
        const menuItems = this._convertMenuItems(menuInfo.items);
        return {
            json: {
                message0: '%1',
                type: menuId,
                inputsInline: true,
                output: 'String',
                colour: categoryInfo.color1,
                colourSecondary: categoryInfo.color2,
                colourTertiary: categoryInfo.color3,
                outputShape: menuInfo.acceptReporters ?
                    ScratchBlocksConstants.OUTPUT_SHAPE_ROUND : ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE,
                args0: [
                    {
                        type: 'field_dropdown',
                        name: menuName,
                        options: menuItems
                    }
                ]
            }
        };
    }

    /**
     * Build the runtime metadata for an extension-defined custom field type.
     * @param fieldName - The field name from the extension metadata.
     * @param fieldInfo - The extension-defined custom field metadata.
     * @param extensionId - The ID of the extension providing the field.
     * @param categoryInfo - The category the field belongs to.
     * @returns The runtime metadata for the custom field type.
     */
    _buildCustomFieldInfo (
        fieldName: string,
        fieldInfo: ExtensionCustomFieldTypeMetadata,
        extensionId: string,
        categoryInfo: CategoryInfo
    ) {
        const extendedName = `${extensionId}_${fieldName}`;
        return {
            fieldName: fieldName,
            extendedName: extendedName,
            argumentTypeInfo: {
                shadow: {
                    type: extendedName,
                    fieldName: `field_${extendedName}`
                }
            },
            scratchBlocksDefinition: this._buildCustomFieldTypeForScratchBlocks(
                extendedName,
                fieldInfo.output,
                fieldInfo.outputShape,
                categoryInfo
            ),
            fieldImplementation: fieldInfo.implementation
        };
    }

    /**
     * Build the scratch-blocks JSON needed for a fieldType.
     * Custom field types need to be namespaced to the extension so that extensions can't interfere with each other
     * @param  fieldName - The name of the field
     * @param output - The output of the field
     * @param outputShape - Shape of the field (from ScratchBlocksConstants)
     * @param categoryInfo - The category the field belongs to.
     * @returns The scratch-blocks definition for the custom field.
     */
    _buildCustomFieldTypeForScratchBlocks (
        fieldName: string,
        output: JsonBlockDefinition['output'],
        outputShape: JsonBlockDefinition['outputShape'],
        categoryInfo: CategoryInfo
    ) {
        return {
            json: {
                type: fieldName,
                message0: '%1',
                inputsInline: true,
                output: output,
                colour: categoryInfo.color1,
                colourSecondary: categoryInfo.color2,
                colourTertiary: categoryInfo.color3,
                outputShape: outputShape,
                args0: [
                    {
                        name: `field_${fieldName}`,
                        type: `field_${fieldName}`
                    }
                ]
            }
        };
    }

    /**
     * Convert ExtensionBlockMetadata into data ready for scratch-blocks.
     * @param blockInfo - the block info to convert
     * @param categoryInfo - the category for this block
     * @returns - the converted & original block information
     * @private
     */
    _convertForScratchBlocks (
        blockInfo: ExtensionBlockMetadata | ExtensionButtonMetadata | '---',
        categoryInfo: CategoryInfo
    ) {
        if (blockInfo === '---') {
            return this._convertSeparatorForScratchBlocks(blockInfo);
        }

        if (blockInfo.blockType === BlockType.BUTTON) {
            return this._convertButtonForScratchBlocks(blockInfo);
        }

        return this._convertBlockForScratchBlocks(blockInfo, categoryInfo);
    }

    /**
     * Convert ExtensionBlockMetadata into scratch-blocks JSON & XML, and generate a proxy function.
     * @param blockInfo - the block to convert
     * @param categoryInfo - the category for this block
     * @returns the converted & original block information
     * @private
     */
    _convertBlockForScratchBlocks (blockInfo: ExtensionBlockMetadata, categoryInfo: CategoryInfo) {
        const extendedOpcode = `${categoryInfo.id}_${blockInfo.opcode}`;

        const blockJSON: JsonBlockDefinition = {
            type: extendedOpcode,
            inputsInline: true,
            // category: categoryInfo.name,
            colour: categoryInfo.color1
            // colourSecondary: categoryInfo.color2,
            // colourTertiary: categoryInfo.color3
        };
        const context: PlaceholderContext = {
            // TODO: store this somewhere so that we can map args appropriately after translation.
            // This maps an arg name to its relative position in the original (usually English) block text.
            // When displaying a block in another language we'll need to run a `replace` action similar to the one
            // below, but each `[ARG]` will need to be replaced with the number in this map.
            argsMap: {},
            blockJSON,
            categoryInfo,
            blockInfo,
            inputList: []
        };

        // If an icon for the extension exists, prepend it to each block, with a vertical separator.
        // We can overspecify an icon for each block, but if no icon exists on a block, fall back to
        // the category block icon.
        const iconURI = blockInfo.blockIconURI || categoryInfo.blockIconURI;

        if (iconURI) {
            blockJSON.extensions = ['scratch_extension'];
            blockJSON.message0 = '%1 %2';
            const iconJSON = {
                type: 'field_image',
                src: iconURI,
                width: 40,
                height: 40
            };
            const separatorJSON = {
                type: 'field_vertical_separator'
            };
            blockJSON.args0 = [
                iconJSON,
                separatorJSON
            ];
        }

        switch (blockInfo.blockType) {
        case BlockType.COMMAND:
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE;
            blockJSON.previousStatement = null; // null = available connection; undefined = hat
            if (!blockInfo.isTerminal) {
                blockJSON.nextStatement = null; // null = available connection; undefined = terminal
            }
            break;
        case BlockType.REPORTER:
            blockJSON.output = 'String'; // TODO: distinguish number & string here?
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_ROUND;
            break;
        case BlockType.BOOLEAN:
            blockJSON.output = 'Boolean';
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_HEXAGONAL;
            break;
        case BlockType.HAT:
        case BlockType.EVENT:
            if (!Object.prototype.hasOwnProperty.call(blockInfo, 'isEdgeActivated')) {
                // if absent, this property defaults to true
                blockInfo.isEdgeActivated = true;
            }
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE;
            blockJSON.nextStatement = null; // null = available connection; undefined = terminal
            break;
        case BlockType.CONDITIONAL:
        case BlockType.LOOP:
            blockInfo.branchCount = blockInfo.branchCount || 1;
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE;
            blockJSON.previousStatement = null; // null = available connection; undefined = hat
            if (!blockInfo.isTerminal) {
                blockJSON.nextStatement = null; // null = available connection; undefined = terminal
            }
            break;
        }

        const blockText = Array.isArray(blockInfo.text) ? blockInfo.text : [blockInfo.text];
        let inTextNum = 0; // text for the next block "arm" is blockText[inTextNum]
        let inBranchNum = 0; // how many branches have we placed into the JSON so far?
        let outLineNum = 0; // used for scratch-blocks `message${outLineNum}` and `args${outLineNum}`
        const convertPlaceholders = this._convertPlaceholders.bind(this, context);
        // const extensionMessageContext = this.makeMessageContextForTarget();

        // alternate between a block "arm" with text on it and an open slot for a substack
        while (inTextNum < blockText.length || inBranchNum < (blockInfo.branchCount ?? 0)) {
            if (inTextNum < blockText.length) {
                context.outLineNum = outLineNum;
                const lineText: string = maybeFormatMessage(blockText[inTextNum]);
                const convertedText = lineText.replace(/\[(.+?)]/g, convertPlaceholders);
                if (blockJSON[`message${outLineNum}`]) {
                    blockJSON[`message${outLineNum}`] += convertedText;
                } else {
                    blockJSON[`message${outLineNum}`] = convertedText;
                }
                ++inTextNum;
                ++outLineNum;
            }
            if (inBranchNum < (blockInfo.branchCount ?? 0)) {
                blockJSON[`message${outLineNum}`] = '%1';
                blockJSON[`args${outLineNum}`] = [{
                    type: 'input_statement',
                    name: `SUBSTACK${inBranchNum > 0 ? inBranchNum + 1 : ''}`
                }];
                ++inBranchNum;
                ++outLineNum;
            }
        }

        if (blockInfo.blockType === BlockType.REPORTER) {
            if (!blockInfo.disableMonitor && context.inputList.length === 0) {
                blockJSON.checkboxInFlyout = true;
            }
        } else if (blockInfo.blockType === BlockType.LOOP) {
            // Add icon to the bottom right of a loop block
            blockJSON[`implicitAlign${outLineNum}`] = 'RIGHT';
            blockJSON[`message${outLineNum}`] = '%1';
            blockJSON[`args${outLineNum}`] = [{
                type: 'field_image',
                src: './static/blocks-media/repeat.svg', // TODO: use a constant or make this configurable?
                width: 24,
                height: 24,
                alt: '*', // TODO remove this since we don't use collapsed blocks in scratch
                flip_rtl: true
            }];
            ++outLineNum;
        }

        const mutation = blockInfo.isDynamic ? `<mutation blockInfo="${xmlEscape(JSON.stringify(blockInfo))}"/>` : '';
        const inputs = context.inputList.join('');
        const blockXML = `<block type="${extendedOpcode}">${mutation}${inputs}</block>`;

        return {
            info: context.blockInfo,
            json: context.blockJSON,
            xml: blockXML
        };
    }

    /**
     * Generate a separator between blocks categories or sub-categories.
     * @param blockInfo - the separator marker to convert
     * @returns - the converted & original block information
     * @private
     */
    _convertSeparatorForScratchBlocks (blockInfo: '---') {
        return {
            info: blockInfo,
            xml: '<sep gap="36"/>'
        };
    }

    /**
     * Convert a button for scratch-blocks. A button has no opcode but specifies a callback name in the `func` field.
     * @param buttonInfo - the button to convert
     * @returns the converted & original button information
     * @private
     */
    _convertButtonForScratchBlocks (buttonInfo: ExtensionButtonMetadata) {
        // for now we only support these pre-defined callbacks handled in scratch-blocks
        const supportedCallbackKeys = ['MAKE_A_LIST', 'MAKE_A_PROCEDURE', 'MAKE_A_VARIABLE'];
        if (supportedCallbackKeys.indexOf(buttonInfo.func!) < 0) {
            log.error(`Custom button callbacks not supported yet: ${buttonInfo.func}`);
        }

        const buttonText = maybeFormatMessage(buttonInfo.text);
        return {
            info: buttonInfo,
            xml: `<button text="${buttonText}" callbackKey="${buttonInfo.func}"></button>`
        };
    }

    /**
     * Helper for _convertPlaceholdes which handles inline images which are a specialized case of block "arguments".
     * @param argInfo Metadata about the inline image as specified by the extension.
     * @returns The scratch-blocks JSON for the inline image field.
     * @private
     */
    _constructInlineImageJson (argInfo: ExtensionImageMetadata) {
        if (!argInfo.dataURI) {
            log.warn('Missing data URI in extension block with argument type IMAGE');
        }
        return {
            type: 'field_image',
            src: argInfo.dataURI || '',
            // TODO these probably shouldn't be hardcoded...?
            width: 24,
            height: 24,
            // Whether or not the inline image should be flipped horizontally
            // in RTL languages. Defaults to false, indicating that the
            // image will not be flipped.
            flip_rtl: argInfo.flipRTL || false
        };
    }

    /**
     * Helper for _convertForScratchBlocks which handles linearization of argument placeholders. Called as a callback
     * from string#replace. In addition to the return value the JSON and XML items in the context will be filled.
     * @param context - Information shared with _convertForScratchBlocks about the block.
     * @param match - the overall string matched by the placeholder regex, including brackets: '[FOO]'.
     * @param placeholder - the name of the placeholder being matched: 'FOO'.
     * @returns The scratch-blocks placeholder for the argument, such as '%1'.
     * @private
     */
    _convertPlaceholders (context: PlaceholderContext, match: string, placeholder: string) {
        // Sanitize the placeholder to ensure valid XML
        placeholder = placeholder.replace(/[<"&]/, '_');

        // Determine whether the argument type is one of the known standard field types
        const argInfo: ExtensionArgumentMetadata =
            context.blockInfo.arguments?.[placeholder] || {} as ExtensionArgumentMetadata;
        let argTypeInfo = ArgumentTypeMap[argInfo.type] || {};

        // Field type not a standard field type, see if extension has registered custom field type
        if (!ArgumentTypeMap[argInfo.type] && context.categoryInfo.customFieldTypes[argInfo.type]) {
            argTypeInfo = context.categoryInfo.customFieldTypes[argInfo.type].argumentTypeInfo;
        }

        // Start to construct the scratch-blocks style JSON defining how the block should be
        // laid out
        let argJSON: JsonBlockArg;

        // Most field types are inputs (slots on the block that can have other blocks plugged into them)
        // check if this is not one of those cases. E.g. an inline image on a block.
        if ((argTypeInfo as (typeof ArgumentTypeMap)['image']).fieldType === 'field_image') {
            argJSON = this._constructInlineImageJson(argInfo as ExtensionImageMetadata);
        } else {
            // Construct input value

            // Layout a block argument (e.g. an input slot on the block)
            argJSON = {
                type: 'input_value',
                name: placeholder
            };

            const defaultValue =
                typeof argInfo.defaultValue === 'undefined' ? '' :
                    xmlEscape(maybeFormatMessage(argInfo.defaultValue).toString());

            if ((argTypeInfo as (typeof ArgumentTypeMap)['Boolean']).check) {
                // Right now the only type of 'check' we have specifies that the
                // input slot on the block accepts Boolean reporters, so it should be
                // shaped like a hexagon
                argJSON.check = (argTypeInfo as (typeof ArgumentTypeMap)['Boolean']).check;
            }

            let valueName;
            let shadowType;
            let fieldName;
            if (argInfo.menu) {
                const menuInfo = context.categoryInfo.menuInfo[argInfo.menu];
                if (menuInfo.acceptReporters) {
                    valueName = placeholder;
                    shadowType = this._makeExtensionMenuId(argInfo.menu, context.categoryInfo.id);
                    fieldName = argInfo.menu;
                } else {
                    argJSON.type = 'field_dropdown';
                    (argJSON as FieldDropdownArg).options = this._convertMenuItems(menuInfo.items);
                    valueName = null;
                    shadowType = null;
                    fieldName = placeholder;
                }
            } else {
                valueName = placeholder;
                shadowType = ((argTypeInfo as (typeof ArgumentTypeMap)[ArgumentType.STRING]).shadow?.type) || null;
                fieldName = ((argTypeInfo as (typeof ArgumentTypeMap)[ArgumentType.STRING]).shadow?.fieldName) || null;
            }

            // <value> is the ScratchBlocks name for a block input.
            if (valueName) {
                context.inputList.push(`<value name="${placeholder}">`);
            }

            // The <shadow> is a placeholder for a reporter and is visible when there's no reporter in this input.
            // Boolean inputs don't need to specify a shadow in the XML.
            if (shadowType) {
                context.inputList.push(`<shadow type="${shadowType}">`);
            }

            // A <field> displays a dynamic value: a user-editable text field, a drop-down menu, etc.
            // Leave out the field if defaultValue or fieldName are not specified
            if (defaultValue && fieldName) {
                context.inputList.push(`<field name="${fieldName}">${defaultValue}</field>`);
            }

            if (shadowType) {
                context.inputList.push('</shadow>');
            }

            if (valueName) {
                context.inputList.push('</value>');
            }
        }

        const argsName = `args${context.outLineNum!}` as const;
        const blockArgs = (context.blockJSON[argsName] = context.blockJSON[argsName] || []);
        if (argJSON) blockArgs.push(argJSON);
        const argNum = blockArgs.length;
        context.argsMap[placeholder] = argNum;

        return `%${argNum}`;
    }

    /**
     * Get scratch-blocks XML for each extension category.
     * @param target - the active editing target, if any.
     * @returns Scratch-blocks XML for each category of extension blocks.
     */
    getBlocksXML (target?: RenderedTarget) {
        return this._blockInfo.map(categoryInfo => {
            const {name, color1, color2} = categoryInfo;
            // Filter out blocks that aren't supposed to be shown on this target, as determined by the block info's
            // `hideFromPalette` and `filter` properties.
            const paletteBlocks = categoryInfo.blocks.filter(block => {
                let blockFilterIncludesTarget = true;
                // If an editing target is not passed, include all blocks
                // If the block info doesn't include a `filter` property, always include it
                if (target && (block.info as ExtensionBlockMetadata).filter) {
                    blockFilterIncludesTarget = (block.info as ExtensionBlockMetadata).filter!.includes(
                        target.isStage ? TargetType.STAGE : TargetType.SPRITE
                    );
                }
                // If the block info's `hideFromPalette` is true, then filter out this block
                return blockFilterIncludesTarget && !(block.info as ExtensionBlockMetadata).hideFromPalette;
            });

            const colorXML = `colour="${color1}" secondaryColour="${color2}"`;

            // Use a menu icon if there is one. Otherwise, use the block icon. If there's no icon,
            // the category menu will show its default colored circle.
            let menuIconURI = '';
            if (categoryInfo.menuIconURI) {
                menuIconURI = categoryInfo.menuIconURI;
            } else if (categoryInfo.blockIconURI) {
                menuIconURI = categoryInfo.blockIconURI;
            }
            const menuIconXML = menuIconURI ?
                `iconURI="${menuIconURI}"` : '';

            let statusButtonXML = '';
            if (categoryInfo.showStatusButton) {
                statusButtonXML = 'showStatusButton="true"';
            }

            return {
                id: categoryInfo.id,
                // eslint-disable-next-line max-len
                xml: `<category name="${name}" toolboxitemid="${categoryInfo.id}" ${statusButtonXML} ${colorXML} ${menuIconXML}>${
                    paletteBlocks.map(block => block.xml).join('')}</category>`
            };
        });
    }

    /**
     * Get scratch-blocks JSON for each dynamic block.
     * @returns The scratch-blocks JSON information for each dynamic block.
     */
    getBlocksJSON () {
        return this._blockInfo.reduce(
            (result: JsonBlockDefinition[], categoryInfo) => result.concat(
                categoryInfo.blocks.filter(info => 'json' in info).map(blockInfo => blockInfo.json)
            ), []);
    }

    /**
     * One-time initialization for Scratch Link support.
     */
    _initScratchLink () {
        // Check that we're actually in a real browser, not Node.js or JSDOM, and we have a valid-looking origin.
        if (globalThis.document &&
            globalThis.origin &&
            globalThis.origin !== 'null' &&
            globalThis.navigator &&
            globalThis.navigator.userAgent &&
            globalThis.navigator.userAgent.includes &&
            !globalThis.navigator.userAgent.includes('Node.js') &&
            !globalThis.navigator.userAgent.includes('jsdom')
        ) {
            // Create a script tag for the Scratch Link browser extension, unless one already exists
            const scriptElement = document.getElementById('scratch-link-extension-script');
            if (!scriptElement) {
                const script = document.createElement('script');
                script.id = 'scratch-link-extension-script';
                document.body.appendChild(script);

                // Tell the browser extension to inject its script.
                // If the extension isn't present or isn't active, this will do nothing.
                globalThis.postMessage('inject-scratch-link-script', globalThis.origin);
            }
        }
    }

    /**
     * Get a scratch link socket.
     * @param type Either BLE or BT
     * @returns The scratch link socket.
     */
    getScratchLinkSocket (type: 'BLE' | 'BT') {
        const factory = this._linkSocketFactory || this._defaultScratchLinkSocketFactory;
        return factory(type);
    }

    /**
     * Configure how ScratchLink sockets are created. Factory must consume a "type" parameter
     * either BT or BLE.
     * @param factory The new factory for creating ScratchLink sockets.
     */
    configureScratchLinkSocketFactory (factory: ScratchLinkSocketFactory) {
        this._linkSocketFactory = factory;
    }

    /**
     * The default scratch link socket creator, using websockets to the installed device manager.
     * @param type Either BLE or BT
     * @returns The new scratch link socket.
     */
    _defaultScratchLinkSocketFactory (type: 'BLE' | 'BT') {
        const Scratch = self.Scratch;
        const ScratchLinkSafariSocket = Scratch?.ScratchLinkSafariSocket;
        // detect this every time in case the user turns on the extension after loading the page
        const useSafariSocket = ScratchLinkSafariSocket && ScratchLinkSafariSocket.isSafariHelperCompatible();
        return useSafariSocket ? new ScratchLinkSafariSocket(type) : new ScratchLinkWebSocket(type);
    }

    /**
     * Register an extension that communications with a hardware peripheral by id,
     * to have access to it and its peripheral functions in the future.
     * @param extensionId - the id of the extension.
     * @param extension - the extension to register.
     */
    registerPeripheralExtension (extensionId: string, extension: PeripheralExtensionClass) {
        this.peripheralExtensions[extensionId] = extension;
    }

    /**
     * Tell the specified extension to scan for a peripheral.
     * @param extensionId - the id of the extension.
     */
    scanForPeripheral (extensionId: string) {
        this.peripheralExtensions[extensionId]?.scan();
    }

    /**
     * Connect to the extension's specified peripheral.
     * @param extensionId - the id of the extension.
     * @param peripheralId - the id of the peripheral.
     */
    connectPeripheral (extensionId: string, peripheralId: number) {
        this.peripheralExtensions[extensionId]?.connect(peripheralId);
    }

    /**
     * Disconnect from the extension's connected peripheral.
     * @param extensionId - the id of the extension.
     */
    disconnectPeripheral (extensionId: string) {
        this.peripheralExtensions[extensionId]?.disconnect();
    }

    /**
     * Returns whether the extension has a currently connected peripheral.
     * @param extensionId - the id of the extension.
     * @returns - whether the extension has a connected peripheral.
     */
    getPeripheralIsConnected (extensionId: string) {
        return this.peripheralExtensions[extensionId]?.isConnected() ?? false;
    }

    /**
     * Emit an event to indicate that the microphone is being used to stream audio.
     * @param listening - true if the microphone is currently listening.
     */
    emitMicListening (listening: boolean) {
        this.emit(Runtime.MIC_LISTENING, listening);
    }

    /**
     * Retrieve the function associated with the given opcode.
     * @param opcode The opcode to look up.
     * @returns The function which implements the opcode.
     */
    getOpcodeFunction (opcode: string): BlockFunction | undefined {
        return this._primitives[opcode];
    }

    /**
     * Return whether an opcode represents a hat block.
     * @param opcode The opcode to look up.
     * @returns True if the op is known to be a hat.
     */
    getIsHat (opcode: string) {
        return Object.prototype.hasOwnProperty.call(this._hats, opcode);
    }

    /**
     * Return whether an opcode represents an edge-activated hat block.
     * @param opcode The opcode to look up.
     * @returns True if the op is known to be a edge-activated hat.
     */
    getIsEdgeActivatedHat (opcode: string) {
        return Object.prototype.hasOwnProperty.call(this._hats, opcode) &&
            this._hats[opcode].edgeActivated;
    }

    /**
     * Retrieve the execution order of the given opcode.
     * @param opcode The opcode to look up.
     * @returns The execution order array of given opcode.
     */
    getExecutionOrders (opcode: string) {
        return Object.prototype.hasOwnProperty.call(this._orders, opcode) && this._orders[opcode];
    }


    /**
     * Attach the audio engine
     * @param audioEngine The audio engine to attach
     */
    attachAudioEngine (audioEngine: AudioEngine) {
        this.audioEngine = audioEngine;
    }

    /**
     * Attach the renderer
     * @param renderer The renderer to attach
     */
    attachRenderer (renderer: RenderWebGL) {
        this.renderer = renderer;
        this.renderer.setEdgelessStage(this.limitOptions.edgelessStage);
        this.renderer.setAccurateCoordinates(this.limitOptions.accurateCoordinates);
        this.renderer.setLayerGroupOrdering(StageLayering.LAYER_GROUPS);
    }

    /**
     * Set the bitmap adapter for the VM/runtime, which converts scratch 2
     * bitmaps to scratch 3 bitmaps. (Scratch 3 bitmaps are all bitmap resolution 2)
     * @param bitmapAdapter The adapter to attach.
     */
    attachV2BitmapAdapter (bitmapAdapter: BitmapAdapter) {
        this.v2BitmapAdapter = bitmapAdapter;
    }

    /**
     * Attach the storage module
     * @param storage The storage module to attach
     */
    attachStorage (storage: ScratchStorage) {
        this.storage = storage;
    }

    // -----------------------------------------------------------------------------
    // -----------------------------------------------------------------------------

    /**
     * Create a thread and push it to the list of threads.
     * @param id ID of block that starts the stack.
     * @param target Target to run thread on.
     * @param opts Optional arguments.
     * @param opts.stackClick true if the script was activated by clicking on the stack
     * @param opts.updateMonitor true if the script should update a monitor value
     * @returns The newly created thread.
     */
    _pushThread (id: string, target: RenderedTarget | null, opts?: {
        stackClick?: boolean,
        updateMonitor?: boolean
    }) {
        const thread = new Thread(id);
        thread.target = target;
        thread.stackClick = Boolean(opts?.stackClick);
        thread.updateMonitor = Boolean(opts?.updateMonitor);
        thread.blockContainer = thread.updateMonitor ?
            this.monitorBlocks :
            target!.blocks;
        thread.pushStack(id);
        this.threads.push(thread);
        return thread;
    }

    /**
     * Stop a thread: stop running it immediately, and remove it from the thread list later.
     * @param thread Thread object to remove from actives
     */
    _stopThread (thread: Thread) {
        // Mark the thread for later removal
        thread.isKilled = true;
        // Inform sequencer to stop executing that thread.
        this.sequencer.retireThread(thread);
    }

    /**
     * Restart a thread in place, maintaining its position in the list of threads.
     * This is used by `startHats` to and is necessary to ensure 2.0-like execution order.
     * Test project: https://scratch.mit.edu/projects/130183108/
     * @param thread Thread object to restart.
     * @returns The restarted thread.
     */
    _restartThread (thread: Thread) {
        const newThread = new Thread(thread.topBlock);
        newThread.target = thread.target;
        newThread.stackClick = thread.stackClick;
        newThread.updateMonitor = thread.updateMonitor;
        newThread.blockContainer = thread.blockContainer;
        newThread.pushStack(thread.topBlock);
        const i = this.threads.indexOf(thread);
        if (i > -1) {
            this.threads[i] = newThread;
            return newThread;
        }
        this.threads.push(thread);
        return thread;
    }

    /**
     * Return whether a thread is currently active/running.
     * @param thread Thread object to check.
     * @returns True if the thread is active/running.
     */
    isActiveThread (thread: Thread) {
        return (
            (
                thread.stack.length > 0 &&
                thread.status !== Thread.STATUS_DONE) &&
            this.threads.indexOf(thread) > -1);
    }

    /**
     * Return whether a thread is waiting for more information or done.
     * @param thread Thread object to check.
     * @returns True if the thread is waiting
     */
    isWaitingThread (thread: Thread) {
        return (
            thread.status === Thread.STATUS_PROMISE_WAIT ||
            thread.status === Thread.STATUS_YIELD_TICK ||
            !this.isActiveThread(thread)
        );
    }

    /**
     * Toggle a script.
     * @param topBlockId ID of block that starts the script.
     * @param opts Optional arguments to toggle the script.
     * @param opts.target Target to run the script on. If not supplied, uses the editing target.
     * @param opts.stackClick true if the user activated the stack by clicking, false if not. This
     *     determines whether we show a visual report when turning on the script.
     */
    toggleScript (topBlockId: string, opts: {
        target?: RenderedTarget,
        stackClick?: boolean
    }) {
        opts = Object.assign({
            target: this._editingTarget,
            stackClick: false
        }, opts);
        // Remove any existing thread.
        for (let i = 0; i < this.threads.length; i++) {
            // Toggling a script that's already running turns it off
            if (this.threads[i].topBlock === topBlockId && this.threads[i].status !== Thread.STATUS_DONE) {
                const blockContainer = opts.target!.blocks;
                const opcode = blockContainer.getOpcode(blockContainer.getBlock(topBlockId));

                if (this.getIsEdgeActivatedHat(opcode!) && this.threads[i].stackClick !== opts.stackClick) {
                    // Allow edge activated hat thread stack click to coexist with
                    // edge activated hat thread that runs every frame
                    continue;
                }
                this._stopThread(this.threads[i]);
                return;
            }
        }
        // Otherwise add it.
        this._pushThread(topBlockId, opts.target!, opts);
    }

    /**
     * Enqueue a script that when finished will update the monitor for the block.
     * @param topBlockId ID of block that starts the script.
     * @param optTarget target Target to run script on. If not supplied, uses editing target.
     */
    addMonitorScript (topBlockId: string, optTarget?: RenderedTarget | null) {
        if (!optTarget) optTarget = this._editingTarget;
        for (let i = 0; i < this.threads.length; i++) {
            // Don't re-add the script if it's already running
            if (this.threads[i].topBlock === topBlockId && this.threads[i].status !== Thread.STATUS_DONE &&
                    this.threads[i].updateMonitor) {
                return;
            }
        }
        // Otherwise add it.
        this._pushThread(topBlockId, optTarget, {updateMonitor: true});
    }

    /**
     * Run a function `f` for all scripts in a workspace.
     * `f` will be called with two parameters:
     *  - the top block ID of the script.
     *  - the target that owns the script.
     * @param f Function to call for each script.
     * @param optTarget Optionally, a target to restrict to.
     */
    allScriptsDo (f: ScriptCallback, optTarget?: RenderedTarget) {
        let targets = this.executableTargets;
        if (optTarget) {
            targets = [optTarget];
        }
        for (let t = targets.length - 1; t >= 0; t--) {
            const target = targets[t];
            const scripts = target.blocks.getScripts();
            for (let j = 0; j < scripts.length; j++) {
                const topBlockId = scripts[j];
                f(topBlockId, target);
            }
        }
    }

    allScriptsByOpcodeDo (opcode: string, f: ScriptByOpcodeCallback, optTarget?: RenderedTarget) {
        let targets = this.executableTargets;
        if (optTarget) {
            targets = [optTarget];
        }
        for (let t = targets.length - 1; t >= 0; t--) {
            const target = targets[t];
            const scripts = getCachedScriptsByOpcode(target.blocks, opcode);
            for (let j = 0; j < scripts.length; j++) {
                f(scripts[j], target);
            }
        }
    }

    /**
     * Start all relevant hats.
     * @param requestedHatOpcode Opcode of hats to start.
     * @param optMatchFields Optionally, fields to match on the hat.
     * @param optTarget Optionally, a target to restrict to.
     * @returns List of threads started by this function.
     */
    startHats (requestedHatOpcode: string,
        optMatchFields?: Record<string, string> | null, optTarget?: RenderedTarget) {
        if (!Object.prototype.hasOwnProperty.call(this._hats, requestedHatOpcode)) {
            // No known hat with this opcode.
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const instance = this;
        const newThreads: Thread[] = [];
        // Look up metadata for the relevant hat.
        const hatMeta = instance._hats[requestedHatOpcode];

        for (const opts in optMatchFields) {
            if (!Object.prototype.hasOwnProperty.call(optMatchFields, opts)) continue;
            optMatchFields[opts] = optMatchFields[opts].toUpperCase();
        }

        // Consider all scripts, looking for hats with opcode `requestedHatOpcode`.
        this.allScriptsByOpcodeDo(requestedHatOpcode, (script, target) => {
            const {
                blockId: topBlockId,
                fieldsOfInputs: hatFields
            } = script;

            // Match any requested fields.
            // For example: ensures that broadcasts match.
            // This needs to happen before the block is evaluated
            // (i.e., before the predicate can be run) because "broadcast and wait"
            // needs to have a precise collection of started threads.
            for (const matchField in optMatchFields) {
                if (hatFields[matchField].value !== optMatchFields[matchField]) {
                    // Field mismatch.
                    return;
                }
            }

            if (hatMeta.restartExistingThreads) {
                // If `restartExistingThreads` is true, we should stop
                // any existing threads starting with the top block.
                for (let i = 0; i < this.threads.length; i++) {
                    if (this.threads[i].target === target &&
                        this.threads[i].topBlock === topBlockId &&
                        // stack click threads and hat threads can coexist
                        !this.threads[i].stackClick) {
                        newThreads.push(this._restartThread(this.threads[i]));
                        return;
                    }
                }
            } else {
                // If `restartExistingThreads` is false, we should
                // give up if any threads with the top block are running.
                for (let j = 0; j < this.threads.length; j++) {
                    if (this.threads[j].target === target &&
                        this.threads[j].topBlock === topBlockId &&
                        // stack click threads and hat threads can coexist
                        !this.threads[j].stackClick &&
                        this.threads[j].status !== Thread.STATUS_DONE) {
                        // Some thread is already running.
                        return;
                    }
                }
            }
            // Start the thread with this top block.
            newThreads.push(this._pushThread(topBlockId, target));
        }, optTarget);
        // For compatibility with Scratch 2, edge triggered hats need to be processed before
        // threads are stepped. See ScratchRuntime.as for original implementation
        newThreads.forEach(thread => {
            execute(this.sequencer, thread);
            thread.goToNextBlock();
        });
        return newThreads;
    }


    /**
     * Dispose all targets. Return to clean state.
     */
    dispose () {
        this.stopAll();
        // Deleting each target's variable's monitors.
        this.targets.forEach(target => {
            if (target.isOriginal) target.deleteMonitors();
        });

        this.targets.map(this.disposeTarget, this);
        this._monitorState = OrderedMap({});
        this.emit(Runtime.RUNTIME_DISPOSED);
        this.ioDevices.clock.resetProjectTimer();

        if (this.renderer && '_allSkins' in this.renderer) {
            this.renderer._allSkins.forEach(skin => {
                this.renderer!.destroySkin(skin._id);
            });
        }
        // @todo clear out extensions? turboMode? etc.

        // *********** Cloud *******************

        // If the runtime currently has cloud data,
        // emit a has cloud data update event resetting
        // it to false
        if (this.hasCloudData()) {
            this.emit(Runtime.HAS_CLOUD_DATA_UPDATE, false);
        }

        this.ioDevices.cloud.clear();

        // Reset runtime cloud data info
        const newCloudDataManager = cloudDataManager();
        this.hasCloudData = newCloudDataManager.hasCloudVariables;
        this.canAddCloudVariable = newCloudDataManager.canAddCloudVariable;
        this.addCloudVariable = this._initializeAddCloudVariable(newCloudDataManager);
        this.removeCloudVariable = this._initializeRemoveCloudVariable(newCloudDataManager);
    }

    /**
     * Add a target to the runtime. This tracks the sprite pane
     * ordering of the target. The target still needs to be put
     * into the correct execution order after calling this function.
     * @param target target to add
     */
    addTarget (target: RenderedTarget) {
        this.targets.push(target);
        this.executableTargets.push(target);
    }

    /**
     * Move a target in the execution order by a relative amount.
     *
     * A positve number will make the target execute earlier. A negative number
     * will make the target execute later in the order.
     *
     * @param executableTarget target to move
     * @param delta number of positions to move target by
     * @returns new position in execution order
     */
    moveExecutable (executableTarget: RenderedTarget, delta: number) {
        const oldIndex = this.executableTargets.indexOf(executableTarget);
        this.executableTargets.splice(oldIndex, 1);
        let newIndex = oldIndex + delta;
        if (newIndex > this.executableTargets.length) {
            newIndex = this.executableTargets.length;
        }
        if (newIndex <= 0) {
            if (this.executableTargets.length > 0 && this.executableTargets[0].isStage) {
                newIndex = 1;
            } else {
                newIndex = 0;
            }
        }
        this.executableTargets.splice(newIndex, 0, executableTarget);
        return newIndex;
    }

    /**
     * Set a target to execute at a specific position in the execution order.
     *
     * Infinity will set the target to execute first. 0 will set the target to
     * execute last (before the stage).
     *
     * @param executableTarget target to move
     * @param newIndex position in execution order to place the target
     * @returns new position in the execution order
     */
    setExecutablePosition (executableTarget: RenderedTarget, newIndex: number) {
        const oldIndex = this.executableTargets.indexOf(executableTarget);
        return this.moveExecutable(executableTarget, newIndex - oldIndex);
    }

    /**
     * Remove a target from the execution set.
     * @param executableTarget target to remove
     */
    removeExecutable (executableTarget: RenderedTarget) {
        const oldIndex = this.executableTargets.indexOf(executableTarget);
        if (oldIndex > -1) {
            this.executableTargets.splice(oldIndex, 1);
        }
    }

    /**
     * Dispose of a target.
     * @param disposingTarget Target to dispose of.
     */
    disposeTarget (disposingTarget: RenderedTarget) {
        this.targets = this.targets.filter(target => {
            if (disposingTarget !== target) return true;
            // Allow target to do dispose actions.
            target.dispose();
            // Remove from list of targets.
            return false;
        });
    }

    /**
     * Stop any threads acting on the target.
     * @param target Target to stop threads for.
     * @param optThreadException Optional thread to skip.
     */
    stopForTarget (target: RenderedTarget, optThreadException?: Thread) {
        // Emit stop event to allow blocks to clean up any state.
        this.emit(Runtime.STOP_FOR_TARGET, target, optThreadException);

        // Stop any threads on the target.
        for (let i = 0; i < this.threads.length; i++) {
            if (this.threads[i] === optThreadException) {
                continue;
            }
            if (this.threads[i].target === target) {
                this._stopThread(this.threads[i]);
            }
        }
    }

    /**
     * Start all threads that start with the green flag.
     */
    greenFlag () {
        this.stopAll();
        this.emit(Runtime.PROJECT_START);
        this.ioDevices.clock.resetProjectTimer();
        this.targets.forEach(target => target.clearEdgeActivatedValues());
        // Inform all targets of the green flag.
        for (let i = 0; i < this.targets.length; i++) {
            this.targets[i].onGreenFlag();
        }
        this.startHats('event_whenflagclicked');
    }

    /**
     * Stop "everything."
     */
    stopAll () {
        // Emit stop event to allow blocks to clean up any state.
        this.emit(Runtime.PROJECT_STOP_ALL);

        // Dispose all clones.
        const newTargets = [];
        for (let i = 0; i < this.targets.length; i++) {
            this.targets[i].onStopAll();
            if (Object.hasOwnProperty.call(this.targets[i], 'isOriginal') &&
                !this.targets[i].isOriginal) {
                this.targets[i].dispose();
            } else {
                newTargets.push(this.targets[i]);
            }
        }
        this.targets = newTargets;
        // Dispose of the active thread.
        if (this.sequencer.activeThread !== null) {
            this._stopThread(this.sequencer.activeThread);
        }
        // Remove all remaining threads from executing in the next tick.
        this.threads = [];
    }

    /**
     * Repeatedly run `sequencer.stepThreads` and filter out
     * inactive threads after each iteration.
     */
    _step () {
        if (this.profiler !== null) {
            if (stepProfilerId === -1) {
                stepProfilerId = this.profiler.idByName('Runtime._step');
            }
            this.profiler.start(stepProfilerId);
        }

        // Clean up threads that were told to stop during or since the last step
        this.threads = this.threads.filter(thread => !thread.isKilled);

        // Find all edge-activated hats, and add them to threads to be evaluated.
        for (const hatType in this._hats) {
            if (!Object.prototype.hasOwnProperty.call(this._hats, hatType)) continue;
            const hat = this._hats[hatType];
            if (hat.edgeActivated) {
                this.startHats(hatType);
            }
        }
        this.redrawRequested = false;
        this._pushMonitors();
        if (this.profiler !== null) {
            if (stepThreadsProfilerId === -1) {
                stepThreadsProfilerId = this.profiler.idByName('Sequencer.stepThreads');
            }
            this.profiler.start(stepThreadsProfilerId);
        }
        const doneThreads = this.sequencer.stepThreads();
        if (this.profiler !== null) {
            this.profiler.stop();
        }
        this._updateGlows(doneThreads);
        // Add done threads so that even if a thread finishes within 1 frame, the green
        // flag will still indicate that a script ran.
        this._emitProjectRunStatus(
            this.threads.length + doneThreads.length -
                this._getMonitorThreadCount([...this.threads, ...doneThreads]));
        // Store threads that completed this iteration for testing and other
        // internal purposes.
        this._lastStepDoneThreads = doneThreads;
        if (this.renderer) {
            // @todo: Only render when this.redrawRequested or clones rendered.
            if (this.profiler !== null) {
                if (rendererDrawProfilerId === -1) {
                    rendererDrawProfilerId = this.profiler.idByName('RenderWebGL.draw');
                }
                this.profiler.start(rendererDrawProfilerId);
            }
            this.renderer.draw();
            if (this.profiler !== null) {
                this.profiler.stop();
            }
        }

        if (this._refreshTargets) {
            this.emit(Runtime.TARGETS_UPDATE, false /* Don't emit project changed */);
            this._refreshTargets = false;
        }

        if (!this._prevMonitorState.equals(this._monitorState)) {
            this.emit(Runtime.MONITORS_UPDATE, this._monitorState);
            this._prevMonitorState = this._monitorState;
        }

        if (this.profiler !== null) {
            this.profiler.stop();
            this.profiler.reportFrames();
        }
    }

    /**
     * Get the number of threads in the given array that are monitor threads (threads
     * that update monitor values, and don't count as running a script).
     * @param threads The set of threads to look through.
     * @returns The number of monitor threads in threads.
     */
    _getMonitorThreadCount (threads: Thread[]) {
        let count = 0;
        threads.forEach(thread => {
            if (thread.updateMonitor) count++;
        });
        return count;
    }

    /**
     * Queue monitor blocks to sequencer to be run.
     */
    _pushMonitors () {
        this.monitorBlocks.runAllMonitored(this);
    }

    /**
     * Set the current editing target known by the runtime.
     * @param editingTarget New editing target.
     */
    setEditingTarget (editingTarget: RenderedTarget) {
        const oldEditingTarget = this._editingTarget;
        this._editingTarget = editingTarget;
        // Script glows must be cleared.
        this._scriptGlowsPreviousFrame = [];
        this._updateGlows();

        if (oldEditingTarget !== this._editingTarget) {
            this.requestToolboxExtensionsUpdate();
        }
    }

    /**
     * Set whether we are in 30 TPS compatibility mode.
     * @param compatibilityModeOn True iff in compatibility mode.
     * @deprecated Use setFramerate(30) (compatibility mode) or setFramerate(60) instead.
     * @see {@link setFramerate}
     */
    setCompatibilityMode (compatibilityModeOn: boolean) {
        this.compatibilityMode = compatibilityModeOn;
        this.setFramerate(compatibilityModeOn ? 30 : 60);
    }

    /**
     * Set the framerate (also called TPS in VM).
     * @param framerate Frames per second.
     */
    setFramerate (framerate: number) {
        this.framerate = framerate;
        if (this._steppingInterval) {
            clearInterval(this._steppingInterval);
            this._steppingInterval = null;
            this.start();
        }
    }

    /**
     * Emit glows/glow clears for scripts after a single tick.
     * Looks at `this.threads` and notices which have turned on/off new glows.
     * @param optExtraThreads Optional list of inactive threads.
     */
    _updateGlows (optExtraThreads?: Thread[]) {
        const searchThreads = [];
        searchThreads.push(...this.threads);
        if (optExtraThreads) {
            searchThreads.push(...optExtraThreads);
        }
        // Set of scripts that request a glow this frame.
        const requestedGlowsThisFrame = [];
        // Final set of scripts glowing during this frame.
        const finalScriptGlows = [];
        // Find all scripts that should be glowing.
        for (let i = 0; i < searchThreads.length; i++) {
            const thread = searchThreads[i];
            const target = thread.target;
            if (target === this._editingTarget) {
                const blockForThread = thread.blockGlowInFrame;
                if (thread.requestScriptGlowInFrame || thread.stackClick) {
                    let script = target?.blocks.getTopLevelScript(blockForThread);
                    if (!script) {
                        // Attempt to find in flyout blocks.
                        script = this.flyoutBlocks.getTopLevelScript(
                            blockForThread
                        );
                    }
                    if (script) {
                        requestedGlowsThisFrame.push(script);
                    }
                }
            }
        }
        // Compare to previous frame.
        for (let j = 0; j < this._scriptGlowsPreviousFrame.length; j++) {
            const previousFrameGlow = this._scriptGlowsPreviousFrame[j];
            if (requestedGlowsThisFrame.indexOf(previousFrameGlow) < 0) {
                // Glow turned off.
                this.glowScript(previousFrameGlow, false);
            } else {
                // Still glowing.
                finalScriptGlows.push(previousFrameGlow);
            }
        }
        for (let k = 0; k < requestedGlowsThisFrame.length; k++) {
            const currentFrameGlow = requestedGlowsThisFrame[k];
            if (this._scriptGlowsPreviousFrame.indexOf(currentFrameGlow) < 0) {
                // Glow turned on.
                this.glowScript(currentFrameGlow, true);
                finalScriptGlows.push(currentFrameGlow);
            }
        }
        this._scriptGlowsPreviousFrame = finalScriptGlows;
    }

    /**
     * Emit run start/stop after each tick. Emits when `this.threads.length` goes
     * between non-zero and zero
     *
     * @param nonMonitorThreadCount The new nonMonitorThreadCount
     */
    _emitProjectRunStatus (nonMonitorThreadCount: number) {
        if (this._nonMonitorThreadCount === 0 && nonMonitorThreadCount > 0) {
            this.emit(Runtime.PROJECT_RUN_START);
        }
        if (this._nonMonitorThreadCount > 0 && nonMonitorThreadCount === 0) {
            this.emit(Runtime.PROJECT_RUN_STOP);
        }
        this._nonMonitorThreadCount = nonMonitorThreadCount;
    }

    /**
     * "Quiet" a script's glow: stop the VM from generating glow/unglow events
     * about that script. Use when a script has just been deleted, but we may
     * still be tracking glow data about it.
     * @param scriptBlockId Id of top-level block in script to quiet.
     */
    quietGlow (scriptBlockId: string) {
        const index = this._scriptGlowsPreviousFrame.indexOf(scriptBlockId);
        if (index > -1) {
            this._scriptGlowsPreviousFrame.splice(index, 1);
        }
    }

    /**
     * Emit feedback for block glowing (used in the sequencer).
     * @param blockId ID for the block to update glow
     * @param isGlowing True to turn on glow; false to turn off.
     */
    glowBlock (blockId: string, isGlowing: boolean) {
        if (isGlowing) {
            this.emit(Runtime.BLOCK_GLOW_ON, {id: blockId});
        } else {
            this.emit(Runtime.BLOCK_GLOW_OFF, {id: blockId});
        }
    }

    /**
     * Emit feedback for script glowing.
     * @param topBlockId ID for the top block to update glow
     * @param isGlowing True to turn on glow; false to turn off.
     */
    glowScript (topBlockId: string, isGlowing: boolean) {
        if (isGlowing) {
            this.emit(Runtime.SCRIPT_GLOW_ON, {id: topBlockId});
        } else {
            this.emit(Runtime.SCRIPT_GLOW_OFF, {id: topBlockId});
        }
    }

    /**
     * Emit whether blocks are being dragged over gui
     * @param areBlocksOverGui True if blocks are dragged out of blocks workspace, false otherwise
     */
    emitBlockDragUpdate (areBlocksOverGui: boolean) {
        this.emit(Runtime.BLOCK_DRAG_UPDATE, areBlocksOverGui);
    }

    /**
     * Emit event to indicate that the block drag has ended with the blocks outside the blocks workspace
     * @param blocks The set of blocks dragged to the GUI
     * @param topBlockId The original id of the top block being dragged
     */
    emitBlockEndDrag (blocks: VMBlock[], topBlockId: string) {
        this.emit(Runtime.BLOCK_DRAG_END, blocks, topBlockId);
    }

    /**
     * Emit value for reporter to show in the blocks.
     * @param blockId ID for the block.
     * @param value Value to show associated with the block.
     */
    visualReport (blockId: string, value: unknown) {
        this.emit(Runtime.VISUAL_REPORT, {id: blockId, value: String(value)});
    }

    /**
     * Add a monitor to the state. If the monitor already exists in the state,
     * updates those properties that are defined in the given monitor record.
     * @param monitor Monitor to add.
     */
    requestAddMonitor (monitor: RecordOf<MonitorRecordProps> | ImmutableMap<string, unknown>) {
        // @ts-expect-error scfoundation mixed use of Immutable and non-Immutable, JS native Map and Immutable Map
        const id: string = monitor.get('id')!;
        if (!this.requestUpdateMonitor(monitor)) { // update monitor if it exists in the state
            // if the monitor did not exist in the state, add it
            this._monitorState = this._monitorState.set(id, monitor as RecordOf<MonitorRecordProps>);
        }
    }

    /**
     * Update a monitor in the state and report success/failure of update.
     * @param monitor Monitor values to update.
     *     values on the old monitor with the same ID. If a value isn't defined on the new monitor,
     *     the old monitor will keep its old value.
     * @returns {boolean} true if monitor exists in the state and was updated, false if it did not exist.
     */
    requestUpdateMonitor (
        monitor: RecordOf<MonitorRecordProps> | ImmutableMap<string, unknown>
    ) {
        // @ts-expect-error scfoundation mixed use of Immutable and non-Immutable, JS native Map and Immutable Map
        const id: string = monitor.get('id');
        if (this._monitorState.has(id)) {
            this._monitorState =
                // Use mergeWith here to prevent undefined values from overwriting existing ones
                this._monitorState.set(id, this._monitorState.get(id)!.mergeWith((prev, next) => {
                    if (typeof next === 'undefined' || next === null) {
                        return prev;
                    }
                    return next;
                }, monitor as RecordOf<MonitorRecordProps>));
            return true;
        }
        return false;
    }

    /**
     * Removes a monitor from the state. Does nothing if the monitor already does
     * not exist in the state.
     * @param monitorId ID of the monitor to remove.
     */
    requestRemoveMonitor (monitorId: string) {
        this._monitorState = this._monitorState.delete(monitorId);
    }

    /**
     * Hides a monitor and returns success/failure of action.
     * @param monitorId ID of the monitor to hide.
     * @returns true if monitor exists and was updated, false otherwise
     */
    requestHideMonitor (monitorId: string) {
        return this.requestUpdateMonitor(Map({
            id: monitorId,
            visible: false
        }));
    }

    /**
     * Shows a monitor and returns success/failure of action.
     * not exist in the state.
     * @param monitorId ID of the monitor to show.
     * @returns true if monitor exists and was updated, false otherwise
     */
    requestShowMonitor (monitorId: string) {
        return this.requestUpdateMonitor(Map({
            id: monitorId,
            visible: true
        }));
    }

    /**
     * Removes all monitors with the given target ID from the state. Does nothing if
     * the monitor already does not exist in the state.
     * @param targetId Remove all monitors with given target ID.
     */
    requestRemoveMonitorByTargetId (targetId: string) {
        this._monitorState = this._monitorState.filterNot(value => value.targetId === targetId);
    }

    /**
     * Get a target by its id.
     * @param targetId Id of target to find.
     * @returns The target, if found.
     */
    getTargetById (targetId: string) {
        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            if (target.id === targetId) {
                return target;
            }
        }
    }

    /**
     * Get the first original (non-clone-block-created) sprite given a name.
     * @param spriteName Name of sprite to look for.
     * @returns Target representing a sprite of the given name.
     */
    getSpriteTargetByName (spriteName: string) {
        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            if (target.isStage) {
                continue;
            }
            if (target.sprite && target.sprite.name === spriteName) {
                return target;
            }
        }
    }

    /**
     * Get a target by its drawable id.
     * @param drawableID drawable id of target to find
     * @returns The target, if found.
     */
    getTargetByDrawableId (drawableID: number) {
        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            if (target.drawableID === drawableID) return target;
        }
    }

    /**
     * Update the clone counter to track how many clones are created.
     * @param changeAmount How many clones have been created/destroyed.
     */
    changeCloneCounter (changeAmount: number) {
        this._cloneCounter += changeAmount;
    }

    /**
     * Return whether there are clones available.
     * @returns True until the number of clones hits Runtime.MAX_CLONES.
     */
    clonesAvailable () {
        return this._cloneCounter < this.MAX_CLONES;
    }

    /**
     * Report that the project has loaded in the Virtual Machine.
     */
    emitProjectLoaded () {
        this.emit(Runtime.PROJECT_LOADED);
    }

    /**
     * Report that the project has changed in a way that would affect serialization
     */
    emitProjectChanged () {
        this.emit(Runtime.PROJECT_CHANGED);
    }

    /**
     * Report that a new target has been created, possibly by cloning an existing target.
     * @param newTarget - the newly created target.
     * @param sourceTarget - the target used as a source for the new clone, if any.
     * @fires Runtime#targetWasCreated
     */
    fireTargetWasCreated (newTarget: RenderedTarget, sourceTarget?: RenderedTarget) {
        this.emit('targetWasCreated', newTarget, sourceTarget);
    }

    /**
     * Report that a clone target is being removed.
     * @param target - the target being removed
     * @fires Runtime#targetWasRemoved
     */
    fireTargetWasRemoved (target: RenderedTarget) {
        this.emit('targetWasRemoved', target);
    }

    /**
     * Get a target representing the Scratch stage, if one exists.
     * @returns The target, if found.
     */
    getTargetForStage () {
        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            if (target.isStage) {
                return target;
            }
        }
    }

    /**
     * Get the editing target.
     * @returns The editing target.
     */
    getEditingTarget () {
        return this._editingTarget;
    }

    getAllVarNamesOfType (varType: VariableType) {
        let varNames: string[] = [];
        for (const target of this.targets) {
            const targetVarNames = target.getAllVariableNamesInScopeByType(varType, true);
            varNames = varNames.concat(targetVarNames);
        }
        return varNames;
    }

    /**
     * Get the label or label function for an opcode
     * @param extendedOpcode - the opcode you want a label for
     * @returns The label metadata for this opcode.
     */
    getLabelForOpcode (extendedOpcode: string) {
        const [category, opcode] = StringUtil.splitFirst(extendedOpcode, '_');
        if (!(category && opcode)) return;

        const categoryInfo = this._blockInfo.find(ci => ci.id === category);
        if (!categoryInfo) return;

        const block = categoryInfo.blocks.find(b => (b.info as ExtensionBlockMetadata).opcode === opcode);
        if (!block) return;

        // TODO: we may want to format the label in a locale-specific way.
        return {
            category: 'extension', // This assumes that all extensions have the same monitor color.
            label: `${categoryInfo.name}: ${(block.info as ExtensionBlockMetadata).text}`
        };
    }

    /**
     * Create a new global variable avoiding conflicts with other variable names.
     * @param variableName The desired variable name for the new global variable.
     * This can be turned into a fresh name as necessary.
     * @param optVarId An optional ID to use for the variable. A new one will be generated
     * if a falsey value for this parameter is provided.
     * @param optVarType The type of the variable to create. Defaults to Variable.SCALAR_TYPE.
     * @returns The new variable that was created.
     */
    createNewGlobalVariable (variableName: string, optVarId?: string, optVarType?: VariableType) {
        const varType = (typeof optVarType === 'string') ? optVarType : Variable.SCALAR_TYPE;
        const allVariableNames = this.getAllVarNamesOfType(varType);
        const newName = StringUtil.unusedName(variableName, allVariableNames);
        const variable = new Variable(optVarId || uid(), newName, varType);
        const stage = this.getTargetForStage();
        if (!stage) throw new Error('No stage found when creating a global variable');
        stage.variables[variable.id] = variable;
        return variable;
    }

    /**
     * Get names and ids of parameters for the given procedure.
     * @param procedureCode Procedure code for procedure to query.
     * @returns List of param names for a procedure.
     */
    getProcedureParamNamesAndIds (procedureCode: string) {
        return this.getProcedureParamNamesIdsAndDefaults(procedureCode)
            ?.slice(0, 2) ?? null as [string[], string[]] | null;
    }

    /**
     * Get names, ids, and defaults of parameters for the given procedure.
     * @param name Name of procedure to query.
     * @returns {?Array.<string>} List of param names for a procedure.
     */
    getProcedureParamNamesIdsAndDefaults (name: string) {
        for (const target of this.targets) {
            const result = target.blocks.getProcedureParamNamesIdsAndDefaults(name);
            if (result) {
                return result;
            }
        }
        return null;
    }

    /**
     * Get the global procedure definition for a given name.
     * @param name Name of procedure to query.
     * @returns ID of procedure definition.
     */
    getProcedureDefinition (name: string): [RenderedTarget, string] | [null, null] {
        for (const target of this.targets) {
            const definition = target.blocks.getProcedureDefinition(name, true);
            if (definition) {
                return [target, definition];
            }
        }
        return [null, null];
    }

    /**
     * Tell the runtime to request a redraw.
     * Use after a clone/sprite has completed some visible operation on the stage.
     */
    requestRedraw () {
        this.redrawRequested = true;
    }

    /**
     * Emit a targets update at the end of the step if the provided target is
     * the original sprite
     * @param target Target requesting the targets update
     */
    requestTargetsUpdate (target: RenderedTarget) {
        if (!target.isOriginal) return;
        this._refreshTargets = true;
    }

    /**
     * Emit an event that indicates that the blocks on the workspace need updating.
     */
    requestBlocksUpdate () {
        this.emit(Runtime.BLOCKS_NEED_UPDATE);
    }

    /**
     * Emit an event that indicates that the toolbox extension blocks need updating.
     */
    requestToolboxExtensionsUpdate () {
        this.emit(Runtime.TOOLBOX_EXTENSIONS_NEED_UPDATE);
    }

    /**
     * Set up timers to repeatedly step in a browser.
     */
    start () {
        // Do not start if we are already running
        if (this._steppingInterval) return;

        this.currentStepTime = 1000 / this.framerate;
        this._steppingInterval = setInterval(() => {
            this._step();
        }, this.currentStepTime);
        this.emit(Runtime.RUNTIME_STARTED);
    }

    /**
     * Quit the Runtime, clearing any handles which might keep the process alive.
     * Do not use the runtime after calling this method. This method is meant for test shutdown.
     */
    quit () {
        clearInterval(this._steppingInterval!);
        this._steppingInterval = null;
    }

    /**
     * Turn on profiling.
     * @param onFrame A callback for profiling frames.
     */
    enableProfiling (onFrame: FrameCallback) {
        if (Profiler.available()) {
            this.profiler = new Profiler(onFrame);
        }
    }

    /**
     * Turn off profiling.
     */
    disableProfiling () {
        this.profiler = null;
    }

    /**
     * Update a millisecond timestamp value that is saved on the Runtime.
     * This value is helpful in certain instances for compatibility with Scratch 2,
     * which sometimes uses a `currentMSecs` timestamp value in Interpreter.as
     */
    updateCurrentMSecs () {
        this.currentMSecs = Date.now();
    }
}

export type IODevices = Runtime['ioDevices'];

export default Runtime;
