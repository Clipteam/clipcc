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
    translateServiceUrl: clipcc.DEFAULT_TRANSLATE_SERVICE_URL,
    ttsServiceUrl: clipcc.DEFAULT_TTS_SERVICE_URL,
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

    const result: Partial<SettingsState> = {};
    for (const key of Object.keys(defaultState) as Array<keyof SettingsState>) {
        const value = parsed[key];
        if (value !== undefined && typeof value === typeof defaultState[key]) {
            (result as Record<string, unknown>)[key] = value;
        }
    }
    return result;
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
