const defaultsDeep = require('lodash.defaultsdeep');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const base = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: 'cheap-module-source-map',
    output: {
        library: {
            name: 'ClipCCExtension',
            type: 'umd'
        },
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.js', '.ts']
    },
    module: {
        rules: [
            {
                test: /\.worker\.ts$/,
                use: {
                    loader: 'codingclip-worker-loader',
                    options: {
                        filename: '[name].js',
                        inline: process.env.NODE_ENV === 'production' ? 'no-fallback' : 'fallback',
                    }
                }
            },
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: '/node-modules/'
            }
        ]
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                include: /\.min\.js$/
            })
        ]
    },
    plugins: [
        new NodePolyfillPlugin()
    ]
};

module.exports = [
    // Web-compatible
    defaultsDeep({}, base, {
        target: 'web',
        entry: {
            'clipcc-extension': './src/index.ts',
            'clipcc-extension.min': './src/index.ts'
        },
        output: {
            path: path.resolve(__dirname, 'dist', 'web')
        },
        externals: {
            'format-message': true,
            'jszip': true
        }
    }),
    // Node-compatible
    defaultsDeep({}, base, {
        target: 'node',
        entry: {
            'clipcc-extension': './src/index.ts'
        },
        output: {
            path: path.resolve(__dirname, 'dist', 'node')
        }
    })
];
