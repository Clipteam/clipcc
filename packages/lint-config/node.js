const globals = require('globals');

/**
 * Node.js ESLint configuration for ClipCC projects.
 * This configuration adds Node.js specific rules and globals.
 *
 * @returns {import('eslint').Linter.Config} ESLint flat config object
 */
module.exports = {
    languageOptions: {
        globals: {
            ...globals.node
        }
    },
    rules: {
        // Node/CommonJS
        'global-require': [2],
        'handle-callback-err': [2],
        'no-mixed-requires': [2],
        'no-new-require': [2],
        'no-path-concat': [2]
    }
};
