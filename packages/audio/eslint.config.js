const clipccConfig = require('eslint-config-clipcc');
const clipccNode = require('eslint-config-clipcc/node');
const clipccES6 = require('eslint-config-clipcc/es6');
const globals = require('globals');

module.exports = [
    ...clipccConfig,
    ...clipccNode,
    ...clipccES6,
    {
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser
            }
        }
    },
    {
        files: ['test/**/*.js'],
        rules: {
            'no-undefined': 'off',
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-description': 'off',
            'jsdoc/require-param-description': 'off',
            'jsdoc/require-returns-description': 'off'
        }
    },
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'dist.js'
        ]
    }
];
