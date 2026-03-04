const path = require('path');
const clipccConfig = require('eslint-config-clipcc');
const clipccNode = require('eslint-config-clipcc/node');
const clipccES6 = require('eslint-config-clipcc/es6');
const clipccReact = require('eslint-config-clipcc/react');
const clipccTS = require('eslint-config-clipcc/ts');
const globals = require('globals');
const importPlugin = require('eslint-plugin-import');
const reactPlugin = require('eslint-plugin-react');

module.exports = [
    ...clipccConfig,
    ...clipccNode,
    ...clipccES6,
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
        plugins: {
            import: importPlugin,
            react: reactPlugin
        },
        settings: {
            'import/resolver': {
                webpack: {
                    config: path.resolve(__dirname, 'webpack.config.js')
                }
            }
        },
        rules: {
            'import/no-mutable-exports': 'error',
            'import/no-commonjs': 'error',
            'import/no-amd': 'error',
            'import/no-nodejs-modules': 'error',
            'react/jsx-no-literals': 'error',
            'jsdoc/require-jsdoc': 'off',
            'no-confusing-arrow': ['error', {
                allowParens: true
            }]
        }
    },
    {
        files: ['src/examples/extensions/**/*.js'],
        languageOptions: {
            ecmaVersion: 5,
            sourceType: 'script',
            globals: {
                ...globals.worker,
                Scratch: true
            }
        }
    },
    {
        files: ['src/lib/libraries/**/*.js'],
        rules: {
            'no-duplicate-imports': 'off'
        }
    },
    {
        files: ['test/**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
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
            'jsdoc/require-returns-description': 'off'
        }
    },
    {
        ignores: [
            'node_modules/**',
            'build/**',
            'dist/**',
            'static/**',
            'test-results/**',
            '**/*.min.js'
        ]
    }
];
