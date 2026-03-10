const path = require('path');

const merge = require('lodash.merge');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
const TerserPlugin = require("terser-webpack-plugin")

const DEFAULT_CHUNK_FILENAME = 'chunks/[name].[chunkhash].js';
const DEFAULT_ASSET_FILENAME = 'assets/[name].[hash][ext][query]';
const DEFAULT_TS_LOADER_OPTIONS = {
    transpileOnly: true,
    allowTsInNodeModules: true
};

/**
 * @typedef {import('webpack').Configuration} Configuration
 * @typedef {import('webpack').RuleSetRule} RuleSetRule
 * @typedef {import('webpack').WebpackPluginFunction} WebpackPluginFunction
 * @typedef {import('webpack').WebpackPluginInstance} WebpackPluginInstance
*/

/**
 * @param {string|URL} [path] A file path as a string or `file://` URL.
 * @returns {string|undefined} The file path as a string, or `undefined` if `path` is not a string or `file://` URL.
 */
const toPath = path => {
    if (typeof path === 'string') {
        return path;
    }
    if (path?.protocol === 'file:') {
        return path.pathname;
    }
};

/**
 * @param {unknown} value
 * @returns {Array<unknown>}
 */
const toArray = value => {
    if (Array.isArray(value)) {
        return value;
    }
    if (typeof value === 'undefined') {
        return [];
    }
    return [value];
};

/**
 * @param {unknown[]} items
 * @returns {unknown[]}
 */
const unique = items => [...new Set(items.filter(item => typeof item !== 'undefined'))];

/**
 * @param {object} value
 * @returns {boolean}
 */
const hasOwnProperties = value => Boolean(value) && Object.keys(value).length > 0;

