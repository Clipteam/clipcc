const DOMPurify = {
    addHook () {},

    sanitize (input) {
        return typeof input === 'string' ? input : String(input);
    }
};

module.exports = DOMPurify;
