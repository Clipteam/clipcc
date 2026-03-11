// @ts-check
/**
 * @import { WebpackManifest } from '../infra';
 */
const webpack = require('webpack');

/** @satisfies {WebpackManifest} */
const manifest = {
    entry: './src/index.js',
    libraryName: 'ScratchStorage',
    target: 'browserslist',
    rootPath: __dirname,
    enableTs: true,
    /** @type {NonNullable<WebpackManifest['plugins']>} */
    plugins: []
};

if (!process.env.CI) {
    manifest.plugins.push(new webpack.ProgressPlugin());
}

module.exports = manifest;
