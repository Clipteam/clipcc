// @ts-check

import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import fs from 'fs';
import {createRequire} from 'module';
import {fileURLToPath} from 'url';
import webpack from 'webpack';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {version} = require('../../package.json');

/**
 * Get module's root path from its name.
 * @param {string} moduleName - the name of the module to get the path of
 * @returns {string} the path to the module's root directory
 */
const getModulePath = moduleName => {
    try {
        return path.dirname(require.resolve(`${moduleName}/package.json`));
    } catch {
        const fallbackModuleName = moduleName.replace(/^clipcc-/, '');
        const fallbackPath = path.resolve(__dirname, '..', '..', 'packages', fallbackModuleName);
        if (fs.existsSync(path.resolve(fallbackPath, 'package.json'))) {
            return fallbackPath;
        }

        throw new Error(`Unable to resolve module path for ${moduleName}`);
    }
};

class CleanSourceMapWebpackPlugin {
/**
 * Apply plugin hook.
 * @param {import('webpack').Compiler} compiler Webpack compiler instance.
 */
    apply (compiler) {
        compiler.hooks.done.tapPromise('CleanSourceMapWebpackPlugin', async stats => {
            const {compilation} = /** @type {{compilation: import('webpack').Compilation}} */ (stats);
            // if (process.env.NODE_ENV !== 'production') return;
            const outputPath = compilation.outputOptions.path;
            if (!outputPath) return;
            /** @type {Promise<void>[]} */
            const threads = [];
            Object.keys(compilation.assets)
                .filter(filename => /[a-zA-Z0-9]\.(js|css)\.map$/.test(filename))
                .forEach(filename => {
                    const filePath = path.resolve(outputPath, filename);
                    threads.push(fs.promises.unlink(filePath).catch(error => {
                        if (error?.code !== 'ENOENT') {
                            throw error;
                        }
                    }));
                });
            await Promise.all(threads);
        });
    }
}

const getScriptLoaders = () => [
    {
        test: /\.tsx?$/,
        loader: 'esbuild-loader',
        options: {
            loader: 'tsx',
            tsconfigRaw: require('./tsconfig.json')
        }
    },
    {
        test: /\.jsx?$/,
        loader: 'esbuild-loader',
        options: {
            loader: 'jsx'
        }
    }
];

/** @type {import('webpack').Configuration} */
const rendererConfig = {
    name: 'renderer',
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    target: 'web',
    entry: {
        index: './src/renderer/index.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist', 'renderer'),
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
    },
    devtool: process.env.NODE_ENV === 'production' ? false : 'cheap-module-source-map',
    devServer: {
        host: '127.0.0.1',
        port: 8386,
        hot: false,
        liveReload: true,
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
            ...getScriptLoaders(),
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
                    to: './static',
                    noErrorOnMissing: true
                },
                {
                    from: path.resolve(getModulePath('clipcc-gui'), 'static'),
                    to: './static'
                },
                {
                    from: path.resolve(__dirname, 'src', 'renderer', 'index.html'),
                    to: '.'
                },
                {
                    from: path.resolve(__dirname, 'src', 'renderer', 'index.css'),
                    to: '.'
                },
                {
                    from: path.resolve(__dirname, 'src', 'renderer', 'loading.html'),
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
                }
            ]
        }),
        new webpack.DefinePlugin({
            'process.env.DEBUG': Boolean(process.env.DEBUG),
            'process.env.GA_ID': `"${process.env.GA_ID || 'UA-000000-01'}"`,
            'clipcc.VERSION': version,
            'clipcc.BUILD_TIME': Date.now()
        }),
        new CleanSourceMapWebpackPlugin()
    ]
};

/** @type {import('webpack').Configuration} */
const mainConfig = {
    name: 'main',
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    target: 'electron-main',
    entry: {
        index: './src/main/index.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist', 'main'),
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.js', '.json']
    },
    devtool: process.env.NODE_ENV === 'production' ? false : 'cheap-module-source-map',
    module: {
        rules: [
            ...getScriptLoaders()
        ]
    },
    plugins: [
        new CleanSourceMapWebpackPlugin()
    ]
};

/** @type {import('webpack').Configuration} */
const preloadConfig = {
    name: 'preload',
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    target: 'electron-preload',
    entry: {
        preload: './src/main/preload.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist', 'main'),
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.js', '.json']
    },
    devtool: process.env.NODE_ENV === 'production' ? false : 'cheap-module-source-map',
    module: {
        rules: [
            ...getScriptLoaders()
        ]
    },
    plugins: [
        new CleanSourceMapWebpackPlugin()
    ]
};

/**
 * Select configs by target.
 * @param {{target?: string}} env Build environment flags.
 * @returns {import('webpack').Configuration | import('webpack').Configuration[]} Target-specific config or all configs.
 */
export default env => {
    const target = env?.target;

    if (target === 'main') return mainConfig;
    if (target === 'preload') return preloadConfig;
    if (target === 'renderer') return rendererConfig;

    return [mainConfig, preloadConfig, rendererConfig];
};
