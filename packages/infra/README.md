# clipcc-infra

Provides shared infrastructure for other clipcc packages. Right now that mainly means a webpack configuration builder with a consistent set of defaults for JS, TypeScript, React, CSS modules, playground builds, and source-linked workspace packages.

## Webpack

### Basic Usage

Add something like this to your `webpack.config.js` file:

```javascript
// @ts-check
/**
 * @import { WebpackManifest } from 'clipcc-infra';
 */

const WebpackConfigBuilder = require('clipcc-infra');

/** @type {WebpackManifest} */
const manifest = {
    rootPath: __dirname,
    libraryName: 'my-library',
    entry: './src/index.js',
    enableReact: true,
    enableTs: true,
    plugins: [],
    rules: []
};

if (process.env.FOO === 'bar') {
    manifest.plugins.push(new MyCustomPlugin());
    manifest.rules.push({
        test: /\.foo$/,
        use: [/* FOO loaders */]
    });
}

const builder = new WebpackConfigBuilder(manifest);

module.exports = builder.get();
```

This produces a webpack 5 configuration with sensible defaults for clipcc packages. Custom plugins, aliases, optimization settings, snapshot settings, and module rules are merged into that generated configuration instead of replacing it wholesale.

### Workspace Packages

If your project is part of a monorepo, add package names to `workspacePackages` so other workspace packages can be consumed from source safely. This is useful when related packages are under active development and you want webpack to compile them directly instead of relying on a prebuilt local install.

To make a package consumable from source, add a `webpack.manifest.js` file at the package root:

```javascript
// @ts-check
/**
 * @import { WebpackManifest } from '../infra';
 */

/** @satisfies {WebpackManifest} */
const manifest = {
    libraryName: 'ClipCCRender',
    entry: './src/index.js',
    rootPath: __dirname,
    enableTs: true
};

module.exports = manifest;
```

That manifest is what downstream packages read, so keep `entry` aligned with the public source entry for the package.

Then make the package's `webpack.config.js` build from that manifest so it still works when built on its own:

```javascript
const manifest = require('./webpack.manifest');
const WebpackConfigBuilder = require('../infra');

const CopyWebpackPlugin = require('copy-webpack-plugin');

const createConfig = overrideManifest => new WebpackConfigBuilder({
    ...manifest,
    ...overrideManifest
}).get();

// Playground
const playground = createConfig({
    target: 'web',
    distPath: './playground',
    entry: {
        playground: './src/playground/playground.js',
        queryPlayground: './src/playground/queryPlayground.js'
    },
    playground: 8361
});

playground.plugins.push(
    new CopyWebpackPlugin({
        patterns: [{
            context: 'src/playground',
            from: '*.+(html|css)'
        }]
    })
);

// Web-compatible
const web = createConfig({
    target: 'web',
    distPath: './dist/web',
    entry: {
        'scratch-render': './src/index.js',
        'scratch-render.min': './src/index.js'
    }
});

// Node-compatible
const node = createConfig({
    target: 'node'
});

module.exports = [playground, web, node];
```

Other packages can then consume that package from source by listing it in `workspacePackages`:

```javascript
// @ts-check
/**
 * @import { WebpackManifest } from '../infra';
 */
const CopyWebpackPlugin = require('copy-webpack-plugin');

/** @satisfies {WebpackManifest} */
const base = {
    libraryName: 'Consumer',
    entry: './src/index.js',
    rootPath: __dirname,
    enableReact: true,
    enableTs: true,
    workspacePackages: [
        'clipcc-render'
    ],
    plugins: [
        new CopyWebpackPlugin({
            /* ... */
        })
    ]
};

module.exports = base;
```

When a package is listed in `workspacePackages`, the builder will:

1. Add an exact-match alias from `package-name$` to that package's entry file, so `import 'package-name'` resolves to its declared source entry.
2. Add a prefix alias from `package-name` to that package's source directory, so `import 'package-name/foo'` resolves inside its source tree.
3. Expand the default JS, TS, and React CSS handling to include that package's source paths.
4. Merge the package's own aliases, rules, and snapshot configuration into the generated config.
5. Recursively load its own `workspacePackages`, so nested source dependencies can also be compiled from source.

