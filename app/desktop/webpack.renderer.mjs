// @ts-check

import path from 'path';

import CopyWebpackPlugin from 'copy-webpack-plugin';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import {createRequire} from 'module';
import {fileURLToPath} from 'url';
import RuleInheritancePlugin from 'rule-inheritance-webpack-plugin';
import webpack from 'webpack';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const {version} = require('../../package.json');

/**
 * @typedef {import('webpack-dev-server').Configuration} ConfigurationWithDevServer
 */


/** @satisfies {webpack.Configuration} */
const rendererConfig = {
    name: 'renderer',
    mode: IS_PRODUCTION ? 'production' : 'development',
    target: 'web',
    entry: {
        index: './src/renderer/index.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist', 'renderer'),
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
    },
    devtool: IS_PRODUCTION ? false : 'cheap-module-source-map',
    devServer: {
        host: '127.0.0.1',
        port: 8386,
        hot: false,
        liveReload: true,
        static: [
            {
                directory: path.resolve(__dirname, 'static'),
                publicPath: '/static'
            },
            {
                directory: path.resolve(__dirname, '../../packages/gui/static'),
                publicPath: '/static'
            },
            {
                directory: path.resolve(__dirname, '../../packages/block/media'),
                publicPath: '/static/blocks-media/default'
            },
            {
                directory: path.resolve(__dirname, '../../packages/block/media'),
                publicPath: '/static/blocks-media/high-contrast'
            },
            {
                directory: path.resolve(__dirname, '../../packages/gui/src/lib/themes/high-contrast/blocks-media'),
                publicPath: '/static/blocks-media/high-contrast'
            }
        ],
        compress: true
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'esbuild-loader',
                include: path.resolve(__dirname, 'src', 'renderer'),
                options: {
                    loader: 'tsx',
                    tsconfigRaw: require('./tsconfig.json')
                }
            },
            {
                test: /\.jsx?$/,
                loader: 'esbuild-loader',
                include: path.resolve(__dirname, 'src', 'renderer'),
                options: {
                    loader: 'jsx'
                }
            },
            {
                test: /\.css$/,
                include: [
                    path.resolve(__dirname, 'src', 'renderer'),
                    require.resolve('react-tabs/style/react-tabs.css')
                ],
                use: [{
                    loader: 'style-loader'
                }, {
                    loader: 'css-loader',
                    options: {
                        modules: {
                            localIdentName: '[name]_[local]_[hash:base64:5]',
                            exportLocalsConvention: 'camelCase'
                        },
                        importLoaders: 1
                    }
                }, {
                    loader: 'postcss-loader',
                    options: {
                        postcssOptions: {
                            plugins: [
                                'postcss-import'
                            ]
                        }
                    }
                }]
            },
            {
                test: /\.(svg|png|wav|gif|jpg)$/,
                include: path.resolve(__dirname, 'src'),
                type: 'asset/resource',
                generator: {
                    filename: 'static/assets/[hash][ext][query]'
                }
            }
        ]
    },
    plugins: [
        new RuleInheritancePlugin({
            packages: [
                path.resolve(__dirname, '../../packages/gui')
            ]
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'static'),
                    to: './static',
                    noErrorOnMissing: true
                },
                {
                    from: path.resolve(__dirname, '../../packages/gui/static'),
                    to: './static'
                },
                {
                    from: path.resolve(__dirname, 'src', 'renderer', 'index.html'),
                    to: '.'
                },
                {
                    from: path.resolve(__dirname, 'src', 'renderer', 'index.css'),
                    to: '.'
                },
                {
                    from: path.resolve(__dirname, 'src', 'renderer', 'loading.html'),
                    to: '.'
                },
                {
                    from: path.resolve(__dirname, '../../packages/block/media'),
                    to: 'static/blocks-media/default'
                },
                {
                    from: path.resolve(__dirname, '../../packages/block/media'),
                    to: 'static/blocks-media/high-contrast'
                },
                {
                    from: path.resolve(__dirname, '../../packages/gui/src/lib/themes/high-contrast/blocks-media'),
                    to: 'static/blocks-media/high-contrast',
                    force: true
                }
            ]
        }),
        new webpack.DefinePlugin({
            'process.env.DEBUG': Boolean(process.env.DEBUG),
            'process.env.GA_ID': `"${process.env.GA_ID || 'UA-000000-01'}"`,
            'clipcc.VERSION': version,
            'clipcc.BUILD_TIME': Date.now()
        }),
        new NodePolyfillPlugin({
            includeAliases: ['Buffer']
        })
    ]
};

if (!IS_PRODUCTION) {
    rendererConfig.module.rules.push({
        test: /blocks-msgs\.js$/,
        include: [
            path.resolve(__dirname, '../../packages/l10n/locales')
        ],
        use: [{
            loader: path.resolve(__dirname, '../../packages/gui/scripts/block-message-loader.js')
        }]
    });
}

export default rendererConfig;
