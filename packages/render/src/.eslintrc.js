module.exports = {
    root: true,
    extends: ['clipcc', 'clipcc/es6', 'clipcc/node'],
    env: {
        node: false,
        browser: true // TODO: disable this
    },
    globals: {
        Buffer: true // TODO: remove this?
    }
};
