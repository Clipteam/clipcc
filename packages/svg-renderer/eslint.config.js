const clipccConfig = require('eslint-config-clipcc');
const clipccES6 = require('eslint-config-clipcc/es6');
const clipccNode = require('eslint-config-clipcc/node');
const clipccTS = require('eslint-config-clipcc/ts');
const globals = require('globals');

module.exports = [
    ...clipccConfig,
    clipccES6,
    clipccNode,
    ...clipccTS,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                document: true,
                window: true,
                DOMParser: true,
                Image: true,
                XMLSerializer: true
            }
        }
    },
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'playground/**',
            '**/*.min.js'
        ]
    }
];
