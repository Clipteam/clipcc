const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackConfigBuilder = require('../infra');
const manifest = require('./webpack.manifest');


const createConfig = (overrideManifest) => {
  const config = new WebpackConfigBuilder({
    ...manifest,
    ...overrideManifest
  }).get();

  config.ignoreWarnings = [/Failed to parse source map/];

  return config;
};

// Playground
const playground = createConfig({
  distPath: './build',
  playground: 8071,
  target: 'web',
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{
        from: path.resolve(require.resolve('blockly'), '../media'),
        to: 'media'
      }, {
        from: 'media',
        to: 'media',
        force: true
      }, {
        from: 'tests/playground.html',
        to: 'index.html'
      }, {
        from: 'tests/toolbox.json',
        to: 'toolbox.json'
      }, {
        from: 'msg/messages.js'
      }]
    })
  ]
});
playground.devServer.static = false;

// Node-compatible
const node = createConfig({
  distPath: './dist/node',
  target: 'node',
  externals: {
    bufferutil: true,
    'utf-8-validate': true,
    canvas: true
  }
});

// Web-comptible
const web = createConfig({
  distPath: './dist/web',
  target: 'web'
});

module.exports = [
  playground,
  node,
  web
];
