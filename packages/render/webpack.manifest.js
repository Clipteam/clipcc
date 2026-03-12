// @ts-check
/**
 * @import { WebpackManifest } from 'clipcc-infra';
 */

const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

/** @satisfies {WebpackManifest} */
const manifest = {
    libraryName: 'ClipCCRender',
    entry: './src/index.js',
    rootPath: __dirname,
    enableTs: true,

    plugins: [
        new NodePolyfillPlugin({
            includeAliases: ['events']
        })
    ]
};

module.exports = manifest;
