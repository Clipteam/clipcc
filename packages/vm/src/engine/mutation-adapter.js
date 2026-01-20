const html = require('htmlparser2');
const decodeHtml = require('decode-html');

/**
 * Convert a part of a mutation DOM to a mutation VM object, recursively.
 * @param {object} dom DOM object for mutation tag.
 * @return {object} Object representing useful parts of this mutation.
 */
const mutatorTagToObject = function (dom) {
    const obj = Object.create(null);
    obj.tagName = dom.name;
    obj.children = [];
    for (const prop in dom.attribs) {
        if (prop === 'xmlns') continue;
        obj[prop] = decodeHtml(dom.attribs[prop]);
        // Note: the capitalization of block info in the following lines is important.
        // The lowercase is read in from xml which normalizes case. The VM uses camel case everywhere else.
        if (prop === 'blockinfo') {
            obj.blockInfo = JSON.parse(obj.blockinfo);
            delete obj.blockinfo;
        }
    }
    for (let i = 0; i < dom.children.length; i++) {
        obj.children.push(
            mutatorTagToObject(dom.children[i])
        );
    }
    return obj;
};

/**
 * Adapter between mutator XML or DOM and block representation which can be
 * used by the Scratch runtime.
 * @param {(object|string)} mutation Mutation XML string or DOM.
 * @return {object} Object representing the mutation.
 */
const mutationAdpater = function (mutation) {
    let mutationParsed;
    // Check if the mutation is already parsed; if not, parse it.
    if (typeof mutation === 'object') {
        mutationParsed = mutation;
    } else {
        mutationParsed = html.parseDOM(mutation)[0];
    }
    return mutatorTagToObject(mutationParsed);
};

/**
 * Mock a Blockly extra state that like what mutation adapter would produce.
 * @param {object} mutation Mutation data.
 */
mutationAdpater.mock = function (mutation) {
    for (const key in mutation) {
        if (typeof mutation[key] === 'string') continue;
        mutation[key] = JSON.stringify(mutation[key]);
    }
    if (!mutation.tagName) {
        mutation.tagName = 'mutation';
    }
    if (!mutation.children) {
        mutation.children = [];
    }
}

/**
 * Unmock a mutation object so that it can be used by the runtime.
 * @param {object} mutation Mutation data.
 */
mutationAdpater.unmock = function (mutation) {
    for (const key in mutation) {
        if (typeof mutation[key] !== 'string') continue;
        try {
            mutation[key] = JSON.parse(mutation[key]);
        } catch (e) {
            // Ignore
        }
    }
};

module.exports = mutationAdpater;
