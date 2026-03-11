// @ts-check
/**
 * @import { WebpackManifest } from '../infra';
 */
const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

/** @satisfies {WebpackManifest} */
const base = {
    libraryName: 'GUI',
    playground: 8601,
    rootPath: __dirname,
    entry: './src/index.js',

    enableReact: true,
    enableTs: true,

    sourcePaths: [
        '../../node_modules/react-tabs' // for react-tabs' CSS
    ],
    workspacePackages: [
        'clipcc-vm',
        'clipcc-block',
        'clipcc-paint',
        'clipcc-render'
    ],
    snapshot: {
        managedPaths: [
            /^.+?[\\/]node_modules[\\/](?!scratch-(blocks|l10n|paint|render|storage|vm))[\\/]/
        ]
    },
    /** @type {NonNullable<WebpackManifest['rules']>} */
    rules: [],
    /** @type {NonNullable<WebpackManifest['plugins']>} */
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: '../block/media',
                    to: 'static/blocks-media/default'
                },
                {
                    from: '../block/media',
                    to: 'static/blocks-media/high-contrast'
                },
                {
                    from: 'src/lib/themes/high-contrast/blocks-media',
                    to: 'static/blocks-media/high-contrast',
                    force: true
                }
            ]
        })
    ],
};

if (process.env.NODE_ENV !== 'production') {
    base.rules.push({
        test: /blocks-msgs\.js$/,
        include: [
            /node_modules[\\/]clipcc-l10n[\\/]locales/
        ],
        use: [{
            loader: path.resolve(__dirname, 'scripts/block-message-loader.js')
        }, {
            loader: 'babel-loader'
        }],
        enforce: 'pre'
    });
}

if (!process.env.CI) {
    base.plugins.push(new webpack.ProgressPlugin());
}

module.exports = base;
