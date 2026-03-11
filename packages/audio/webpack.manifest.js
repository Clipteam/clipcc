// @ts-check
/**
 * @import { WebpackManifest } from '../infra';
 */

/** @satisfies {WebpackManifest} */
const manifest = {
    entry: './src/index.js',
    libraryName: 'AudioEngine',
    rootPath: __dirname
};

module.exports = manifest;
