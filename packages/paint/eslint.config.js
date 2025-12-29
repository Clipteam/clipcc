const clipccConfig = require('eslint-config-clipcc');
const clipccES6 = require('eslint-config-clipcc/es6');
const clipccNode = require('eslint-config-clipcc/node');

module.exports = [
    ...clipccConfig,
    clipccES6,
    clipccNode,
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'playground/**',
            'scripts/**',
            '**/*.min.js'
        ]
    }
];
