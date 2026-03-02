import {addLocaleData} from 'react-intl';

import locales, {localeData, isRtl} from 'clipcc-l10n';
import editorMessages from 'clipcc-l10n/locales/editor-msgs';
import blockMessages from 'clipcc-l10n/locales/blocks-msgs';

addLocaleData(localeData);

const UPDATE_LOCALES = 'scratch-gui/locales/UPDATE_LOCALES';
const SELECT_LOCALE = 'scratch-gui/locales/SELECT_LOCALE';

const initialState = {
    isRtl: false,
    locale: 'en',
    messagesByLocale: Object.fromEntries(Object.keys(locales).map(lang => [
        lang,
        Object.assign({}, {
            editor: editorMessages[lang],
            block: blockMessages[lang]
        })
    ])),
    editorMessages: editorMessages.en,
    blockMessages: blockMessages.en
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SELECT_LOCALE:
        return Object.assign({}, state, {
            isRtl: isRtl(action.locale),
            locale: action.locale,
            messagesByLocale: state.messagesByLocale,
            editorMessages: state.messagesByLocale[action.locale].editor,
            blockMessages: state.messagesByLocale[action.locale].block
        });
    case UPDATE_LOCALES:
        return Object.assign({}, state, {
            isRtl: state.isRtl,
            locale: state.locale,
            messagesByLocale: action.messagesByLocale,
            editorMessages: action.messagesByLocale[state.locale].editor,
            blockMessages: action.messagesByLocale[state.locale].block
        });
    default:
        return state;
    }
};

const selectLocale = function (locale) {
    return {
        type: SELECT_LOCALE,
        locale: locale
    };
};

const setLocales = function (localesMessages) {
    return {
        type: UPDATE_LOCALES,
        messagesByLocale: localesMessages
    };
};
const initLocale = function (currentState, locale) {
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
