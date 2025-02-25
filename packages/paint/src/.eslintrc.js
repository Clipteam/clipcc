/* eslint-disable import/no-commonjs */
module.exports = {
/* eslint-enable import/no-commonjs */
    root: true,
    extends: ['clipcc', 'clipcc/es6', 'clipcc/react', 'plugin:import/recommended'],
    env: {
        browser: true
    },
    rules: {
        'import/no-mutable-exports': 'error',
        'import/no-commonjs': 'error',
        'import/no-amd': 'error',
        'import/no-nodejs-modules': 'error'
    },
    settings: {
        react: {
            version: '16.2' // Prevent 16.3 lifecycle method errors
        }
    }
};
