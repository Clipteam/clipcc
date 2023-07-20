const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');

const PRODUCTION_MODE = process.env.NODE_ENV;

module.exports = {
    entry: './src/main.ts',
    mode: PRODUCTION_MODE === 'production' ? 'production' : 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'clipcc-script.js',
        library: {
            type: 'commonjs2'
        }
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [{
                from: path.join(__dirname, 'src/lib/lib.d.ts'),
                to: path.join(__dirname, 'dist/lib.d.ts')
            }]
        })
    ]
};
　