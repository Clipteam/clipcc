const TESTING = process.env.NODE_ENV === 'test';

const config = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                browsers: ['last 3 versions', 'Safari >= 8', 'iOS >= 8']
            }
        }],
        ['@babel/preset-typescript', {optimizeConstEnums: true}]
    ]
};

if (TESTING) {
    config.plugins = [
        ['babel-plugin-transform-import-meta']
    ];
}

module.exports = config;
