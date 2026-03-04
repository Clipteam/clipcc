import {addLocaleData} from 'react-intl';
import {updateIntl as superUpdateIntl, IntlProvider, intlReducer} from 'react-intl-redux';

import localeData from 'clipcc-l10n';
import paintMessages from 'clipcc-l10n/locales/paint-editor-msgs';

Object.keys(localeData).forEach(locale => {
    // TODO: will need to handle locales not in the default intl - see www/custom-locales
    addLocaleData(localeData[locale].localeData);
});

const intlInitialState = {
    intl: {
        defaultLocale: 'en',
        locale: 'en',
        messages: paintMessages.en.messages
    }
};

const updateIntl = locale => superUpdateIntl({
    locale: locale,
    messages: paintMessages[locale].messages || paintMessages.en.messages
});

export {
    intlReducer as default,
    IntlProvider,
    intlInitialState,
    updateIntl
};
