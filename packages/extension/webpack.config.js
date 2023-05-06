const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: {
        'clipcc-extension': './src/index.ts'
    },
    devtool: 'cheap-module-source-map',
    output: {
        library: 'ClipCCExtension',
        libraryTarget: 'umd',
        path: path.resolve(__dirname, 'dist'),
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
    }
}
