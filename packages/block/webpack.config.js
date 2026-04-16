const path = require('path');
const defaultsDeep = require('lodash.defaultsdeep');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const baseConfig = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: process.env.NODE_ENV === 'production' ? false : 'eval-cheap-module-source-map',
  entry: './src/index.ts',
  output: {
    library: 'ScratchBlocks',
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [{
      test: /\.css$/,
      type: 'asset/source',
      include: path.resolve(__dirname, 'src')
    }, {
      test: /\.ts$/,
      exclude: /node_modules/,
      use: 'ts-loader',
      include: path.resolve(__dirname, 'src')
    }, {
      test: /_compressed\.js$/,
      enforce: 'pre',
      use: 'source-map-loader',
      include: /blockly/
    }]
  },
  ignoreWarnings: [/Failed to parse source map/]
};

module.exports = [
  // Playground
  defaultsDeep({}, baseConfig, {
    target: 'web',
    devServer: {
      static: false,
      host: '0.0.0.0',
      port: process.env.PORT || 8071
    },
    output: {
      libraryTarget: 'umd',
      path: path.resolve(__dirname, 'build')
    },
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
  }),
  // Node-compatible
  defaultsDeep({}, baseConfig, {
    target: 'node',
    output: {
      libraryTarget: 'commonjs2',
      path: path.resolve(__dirname, 'dist', 'node')
    },
    externals: {
      bufferutil: true,
      'utf-8-validate': true,
      canvas: true
    }
  }),
  // Web-comptible
  defaultsDeep({}, baseConfig, {
    target: 'web',
    output: {
      libraryTarget: 'umd',
      path: path.resolve(__dirname, 'dist', 'web')
    }
  })
];
