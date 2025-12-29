// ESLint 9 flat config for clipcc-storage
const clipccConfig = require('eslint-config-clipcc');
const clipccNode = require('eslint-config-clipcc/node');
const clipccTS = require('eslint-config-clipcc/ts');
const globals = require('globals');

module.exports = [
    ...clipccConfig,
    clipccNode,

    // TypeScript source files
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

    // Test files - Jest environment
    {
        files: ['test/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.jest
            }
        }
    },

    // Test transformers - Jest + Node
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
        ignores: [
            'node_modules/**',
            'dist/**',
            '**/*.min.js'
        ]
    }
];
