/**
 * ES6/ES2024 ESLint configuration for ClipCC projects.
 * This configuration adds ES6+ specific rules.
 *
 * @returns {import('eslint').Linter.Config[]} ESLint flat config array
 */
module.exports = [
    {
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            parserOptions: {
                ecmaVersion: 2024
            }
        },
        rules: {
            'arrow-body-style': [2, 'as-needed'],
            'arrow-parens': [2, 'as-needed'],
            'arrow-spacing': [2, {
                before: true,
                after: true
            }],
            'no-prototype-builtins': [2],
            'no-confusing-arrow': [2],
            'no-duplicate-imports': [2],
            'no-return-await': [2],
            'no-template-curly-in-string': [2],
            'no-useless-computed-key': [2],
            'no-useless-constructor': [2],
            'no-useless-rename': [2],
            'no-var': [2],
            'prefer-arrow-callback': [2],
            'prefer-const': [2, {destructuring: 'all'}],
            'prefer-promise-reject-errors': [1],
            'prefer-rest-params': [2],
            'prefer-spread': [2],
            'prefer-template': [2],
            'require-atomic-updates': [2],
            'require-await': [2],
            'rest-spread-spacing': [2, 'never'],
            'symbol-description': [2],
            'template-curly-spacing': [2, 'never'],
            'jsdoc/no-defaults': 'error' // JSDoc default param is rebundant for ES6 default param
        }
    }
];
