// @ts-check
/**
 * @import { WebpackManifest } from '../infra';
 */
const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const {version} = require('../../package.json');

/** @type {WebpackManifest} */
const manifest = {
  libraryName: 'VirtualMachine',
  rootPath: __dirname,
  entry: './src/index.js',
  enableTs: true,
  sourcePaths: ['../render/src'],
  alias: {
    'text-encoding': 'fastestsmallesttextencoderdecoder',
    'clipcc-render': '../render/src/index.js', // @todo should move to workspacePackages when it gets migrated.
    'clipcc-audio': '../audio/src/index.js' // @todo should move to workspacePackages when it gets migrated.
  },
  rules: [{
    test: /\.mp3$/,
    type: 'asset/resource'
  }],
  plugins: [
    new NodePolyfillPlugin(),
    new webpack.DefinePlugin({
      'clipcc.VERSION': version,
      'clipcc.BUILD_TIME': Date.now()
    })
  ]
};

module.exports = manifest;
