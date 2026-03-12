const manifest = require('./webpack.manifest');
const WebpackConfigBuilder = require('../infra');

const config = new WebpackConfigBuilder({
    ...manifest,
    entry: {
        l10n: manifest.entry,
        supportedLocales: './src/supported-locales.js',
        localeData: './src/locale-data.js'
    }
}).get();

module.exports = config;