class ScratchWebpackConfigBuilder {
    /**
     * @param {object} options Options for the webpack configuration.
     * @param {string|URL} [options.rootPath] The absolute path to the project root.
     * @param {string|URL} [options.distPath] The absolute path to build output. Defaults to `dist` under `rootPath`.
     * @param {string|URL} [options.publicPath] The public location where the output assets will be located. Defaults to `/`.
     * @param {boolean} [options.enableReact] Whether to enable React and JSX support.
     * @param {boolean} [options.enableTs] Whether to enable TypeScript support.
     * @param {string} [options.libraryName] The name of the library to build. Shorthand for `output.library.name`.
     * @param {string|URL} [options.srcPath] The absolute path to the source files. Defaults to `src` under `rootPath`.
     * @param {Array<string|URL>} [options.sourcePaths] Additional source paths to process with the default JS/TS rules.
     * @param {boolean} [options.shouldSplitChunks] Whether to enable spliting code to chunks.
     * @param {RegExp[]} [options.cssModuleExceptions] Optional array of regex rules that exclude matching CSS files from CSS module scoping.
     * @param {object} [options.tsLoaderOptions] Additional options for `ts-loader`.
     * @param {boolean} [options.useDefaultTsLoaderOptions] Whether to apply ClipCC's default `ts-loader` options.
     */
    constructor ({
        distPath,
        enableReact,
        enableTs,
        libraryName,
        rootPath,
        srcPath,
        sourcePaths = [],
        publicPath = '/',
        shouldSplitChunks,
        cssModuleExceptions = [],
        tsLoaderOptions,
        useDefaultTsLoaderOptions = true
    }) {
        const isProduction = process.env.NODE_ENV === 'production';
        const mode = isProduction ? 'production' : 'development';
        const resolvedTsLoaderOptions = enableTs ? merge(
            {},
            useDefaultTsLoaderOptions ? DEFAULT_TS_LOADER_OPTIONS : {},
            tsLoaderOptions
        ) : undefined;

        this._enableReact = Boolean(enableReact);
        this._enableTs = Boolean(enableTs);
        this._cssModuleExceptions = cssModuleExceptions;
        this._libraryName = libraryName;
        this._publicPath = publicPath;
        this._rootPath = toPath(rootPath) || '.'; // '.' will cause a webpack error since src must be absolute
        this._srcPath = toPath(srcPath) ?? path.resolve(this._rootPath, 'src');
        this._distPath = toPath(distPath) ?? path.resolve(this._rootPath, 'dist');
        this._shouldSplitChunks = shouldSplitChunks;
        this._sourcePaths = unique([
            this._srcPath,
            ...toArray(sourcePaths).map(candidate => toPath(candidate))
        ]);
        this._tsLoaderOptions = tsLoaderOptions;
        this._useDefaultTsLoaderOptions = useDefaultTsLoaderOptions;

        this._defaultJsRule = {
            test: enableReact ? /\.[cm]?jsx?$/ : /\.[cm]?js$/,
            include: this._sourcePaths,
            loader: 'babel-loader',
            options: {
                presets: [
                    '@babel/preset-env',
                    ...(
                        enableReact ? ['@babel/preset-react'] : []
                    )
                ]
            }
        };

        this._defaultTsRule = enableTs ? {
            test: enableReact ? /\.[cm]?tsx?$/ : /\.[cm]?ts$/,
            include: this._sourcePaths,
            loader: 'ts-loader',
            ...(hasOwnProperties(resolvedTsLoaderOptions) ? {
                options: resolvedTsLoaderOptions
            } : {})
        } : null;

        /**
         * @type {Configuration}
         */
        this._config = {
            mode,
            devtool: 'cheap-module-source-map',
            entry: libraryName ? {
                [libraryName]: path.resolve(this._srcPath, 'index')
            } : path.resolve(this._srcPath, 'index'),
            optimization: {
                minimize: isProduction,
                minimizer: [
                    new TerserPlugin({
                        // Limiting Terser to use only 2 threads. At least for building scratch-gui
                        // this results in a performance gain (from ~60s to ~36s) on a MacBook with
                        // M1 Pro and 32GB of RAM and halving the memory usage (from ~11GB at peaks to ~6GB)
                        parallel: 2
                    })
                ],
                ...(
                    shouldSplitChunks ? {
                        splitChunks: {
                            chunks: 'all',
                            filename: DEFAULT_CHUNK_FILENAME,
                        },
                        mergeDuplicateChunks: true
                    } : {}
                )
            },
            output: {
                clean: true,
                filename: '[name].js',
                assetModuleFilename: DEFAULT_ASSET_FILENAME,
                chunkFilename: DEFAULT_CHUNK_FILENAME,
                path: this._distPath,
                // See https://github.com/scratchfoundation/scratch-editor/pull/25/files/9bc537f9bce35ee327b74bd6715d6c5140f73937#r1763073684
                publicPath,
                library: {
                    name: libraryName,
                    type: 'umd2'
                }
            },
            resolve: {
                extensions: [
                    '.mjs',
                    '.cjs',
                    ...(
                        enableReact ? [
                            '.mjsx',
                            '.cjsx',
                            '.jsx'
                        ] : []
                    ),
                    ...(enableTs ? ['.ts', '.tsx'] : []),
                    // webpack supports '...' to include defaults, but eslint does not
                    '.js',
                    '.json'
                ]
            },
            module: {
                rules: [
                    this._defaultJsRule,
                    {
                        // `asset` automatically chooses between exporting a data URI and emitting a separate file.
                        // Previously achievable by using `url-loader` with asset size limit.
                        // If file output is chosen, it is saved with the default asset module filename.
                        resourceQuery: '?asset',
                        type: 'asset'
                    },
                    {
                        // `asset/resource` emits a separate file and exports the URL.
                        // Previously achievable by using `file-loader`.
                        // Output is saved with the default asset module filename.
                        resourceQuery: /^\?(resource|file)$/,
                        type: 'asset/resource'
                    },
                    {
                        // `asset/inline` exports a data URI of the asset.
                        // Previously achievable by using `url-loader`.
                        // Because the file is inlined, there is no filename.
                        resourceQuery: /^\?(inline|url)$/,
                        type: 'asset/inline'
                    },
                    {
                        // `asset/source` exports the source code of the asset.
                        // Previously achievable by using `raw-loader`.
                        resourceQuery: /^\?(source|raw)$/,
                        type: 'asset/source',
                        generator: {
                            // This filename seems unused, but if it ever gets used,
                            // its extension should not match the asset's extension.
                            filename: DEFAULT_ASSET_FILENAME + '.js'
                        }
                    },
                    {
                        resourceQuery: '?arrayBuffer',
                        type: 'javascript/auto',
                        use: 'arraybuffer-loader'
                    },
                    {
                        test: /\.hex$/,
                        use: [{
                            loader: 'url-loader',
                            options: {
                                limit: 16 * 1024
                            }
                        }]
                    },
                    ...(
                        enableReact ? [
                            {
                                test: /\.css$/,
                                ...(cssModuleExceptions.length > 0 ? {
                                    exclude: cssModuleExceptions
                                } : {}),
                                use: [
                                    {
                                        loader: 'style-loader'
                                    },
                                    {
                                        loader: 'css-loader',
                                        options: {
                                            modules: {
                                                namedExport: false,
                                                localIdentName: '[name]_[local]_[hash:base64:5]',
                                                exportLocalsConvention: 'camelCase'
                                            },
                                            importLoaders: 1,
                                            esModule: false
                                        }
                                    },
                                    {
                                        loader: 'postcss-loader',
                                        options: {
                                            postcssOptions: {
                                                plugins: [
                                                    'postcss-import',
                                                    'postcss-simple-vars',
                                                    'autoprefixer'
                                                ]
                                            }
                                        }
                                    }
                                ]
                            },
                            ...(cssModuleExceptions.length > 0 ? [{
                                test: cssModuleExceptions,
                                use: [
                                    'style-loader',
                                    'css-loader',
                                    {
                                        loader: 'postcss-loader',
                                        options: {
                                            postcssOptions: {
                                                plugins: [
                                                    'postcss-import',
                                                    'autoprefixer'
                                                ]
                                            }
                                        }
                                    }
                                ]
                            }] : [])
                        ] : []
                    ),
                    ...(this._defaultTsRule ? [this._defaultTsRule] : []),
                ],
            },
            plugins: [
                new webpack.ProvidePlugin({
                    Buffer: ['buffer', 'Buffer']
                })
            ]
        };
    }

