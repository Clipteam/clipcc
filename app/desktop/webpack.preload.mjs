// @ts-check

import path from 'path';
import {createRequire} from 'module';

const require = createRequire(import.meta.url);

/** @type {import('webpack').Configuration} */
export default {
    name: 'preload',
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    target: 'electron-preload',
    entry: {
        preload: './src/preload/index.ts'
    },
    output: {
        path: path.resolve(import.meta.dirname, 'dist', 'main'),
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.js', '.json']
    },
    devtool: process.env.NODE_ENV === 'production' ? false : 'cheap-module-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'esbuild-loader',
                include: path.resolve(import.meta.dirname, 'src', 'preload'),
                options: {
                    loader: 'tsx',
                    tsconfigRaw: require('./tsconfig.json')
                }
            },
            {
                test: /\.jsx?$/,
                loader: 'esbuild-loader',
                include: path.resolve(import.meta.dirname, 'src', 'preload'),
                options: {
                    loader: 'jsx'
                }
            }
        ]
    }
};
