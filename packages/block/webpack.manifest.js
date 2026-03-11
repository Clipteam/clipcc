// @ts-check
/**
 * @import { WebpackManifest } from '../infra';
 */

/** @satisfies {WebpackManifest} */
const manifest = {
  libraryName: 'ScratchBlocks',
  rootPath: __dirname,
  devTool: process.env.NODE_ENV === 'production' ? false : 'eval-cheap-module-source-map',
  entry: './src/index.ts',
  enableTs: true,
  rules: [{
    test: /\.css$/,
    use: 'raw-loader',
    include: 'src'
  }, {
    test: /_compressed\.js$/,
    enforce: 'pre',
    use: 'source-map-loader',
    include: /blockly/
  }]
};

module.exports = manifest;
