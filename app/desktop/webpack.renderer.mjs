// @ts-check

import path from 'path';

import CopyWebpackPlugin from 'copy-webpack-plugin';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import {createRequire} from 'module';
import RuleInheritancePlugin from 'rule-inheritance-webpack-plugin';
import webpack from 'webpack';
const require = createRequire(import.meta.url);

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
        path: path.resolve(import.meta.dirname, 'dist', 'renderer'),
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
    },
    devtool: IS_PRODUCTION ? false : 'cheap-module-source-map',
    devServer: {
        host: 'localhost',
        port: 8386,
        hot: false,
        liveReload: true,
        static: [
            {
                directory: path.resolve(import.meta.dirname, 'static'),
                publicPath: '/static'
            },
            {
                directory: path.resolve(import.meta.dirname, '../../packages/gui/static'),
                publicPath: '/static'
            },
            {
                directory: path.resolve(import.meta.dirname, '../../packages/block/media'),
                publicPath: '/static/blocks-media/default'
            },
            {
                directory: path.resolve(import.meta.dirname, '../../packages/block/media'),
                publicPath: '/static/blocks-media/high-contrast'
            },
            {
                directory: path.resolve(
                    import.meta.dirname,
                    '../../packages/gui/src/lib/themes/high-contrast/blocks-media'
                ),
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
                include: path.resolve(import.meta.dirname, 'src', 'renderer'),
                options: {
                    loader: 'tsx',
                    tsconfigRaw: require('./tsconfig.json')
                }
            },
            {
                test: /\.jsx?$/,
                loader: 'esbuild-loader',
                include: path.resolve(import.meta.dirname, 'src', 'renderer'),
                options: {
                    loader: 'jsx'
                }
            },
            {
                test: /\.css$/,
                include: [
                    path.resolve(import.meta.dirname, 'src', 'renderer'),
                    require.resolve('react-tabs/style/react-tabs.css', {
                        paths: [path.resolve(import.meta.dirname, '../../packages/gui')]
                    })
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
                include: path.resolve(import.meta.dirname, 'src'),
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
                path.resolve(import.meta.dirname, '../../packages/gui')
            ]
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(import.meta.dirname, 'static'),
                    to: './static',
                    noErrorOnMissing: true
                },
                {
                    from: path.resolve(import.meta.dirname, '../../packages/gui/static'),
                    to: './static'
                },
                {
                    from: path.resolve(import.meta.dirname, 'src', 'renderer', 'index.html'),
                    to: '.'
                },
                {
                    from: path.resolve(import.meta.dirname, 'src', 'renderer', 'index.css'),
                    to: '.'
                },
                {
                    from: path.resolve(import.meta.dirname, 'src', 'renderer', 'loading.html'),
                    to: '.'
                },
                {
                    from: path.resolve(import.meta.dirname, '../../packages/block/media'),
                    to: 'static/blocks-media/default'
                },
                {
                    from: path.resolve(import.meta.dirname, '../../packages/block/media'),
                    to: 'static/blocks-media/high-contrast'
                },
                {
                    from: path.resolve(
                        import.meta.dirname,
                        '../../packages/gui/src/lib/themes/high-contrast/blocks-media'
                    ),
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
            includeAliases: ['Buffer', 'events']
        })
    ]
};

if (!IS_PRODUCTION) {
    rendererConfig.module.rules.push({
        test: /blocks-msgs\.js$/,
        include: [
            path.resolve(import.meta.dirname, '../../packages/l10n/locales')
        ],
        use: [{
            loader: path.resolve(import.meta.dirname, '../../packages/gui/scripts/block-message-loader.js')
        }]
    });
}

export default rendererConfig;
