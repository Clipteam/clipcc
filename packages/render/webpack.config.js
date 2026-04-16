const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const base = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    resolve: {
        extensions: ['.ts', '.js']
    },
    devtool: 'cheap-module-source-map',
    module: {
        rules: [
            {
                include: [
                    path.resolve(__dirname, 'src')
                ],
                test: /\.[jt]s$/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        ['@babel/preset-env', {targets: {browsers: ['last 3 versions', 'Safari >= 8', 'iOS >= 8']}}],
                        '@babel/preset-typescript'
                    ]
                }
            },
            {
                resourceQuery: /raw/,
                type: 'asset/source'
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
    // Playground
    Object.assign({}, base, {
        target: 'web',
        devServer: {
            static: false,
            host: '0.0.0.0',
            port: process.env.PORT || 8361
        },
        entry: {
            playground: './src/playground/playground.js',
            queryPlayground: './src/playground/queryPlayground.js'
        },
        output: {
            libraryTarget: 'umd',
            path: path.resolve('playground'),
            filename: '[name].js'
        },
        plugins: base.plugins.concat([
            new CopyWebpackPlugin({
                patterns: [{
                    context: 'src/playground',
                    from: '*.+(html|css)'
                }]
            })
        ])
    }),
    // Web-compatible
    Object.assign({}, base, {
        target: 'web',
        entry: {
            'scratch-render': './src/index.js',
            'scratch-render.min': './src/index.js'
        },
        output: {
            library: 'ScratchRender',
            libraryTarget: 'umd',
            path: path.resolve('dist', 'web'),
            filename: '[name].js'
        }
    }),
    // Node-compatible
    Object.assign({}, base, {
        target: 'node',
        entry: {
            'scratch-render': './src/index.js'
        },
        output: {
            library: 'ScratchRender',
            libraryTarget: 'commonjs2',
            path: path.resolve('dist', 'node'),
            filename: '[name].js'
        },
        externals: {
            '!ify-loader!grapheme-breaker': 'grapheme-breaker',
            '!ify-loader!linebreak': 'linebreak',
            'hull.js': true,
            'clipcc-svg-renderer': true,
            'twgl.js': true,
            'xml-escape': true
        }
    })
];
