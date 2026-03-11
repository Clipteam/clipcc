// @ts-check

const path = require('path');
const fs = require('fs');

const TerserPlugin = require('terser-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

/** @typedef {import('webpack').Configuration} Configuration */
/** @typedef {import('webpack').RuleSetRule} RuleSetRule */
/** @typedef {NonNullable<Configuration['snapshot']>} SnapshotConfig */
/** @typedef {NonNullable<Configuration['entry']>} EntryConfig */
/**
 * @typedef {Configuration & {
 *     devServer?: {
 *         static: string,
 *         host: string,
 *         port: string | number
 *     }
 * }} ConfigWithDevServer
 */
/**
 * @typedef {RuleSetRule & {
 *     include?: RuleSetRule['include'],
 *     exclude?: RuleSetRule['exclude'],
 *     rules?: ManifestRule[],
 *     oneOf?: ManifestRule[]
 * }} ManifestRule
 */
/**
 * @typedef {{
 *     entry: EntryConfig,
 *     libraryName: string,
 *     target?: Configuration['target'],
 *     devTool?: Configuration['devtool'],
 *     rootPath: string,
 *     srcPath?: string,
 *     distPath?: string,
 *     publicPath?: string,
 *     sourcePaths?: string[],
 *     enableReact?: boolean,
 *     enableTs?: boolean,
 *     shouldSplitChunks?: boolean,
 *     rules?: ManifestRule[],
 *     plugins?: Configuration['plugins'],
 *     alias?: Record<string, string>,
 *     snapshot?: SnapshotConfig,
 *     playground?: boolean | number,
 *     workspacePackages?: string[]
 * }} WebpackManifest
 */

const DEFAULT_CHUNK_FILENAME = 'chunks/[name].js';
const DEFAULT_TS_LOADER_OPTIONS = {
    transpileOnly: true,
    allowTsInNodeModules: true
};

/**
 * @param {Buffer} content
 * @returns {string}
 */
const createHexDataUrl = content => `data:text/plain;base64,${content.toString('base64')}`;

/**
 * @template T
 * @param {T | T[]=} value
 * @returns {T[]}
 */
const toArray = value => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'undefined') return [];
    return [value];
};

/**
 * @template T
 * @param {Array<T | undefined>} values
 * @returns {T[]}
 */
const unique = values => {
    const filteredValues = /** @type {T[]} */ (values.filter(value => typeof value !== 'undefined'));
    return Array.from(new Set(filteredValues));
};

/**
 * @param {string} rootPath
 * @param {ManifestRule[]=} rules
 * @returns {ManifestRule[]}
 */
const normalizeChildRules = (rootPath, rules) => (rules ?? [])
    .filter(childRule => Boolean(childRule) && typeof childRule === 'object')
    .map(childRule => normalizeRule(rootPath, /** @type {ManifestRule} */ (childRule)));

/**
 * @param {string} value
 * @returns {boolean}
 */
const isRelativePath = value => value.startsWith('.') || value.startsWith('..');

/**
 * @param {string} rootPath
 * @param {string} value
 * @returns {string}
 */
const maybeResolvePath = (rootPath, value) => {
    if (path.isAbsolute(value) || isRelativePath(value)) {
        return path.resolve(rootPath, value);
    }

    const resolvedPath = path.resolve(rootPath, value);
    return fs.existsSync(resolvedPath) ? resolvedPath : value;
};

/**
 * @param {string} rootPath
 * @param {EntryConfig} entry
 * @returns {EntryConfig}
 */
const normalizeEntry = (rootPath, entry) => {
    if (typeof entry === 'string') {
        return maybeResolvePath(rootPath, entry);
    }

    if (Array.isArray(entry)) {
        return entry.map(value => maybeResolvePath(rootPath, value));
    }

    return Object.fromEntries(
        Object.entries(entry).map(([key, value]) => {
            if (typeof value === 'string' || Array.isArray(value)) {
                return [key, normalizeEntry(rootPath, value)];
            }

            if (value && typeof value === 'object' && 'import' in value) {
                return [key, {
                    ...value,
                    ...(value.import ? {import: normalizeEntry(rootPath, value.import)} : {})
                }];
            }

            return [key, value];
        })
    );
};

/**
 * @param {EntryConfig} entry
 * @returns {string | undefined}
 */
