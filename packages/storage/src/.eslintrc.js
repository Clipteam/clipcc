module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: ['clipcc', 'clipcc/es6', 'clipcc/node', 'clipcc/ts'],
    env: {
        node: true,
        browser: false
    },
    overrides: [
        {
            files: ['**/*.ts', '**/*.tsx'],
            rules: {
                'no-use-before-define': 'off',
                '@typescript-eslint/no-use-before-define': 'error'
            }
        }
    ]
};
