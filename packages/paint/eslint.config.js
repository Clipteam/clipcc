const clipccConfig = require('eslint-config-clipcc');
const clipccES6 = require('eslint-config-clipcc/es6');
const clipccNode = require('eslint-config-clipcc/node');
const clipccReact = require('eslint-config-clipcc/react');
const reactPlugin = require('eslint-plugin-react');
const clipccTS = require('eslint-config-clipcc/ts');
const globals = require('globals');

module.exports = [
    ...clipccConfig,
    ...clipccES6,
    ...clipccNode,
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'playground/**',
            'scripts/**',
            '**/*.min.js'
        ]
    },
    ...clipccReact.map(config => ({
        ...config,
        files: ['src/**/*.{js,jsx}']
    })),
    ...clipccTS.map(config => ({
        ...config,
        files: ['src/**/*.{ts,tsx}']
    })),
    {
        files: ['src/**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                process: true
            }
        },
        rules: {
            'jsdoc/require-jsdoc': 'off',
            'no-confusing-arrow': ['error', {
                allowParens: true
            }]
        }
    },
    {
        files: ['test/**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            plugins: {
                react: reactPlugin
            },
            globals: {
                ...globals.jest,
                ...globals.browser
            }
        },
        rules: {
            'no-undefined': 'off',
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-description': 'off',
            'jsdoc/require-param-description': 'off',
            'jsdoc/require-returns-description': 'off',
            'react/jsx-uses-vars': [2],
            'react/jsx-uses-react': [2]
        }
    }
];
