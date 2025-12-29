const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

/**
 * TypeScript ESLint configuration for ClipCC projects.
 * This configuration adds TypeScript specific rules.
 *
 * @returns {import('eslint').Linter.Config[]} ESLint flat config array
 */
module.exports = {
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
        'jsdoc/require-returns-type': 'off',
        'func-style': 'off',

        // Disable rules that conflict with TypeScript's type system
        // TypeScript already provides its own undefined-variable checking
        'no-undef': 'off',
        // ESLint's no-duplicate-imports doesn't understand `import type` syntax
        'no-duplicate-imports': 'off',
        // TypeScript commonly uses `undefined` in type annotations and defaults
        'no-undefined': 'off',
        // Async methods often implement async interfaces without needing `await`
        'require-await': 'off',
        // TypeScript parameter properties make constructors look "useless" to ESLint
        'no-useless-constructor': 'off',
        // Use TypeScript-aware no-shadow to avoid false positives on enums/types
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'error'
    }
};
