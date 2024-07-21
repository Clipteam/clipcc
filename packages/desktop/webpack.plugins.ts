import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import type { WebpackPluginInstance } from 'webpack';



// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

export const plugins : Required<WebpackPluginInstance>['plugins'] = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
    
  }),
];
