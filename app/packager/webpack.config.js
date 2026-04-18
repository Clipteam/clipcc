// @ts-check
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

/**
 * @typedef {import('webpack-dev-server').Configuration} ConfigurationWithDevServer
 */

/** @type {import('webpack').Configuration} */
export default {
    name: 'main',
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    target: 'web',
    entry: './src/index.tsx',
    output: {
        path: path.resolve(import.meta.dirname, 'dist'),
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.js', '.tsx', '.jsx', '.json']
    },
    devtool: process.env.NODE_ENV === 'production' ? false : 'cheap-module-source-map',
    devServer: {
        port: 8864,
        static: [{
            directory: path.resolve(import.meta.dirname),
            publicPath: '/'
        }]
    },
    module: {
        rules: [{
            test: /\.[jt]sx?$/,
            loader: 'babel-loader',
            include: path.resolve(import.meta.dirname, 'src'),
            options: {
                presets: [
                    '@babel/preset-env',
                    'solid',
                    '@babel/preset-typescript'
                ],
                plugins: ['solid-refresh/babel']
            }
        }, {
            test: /\.css$/,
            type: 'asset/source',
            include: path.resolve(import.meta.dirname, 'src')
        }]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/playground/index.html'
        })
    ]
};