### Default Behavior

The builder currently does these things:

- Resolves `entry`, `srcPath`, `distPath`, rule `include` and `exclude` paths, alias values, and snapshot paths relative to `rootPath`.
- Uses `cheap-module-source-map` by default for `devtool`.
- Uses `target: 'web'` by default.
- Emits UMD output for non-node targets and CommonJS output for node-like targets.
- Adds `babel-loader` with `@babel/preset-env` for JS sources.
- Adds `@babel/preset-react` when `enableReact` is enabled.
- Adds `ts-loader` with `transpileOnly: true` when `enableTs` is enabled.
- Adds CSS module handling for `.css` files under React source paths when `enableReact` is enabled.
- Injects `Buffer` through `webpack.ProvidePlugin`.
- Enables `devServer` when `playground` is set.
- Preserves user-supplied `optimization` and appends a terser pass for files that end with `.min.js`.
- Enables `splitChunks.chunks = 'async'` when `shouldSplitChunks` is enabled.
- Sets `externalsPresets.node = true` and disables `nodePrefixForCoreModules` for node-like targets.

### Asset Handling

The built-in rules currently add only a few asset-oriented behaviors:

```js
import firmware from './firmware.hex';
import bytes from './sound.wav?arrayBuffer';
import text from './template.svg?raw';
```

- `.hex` files are emitted as inline `data:` URLs using base64 text content.
- `?arrayBuffer` uses `arraybuffer-loader`.
- `?raw` uses webpack's `asset/source` behavior.

If you need additional asset module behavior such as `asset/resource` or `asset/inline` for other file types, add a custom rule in your manifest.

### API

#### `new WebpackConfigBuilder(manifest: WebpackManifest)`

Creates a builder instance and normalizes the manifest immediately. Any packages listed in `workspacePackages` are resolved and merged during construction.

Required manifest fields:

- `entry`: The webpack entry definition for the package.
- `libraryName`: The UMD global name used for non-node targets.
- `rootPath`: The base directory used to resolve relative paths in the manifest.

Optional manifest fields:

- `target`: Webpack target. Node-like targets switch output to CommonJS and enable `externalsPresets.node`.
- `devTool`: Source map mode for the generated config. Defaults to `cheap-module-source-map`.
- `srcPath`: Main source directory. Defaults to `./src`.
- `distPath`: Output directory for the bundle. Defaults to `./dist`.
- `publicPath`: Runtime base URL for emitted assets. Defaults to `/`.
- `sourcePaths`: Additional source directories that should go through the default JS and TS pipeline.
- `enableReact`: Enables React JS transpilation and CSS module handling for React source paths.
- `enableTs`: Enables `ts-loader` for TypeScript and TSX entries.
- `shouldSplitChunks`: Enables async chunk splitting under `optimization.splitChunks`.
- `rules`: Additional webpack rules appended after the built-in rules.
- `plugins`: Additional webpack plugins appended after the built-in `Buffer` provider.
- `alias`: Extra `resolve.alias` entries. These can override aliases inherited from workspace packages.
- `snapshot`: Snapshot configuration merged into the final webpack config.
- `playground`: Enables `devServer`; pass `true` to use `PORT` or `auto`, or pass a number to force a port.
- `externals`: Webpack externals passed through to the final config.
- `optimization`: Extra optimization settings merged into the final config before the default `.min.js` terser entry is appended.
- `workspacePackages`: Package names to consume from source through `webpack.manifest.js`.

#### `builder.addWorkspacePackage(packageName: string)`

Loads a package manifest from `packageName/webpack.manifest.js` and merges its source-aware aliases, rules, snapshot settings, and recursive workspace package dependencies into the current builder.

#### `builder.get(): Configuration`

Builds and returns the final webpack configuration object.

#### Browser Targets

This package does not manage a shared `browserslist` definition. If your Babel and other tooling need browser targeting, configure `browserslist` in your package's `package.json` or a top-level `.browserslistrc` file so the same target matrix can be reused everywhere.