    /**
     * @returns {ScratchWebpackConfigBuilder} a copy of the current configuration builder.
     */
    clone() {
        return new ScratchWebpackConfigBuilder({
            libraryName: this._libraryName,
            rootPath: this._rootPath,
            srcPath: this._srcPath,
            distPath: this._distPath,
            sourcePaths: this._sourcePaths,
            publicPath: this._publicPath,
            enableReact: this._enableReact,
            enableTs: this._enableTs,
            shouldSplitChunks: this._shouldSplitChunks,
            cssModuleExceptions: this._cssModuleExceptions,
            tsLoaderOptions: this._tsLoaderOptions,
            useDefaultTsLoaderOptions: this._useDefaultTsLoaderOptions
        }).merge(this._config);
    }

    /**
     * @returns {Configuration} a copy of the current configuration object.
     */
    get() {
        return merge({}, this._config);
    }

    /**
     * Merge new settings into the current configuration object, overriding existing values.
     * @param {Configuration} overrides Settings to apply.
     * @returns {this}
     */
    merge(overrides) {
        merge(this._config, overrides);
        return this;
    }

    /**
     * Append new externals to the current configuration object.
     * @param {string[]} externals Externals to add.
     * @returns {this}
     */
    addExternals(externals) {
        this._config.externals = (this._config.externals ?? []).concat(externals);
        return this;
    }

    /**
     * Add another source path to the default JS/TS loader rules.
     * @param {string|URL} sourcePath The additional source path.
     * @returns {this}
     */
    addSourcePath(sourcePath) {
        const resolvedSourcePath = toPath(sourcePath);
        if (!resolvedSourcePath) {
            return this;
        }

        this._sourcePaths = unique([...this._sourcePaths, resolvedSourcePath]);

        if (this._defaultJsRule) {
            this._defaultJsRule.include = this._sourcePaths;
        }
        if (this._defaultTsRule) {
            this._defaultTsRule.include = this._sourcePaths;
        }

        return this;
    }

