const solidPlugin = require('eslint-plugin-solid');

/**
 * Solid.js ESLint configuration for ClipCC projects.
 * This configuration adds Solid,js specific rules.
 *
 * @returns {import('eslint').Linter.Config[]} ESLint flat config array
 */
module.exports = [
    {
        plugins: {
            solid: solidPlugin
        },
        rules: {
            'solid/jsx-no-duplicate-props': 2,
            'solid/jsx-uses-vars': 2,
            'solid/jsx-no-undef': [2, {typescriptEnabled: true}],
            'solid/no-unknown-namespaces': 0,
            'solid/no-innerhtml': 2,
            'solid/jsx-no-script-url': 2,
            'solid/components-return-once': 1,
            'solid/no-destructure': 2,
            'solid/prefer-for': 2,
            'solid/reactivity': 1,
            'solid/event-handlers': 1,
            'solid/imports': 1,
            'solid/style-prop': 1,
            'solid/no-react-deps': 1,
            'solid/no-react-specific-props': 1,
            'solid/self-closing-comp': 1,
            'solid/no-array-handlers': 0,
            'solid/prefer-show': 1
        }
    }
];
