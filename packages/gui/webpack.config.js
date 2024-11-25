const defaultsDeep = require('lodash.defaultsdeep');
const path = require('path');
const webpack = require('webpack');
const {version} = require('../../package.json');

// Plugins
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

const STATIC_PATH = process.env.STATIC_PATH || '/static';

const base = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: 'cheap-module-source-map',
    devServer: {
        static: path.resolve(__dirname, 'build'),
        host: '0.0.0.0',
        port: process.env.PORT || 8601
    },
    output: {
        library: 'GUI',
        filename: '[name].js',
        chunkFilename: 'chunks/[name].js'
    },
    resolve: {
        extensions: ['.ts', '.js', '.tsx', '.jsx'],
        alias: {
            'clipcc-vm': path.resolve(__dirname, '../vm/src/index.js'),
            'clipcc-storage': path.resolve(__dirname, '../storage/src/index.ts'),
            'clipcc-render': path.resolve(__dirname, '../render/src/index.js'),
            'clipcc-audio': path.resolve(__dirname, '../audio/src/index.js')
        },
        symlinks: false
    },
    snapshot: {
        managedPaths: [
            /^.+?[\\/]node_modules[\\/](?!scratch-(blocks|l10n|paint|render|storage|vm))[\\/]/
        ]
    },
    module: {
        rules: [{
            include: [
                path.resolve(__dirname, 'src'),
                path.resolve(__dirname, '../vm/src'),
                path.resolve(__dirname, '../storage/src'),
                path.resolve(__dirname, '../audio/src'),
                path.resolve(__dirname, '../svg-renderer/src')
            ],
            test: /\.([cm]?ts|tsx)$/,
            loader: 'ts-loader',
            options: {
                transpileOnly: true,
                allowTsInNodeModules: true
            }
        },
        {
            test: /\.jsx?$/,
            loader: 'babel-loader',
            include: [
                path.resolve(__dirname, 'src'),
                /node_modules[\\/]scratch-[^\\/]+[\\/]src/,
                /node_modules[\\/]clipcc-[^\\/]+[\\/]src/,
                /node_modules[\\/]pify/,
                /node_modules[\\/]@vernier[\\/]godirect/
            ],
            options: {
                // Explicitly disable babelrc so we don't catch various config
                // in much lower dependencies.
                babelrc: false,
                plugins: [
                    '@babel/plugin-syntax-dynamic-import',
                    '@babel/plugin-transform-async-to-generator',
                    '@babel/plugin-proposal-object-rest-spread',
                    ['react-intl', {
                        messagesDir: './translations/messages/'
                    }]],
                presets: ['@babel/preset-env', '@babel/preset-react']
            }
        },
        {
            test: /\.css$/,
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
                            'postcss-import',
                            'autoprefixer'
                        ]
                    }
                }
            }]
        }, {
            test: /\.hex$/,
            type: 'asset/inline',
            generator: {
                dataUrl: content => `data:text/plain;base64,${content.toString('base64')}`
            }
        }, {
            resourceQuery: '?arrayBuffer',
            type: 'javascript/auto',
            use: 'arraybuffer-loader'
        }, {
            resourceQuery: /raw/,
            type: 'asset/source'
        }]
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                include: /\.min\.js$/
            })
        ]
    },
    plugins: [
        new NodePolyfillPlugin(),
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
    ]
};

if (!process.env.CI) {
    base.plugins.push(new webpack.ProgressPlugin());
}

module.exports = [
    // to run editor examples
    defaultsDeep({}, base, {
        entry: {
            gui: './src/playground/index.jsx',
            blocksonly: './src/playground/blocks-only.jsx',
            lifecycle: './src/playground/lifecycle-test.jsx',
            compatibilitytesting: './src/playground/compatibility-testing.jsx',
            player: './src/playground/player.jsx'
        },
        output: {
            path: path.resolve(__dirname, 'build'),
            filename: '[name].js'
        },
        module: {
            rules: base.module.rules.concat([
                {
                    test: /\.(svg|png|wav|gif|jpg)$/,
                    resourceQuery: {not: [/raw/]},
                    type: 'asset/inline'
                }
            ])
        },
        optimization: {
            splitChunks: {
                chunks: 'all',
                name: 'lib.min'
            }
        },
        plugins: base.plugins.concat([
            new webpack.DefinePlugin({
                'process.env.DEBUG': Boolean(process.env.DEBUG),
                'process.env.GA_ID': `"${process.env.GA_ID || 'UA-000000-01'}"`,
                'clipcc.VERSION': version,
                'clipcc.BUILD_TIME': Date.now()
            }),
            new HtmlWebpackPlugin({
                chunks: ['lib.min', 'gui'],
                template: 'src/playground/index.ejs',
                title: 'ClipCC GUI'
            }),
            new HtmlWebpackPlugin({
                chunks: ['lib.min', 'blocksonly'],
                template: 'src/playground/index.ejs',
                filename: 'blocks-only.html',
                title: 'ClipCC GUI: Blocks Only Example'
            }),
            new HtmlWebpackPlugin({
                chunks: ['lib.min', 'compatibilitytesting'],
                template: 'src/playground/index.ejs',
                filename: 'compatibility-testing.html',
                title: 'ClipCC GUI: Compatibility Testing'
            }),
            new HtmlWebpackPlugin({
                chunks: ['lib.min', 'player'],
                template: 'src/playground/index.ejs',
                filename: 'player.html',
                title: 'ClipCC GUI: Player Example'
            }),
            new HtmlWebpackPlugin({
                chunks: ['lib.min', 'lifecycle'],
                template: 'src/playground/index.ejs',
                filename: 'lifecycle.html',
                title: 'ClipCC GUI: Lifecycle Test'
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: 'static',
                        to: 'static'
                    }
                ]
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: 'extensions/**',
                        to: 'static',
                        context: 'src/examples'
                    }
                ]
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: 'extension-worker.{js,js.map}',
                        context: '../vm/dist/web'
                    }
                ]
            })
        ])
    })
].concat(
    process.env.NODE_ENV === 'production' || process.env.BUILD_MODE === 'dist' ? (
        // export as library
        defaultsDeep({}, base, {
            target: 'web',
            entry: {
                'scratch-gui': './src/index.js'
            },
            output: {
                libraryTarget: 'umd',
                path: path.resolve('dist'),
                publicPath: `${STATIC_PATH}/`
            },
            externals: {
                'react': 'react',
                'react-dom': 'react-dom'
            },
            module: {
                rules: base.module.rules.concat([
                    {
                        test: /\.(svg|png|wav|gif|jpg)$/,
                        resourceQuery: {not: [/raw/]},
                        type: 'asset/inline'
                    }
                ])
            },
            plugins: base.plugins.concat([
                new CopyWebpackPlugin({
                    patterns: [
                        {
                            from: 'extension-worker.{js,js.map}',
                            context: '../vm/dist/web'
                        }
                    ]
                }),
                // Include library JSON files for scratch-desktop to use for downloading
                new CopyWebpackPlugin({
                    patterns: [
                        {
                            from: 'src/lib/libraries/*.json',
                            to: 'libraries/[name][ext]'
                        }
                    ]
                }),
                new WorkboxPlugin.GenerateSW({
                    clientsClaim: true,
                    skipWaiting: true
                })
            ])
        })) : []
);
