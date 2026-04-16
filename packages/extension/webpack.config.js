const defaultsDeep = require('lodash.defaultsdeep');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const baseConfig = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: 'cheap-module-source-map',
    entry: {
        'clipcc-extension': './src/index.ts'
    },
    output: {
        library: 'Extension',
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [{
            test: /\.ts$/,
            use: 'ts-loader',
            exclude: /node_modules/
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
            includeAliases: ['events']
        })
    ]
};

module.exports = [
    // Web-compatible
    defaultsDeep({}, baseConfig, {
        target: 'web',
        output: {
            libraryTarget: 'umd',
            path: path.resolve(__dirname, 'dist', 'web')
        }
    }),
    // Node-compatible
    defaultsDeep({}, baseConfig, {
        target: 'node',
        output: {
            libraryTarget: 'commonjs2',
            path: path.resolve(__dirname, 'dist', 'node')
        }
    }),
    // Worker for test
    {
        mode: 'production',
        entry: {
            worker: './test/fixtures/dispatch-worker.ts'
        },
        target: 'node',
        output: {
            libraryTarget: 'umd',
            path: path.resolve(__dirname, 'test', 'dist'),
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        module: {
            rules: [{
                test: /\.ts$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: path.resolve(__dirname, 'tsconfig.test.json')
                    }
                },
                exclude: /node_modules/,
                include: [
                    path.resolve(__dirname, 'src'),
                    path.resolve(__dirname, 'test')
                ]
            }]
        }
    }
];
