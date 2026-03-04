const defaultsDeep = require('lodash.defaultsdeep');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

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
    }
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
    })
];
