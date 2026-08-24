const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const defaultsDeep = require('lodash.defaultsdeep');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const RuleInheritancePlugin = require('rule-inheritance-webpack-plugin');
const {version} = require('../../package.json');

const DEFAULT_TRANSLATE_SERVICE_URL = process.env.TRANSLATE_SERVICE_URL ||
    'https://translate-service.scratch.mit.edu/translate';
const DEFAULT_TTS_SERVICE_URL = process.env.TTS_SERVICE_URL ||
    'https://synthesis-service.scratch.mit.edu/synth';

const base = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: 'cheap-module-source-map',
    output: {
        filename: '[name].js'
    },
    resolve: {
        alias: {
            'text-encoding': 'fastestsmallesttextencoderdecoder'
        },
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [{
            test: /\.[jt]s$/,
            loader: 'babel-loader',
            include: path.resolve(__dirname, 'src'),
            options: {
                presets: [
                    ['@babel/preset-env', {targets: {browsers: ['last 3 versions', 'Safari >= 8', 'iOS >= 8']}}],
                    '@babel/preset-typescript'
                ]
            }
        },
        {
            test: /\.mp3$/,
            type: 'asset/resource'
        },
        {
            resourceQuery: /raw/,
            type: 'asset/source'
        },
        {
            resourceQuery: '?arrayBuffer',
            type: 'javascript/auto',
            use: 'arraybuffer-loader'
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
        new NodePolyfillPlugin({
            includeAliases: ['events', 'buffer']
        }),
        new webpack.DefinePlugin({
            'clipcc.VERSION': version,
            'clipcc.BUILD_TIME': Date.now(),
            'clipcc.DEFAULT_TRANSLATE_SERVICE_URL': JSON.stringify(DEFAULT_TRANSLATE_SERVICE_URL),
            'clipcc.DEFAULT_TTS_SERVICE_URL': JSON.stringify(DEFAULT_TTS_SERVICE_URL)
        }),
        new webpack.IgnorePlugin({
            resourceRegExp: /canvas/,
            contextRegExp: /jsdom$/
        })
    ]
};

module.exports = [
    // Web-compatible
    defaultsDeep({}, base, {
        target: 'web',
        entry: {
            'scratch-vm': './src/index.js',
            'scratch-vm.min': './src/index.js'
        },
        output: {
            library: {
                name: 'VirtualMachine',
                type: 'umd'
            },
            path: path.resolve('dist', 'web')
        }
    }),
    // Node-compatible
    defaultsDeep({}, base, {
        target: 'node',
        entry: {
            'scratch-vm': './src/index.js'
        },
        output: {
            library: {
                type: 'commonjs2'
            },
            path: path.resolve('dist', 'node')
        },
        externals: {
            'decode-html': true,
            'format-message': true,
            'htmlparser2': true,
            'immutable': true,
            'jszip': true,
            '@turbowarp/nanolog': true,
            'clipcc-parser': true,
            'socket.io-client': true
        }
    }),
    // Playground
    defaultsDeep({}, base, {
        target: 'web',
        entry: {
            'benchmark': './src/playground/benchmark',
            'video-sensing-extension-debug': './src/extensions/scratch3_video_sensing/debug'
        },
        devServer: {
            static: false,
            host: '0.0.0.0',
            port: process.env.PORT || 8073
        },
        output: {
            path: path.resolve(__dirname, 'playground'),
            filename: '[name].js'
        },
        module: {
            rules: base.module.rules.concat([
                {
                    test: require.resolve('stats.js/build/stats.min.js'),
                    loader: 'script-loader'
                }
            ])
        },
        performance: {
            hints: false
        },
        plugins: base.plugins.concat([
            new RuleInheritancePlugin({
                packages: [
                    path.resolve(__dirname, '../storage')
                ]
            }),
            new CopyWebpackPlugin({
                patterns: [{
                    from: '../block/media',
                    to: 'media'
                }, {
                    from: 'src/playground'
                }]
            })
        ])
    })
];
