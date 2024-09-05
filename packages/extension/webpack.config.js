import TerserPlugin from 'terser-webpack-plugin';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import defaultsDeep from 'lodash.defaultsdeep';
import path from 'path';

const base = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    resolve: {
        extensions: ['.ts', '.js']
    },
    devtool: 'cheap-module-source-map',
    entry: {
        'clipcc-extension': './src/index.ts'
    },
    module: {
        rules: [{
            include: [
                path.resolve('src')
            ],
            test: /\.([cm]?ts|tsx)$/,
            loader: 'ts-loader'
        }]
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                include: /\.js$/
            })
        ]
    },
    plugins: [
        new NodePolyfillPlugin({
            onlyAliases: ['path']
        })
    ]
};

export default [
    defaultsDeep({}, base, {
        target: 'web',
        output: {
            library: 'ClipCCExtension',
            libraryTarget: 'umd',
            path: path.resolve('dist', 'web'),
            filename: '[name].js'
        },
        optimization: {
            minimize: process.env.NODE_ENV === 'production'
        }
    })
];
