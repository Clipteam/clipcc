const {IgnorePlugin} = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const defaultsDeep = require('lodash.defaultsdeep');
const path = require('path');

const base = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devServer: {
        contentBase: false,
        host: '0.0.0.0',
        port: process.env.PORT || 8576
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    devtool: 'cheap-module-source-map',
    entry: {
        'scratch-svg-renderer': './src/index.ts'
    },
    module: {
        rules: [{
            include: [
                path.resolve('node_modules', 'scratch-render-fonts')
            ],
            test: /\.js$/,
            loader: 'babel-loader',
            options: {
                presets: [['@babel/preset-env', {
                    targets: {
                        browsers: ['last 3 versions', 'Safari >= 8', 'iOS >= 8'],
                        node: '20'
                    }
                }]]
            }
        }, {
            include: [
                path.resolve('src')
            ],
            test: /\.([cm]?ts|tsx)$/,
            loader: 'ts-loader',
            options: {
                transpileOnly: process.env.NODE_ENV !== 'production'
            }
        }]
    },
    plugins: [
        new IgnorePlugin({
            resourceRegExp: /canvas/,
            contextRegExp: /jsdom$/
        })
    ]
};

module.exports = [
    defaultsDeep({}, base, {
        target: 'web',
        output: {
            library: 'ScratchSVGRenderer',
            libraryTarget: 'umd',
            path: path.resolve('playground'),
            publicPath: '/',
            filename: '[name].js'
        },
        plugins: base.plugins.concat([
            new CopyWebpackPlugin([
                {
                    from: 'src/playground'
                }
            ])
        ])
    }),
    defaultsDeep({}, base, {
        target: 'web',
        output: {
            library: 'ScratchSVGRenderer',
            libraryTarget: 'umd',
            path: path.resolve('dist', 'web'),
            filename: '[name].js'
        },
        optimization: {
            minimize: process.env.NODE_ENV === 'production'
        }
    }),
    defaultsDeep({}, base, {
        target: 'node',
        output: {
            library: 'ScratchSVGRenderer',
            libraryTarget: 'umd',
            path: path.resolve('dist', 'node'),
            filename: '[name].js'
        },
        optimization: {
            minimize: process.env.NODE_ENV === 'production'
        }
    })
];
