import * as html from 'htmlparser2';
import decodeHtml from 'decode-html';
import type {Element} from 'domhandler';
import type {VMMutation} from '../serialization/schema';

/**
 * Convert a part of a mutation DOM to a mutation VM object, recursively.
 * @param dom DOM object for mutation tag.
 * @returns Object representing useful parts of this mutation.
 */
const mutatorTagToObject = function (dom: Element) {
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
            mutatorTagToObject(dom.children[i] as Element)
        );
    }
    return obj;
};

/**
 * Adapter between mutator XML or DOM and block representation which can be
 * used by the Scratch runtime.
 * @param mutation Mutation XML string or DOM.
 * @returns Object representing the mutation.
 */
const mutationAdapter = function (mutation: Element | string): VMMutation {
    let mutationParsed;
    // Check if the mutation is already parsed; if not, parse it.
    if (typeof mutation === 'object') {
        mutationParsed = mutation;
    } else {
        mutationParsed = html.parseDOM(mutation)[0];
    }
    return mutatorTagToObject(mutationParsed as Element);
};

export default mutationAdapter;
