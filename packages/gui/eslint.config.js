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
    // Base config for all files
    ...clipccConfig,
    clipccNode,
    clipccES6,

    // Apply React config first to make the plugin available
    ...clipccReact.map(config => ({
        ...config,
        files: ['src/**/*.{js,jsx}']
    })),

    // Apply TypeScript config to TypeScript files
    ...clipccTS.map(config => ({
        ...config,
        files: ['src/**/*.{ts,tsx}']
    })),

    // Source files configuration (browser environment + import plugin + React rules)
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
            'no-confusing-arrow': ['error', {
                allowParens: true
            }]
        }
    },

    // Extension examples - worker environment, no ES6
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

    // Library manifests - allow duplicate imports
    {
        files: ['src/lib/libraries/**/*.js'],
        rules: {
            'no-duplicate-imports': 'off'
        }
    },

    // Global ignores
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