    /**
     * Add or override a resolve alias.
     * @param {string} alias The alias name.
     * @param {string|URL} target The aliased path.
     * @returns {this}
     */
    addResolveAlias(alias, target) {
        const resolvedTarget = toPath(target);
        if (!alias || !resolvedTarget) {
            return this;
        }

        this._config.resolve = this._config.resolve ?? {};
        this._config.resolve.alias = {
            ...(this._config.resolve.alias ?? {}),
            [alias]: resolvedTarget
        };

        return this;
    }

    /**
     * Add rules scoped to a specific resource path.
     * @param {string|URL} includePath Path to scope the rules to.
     * @param {RuleSetRule[]} rules Rules to evaluate within the scope.
     * @returns {this}
     */
    addScopedModuleRules(includePath, rules) {
        const resolvedIncludePath = toPath(includePath);
        if (!resolvedIncludePath || !Array.isArray(rules) || rules.length === 0) {
            return this;
        }

        return this.addModuleRule({
            include: resolvedIncludePath,
            rules
        });
    }

    /**
     * @param {Configuration['resolve']} resolveOptions
     */
    _mergeResolveOptions(resolveOptions = {}) {
        if (!hasOwnProperties(resolveOptions)) {
            return;
        }

        this._config.resolve = this._config.resolve ?? {};

        if (resolveOptions.alias) {
            this._config.resolve.alias = merge({}, this._config.resolve.alias ?? {}, resolveOptions.alias);
        }
        if (resolveOptions.fallback) {
            this._config.resolve.fallback = merge({}, this._config.resolve.fallback ?? {}, resolveOptions.fallback);
        }
        if (resolveOptions.extensions) {
            this._config.resolve.extensions = unique([
                ...(this._config.resolve.extensions ?? []),
                ...resolveOptions.extensions
            ]);
        }

        if (Object.prototype.hasOwnProperty.call(resolveOptions, 'symlinks')) {
            this._config.resolve.symlinks = resolveOptions.symlinks;
        }

        const otherResolveOptions = {...resolveOptions};
        delete otherResolveOptions.alias;
        delete otherResolveOptions.extensions;
        delete otherResolveOptions.fallback;
        delete otherResolveOptions.symlinks;

        merge(this._config.resolve, otherResolveOptions);
    }

    /**
     * @param {Configuration['snapshot']} snapshotOptions
     */
    _mergeSnapshotOptions(snapshotOptions = {}) {
        if (!hasOwnProperties(snapshotOptions)) {
            return;
        }

        this._config.snapshot = this._config.snapshot ?? {};

        for (const property of ['immutablePaths', 'managedPaths', 'unmanagedPaths']) {
            if (snapshotOptions[property]) {
                this._config.snapshot[property] = unique([
                    ...(this._config.snapshot[property] ?? []),
                    ...snapshotOptions[property]
                ]);
            }
        }

        const otherSnapshotOptions = {...snapshotOptions};
        delete otherSnapshotOptions.immutablePaths;
        delete otherSnapshotOptions.managedPaths;
        delete otherSnapshotOptions.unmanagedPaths;

        merge(this._config.snapshot, otherSnapshotOptions);
    }