const findFirstEntryPath = entry => {
    if (typeof entry === 'string') {
        return entry;
    }

    if (Array.isArray(entry)) {
        return entry[0];
    }

    for (const value of Object.values(entry)) {
        if (typeof value === 'string') {
            return value;
        }

        if (Array.isArray(value)) {
            return value[0];
        }

        if (value && typeof value === 'object' && 'import' in value) {
            const entryPath = value.import;

            if (typeof entryPath === 'string') {
                return entryPath;
            }

            if (Array.isArray(entryPath)) {
                return entryPath[0];
            }
        }
    }

    return undefined;
};

/**
 * @param {string} rootPath
 * @param {RuleSetRule['include'] | RuleSetRule['exclude']=} condition
 * @returns {RuleSetRule['include'] | RuleSetRule['exclude'] | undefined}
 */
const normalizeRuleCondition = (rootPath, condition) => {
    if (Array.isArray(condition)) {
        return condition.map(entry => typeof entry === 'string' ? path.resolve(rootPath, entry) : entry);
    }

    if (typeof condition === 'string') {
        return path.resolve(rootPath, condition);
    }

    return condition;
};

/**
 * @param {string} rootPath
 * @param {ManifestRule} rule
 * @returns {ManifestRule}
 */
const normalizeRule = (rootPath, rule) => ({
    ...rule,
    include: normalizeRuleCondition(rootPath, rule.include),
    exclude: normalizeRuleCondition(rootPath, rule.exclude),
    ...(Array.isArray(rule.rules) ? {
        rules: normalizeChildRules(rootPath, rule.rules)
    } : {}),
    ...(Array.isArray(rule.oneOf) ? {
        oneOf: normalizeChildRules(rootPath, rule.oneOf)
    } : {})
});

/**
 * @param {string} rootPath
 * @param {Configuration['snapshot']=} snapshot
 * @returns {Configuration['snapshot'] | undefined}
 */
const normalizeSnapshot = (rootPath, snapshot) => {
    if (!snapshot) return undefined;

    /**
     * @param {Array<string | RegExp>=} entries
     * @returns {Array<string | RegExp> | undefined}
     */
    const normalizePathEntries = entries => {
        if (!entries) return undefined;
        return unique(entries.map(entry => typeof entry === 'string' ? path.resolve(rootPath, entry) : entry));
    };

    return {
        ...snapshot,
        immutablePaths: normalizePathEntries(snapshot.immutablePaths),
        managedPaths: normalizePathEntries(snapshot.managedPaths),
        unmanagedPaths: normalizePathEntries(snapshot.unmanagedPaths)
    };
};

/**
 * @param {SnapshotConfig=} currentSnapshot
 * @param {SnapshotConfig=} nextSnapshot
 * @returns {SnapshotConfig}
 */
const mergeSnapshot = (currentSnapshot, nextSnapshot) => {
    if (!currentSnapshot && !nextSnapshot) return {};
    if (!currentSnapshot) return nextSnapshot ?? {};
    if (!nextSnapshot) return currentSnapshot;

    /**
     * @param {Array<string | RegExp>=} currentEntries
     * @param {Array<string | RegExp>=} nextEntries
     * @returns {Array<string | RegExp> | undefined}
     */
    const mergeEntries = (currentEntries, nextEntries) => {
        const merged = unique([...(currentEntries ?? []), ...(nextEntries ?? [])]);
        return merged.length > 0 ? merged : undefined;
    };

    return {
        ...currentSnapshot,
        ...nextSnapshot,
        immutablePaths: mergeEntries(currentSnapshot.immutablePaths, nextSnapshot.immutablePaths),
        managedPaths: mergeEntries(currentSnapshot.managedPaths, nextSnapshot.managedPaths),
        unmanagedPaths: mergeEntries(currentSnapshot.unmanagedPaths, nextSnapshot.unmanagedPaths)
    };
};

/**
 * @param {string} rootPath
 * @param {Record<string, string>} alias
 * @returns {Record<string, string>}
 */
const normalizeAlias = (rootPath, alias) => Object.fromEntries(
    Object.entries(alias).map(([key, value]) => [key, maybeResolvePath(rootPath, value)])
);

/**
 * @param {WebpackManifest} manifest
 * @returns {Required<WebpackManifest>}
 */
