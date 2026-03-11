const path = require('path');
const webpack = require('webpack');
const {version} = require('../../package.json');

const manifest = require('./webpack.manifest');
const WebpackConfigBuilder = require('../infra');

// Plugins
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

const STATIC_PATH = process.env.STATIC_PATH || '/static';

const createConfig = overrideManifest => {
    const config = new WebpackConfigBuilder({
        ...manifest,
        ...overrideManifest
    }).get();

    return config;
};

if (process.env.ANALYZE) {
    // eslint-disable-next-line global-require
    const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
    manifest.plugins.push(new BundleAnalyzerPlugin());
}

/** @type {webpack.Configuration} */
const configs = [];

const fallbackAssetRule = {
    test: /\.(svg|png|wav|gif|jpg)$/,
    resourceQuery: { not: [/raw/] },
    type: 'asset/inline'
};

// to run editor examples
const playground = createConfig({
    entry: {
        gui: './src/playground/index.jsx',
        blocksonly: './src/playground/blocks-only.jsx',
        lifecycle: './src/playground/lifecycle-test.jsx',
        compatibilitytesting: './src/playground/compatibility-testing.jsx',
        player: './src/playground/player.jsx'
    },
    distPath: path.resolve(__dirname, 'build'),
    rules: [...manifest.rules, fallbackAssetRule],
    optimization: {
        splitChunks: {
            chunks: 'async',
            minChunks: 2,
            maxInitialRequests: 5,
            cacheGroups: {
                default: false,
                defaultVendors: false,
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
        runtimeChunk: {
            name: 'lib.min'
        }
    },
    plugins: [
        ...manifest.plugins,
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
    ]
});

configs.push(playground);

if (process.env.NODE_ENV === 'production' || process.env.BUILD_MODE === 'dist') {
    const lib = createConfig({
        target: 'web',
        publicPath: STATIC_PATH,
        entry: {
            'scratch-gui': './src/index.js'
        },
        externals: {
            'react': 'react',
            'react-dom': 'react-dom'
        },
        rules: [...manifest.rules, fallbackAssetRule],
        plugins: [
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
        ],
        optimization: {
            minimizer: [
                new TerserPlugin({
                    include: /\.min\.js$/
                }),
                new ImageMinimizerPlugin({
                    minimizer: {
                        implementation: ImageMinimizerPlugin.imageminMinify,
                        options: {
                            plugins: [
                                ['gifsicle', { interlaced: true }],
                                ['jpegtran', { progressive: true }],
                                ['optipng', { optimizationLevel: 5 }]
                            ]
                        }
                    }
                })
            ]
        }
    });
    configs.push(lib);
}

module.exports = configs;
