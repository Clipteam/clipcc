const clipccConfig = require('eslint-config-clipcc');
const clipccNode = require('eslint-config-clipcc/node');
const clipccES6 = require('eslint-config-clipcc/es6');

module.exports = [
    ...clipccConfig,
    ...clipccNode,
    ...clipccES6,
    {
        files: ['test/**/*.js'],
        rules: {
            'no-undefined': 'off'
        }
    },
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            '.tap/**',
            '**/*.min.js'
        ]
    }
];
