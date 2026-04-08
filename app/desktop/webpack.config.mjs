// @ts-check

import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import fs from 'fs';
import {DefinePlugin} from 'webpack';

import {version} from '../../package.json';

/**
 * Get module's root path from its name.
 * @param {string} moduleName - the name of the module to get the path of
 * @returns {string} the path to the module's root directory
 */
const getModulePath = moduleName => path.dirname(require.resolve(`${moduleName}/package.json`));

class CleanSourceMapWebpackPlugin {
    /**
     * @param {import('webpack').Compiler} compiler the compiler instance
     */
    apply (compiler) {
        compiler.hooks.done.tapAsync('CleanSourceMapWebpackPlugin', async ({compilation}) => {
            // if (process.env.NODE_ENV !== 'production') return;
            const outputPath = compilation.outputOptions.path;
            if (!outputPath) return;
            /** @type {Promise<void>[]} */
            const threads = [];
            Object.keys(compilation.assets)
                .filter(filename => /[a-zA-Z0-9]\.(js|css)\.map$/.test(filename))
                .forEach(filename => {
                    const filePath = path.resolve(outputPath, filename);
                    threads.push(fs.promises.unlink(filePath));
                });
            await Promise.all(threads);
        });
    }
}

/** @type {import('webpack').Configuration} */
export default {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    target: 'web',
    entry: {
        index: './src/main/index.ts'
    },
    output: {
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
    },
    devtool: process.env.NODE_ENV === 'production' ? undefined : 'source-map',
    devServer: {
        static: [
            {
                directory: path.join(__dirname, 'static'),
                publicPath: '/static'
            },
            {
                directory: path.join(getModulePath('clipcc-gui'), 'static'),
                publicPath: '/static'
            },
            {
                directory: path.join(getModulePath('clipcc-block'), 'media'),
                publicPath: '/static/blocks-media/default'
            },
            {
                directory: path.join(getModulePath('clipcc-block'), 'media'),
                publicPath: '/static/blocks-media/high-contrast'
            },
            {
                directory: path.join(getModulePath('clipcc-gui'), 'src/lib/themes/high-contrast/blocks-media'),
                publicPath: '/static/blocks-media/high-contrast'
            }
        ],
        compress: true
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'esbuild-loader',
                options: {
                    loader: 'tsx',
                    // eslint-disable-next-line global-require
                    tsconfigRaw: require('./tsconfig.json')
                }
            },
            {
                test: /\.jsx?$/,
                loader: 'esbuild-loader',
                options: {
                    loader: 'jsx'
                }
            },
            {
                test: /\.css$/,
                use: [{
                    loader: 'style-loader'
                }, {
                    loader: 'css-loader',
                    options: {
                        modules: {
                            localIdentName: '[name]_[local]_[hash:base64:5]',
                            exportLocalsConvention: 'camelCase'
                        },
                        importLoaders: 1
                    }
                }, {
                    loader: 'postcss-loader',
                    options: {
                        postcssOptions: {
                            plugins: [
                                'postcss-import'
                            ]
                        }
                    }
                }]
            },
            {
                test: /\.(svg|png|wav|gif|jpg)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'static/assets/[hash][ext][query]'
                }
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'static'),
                    to: './static'
                },
                {
                    from: path.resolve(getModulePath('clipcc-gui'), 'static'),
                    to: './static'
                },
                {
                    from: path.resolve(__dirname, 'src', 'index.html'),
                    to: '.'
                },
                {
                    from: path.resolve(__dirname, 'src', 'index.css'),
                    to: '.'
                },
                {
                    from: path.resolve(getModulePath('clipcc-block'), 'media'),
                    to: 'static/blocks-media/default'
                },
                {
                    from: path.resolve(getModulePath('clipcc-block'), 'media'),
                    to: 'static/blocks-media/high-contrast'
                },
                {
                    from: path.resolve(getModulePath('clipcc-gui'), 'src/lib/themes/high-contrast/blocks-media'),
                    to: 'static/blocks-media/high-contrast',
                    force: true
                }]
        }),
        new DefinePlugin({
            'process.env.DEBUG': Boolean(process.env.DEBUG),
            'process.env.GA_ID': `"${process.env.GA_ID || 'UA-000000-01'}"`,
            'clipcc.VERSION': version,
            'clipcc.BUILD_TIME': Date.now()
        }),
        new CleanSourceMapWebpackPlugin()
    ]
};
