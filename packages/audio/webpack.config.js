const manifest = require('./webpack.manifest');
const WebpackConfigBuilder = require('../infra');

const config = new WebpackConfigBuilder({
    ...manifest,
    entry: {
        dist: manifest.entry
    }
}).get();
config.externals = {
    'audio-context': true,
    '@turbowarp/nanolog': true,
    'startaudiocontext': true
};

module.exports = config;
