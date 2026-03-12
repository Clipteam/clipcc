module.exports = {
    rootPath: __dirname,
    libraryName: 'BetaFixture',
    entry: {
        beta: {
            import: ['./src/beta-entry.js', './src/beta-helper.js']
        }
    },
    sourcePaths: ['./beta-extra'],
    alias: {
        '@beta-only': './beta-alias'
    },
    rules: [{
        test: /\.beta$/,
        exclude: './beta-exclude'
    }],
    snapshot: {
        immutablePaths: ['./beta-immutable'],
        managedPaths: ['./beta-managed']
    },
    workspacePackages: ['test-workspace-gamma']
};
