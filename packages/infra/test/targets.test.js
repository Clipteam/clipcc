const path = require('path');

const webpack = require('webpack');

const ScratchWebpackConfigBuilder = require('../src/index.cjs');

const common = {
    libraryName: 'test-library',
    rootPath: path.resolve(__dirname)
};

describe('generating configurations for specific targets', () => {
    it('should should generate a valid configuration without a target', () => {
        const genericConfig = new ScratchWebpackConfigBuilder(common)
            .get();
        expect(genericConfig).not.toHaveProperty('target');
        expect(() => webpack.validate(genericConfig)).not.toThrow();
    });

    it('should should generate a valid `node` configuration', () => {
        const nodeConfig = new ScratchWebpackConfigBuilder(common)
            .setTarget('node')
            .get();
        expect(nodeConfig).toMatchObject({target: 'node'});
        expect(() => webpack.validate(nodeConfig)).not.toThrow();
    });

    it('should should generate a valid `browserslist` configuration', () => {
        const webConfig = new ScratchWebpackConfigBuilder(common)
            .setTarget('browserslist')
            .get();
        expect(webConfig).toMatchObject({target: 'browserslist'});
        expect(() => webpack.validate(webConfig)).not.toThrow();
    });
});

describe('TypeScript support', () => {
    it('uses a dedicated ts-loader rule with ClipCC defaults', () => {
        const externalSourcePath = path.resolve(__dirname, 'external-src');
        const config = new ScratchWebpackConfigBuilder({
            ...common,
            enableTs: true,
            sourcePaths: [externalSourcePath]
        }).get();

        const jsRule = config.module.rules.find(rule => rule.loader === 'babel-loader');
        const tsRule = config.module.rules.find(rule => rule.loader === 'ts-loader');

        expect(jsRule.test.test('example.js')).toBe(true);
        expect(jsRule.test.test('example.ts')).toBe(false);
        expect(tsRule).toMatchObject({
            options: {
                transpileOnly: true,
                allowTsInNodeModules: true
            }
        });
        expect(tsRule.include).toEqual(expect.arrayContaining([
            path.resolve(__dirname, 'src'),
            externalSourcePath
        ]));
        expect(() => webpack.validate(config)).not.toThrow();
    });

    it('lets callers override the default ts-loader options', () => {
        const config = new ScratchWebpackConfigBuilder({
            ...common,
            enableTs: true,
            tsLoaderOptions: {
                transpileOnly: false,
                projectReferences: true
            },
            useDefaultTsLoaderOptions: false
        }).get();

        const tsRule = config.module.rules.find(rule => rule.loader === 'ts-loader');

        expect(tsRule.options).toEqual({
            transpileOnly: false,
            projectReferences: true
        });
        expect(() => webpack.validate(config)).not.toThrow();
    });
});

describe('workspace package support', () => {
    it('scopes package-specific rules to the workspace package source path', () => {
        const blockRootPath = path.resolve(__dirname, '../block');
        const blockSrcPath = path.resolve(blockRootPath, 'src');
        const managedPathPattern = /^(.+?[\\/]node_modules[\\/](?!clipcc-block).+?)[\\/]/;
        const config = new ScratchWebpackConfigBuilder({
            ...common,
            enableReact: true,
            enableTs: true
        })
            .addWorkspacePackage({
                name: 'clipcc-block',
                rootPath: blockRootPath,
                config: {
                    module: {
                        rules: [{
                            test: /\.css$/,
                            use: 'raw-loader'
                        }]
                    },
                    resolve: {
                        alias: {
                            'clipcc-block/msg': path.resolve(blockSrcPath, 'msg')
                        },
                        extensions: ['.block.css'],
                        symlinks: false
                    },
                    snapshot: {
                        managedPaths: [managedPathPattern]
                    }
                }
            })
            .get();

        const jsRule = config.module.rules.find(rule => rule.loader === 'babel-loader');
        const tsRule = config.module.rules.find(rule => rule.loader === 'ts-loader');
        const scopedRule = config.module.rules.find(rule => rule.include === blockSrcPath && Array.isArray(rule.rules));

        expect(config.resolve.alias['clipcc-block']).toBe(blockSrcPath);
        expect(config.resolve.alias['clipcc-block/msg']).toBe(path.resolve(blockSrcPath, 'msg'));
        expect(config.resolve.extensions).toEqual(expect.arrayContaining(['.block.css']));
        expect(config.resolve.symlinks).toBe(false);
        expect(config.snapshot.managedPaths).toContain(managedPathPattern);
        expect(jsRule.include).toEqual(expect.arrayContaining([blockSrcPath]));
        expect(tsRule.include).toEqual(expect.arrayContaining([blockSrcPath]));
        expect(scopedRule.rules).toEqual([{test: /\.css$/, use: 'raw-loader'}]);
        expect(() => webpack.validate(config)).not.toThrow();
    });
});