const normalizeManifest = manifest => {
    const rootPath = path.resolve(manifest.rootPath);
    const srcPath = path.resolve(rootPath, manifest.srcPath ?? 'src');
    const distPath = path.resolve(rootPath, manifest.distPath ?? 'dist');

    return {
        entry: normalizeEntry(rootPath, manifest.entry),
        libraryName: manifest.libraryName,
        devTool: manifest.devTool ?? 'cheap-module-source-map',
        rootPath,
        srcPath,
        distPath,
        publicPath: manifest.publicPath ?? '/',
        sourcePaths: unique(toArray(manifest.sourcePaths).map(sourcePath => path.resolve(rootPath, sourcePath))),
        enableReact: manifest.enableReact ?? false,
        enableTs: manifest.enableTs ?? false,
        shouldSplitChunks: manifest.shouldSplitChunks ?? false,
        rules: (manifest.rules ?? []).map(rule => normalizeRule(rootPath, rule)),
        alias: normalizeAlias(rootPath, manifest.alias ?? {}),
        plugins: manifest.plugins ?? [],
        snapshot: normalizeSnapshot(rootPath, manifest.snapshot) ?? {},
        target: manifest.target ?? 'web',
        playground: manifest.playground ?? false,
        workspacePackages: manifest.workspacePackages ?? []
    };
};

/**
 * @param {Required<WebpackManifest>} manifest
 * @returns {string}
 */
const getEntryPath = manifest => findFirstEntryPath(manifest.entry) ?? manifest.srcPath;

/**
 * @param {string} packageName
 * @param {Required<WebpackManifest>} manifest
 * @returns {Record<string, string>}
 */
const createWorkspaceAliases = (packageName, manifest) => ({
    [packageName]: manifest.srcPath,
    [`${packageName}$`]: getEntryPath(manifest)
});

/**
 * @param {Required<WebpackManifest>} manifest
 * @param {string[]} sourcePaths
 * @param {string[]} cssSourcePaths
 * @returns {RuleSetRule[]}
 */
const createDefaultRules = (manifest, sourcePaths, cssSourcePaths) => {
    /** @type {RuleSetRule[]} */
    const rules = [];

    if (manifest.enableTs) {
        rules.push({
            include: sourcePaths,
            test: /\.([cm]?ts|tsx)$/,
            loader: 'ts-loader',
            options: DEFAULT_TS_LOADER_OPTIONS
        });
    }

    rules.push({
        include: sourcePaths,
        test: manifest.enableReact ? /\.[cm]?jsx?$/ : /\.[cm]?js$/,
        loader: 'babel-loader',
        options: {
            babelrc: false,
            presets: [
                '@babel/preset-env',
                ...(manifest.enableReact ? ['@babel/preset-react'] : [])
            ]
        }
    });

    if (manifest.enableReact) {
        rules.push({
            include: cssSourcePaths,
            test: /\.css$/,
            use: [{
                loader: 'style-loader'
            }, {
                loader: 'css-loader',
                options: {
                    modules: {
                        localIdentName: '[name]_[local]_[hash:base64:5]',
                        exportLocalsConvention: 'camelCase'
                    },
                    importLoaders: 1
                }
            }, {
                loader: 'postcss-loader',
                options: {
                    postcssOptions: {
                        plugins: [
                            'postcss-import',
                            'autoprefixer'
                        ]
                    }
                }
            }]
        });
    }

    rules.push(
        {
            test: /\.hex$/,
            type: 'asset/inline',
            generator: {
                dataUrl: createHexDataUrl
            }
        },
        {
            resourceQuery: '?arrayBuffer',
            type: 'javascript/auto',
            use: 'arraybuffer-loader'
        },
        {
            resourceQuery: /raw/,
            type: 'asset/source'
        }
    );

    return rules;
};

/**
 * @param {string} packageName
 * @returns {WebpackManifest | null}
 */
const resolveWorkspacePackageManifest = packageName => {
    try {
        const packageJsonPath = require.resolve(`${packageName}/package.json`);
        const packageDir = path.dirname(packageJsonPath);
        const webpackManifestPath = path.join(packageDir, 'webpack.manifest.js');

        if (!fs.existsSync(webpackManifestPath)) return null;

        const manifest = require(webpackManifestPath);
        return manifest.default ?? manifest;
    } catch {
        return null;
    }
};

class WebpackConfigBuilder {
    /**
     * @param {WebpackManifest} manifest
     */
    constructor(manifest) {
        /** @readonly @private @type {Set<string>} */
        this.loadedWorkspacePackages = new Set();
        /** @type {Required<WebpackManifest>} */
        this.manifest = normalizeManifest(manifest);
        /** @readonly @private @type {string[]} */
        this.localSourcePaths = unique([
            this.manifest.srcPath,
            ...this.manifest.sourcePaths
        ]);

        for (const packageName of this.manifest.workspacePackages) {
            this.addWorkspacePackage(packageName);
        }
    }

