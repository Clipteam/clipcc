// @ts-check
/**
 * @import { WebpackManifest } from '../infra';
 */

/** @type {WebpackManifest} */
const manifest = {
  libraryName: 'ScratchBlocks',
  rootPath: __dirname,
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
