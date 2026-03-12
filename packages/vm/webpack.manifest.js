// @ts-check
/**
 * @import { WebpackManifest } from '../infra';
 */
const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const {version} = require('../../package.json');

/** @satisfies {WebpackManifest} */
const manifest = {
  libraryName: 'VirtualMachine',
  rootPath: __dirname,
  entry: './src/index.js',
  enableTs: true,
  alias: {
    'text-encoding': 'fastestsmallesttextencoderdecoder'
  },
  workspacePackages: ['clipcc-render', 'clipcc-audio'],
  rules: [],
  plugins: [
    new NodePolyfillPlugin(),
    new webpack.DefinePlugin({
      'clipcc.VERSION': version,
      'clipcc.BUILD_TIME': Date.now()
    })
  ]
};

module.exports = manifest;
