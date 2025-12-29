const clipccConfig = require('eslint-config-clipcc');
const clipccNode = require('eslint-config-clipcc/node');
const clipccES6 = require('eslint-config-clipcc/es6');
const globals = require('globals');

module.exports = [
    ...clipccConfig,
    clipccNode,
    clipccES6,

    // Source files - browser environment with Buffer global
    {
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                Buffer: 'readonly'
            }
        }
    },

    // Playground - browser with console allowed
    {
        files: ['src/playground/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser
            }
        },
        rules: {
            'no-console': 'off'
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
