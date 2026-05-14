const path = require('path');

const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: 'cheap-module-source-map',
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        library: {
            name: 'AudioEngine',
            type: 'umd'
        },
        filename: '[name].js'
    },
    module: {
        rules: [{
            test: /\.js$/,
            include: path.resolve(__dirname, 'src'),
            loader: 'babel-loader',
            options: {
                presets: [['@babel/preset-env', {targets: {browsers: ['last 3 versions', 'Safari >= 8', 'iOS >= 8']}}]]
            }
        }]
    },
    externals: {
        'audio-context': true,
        '@turbowarp/nanolog': true,
        'startaudiocontext': true
    },
    plugins: [
        new NodePolyfillPlugin({
            includeAliases: ['events']
        })
    ]
};
