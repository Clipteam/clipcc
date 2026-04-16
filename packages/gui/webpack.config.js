const defaultsDeep = require('lodash.defaultsdeep');
const path = require('path');
const webpack = require('webpack');
const {version} = require('../../package.json');

// Plugins
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const RuleInheritancePlugin = require('rule-inheritance-webpack-plugin');

const STATIC_PATH = process.env.STATIC_PATH || '/static';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const BUILD_DIST = IS_PRODUCTION || process.env.BUILD_MODE === 'dist';
const IS_CI = process.env.CI;

const base = {
    mode: IS_PRODUCTION ? 'production' : 'development',
    devtool: 'cheap-module-source-map',
    devServer: {
        static: path.resolve(__dirname, 'build'),
        host: '0.0.0.0',
        port: process.env.PORT || 8601
    },
    output: {
        library: 'GUI',
        filename: '[name].js',
        chunkFilename: 'chunks/[name].js',
        assetModuleFilename: 'assets/[hash][ext][query]'
    },
    resolve: {
        alias: {
            'text-encoding': 'fastestsmallesttextencoderdecoder'
        },
        extensions: ['.ts', '.js', '.tsx', '.jsx']
    },
    module: {
        rules: [{
            test: /\.[jt]sx?$/,
            loader: 'babel-loader',
            include: path.resolve(__dirname, 'src'),
            options: {
                // Explicitly disable babelrc so we don't catch various config
                // in much lower dependencies.
                babelrc: false,
                plugins: [
                    ['react-intl', {
                        messagesDir: './translations/messages/'
                    }]],
                presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript']
            }
        }, {
            test: /\.css$/,
            include: [
                path.resolve(__dirname, 'src'),
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
                            'postcss-import',
                            'autoprefixer'
                        ]
                    }
                }
            }]
        }, {
            test: /\.hex$/,
            type: 'asset'
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
        splitChunks: {
            chunks: 'async',
            minChunks: 2,
            maxInitialRequests: 5,
            cacheGroups: {
                default: false,
                defaultVendors: false,
                metadata: {
                    test: module => module.type === 'json' && module.size() > 128 * 1024,
                    name: 'metadata',
                    chunks: 'all',
                    priority: 20,
                    reuseExistingChunk: true,
                    enforce: true
                },
                lib: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'lib.min',
                    chunks: 'initial',
                    priority: 10,
                    reuseExistingChunk: true,
                    enforce: true
                }
            }
        },
        minimizer: [
            new TerserPlugin({
                include: /\.min\.js$/
            }),
            new ImageMinimizerPlugin({
                minimizer: {
                    implementation: ImageMinimizerPlugin.imageminMinify,
                    options: {
                        plugins: [
                            ['gifsicle', {interlaced: true}],
                            ['jpegtran', {progressive: true}],
                            ['optipng', {optimizationLevel: 5}],
                            ['svgo']
                        ]
                    }
                }
            }),
            new CssMinimizerPlugin({
                minify: CssMinimizerPlugin.lightningCssMinify
            })
        ]
    },
    plugins: [
        new RuleInheritancePlugin({
            packages: [
                path.resolve(__dirname, '../audio'),
                path.resolve(__dirname, '../block'),
                path.resolve(__dirname, '../l10n'),
                path.resolve(__dirname, '../paint'),
                path.resolve(__dirname, '../render'),
                path.resolve(__dirname, '../storage'),
                path.resolve(__dirname, '../vm')
            ]
        }),
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

if (!IS_CI) {
    base.plugins.push(new webpack.ProgressPlugin());
}

if (process.env.ANALYZE) {
    // eslint-disable-next-line global-require
    const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
    base.plugins.push(new BundleAnalyzerPlugin());
}

if (!IS_PRODUCTION) {
    base.module.rules.push({
        test: /blocks-msgs\.js$/,
        include: [
            path.resolve(__dirname, '../l10n/locales')
        ],
        use: [{
            loader: path.resolve(__dirname, 'scripts/block-message-loader.js')
        }, {
            loader: 'babel-loader'
        }],
        enforce: 'pre'
    });
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
                    type: 'asset'
                }
            ])
        },
        plugins: base.plugins.concat([
            new webpack.DefinePlugin({
                'process.env.DEBUG': Boolean(process.env.DEBUG),
                'process.env.GA_ID': `"${process.env.GA_ID || 'UA-000000-01'}"`,
                'clipcc.VERSION': version,
                'clipcc.BUILD_TIME': Date.now()
            }),
            new HtmlWebpackPlugin({
                chunks: ['runtime.min', 'lib.min', 'gui'],
                template: 'src/playground/index.ejs',
                title: 'ClipCC GUI'
            }),
            new HtmlWebpackPlugin({
                chunks: ['runtime.min', 'lib.min', 'blocksonly'],
                template: 'src/playground/index.ejs',
                filename: 'blocks-only.html',
                title: 'ClipCC GUI: Blocks Only Example'
            }),
            new HtmlWebpackPlugin({
                chunks: ['runtime.min', 'lib.min', 'compatibilitytesting'],
                template: 'src/playground/index.ejs',
                filename: 'compatibility-testing.html',
                title: 'ClipCC GUI: Compatibility Testing'
            }),
            new HtmlWebpackPlugin({
                chunks: ['runtime.min', 'lib.min', 'player'],
                template: 'src/playground/index.ejs',
                filename: 'player.html',
                title: 'ClipCC GUI: Player Example'
            }),
            new HtmlWebpackPlugin({
                chunks: ['runtime.min', 'lib.min', 'lifecycle'],
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
    BUILD_DIST ? (
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
                        type: 'asset'
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
                })
            ])
        })) : []
);
