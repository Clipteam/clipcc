/**
 * Currently supported locales for the Scratch Project
 * @type {Object} Key Value pairs of locale code: Language name written in the language
 */

const locales = {
    'en': {name: 'English'},
    // 'fr': {name: 'Français'},
    // 'zh-cn-chunibyo': {name: '中二模式'},
    'zh-cn': {name: '简体中文'},
    'zh-tw': {name: '繁體中文'}
};

const customLocales = {
    // TODO: replace zh-cn, zh-tw with zh-Hans and zh-Hant then customLocales is unnecessary
    'zh-cn': {
        locale: 'zh-cn',
        parentLocale: 'zh'
    },
    'zh-tw': {
        locale: 'zh-tw',
        parentLocale: 'zh'
    }
};

const localeMap = {
    'aa-dj': 'aa_DJ',
    'es-419': 'es_419',
    // ja-Hira: no map - it's 'ja-Hira' on transifex
    'pt-br': 'pt_BR',
    'zh-cn': 'zh-Hans',
    'zh-tw': 'zh-Hant'
};

// list of RTL locales supported, and a function to check whether a locale is RTL
const rtlLocales = [
    'ar',
    'ckb',
    'fa',
    'he'
];

const isRtl = locale => {
    return rtlLocales.indexOf(locale) !== -1;
};

export {locales as default, customLocales, localeMap, isRtl};
