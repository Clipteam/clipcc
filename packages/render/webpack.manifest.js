// @ts-check
/**
 * @import { WebpackManifest } from '../infra';
 */

/** @type {WebpackManifest} */
const manifest = {
    libraryName: 'ClipCCRender',
    entry: './src/index.js',
    rootPath: __dirname,
    enableTs: true
};

module.exports = manifest;
