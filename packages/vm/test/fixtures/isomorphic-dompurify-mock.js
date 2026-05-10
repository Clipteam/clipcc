const DOMPurify = {
    addHook () {},

    sanitize (input) {
        return typeof input === 'string' ? input : String(input);
    }
};

export default DOMPurify;

export const {
    addHook,
    sanitize
} = DOMPurify;
