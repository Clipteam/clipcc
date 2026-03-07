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
            globals: {
                ...globals.browser
            }
        },
        rules: {
            'jsdoc/require-jsdoc': 'off'
        }
    },
    {
        files: ['src/extension-support/extension-worker.js'],
        languageOptions: {
            globals: {
                ...globals.worker
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
            'playground/**',
            'coverage/**',
            'benchmark/**',
            '**/*.min.js'
        ]
    }
];
