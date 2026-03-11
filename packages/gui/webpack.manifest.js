// @ts-check
/**
 * @import { WebpackManifest } from '../infra';
 */

/** @type {WebpackManifest} */
const base = {
    libraryName: 'GUI',
    playground: 8601,
    rootPath: __dirname,
    entry: './src/index.js',

    enableReact: true,
    enableTs: true,

    workspacePackages: [
        'clipcc-vm',
        'clipcc-block',
        'clipcc-paint',
        'clipcc-render'
    ]
};

module.exports = base;
