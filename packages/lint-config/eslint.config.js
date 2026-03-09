const baseConfig = require('./index.js');

module.exports = [
    ...baseConfig,
    {
        ignores: ['node_modules/**']
    }
];