    /**
     * Register a workspace package that should be resolved and loaded from source.
     *
     * Rules imported from the workspace package are wrapped in a parent rule whose
     * `include` condition is the package source path, so package-specific loaders do
     * not leak into the consumer package.
     *
     * @param {object} workspacePackage Workspace package settings.
     * @param {string} [workspacePackage.name] Package name used as the default alias.
     * @param {string} [workspacePackage.alias] Alias name to register.
     * @param {string|URL} [workspacePackage.aliasTarget] Path the alias should resolve to. Defaults to `srcPath`.
     * @param {Configuration} [workspacePackage.config] Existing package webpack config to merge selectively.
     * @param {string|URL} [workspacePackage.rootPath] Package root. Used to infer `srcPath`.
     * @param {string|URL} [workspacePackage.srcPath] Package source path. Defaults to `src` under `rootPath`.
     * @param {RuleSetRule[]} [workspacePackage.moduleRules] Package-specific module rules.
     * @param {Configuration['resolve']} [workspacePackage.resolve] Additional resolve options.
     * @param {Configuration['snapshot']} [workspacePackage.snapshot] Additional snapshot options.
     * @param {boolean} [workspacePackage.includeInDefaultLoaders] Whether default JS/TS rules should process this package.
     * @returns {this}
     */
    addWorkspacePackage({
        name,
        alias,
        aliasTarget,
        config,
        rootPath,
        srcPath,
        moduleRules = [],
        resolve,
        snapshot,
        includeInDefaultLoaders = true
    }) {
        const resolvedRootPath = toPath(rootPath);
        const resolvedSrcPath = toPath(srcPath) ?? (resolvedRootPath ? path.resolve(resolvedRootPath, 'src') : undefined);
        const resolvedAliasTarget = toPath(aliasTarget) ?? resolvedSrcPath;
        const packageAlias = alias ?? name;
        const scopedModuleRules = [
            ...(config?.module?.rules ?? []),
            ...moduleRules
        ];

        if (!resolvedSrcPath && !resolvedAliasTarget) {
            throw new Error('addWorkspacePackage requires rootPath, srcPath, or aliasTarget');
        }

        if (packageAlias && resolvedAliasTarget) {
            this.addResolveAlias(packageAlias, resolvedAliasTarget);
        }

        if (includeInDefaultLoaders) {
            this.addSourcePath(resolvedSrcPath ?? resolvedAliasTarget);
        }

        if (scopedModuleRules.length > 0) {
            this.addScopedModuleRules(resolvedSrcPath ?? resolvedAliasTarget, scopedModuleRules);
        }

        this._mergeResolveOptions(config?.resolve);
        this._mergeResolveOptions(resolve);
        this._mergeSnapshotOptions(config?.snapshot);
        this._mergeSnapshotOptions(snapshot);

        return this;
    }

    /**
     * Set the target environment for this configuration.
     * @param {string} target The target environment, like `node`, `browserslist`, etc.
     * @returns {this}
     */
    setTarget(target) {
        this._config.target = target;

        if (target.startsWith('node')) {
            this.merge({
                externalsPresets: {node: true},
                externals: [nodeExternals()],
                output: {
                    path: path.resolve(this._distPath, 'node')
                }
            });
        } else if (target.startsWith('browserslist')) {
            this.merge({
                externalsPresets: {web: true},
                output: {
                    path: path.resolve(this._distPath, 'web')
                }
            });
        }

        return this;
    }

    /**
     * Enable the webpack dev server. Probably only useful for web targets.
     * @param {string|number} [port='auto'] The port to listen on, or `'auto'` to use a random port.
     * @returns {this}
     */
    enableDevServer (port = 'auto') {
        return this.merge({
            devServer: {
                client: {
                    overlay: true,
                    progress: true
                },
                port
            }
        });
    }

    /**
     * Add a new rule to `module.rules` in the current configuration object.
     * @param {RuleSetRule} rule The rule to add.
     * @returns {this}
     */
    addModuleRule(rule) {
        return this.merge({
            module: {
                rules: [
                    ...(this._config?.module?.rules ?? []),
                    rule
                ]
            }
        });
    }

    /**
     * Add a new plugin to `plugins` in the current configuration object.
     * @param {WebpackPluginInstance|WebpackPluginFunction} plugin The plugin to add.
     * @returns {this}
     */
    addPlugin(plugin) {
        return this.merge({
            plugins: [
                ...(this._config?.plugins ?? []),
                plugin
            ]
        });
    }
}

module.exports = ScratchWebpackConfigBuilder;
