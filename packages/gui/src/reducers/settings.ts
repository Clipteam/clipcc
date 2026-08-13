import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const UPDATE = 'scratch-gui/settings/UPDATE';

export type SettingsState = {
    hideNonVanillaBlocks: boolean;
    autoSave: boolean;
    infiniteCloning: boolean;
    edgelessStage: boolean;
    unlimitedListLength: boolean;
    unlimitedPenSize: boolean;
    unlimitedSoundStuffs: boolean;
    accurateCoordinates: boolean;
    autoSaveInterval: number;
    compression: number;
    framerate: number;
    theme: string;
    stageWidth: number;
    stageHeight: number;
    translateServiceUrl: string;
    ttsServiceUrl: string;
    useScratchOfficialApi: boolean;
};

const defaultState: SettingsState = {
    hideNonVanillaBlocks: false,
    autoSave: false,
    infiniteCloning: false,
    edgelessStage: false,
    unlimitedListLength: false,
    unlimitedPenSize: false,
    unlimitedSoundStuffs: false,
    accurateCoordinates: false,
    autoSaveInterval: 120,
    compression: 6,
    framerate: 30,
    theme: 'system',
    stageWidth: 480,
    stageHeight: 360,
    translateServiceUrl: 'https://trampoline.simonshiki.top/translate/translate',
    ttsServiceUrl: 'https://trampoline.simonshiki.top/tts/synth',
    useScratchOfficialApi: false
};

const parseSavedSettings = (): Partial<SettingsState> => {
    const raw = localStorage.getItem('settings');
    if (!raw) return {};

    let parsed: Record<string, unknown>;
    try {
        parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return {};
    } catch {
        return {};
    }

    return {
        hideNonVanillaBlocks:
            typeof parsed.hideNonVanillaBlocks === 'boolean' ? parsed.hideNonVanillaBlocks : undefined,
        autoSave: typeof parsed.autoSave === 'boolean' ? parsed.autoSave : undefined,
        infiniteCloning: typeof parsed.infiniteCloning === 'boolean' ? parsed.infiniteCloning : undefined,
        edgelessStage: typeof parsed.edgelessStage === 'boolean' ? parsed.edgelessStage : undefined,
        unlimitedListLength: typeof parsed.unlimitedListLength === 'boolean' ? parsed.unlimitedListLength : undefined,
        unlimitedPenSize: typeof parsed.unlimitedPenSize === 'boolean' ? parsed.unlimitedPenSize : undefined,
        unlimitedSoundStuffs:
            typeof parsed.unlimitedSoundStuffs === 'boolean' ? parsed.unlimitedSoundStuffs : undefined,
        accurateCoordinates: typeof parsed.accurateCoordinates === 'boolean' ? parsed.accurateCoordinates : undefined,
        autoSaveInterval: typeof parsed.autoSaveInterval === 'number' ? parsed.autoSaveInterval : undefined,
        compression: typeof parsed.compression === 'number' ? parsed.compression : undefined,
        framerate: typeof parsed.framerate === 'number' ? parsed.framerate : undefined,
        theme: typeof parsed.theme === 'string' ? parsed.theme : undefined,
        stageWidth: typeof parsed.stageWidth === 'number' ? parsed.stageWidth : undefined,
        stageHeight: typeof parsed.stageHeight === 'number' ? parsed.stageHeight : undefined,
        translateServiceUrl:
            typeof parsed.translateServiceUrl === 'string' ? parsed.translateServiceUrl : undefined,
        ttsServiceUrl:
            typeof parsed.ttsServiceUrl === 'string' ? parsed.ttsServiceUrl : undefined,
        useScratchOfficialApi:
            typeof parsed.useScratchOfficialApi === 'boolean' ? parsed.useScratchOfficialApi : undefined
    };
};

const initialState: SettingsState = {
    ...defaultState,
    ...parseSavedSettings()
};

localStorage.setItem('settings', JSON.stringify(initialState));

interface UpdateSettingsAction extends BaseAction<typeof UPDATE> {
    settings: Partial<SettingsState>;
};

const reducer = function (state = initialState, action: AnyAction): SettingsState {
    switch (action.type) {
    case UPDATE: {
        const newSettings = Object.assign({}, state, action.settings);
        localStorage.setItem('settings', JSON.stringify(newSettings));
        return newSettings;
    }
    default:
        return state;
    }
};

const updateSettings = function (settings: Partial<SettingsState>): UpdateSettingsAction {
    return {
        type: UPDATE,
        settings: settings
    };
};

export {
    reducer as default,
    initialState as settingsInitialState,
    updateSettings
};
