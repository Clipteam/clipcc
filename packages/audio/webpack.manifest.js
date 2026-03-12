// @ts-check
/**
 * @import { WebpackManifest } from 'clipcc-infra';
 */

const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

/** @satisfies {WebpackManifest} */
const manifest = {
    entry: './src/index.js',
    libraryName: 'AudioEngine',
    rootPath: __dirname,
    plugins: [
        new NodePolyfillPlugin({
            includeAliases: ['events']
        })
    ]
};

module.exports = manifest;
