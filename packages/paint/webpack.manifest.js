// @ts-check
/**
 * @import { WebpackManifest } from '../infra';
 */

/** @satisfies {WebpackManifest} */
const manifest = {
    entry: './src/index.js',
    libraryName: 'ScratchPaint',
    rootPath: __dirname,
    enableReact: true,
    enableTs: true,
    rules: [{
        test: /\.png$/i,
        type: 'asset/inline'
    },
    {
        test: /\.svg$/,
        loader: 'svg-url-loader'
    }]
};

module.exports = manifest;
