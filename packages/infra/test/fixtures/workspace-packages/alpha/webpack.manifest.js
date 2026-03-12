module.exports = {
    rootPath: __dirname,
    libraryName: 'AlphaFixture',
    entry: ['./src/index.js', './src/polyfill.js'],
    enableReact: true,
    enableTs: true,
    sourcePaths: ['./alpha-extra'],
    alias: {
        '@workspace-shared': './alpha-alias'
    },
    rules: [{
        test: /\.alpha$/,
        include: './alpha-include',
        oneOf: [{
            test: /\.alpha-inner$/,
            include: './alpha-inner'
        }]
    }],
    snapshot: {
        immutablePaths: ['./alpha-immutable'],
        unmanagedPaths: ['./alpha-unmanaged']
    },
    workspacePackages: ['test-workspace-beta']
};
