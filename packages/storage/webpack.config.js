const webpack = require('webpack');

const manifest = require('./webpack.manifest');
const WebpackConfigBuilder = require('../infra');

const createConfig = overrideManifest => {
    const config = new WebpackConfigBuilder({
        ...manifest,
        ...overrideManifest
    }).get();

    return config;
};

// Web-compatible
const webNonMin = createConfig({
    target: 'web',
    distPath: './dist/web',
    entry: {
        'scratch-storage': './src/index.ts'
    },
    optimization: {
        minimize: false
    }
});

const webMin = createConfig({
    target: 'web',
    distPath: './dist/web',
    entry: {
        'scratch-storage.min': './src/index.ts'
    },
    optimization: {
        minimize: true
    }
});

// Node-compatible
const node = createConfig({
    target: 'node',
    distPath: './dist/node',
    entry: {
        'scratch-storage': './src/index.ts'
    },
    externals: {
        'base64-js': true,
        'js-md5': true,
        'localforage': true,
        'fastestsmallesttextencoderdecoder': true
    },
    plugins: [
        new webpack.ProvidePlugin({
            fetch: ['node-fetch', 'default']
        })
    ]
});

module.exports = [
    webNonMin,
    webMin,
    node
];
