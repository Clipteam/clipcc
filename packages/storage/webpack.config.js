const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const baseConfig = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    target: 'browserslist',
    devtool: 'cheap-module-source-map',
    module: {
        rules: [
            {
                include: [
                    path.resolve(__dirname, 'src')
                ],
                test: /\.js$/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        ['@babel/preset-env', {targets: {browsers: ['last 3 versions', 'Safari >= 8', 'iOS >= 8']}}]
                    ]
                }
            },
            {
                include: [
                    path.resolve(__dirname, 'src')
                ],
                test: /\.([cm]?ts|tsx)$/,
                loader: 'ts-loader'
            },
            {
                resourceQuery: '?arrayBuffer',
                type: 'javascript/auto',
                use: 'arraybuffer-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        fallback: {
            Buffer: require.resolve('buffer/')
        }
    },
    optimization: {
        splitChunks: false,
        minimizer: [
            new TerserPlugin({
                include: /\.min\.js$/,
                terserOptions: {
                    sourceMap: true
                }
            })
        ]
    },
    plugins: [
        new NodePolyfillPlugin()
    ]
};

if (!process.env.CI) {
    baseConfig.plugins.push(new webpack.ProgressPlugin());
}

// Web-compatible
const webConfig = {
    ...baseConfig,
    output: {
        library: {
            name: 'ScratchStorage',
            type: 'umd'
        },
        path: path.resolve(__dirname, 'dist', 'web'),
        clean: false
    }
};

const webNonMinConfig = {
    ...webConfig,
    entry: {
        'scratch-storage': path.join(__dirname, './src/index.ts')
    },
    optimization: {
        minimize: false
    }
};

const webMinConfig = {
    ...webConfig,
    entry: {
        'scratch-storage.min': path.join(__dirname, './src/index.ts')
    },
    optimization: {
        minimize: true
    }
};

// Node-compatible
const nodeConfig = {
    ...baseConfig,
    target: 'node',
    entry: {
        'scratch-storage': path.join(__dirname, './src/index.ts')
    },
    output: {
        library: {
            type: 'commonjs2'
        },
        environment: {
            nodePrefixForCoreModules: false
        },
        chunkFormat: 'commonjs',
        path: path.resolve(__dirname, 'dist', 'node'),
        clean: false
    },
    externals: {
        'base64-js': true,
        'js-md5': true,
        'localforage': true,
        'fastestsmallesttextencoderdecoder': true
    },
    plugins: baseConfig.plugins.concat([
        new webpack.ProvidePlugin({
            fetch: ['node-fetch', 'default']
        })
    ])
};

module.exports = [webNonMinConfig, webMinConfig, nodeConfig];