    /**
     * @param {string} packageName
     * @returns {this}
     */
    addWorkspacePackage(packageName) {
        if (this.loadedWorkspacePackages.has(packageName)) {
            return this;
        }

        this.loadedWorkspacePackages.add(packageName);

        const workspaceManifest = resolveWorkspacePackageManifest(packageName);
        if (!workspaceManifest) {
            console.warn(`Package ${packageName} does not have a webpack manifest, skipping.`);
            return this;
        }

        const normalizedManifest = normalizeManifest(workspaceManifest);

        for (const dependencyName of normalizedManifest.workspacePackages) {
            this.addWorkspacePackage(dependencyName);
        }

        this.manifest.enableReact ||= normalizedManifest.enableReact;
        this.manifest.enableTs ||= normalizedManifest.enableTs;
        this.manifest.shouldSplitChunks ||= normalizedManifest.shouldSplitChunks;
        this.manifest.sourcePaths = unique([
            ...this.manifest.sourcePaths,
            normalizedManifest.srcPath,
            ...normalizedManifest.sourcePaths
        ]);

        this.manifest.alias = {
            ...createWorkspaceAliases(packageName, normalizedManifest),
            ...normalizedManifest.alias,
            ...this.manifest.alias
        };

        if (normalizedManifest.rules.length > 0) {
            this.manifest.rules = [{
                include: normalizedManifest.srcPath,
                rules: normalizedManifest.rules
            }, ...this.manifest.rules];
        }

        this.manifest.snapshot = mergeSnapshot(this.manifest.snapshot, normalizedManifest.snapshot);
        this.manifest.workspacePackages = unique([...this.manifest.workspacePackages, packageName]);

        return this;
    }

    /**
     * @returns {Configuration}
     */
    get() {
        const sourcePaths = unique([
            this.manifest.srcPath,
            ...this.manifest.sourcePaths
        ]);

        const targetingNode = this.manifest.target?.toString().startsWith('node');

        /** @type {Configuration['output']} */
        const output = {
            path: this.manifest.distPath,
            publicPath: this.manifest.publicPath,
            filename: '[name].js',
            chunkFilename: DEFAULT_CHUNK_FILENAME,
            ...(targetingNode ? {
                library: {
                    type: 'commonjs2'
                }
            } : {
                library: {
                    name: this.manifest.libraryName,
                    type: 'umd'
                }
            })
        };

        /** @type {ConfigWithDevServer} */
        const configuration = {
            context: this.manifest.rootPath,
            mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
            devtool: 'cheap-module-source-map',
            target: this.manifest.target,
            entry: this.manifest.entry,
            output,
            resolve: {
                extensions: this.manifest.enableReact ? ['.ts', '.js', '.tsx', '.jsx'] : (this.manifest.enableTs ? ['.ts', '.js'] : ['.js']),
                alias: this.manifest.alias,
                symlinks: false
            },
            module: {
                rules: [
                    ...createDefaultRules(this.manifest, sourcePaths, this.localSourcePaths),
                    ...this.manifest.rules
                ]
            },
            plugins: [...this.manifest.plugins]
        };

        if (Object.keys(this.manifest.snapshot).length > 0) {
            configuration.snapshot = this.manifest.snapshot;
        }

        if (this.manifest.shouldSplitChunks) {
            configuration.optimization = {
                ...(configuration.optimization ?? {}),
                splitChunks: {
                    chunks: 'async'
                }
            };
        }

        if (this.manifest.playground) {
            configuration.devServer = {
                static: this.manifest.distPath,
                host: '0.0.0.0',
                port: typeof this.manifest.playground === 'number' ? this.manifest.playground : (process.env.PORT || 'auto')
            };
        }

        configuration.optimization = {
            ...(configuration.optimization ?? {}),
            minimize: process.env.NODE_ENV === 'production',
            minimizer: [
                new TerserPlugin({
                    include: /\.min\.js$/
                })
            ]
        };

        if (targetingNode) {
            configuration.externalsPresets = {node: true};
            configuration.externals = [nodeExternals()];
        }

        return configuration;
    }
}

module.exports = WebpackConfigBuilder;
module.exports.default = WebpackConfigBuilder;
