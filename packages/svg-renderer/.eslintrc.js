module.exports = {
    extends: ['clipcc', 'clipcc/es6', 'clipcc/node'],
    globals: {
        document: true,
        window: true,
        DOMParser: true,
        Image: true,
        XMLSerializer: true
    }
};
