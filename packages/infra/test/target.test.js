const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const WebpackConfigBuilder = require('../src');

const getRuleByLoader = (rules, loader) => rules.find(rule => rule.loader === loader);

const getAssetRule = (rules, predicate) => rules.find(predicate);

describe('WebpackConfigBuilder targets', () => {
	const originalNodeEnv = process.env.NODE_ENV;
	const originalPort = process.env.PORT;

	afterEach(() => {
		process.env.NODE_ENV = originalNodeEnv;
		process.env.PORT = originalPort;
	});

	test('builds the expected web configuration defaults and feature flags', () => {
		const rootPath = path.join(__dirname, 'fixtures', 'target-consumer');

		process.env.NODE_ENV = 'production';
		process.env.PORT = '4321';

		const config = new WebpackConfigBuilder({
			rootPath,
			libraryName: 'TargetFixture',
			entry: {
				main: './src/index.js',
				worker: {
					import: ['./src/worker.js', './src/runtime.js']
				}
			},
			enableReact: true,
			enableTs: true,
			sourcePaths: ['./extras'],
			alias: {
				'@shared': './shared'
			},
			rules: [{
				test: /\.custom$/,
				include: './custom',
				oneOf: [{
					test: /\.custom-child$/,
					include: './nested'
				}]
			}],
			shouldSplitChunks: true,
			optimization: {
				moduleIds: 'deterministic'
			},
			playground: true,
			publicPath: '/static/'
		}).get();

		expect(config.context).toBe(rootPath);
		expect(config.mode).toBe('production');
		expect(config.devtool).toBe('cheap-module-source-map');
		expect(config.entry).toEqual({
			main: path.join(rootPath, 'src', 'index.js'),
			worker: {
				import: [
					path.join(rootPath, 'src', 'worker.js'),
					path.join(rootPath, 'src', 'runtime.js')
				]
			}
		});
		expect(config.output).toMatchObject({
			path: path.join(rootPath, 'dist'),
			publicPath: '/static/',
			filename: '[name].js',
			chunkFilename: 'chunks/[name].js',
			library: {
				name: 'TargetFixture',
				type: 'umd'
			}
		});
		expect(config.resolve).toEqual({
			extensions: ['.ts', '.js', '.tsx', '.jsx'],
			alias: {
				'@shared': path.join(rootPath, 'shared')
			},
			symlinks: false
		});

		const tsRule = getRuleByLoader(config.module.rules, 'ts-loader');
		expect(tsRule).toMatchObject({
			test: /\.([cm]?ts|tsx)$/,
			loader: 'ts-loader',
			options: {
				transpileOnly: true
			},
			include: [
				path.join(rootPath, 'src'),
				path.join(rootPath, 'extras')
			]
		});

		const babelRule = getRuleByLoader(config.module.rules, 'babel-loader');
		expect(babelRule).toMatchObject({
			test: /\.[cm]?jsx?$/,
			loader: 'babel-loader',
			include: [
				path.join(rootPath, 'src'),
				path.join(rootPath, 'extras')
			]
		});
		expect(babelRule.options).toMatchObject({
			babelrc: false,
			presets: ['@babel/preset-env', '@babel/preset-react']
		});

		const cssRule = getAssetRule(config.module.rules, rule => Array.isArray(rule.use));
		expect(cssRule).toMatchObject({
			test: /\.css$/,
			include: [
				path.join(rootPath, 'src'),
				path.join(rootPath, 'extras')
			]
		});
		expect(cssRule.use.map(loader => loader.loader)).toEqual([
			'style-loader',
			'css-loader',
			'postcss-loader'
		]);

		const customRule = config.module.rules.find(rule => String(rule.test) === String(/\.custom$/));
		expect(customRule).toMatchObject({
			include: path.join(rootPath, 'custom')
		});
		expect(customRule.oneOf[0]).toMatchObject({
			test: /\.custom-child$/,
			include: path.join(rootPath, 'nested')
		});

		expect(getAssetRule(config.module.rules, rule => String(rule.test) === String(/\.hex$/))).toMatchObject({
			type: 'asset/inline'
		});
		expect(getAssetRule(config.module.rules, rule => String(rule.resourceQuery) === String(/raw/))).toMatchObject({
			type: 'asset/source'
		});
		expect(getAssetRule(config.module.rules, rule => rule.resourceQuery === '?arrayBuffer')).toMatchObject({
			type: 'javascript/auto',
			use: 'arraybuffer-loader'
		});

		expect(config.plugins[0]).toBeInstanceOf(webpack.ProvidePlugin);
		expect(config.devServer).toEqual({
			static: path.join(rootPath, 'dist'),
			host: '0.0.0.0',
			port: '4321'
		});
		expect(config.optimization).toMatchObject({
			minimize: true,
			moduleIds: 'deterministic',
			splitChunks: {
				chunks: 'async'
			}
		});
		expect(config.optimization.minimizer).toHaveLength(1);
		expect(config.optimization.minimizer[0]).toBeInstanceOf(TerserPlugin);
	});

	test('builds node targets with commonjs output and node presets', () => {
		const rootPath = path.join(__dirname, 'fixtures', 'node-consumer');

		process.env.NODE_ENV = 'development';

		const config = new WebpackConfigBuilder({
			rootPath,
			libraryName: 'NodeFixture',
			entry: './src/index.js',
			target: 'node18',
			enableTs: true
		}).get();

		expect(config.mode).toBe('development');
		expect(config.entry).toBe(path.join(rootPath, 'src', 'index.js'));
		expect(config.output.library).toEqual({
			type: 'commonjs2'
		});
		expect(config.externalsPresets).toEqual({
			node: true
		});
		expect(config.output.environment).toEqual({
			nodePrefixForCoreModules: false
		});
		expect(config.resolve.extensions).toEqual(['.ts', '.js']);
		expect(config.devServer).toBeUndefined();
	});
});
