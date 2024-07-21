import type { ModuleOptions } from 'webpack';

export const rules: Required<ModuleOptions>['rules'] = [
  // Add support for native node modules
  {
    // We're specifying native_modules in the test because the asset relocator loader generates a
    // "fake" .node file which is really a cjs file.
    test: /native_modules[/\\].+\.node$/,
    use: 'node-loader',
  },
  {
    test: /\.(svg|png|wav|gif|jpg)$/,
    exclude: /(node_modules|\.webpack)/,
    resourceQuery: { not: [/raw/] },
    type: "asset/inline",
  },
  {
    test: /\.hex$/,
    type: "asset/inline",
    generator: {
      dataUrl: (content: Buffer) =>
        `data:text/plain;base64,${content.toString("base64")}`,
    },
  },
  {
    resourceQuery: /raw/,
    type: "asset/source",
  },
  {
    test: /\.tsx?$/,
    use: {
      loader: "ts-loader",
      options: {
        transpileOnly: true,
      },
    },
  },
  {
    test: /\.jsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: "babel-loader",
      options: {
        // Explicitly disable babelrc so we don't catch various config
        // in much lower dependencies.
        babelrc: false,
        plugins: [
          "@babel/plugin-syntax-dynamic-import",
          "@babel/plugin-transform-async-to-generator",
          "@babel/plugin-proposal-object-rest-spread",
        ],
        presets: ["@babel/preset-env", "@babel/preset-react"],
      },
    },
  },

];
