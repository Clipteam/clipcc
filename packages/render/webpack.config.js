const manifest = require('./webpack.manifest');
const WebpackConfigBuilder = require('../infra');

const CopyWebpackPlugin = require('copy-webpack-plugin');

const createConfig = overrideManifest => {
    const config = new WebpackConfigBuilder({
        ...manifest,
        ...overrideManifest
    }).get();

    return config;
};

// Playground
const playground = createConfig({
    target: 'web',
    distPath: './playground',
    entry: {
        playground: './src/playground/playground.js',
        queryPlayground: './src/playground/queryPlayground.js'
    },
    playground: 8361
});

playground.plugins.push(
    new CopyWebpackPlugin({
        patterns: [{
            context: 'src/playground',
            from: '*.+(html|css)'
        }]
    })
);

// Web-compatible
const web = createConfig({
    target: 'web',
    distPath: './dist/web',
    entry: {
        'scratch-render': './src/index.js',
        'scratch-render.min': './src/index.js'
    }
});

// Node-compatible
const node = createConfig({
    target: 'node',
    distPath: './dist/node',
    entry: {
        'scratch-render': './src/index.js'
    },
    externals: {
        '!ify-loader!grapheme-breaker': 'grapheme-breaker',
        '!ify-loader!linebreak': 'linebreak',
        'hull.js': true,
        'twgl.js': true,
        'xml-escape': true,
        'clipcc-svg-renderer': true
    }
});

module.exports = [playground, web, node];
