// @ts-check
/**
 * @import { WebpackManifest } from '../infra';
 */

/** @type {WebpackManifest} */
const manifest = {
    entry: './src/index.js',
    libraryName: 'l10n',
    rootPath: __dirname
};

module.exports = manifest;
