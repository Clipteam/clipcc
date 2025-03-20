const path = require('path');
const defaultsDeep = require('lodash.defaultsdeep');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const baseConfig = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: process.env.NODE_ENV === 'production' ? false : 'eval-source-map',
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
      use: 'raw-loader',
      include: path.resolve(__dirname, 'src')
    }, {
      test: /\.ts$/,
      use: 'ts-loader',
      exclude: /node_modules/
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
  defaultsDeep({}, baseConfig, {
    output: {
      path: path.resolve(__dirname, 'dist')
    }
  }),
  defaultsDeep({}, baseConfig, {
    output: {
      libraryTarget: 'umd',
      path: path.resolve(__dirname, 'dist', 'web')
    }
  }),
  defaultsDeep({}, baseConfig, {
    devServer: {
      static: false,
      host: '0.0.0.0',
      port: process.env.PORT || 8071
    },
    output: {
      path: path.resolve(__dirname, 'build')
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [{
          from: path.resolve(require.resolve('blockly'), '../media'),
          to: 'media'
        }, {
          from: 'media',
          to: 'media'
        }, {
          from: 'tests/playground.html',
          to: 'index.html'
        }, {
          from: 'msg/messages.js'
        }]
      })
    ]
  })
];
