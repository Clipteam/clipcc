const path = require('path');
const manifest = require('./webpack.manifest');
const WebpackConfigBuilder = require('../infra');

// Plugins
const HtmlWebpackPlugin = require('html-webpack-plugin');


const playground = new WebpackConfigBuilder({
    ...manifest,
    entry: {
        playground: './src/playground/playground.jsx'
    },
    playground: 8078,
    distPath: path.resolve(__dirname, 'playground'),
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/playground/index.ejs',
            title: 'Scratch 3.0 Paint Editor Playground'
        })
    ]
}).get();

const library = new WebpackConfigBuilder({
    ...manifest,
    entry: {
        'scratch-paint': manifest.entry
    },
    distPath: path.resolve(__dirname, 'dist')
}).get();
library.externals = {
    '@turbowarp/nanolog': '@turbowarp/nanolog',
    'prop-types': 'prop-types',
    'react': 'react',
    'react-dom': 'react-dom',
    'react-intl': 'react-intl',
    'react-intl-redux': 'react-intl-redux',
    'react-popover': 'react-popover',
    'react-redux': 'react-redux',
    'react-responsive': 'react-responsive',
    'react-style-proptype': 'react-style-proptype',
    'react-tooltip': 'react-tooltip',
    'redux': 'redux'
};

module.exports = [playground, library];
