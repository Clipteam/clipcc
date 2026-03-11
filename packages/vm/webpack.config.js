const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackConfigBuilder = require('../infra');
const manifest = require('./webpack.manifest');

const createConfig = (overrideManifest) => {
    const config = new WebpackConfigBuilder({
        ...manifest,
        ...overrideManifest
    }).get();

    return config;
};

// Web-compatible
const web = createConfig({
    target: 'web',
    distPath: './dist/web',
    entry: {
        'scratch-vm': './src/index.js',
        'scratch-vm.min': './src/index.js'
    }
});

// Node-compatible
const node = createConfig({
    target: 'node',
    distPath: './dist/node',
    entry: {
        'scratch-vm': './src/index.js'
    }
});
node.externals = {
    'decode-html': true,
    'format-message': true,
    'htmlparser2': true,
    'immutable': true,
    'jszip': true,
    '@turbowarp/nanolog': true,
    'clipcc-parser': true,
    'socket.io-client': true
};

// Playground
const playground = createConfig({
    target: 'web',
    distPath: './playground',
    entry: {
        'benchmark': './src/playground/benchmark',
        'video-sensing-extension-debug': './src/extensions/scratch3_video_sensing/debug'
    },
    playground: true
});
playground.devServer.static = false;
playground.devServer.port = process.env.PORT || 8073;
playground.module.rules.push({
    test: require.resolve('stats.js/build/stats.min.js'),
    loader: 'script-loader'
});
playground.performance = {
    hints: false
};
playground.plugins = playground.plugins.concat([
    new CopyWebpackPlugin({
        patterns: [{
            from: '../block/media',
            to: 'media'
        }, {
            from: '../storage/dist/web'
        }, {
            from: '../render/dist/web'
        }, {
            from: 'src/playground'
        }]
    })
]);

module.exports = [
    web,
    node,
    playground
];
