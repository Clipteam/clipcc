// temporarily we have all the locale data in scratch-l10n

import en from './locale-data/en';
import fr from './locale-data/fr';
import zh from './locale-data/zh';

import {customLocales} from './supported-locales.js';

let localeData = [].concat(
    en,
    fr,
    zh
);

for (const lang in customLocales) {
    localeData.push(customLocales[lang]);
}

export {
    localeData as default // data expected for initializing ReactIntl.addLocaleData
};
