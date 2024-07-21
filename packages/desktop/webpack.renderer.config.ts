import type { Configuration } from "webpack";

import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";
// eslint-disable-next-line import/default
import CopyPlugin from "copy-webpack-plugin";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";
import path from "path";

const getModulePath = (moduleName: string) =>
  path.dirname(require.resolve(`${moduleName}/package.json`));
rules.push({
  test: /\.css$/,
  use: [
    { loader: "style-loader" },
    {
      loader: "css-loader",
      options: {
        modules: {
          localIdentName: "[name]_[local]_[hash:base64:5]",
          exportLocalsConvention: "camelCase",
        },
        importLoaders: 1,
      },
    },
    {
      loader: "postcss-loader",
      options: {
        postcssOptions: {
          plugins: ["postcss-import", "autoprefixer"],
        },
      },
    },
  ],
});
plugins.push(
  new NodePolyfillPlugin()
)
plugins.push(
  new CopyPlugin({
    patterns: [
      {
        from: "../block/media",
        to: path.join(__dirname, ".webpack/gui/static/blocks-media/default"),
      },
      {
        from: "../block/media",
        to: path.join(__dirname, ".webpack/gui/static/blocks-media/high-contrast"),
      },
      {
        from: "../gui/src/lib/themes/high-contrast/blocks-media",
        to: path.join(__dirname, ".webpack/gui/static/blocks-media/high-contrast"),
        force: true,
      },

      {
        from: "extension-worker.{js,js.map}",
        context: path.join(getModulePath("clipcc-vm"), "dist", "web"),
        to: path.join(__dirname, ".webpack/gui/"),
      },
      {
        from: "**/*.{png,svg,jpg}",
        context: path.join(__dirname, 'icons'),
        to: path.join(__dirname, ".webpack/icons/"),
      },
    ],
  })
);




export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    fallback: {
      stream: require.resolve("stream-browserify")
    },
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
  },
};
