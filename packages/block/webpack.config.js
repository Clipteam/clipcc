const path = require('path');

module.exports = [{
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/index.ts',
  output: {
    library: 'ScratchBlocks',
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, 'dist'),
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
    }]
  }
}, {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/index.ts',
  output: {
    library: 'ScratchBlocks',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist', 'web'),
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
    }]
  }
}];
