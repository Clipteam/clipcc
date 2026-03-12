const path = require('path');
const Module = require('module');

const WebpackConfigBuilder = require('../src');

const originalResolveFilename = Module._resolveFilename;

const fixtureDir = path.join(__dirname, 'fixtures', 'workspace-packages');

const fixturePackageJsonPaths = {
	'test-workspace-alpha/package.json': path.join(fixtureDir, 'alpha', 'package.json'),
	'test-workspace-beta/package.json': path.join(fixtureDir, 'beta', 'package.json'),
	'test-workspace-gamma/package.json': path.join(fixtureDir, 'gamma', 'package.json')
};

const getRuleByLoader = (rules, loader) => rules.find(rule => rule.loader === loader);

describe('WebpackConfigBuilder workspace packages', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	test('merges workspace package manifests recursively into the generated config', () => {
		jest.spyOn(Module, '_resolveFilename').mockImplementation((request, parent, isMain, options) => {
			if (request in fixturePackageJsonPaths) {
				return fixturePackageJsonPaths[request];
			}

			return originalResolveFilename.call(Module, request, parent, isMain, options);
		});

		const rootPath = path.join(__dirname, 'fixtures', 'workspace-consumer');

		const config = new WebpackConfigBuilder({
			rootPath,
			libraryName: 'WorkspaceFixture',
			entry: './src/index.js',
			workspacePackages: ['test-workspace-alpha'],
			alias: {
				'@workspace-shared': './local-alias'
			},
			snapshot: {
				managedPaths: ['./local-managed']
			}
		}).get();

		const alphaRoot = path.join(fixtureDir, 'alpha');
		const betaRoot = path.join(fixtureDir, 'beta');
		const gammaRoot = path.join(fixtureDir, 'gamma');

		expect(config.resolve.extensions).toEqual(['.ts', '.js', '.tsx', '.jsx']);
		expect(config.resolve.alias).toEqual(expect.objectContaining({
			'test-workspace-alpha': path.join(alphaRoot, 'src'),
			'test-workspace-alpha$': path.join(alphaRoot, 'src', 'index.js'),
			'test-workspace-beta': path.join(betaRoot, 'src'),
			'test-workspace-beta$': path.join(betaRoot, 'src', 'beta-entry.js'),
			'test-workspace-gamma': path.join(gammaRoot, 'src'),
			'test-workspace-gamma$': path.join(gammaRoot, 'src', 'gamma-entry.js'),
			'@beta-only': path.join(betaRoot, 'beta-alias'),
			'@gamma-only': path.join(gammaRoot, 'gamma-alias'),
			'@workspace-shared': path.join(rootPath, 'local-alias')
		}));

		const tsRule = getRuleByLoader(config.module.rules, 'ts-loader');
		expect(tsRule.include).toEqual(expect.arrayContaining([
			path.join(rootPath, 'src'),
			path.join(alphaRoot, 'src'),
			path.join(alphaRoot, 'alpha-extra'),
			path.join(betaRoot, 'src'),
			path.join(betaRoot, 'beta-extra'),
			path.join(gammaRoot, 'src')
		]));

		const cssRule = config.module.rules.find(rule => Array.isArray(rule.use));
		expect(cssRule.include).toEqual(expect.arrayContaining([
			path.join(alphaRoot, 'src'),
			path.join(alphaRoot, 'alpha-extra'),
			path.join(gammaRoot, 'src')
		]));
		expect(cssRule.include).not.toContain(path.join(rootPath, 'src'));
		expect(cssRule.include).not.toContain(path.join(betaRoot, 'src'));

		const appendedRules = config.module.rules.filter(rule => Array.isArray(rule.rules));
		expect(appendedRules).toHaveLength(3);
		expect(appendedRules[0]).toMatchObject({
			include: path.join(alphaRoot, 'src')
		});
		expect(appendedRules[0].rules[0]).toMatchObject({
			test: /\.alpha$/,
			include: path.join(alphaRoot, 'alpha-include')
		});
		expect(appendedRules[0].rules[0].oneOf[0]).toMatchObject({
			test: /\.alpha-inner$/,
			include: path.join(alphaRoot, 'alpha-inner')
		});

		expect(appendedRules[1]).toMatchObject({
			include: path.join(betaRoot, 'src')
		});
		expect(appendedRules[1].rules[0]).toMatchObject({
			test: /\.beta$/,
			exclude: path.join(betaRoot, 'beta-exclude')
		});

		expect(appendedRules[2]).toMatchObject({
			include: path.join(gammaRoot, 'src')
		});
		expect(appendedRules[2].rules[0]).toMatchObject({
			test: /\.gamma$/,
			include: path.join(gammaRoot, 'gamma-include')
		});

		expect(config.snapshot).toMatchObject({
			immutablePaths: expect.arrayContaining([
				path.join(alphaRoot, 'alpha-immutable'),
				path.join(betaRoot, 'beta-immutable')
			]),
			managedPaths: expect.arrayContaining([
				path.join(rootPath, 'local-managed'),
				path.join(betaRoot, 'beta-managed')
			]),
			unmanagedPaths: expect.arrayContaining([
				path.join(alphaRoot, 'alpha-unmanaged'),
				path.join(gammaRoot, 'gamma-unmanaged')
			])
		});
	});
});
