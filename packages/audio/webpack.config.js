const path = require('path');

module.exports = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: 'cheap-module-source-map',
    entry: {
        dist: './src/index.js'
    },
    output: {
        library: 'AudioEngine',
        libraryTarget: 'umd',
        filename: '[name].js'
    },
    module: {
        rules: [{
            include: [
                path.resolve('src')
            ],
            test: /\.([cm]?ts|tsx)$/,
            loader: 'ts-loader',
            options: {
                transpileOnly: true,
                allowTsInNodeModules: true
            }
        }, {
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
    }
};
