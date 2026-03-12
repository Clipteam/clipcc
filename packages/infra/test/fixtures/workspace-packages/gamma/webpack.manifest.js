module.exports = {
    rootPath: __dirname,
    libraryName: 'GammaFixture',
    entry: './src/gamma-entry.js',
    enableReact: true,
    alias: {
        '@gamma-only': './gamma-alias'
    },
    rules: [{
        test: /\.gamma$/,
        include: './gamma-include'
    }],
    snapshot: {
        unmanagedPaths: ['./gamma-unmanaged']
    }
};
