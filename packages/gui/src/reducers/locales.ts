import {addLocaleData} from 'react-intl';

import locales, {localeData, isRtl} from 'clipcc-l10n';
import editorMessages from 'clipcc-l10n/locales/editor-msgs';
import blockMessages from 'clipcc-l10n/locales/blocks-msgs';
import type {BaseAction} from './common';

addLocaleData(localeData);

const UPDATE_LOCALES = 'scratch-gui/locales/UPDATE_LOCALES';
const SELECT_LOCALE = 'scratch-gui/locales/SELECT_LOCALE';

interface LocaleMessages {
    editor: Record<string, string>;
    block: Record<string, string>;
};

type MessagesByLocale = Record<string, LocaleMessages>;

export interface LocalesState {
    isRtl: boolean;
    locale: string;
    messagesByLocale: MessagesByLocale;
    editorMessages: Record<string, string>;
    blockMessages: Record<string, string>;
};

const initialMessagesByLocale: MessagesByLocale = Object.fromEntries(Object.keys(locales).map(lang => [
    lang,
    Object.assign({}, {
        editor: editorMessages[lang as keyof typeof editorMessages],
        block: blockMessages[lang as keyof typeof blockMessages]
    })
]));

const initialState: LocalesState = {
    isRtl: false,
    locale: 'en',
    messagesByLocale: initialMessagesByLocale,
    editorMessages: editorMessages.en,
    blockMessages: blockMessages.en
};

interface SelectLocaleAction extends BaseAction<typeof SELECT_LOCALE> {
    locale: string;
};

interface UpdateLocalesAction extends BaseAction<typeof UPDATE_LOCALES> {
    messagesByLocale: MessagesByLocale;
};

type LocalesAction = SelectLocaleAction | UpdateLocalesAction;

const reducer = function (state: LocalesState = initialState, action: LocalesAction): LocalesState {
    switch (action.type) {
    case SELECT_LOCALE: {
        const localeMessages = state.messagesByLocale[action.locale];
        if (!localeMessages) return state;

        return Object.assign({}, state, {
            isRtl: isRtl(action.locale),
            locale: action.locale,
            messagesByLocale: state.messagesByLocale,
            editorMessages: localeMessages.editor,
            blockMessages: localeMessages.block
        });
    }
    case UPDATE_LOCALES: {
        const localeMessages = action.messagesByLocale[state.locale];
        if (!localeMessages) return state;

        return Object.assign({}, state, {
            isRtl: state.isRtl,
            locale: state.locale,
            messagesByLocale: action.messagesByLocale,
            editorMessages: localeMessages.editor,
            blockMessages: localeMessages.block
        });
    }
    default:
        return state;
    }
};

const selectLocale = function (locale: string): SelectLocaleAction {
    return {
        type: SELECT_LOCALE,
        locale: locale
    };
};

const setLocales = function (localesMessages: MessagesByLocale): UpdateLocalesAction {
    return {
        type: UPDATE_LOCALES,
        messagesByLocale: localesMessages
    };
};
const initLocale = function (currentState: LocalesState, locale: string): LocalesState {
    if (Object.prototype.hasOwnProperty.call(currentState.messagesByLocale, locale)) {
        return Object.assign(
            {},
            currentState,
            {
                isRtl: isRtl(locale),
                locale: locale,
                messagesByLocale: currentState.messagesByLocale,
                editorMessages: currentState.messagesByLocale[locale].editor,
                blockMessages: currentState.messagesByLocale[locale].block
            }
        );
    }
    // don't change locale if it's not in the current messages
    return currentState;
};
export {
    reducer as default,
    initialState as localesInitialState,
    initLocale,
    selectLocale,
    setLocales
};
