const clipccConfig = require('eslint-config-clipcc');
const clipccNode = require('eslint-config-clipcc/node');
const clipccTS = require('eslint-config-clipcc/ts');
const globals = require('globals');

module.exports = [
    ...clipccConfig,
    clipccNode,
    ...clipccTS.map(config => ({
        ...config,
        files: ['src/**/*.ts'],
        languageOptions: {
            ...config.languageOptions,
            globals: {
                ...globals.node
            }
        }
    })),
    {
        files: ['test/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.jest
            }
        },
        rules: {
            'no-undefined': 'off',
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-description': 'off',
            'jsdoc/require-param-description': 'off',
            'jsdoc/require-returns-description': 'off'
        }
    },
    {
        files: ['test/transformers/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.jest,
                ...globals.node
            }
        }
    },
    {
        files: ['src/**/*.worker.js'],
        languageOptions: {
            globals: {
                ...globals.worker
            }
        }
    },
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            '**/*.min.js'
        ]
    }
];
