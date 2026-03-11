const manifest = require('./webpack.manifest');
const WebpackConfigBuilder = require('../infra');

const config = new WebpackConfigBuilder(Object.assign(manifest, {
    entry: {
        l10n: manifest.entry,
        supportedLocales: './src/supported-locales.js',
        localeData: './src/locale-data.js'
    }
})).get();
config.devtool = 'cheap-module-source-map';

module.exports = config;
