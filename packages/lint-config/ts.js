const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

/**
 * TypeScript ESLint configuration for ClipCC projects.
 * This configuration adds TypeScript specific rules.
 * Use with ESLint 9 flat config format.
 *
 * @returns {import('eslint').Linter.Config[]} ESLint flat config array
 */
module.exports = [
    js.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module'
            }
        },
        plugins: {
            '@typescript-eslint': tsPlugin
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            // Disable JSDoc type requirements for TypeScript (it has its own types)
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-param-type': 'off',
            'func-style': 'off',
            'no-use-before-define': 'off'
        }
    }
];
