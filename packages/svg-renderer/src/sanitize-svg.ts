// @ts-nocheck

/**
 * @fileOverview Sanitize the content of an SVG aggressively, to make it as safe
 * as possible
 */
import fixupSvgString from './fixup-svg-string';
import {generate, parse, walk} from 'css-tree';
import DOMPurify from 'isomorphic-dompurify';

const isInternalRef = ref => ref.startsWith('#') || ref.startsWith('data:');

DOMPurify.addHook(
    'beforeSanitizeAttributes',
    currentNode => {

        if (currentNode && currentNode.href && currentNode.href.baseVal) {
            const href = currentNode.href.baseVal.replace(/\s/g, '');
            // "data:" and "#" are valid hrefs
            if (!isInternalRef(href)) {
                // TODO: Those can be in different namespaces than `xlink:`
                if (currentNode.attributes.getNamedItem('xlink:href')) {
                    currentNode.attributes.removeNamedItem('xlink:href');
                    delete currentNode['xlink:href'];
                }
                if (currentNode.attributes.getNamedItem('href')) {
                    currentNode.attributes.removeNamedItem('href');
                    delete currentNode.href;
                }

                // Remove url(...) usages with external references
                if (currentNode && currentNode.attributes) {
                    for (let i = currentNode.attributes.length - 1; i >= 0; i--) {
                        const attr = currentNode.attributes[i];
                        const rawValue = attr.value || '';
                        const value = rawValue.toLowerCase().replace(/\s/g, '');

                        const urlMatch = value.match(/url\((.?)\)/);
                        if (urlMatch) {
                            const ref = urlMatch[1].replace(/['"]/g, '');
                            if (!isInternalRef(ref)) {
                                currentNode.removeAttribute(attr.name);
                            }
                        }
                    }
                }
            }
        }
        return currentNode;
    }
);

DOMPurify.addHook(
    'uponSanitizeElement',
    (node, data) => {
        if (data.tagName === 'style') {
            const ast = parse(node.textContent);
            let isModified = false;
            // Remove any @import rules as it could leak HTTP requests
            walk(ast, (astNode, item, list) => {
                // @import rules
                if (astNode.type === 'Atrule' && astNode.name.toLowerCase() === 'import') {
                    list.remove(item);
                    isModified = true;
                }

                // Elements using url(...) for external resources
                if (astNode.type === 'Declaration' && astNode.value) {
                    let shouldRemove = false;
                    walk(astNode.value, valueNode => {
                        if (valueNode.type === 'Url') {
                            const urlValue = (valueNode.value.value || '').trim().replace(/['"]/g, '');

                            if (!isInternalRef(urlValue)) {
                                shouldRemove = true;
                            }
                        }
                    });

                    if (shouldRemove) {
                        list.remove(item);
                        isModified = true;
                    }
                }
            });
            if (isModified) {
                node.textContent = generate(ast);
            }
        }
    }
);

// Use JS implemented TextDecoder and TextEncoder if it is not provided by the
// browser.
let _TextDecoder;
let _TextEncoder;
if (typeof TextDecoder === 'undefined' || typeof TextEncoder === 'undefined') {
    // Wait to require the text encoding polyfill until we know it's needed.
    // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
    const encoding = require('fastestsmallesttextencoderdecoder');
    _TextDecoder = encoding.TextDecoder;
    _TextEncoder = encoding.TextEncoder;
} else {
    _TextDecoder = TextDecoder;
    _TextEncoder = TextEncoder;
}

const sanitizeSvg = {
    /**
     * Load an SVG Uint8Array of bytes and "sanitize" it
     * @param rawData unsanitized SVG daata
     * @returns sanitized SVG data
     */
    sanitizeByteStream (rawData: Uint8Array): Uint8Array {
        const decoder = new _TextDecoder();
        const encoder = new _TextEncoder();
        const sanitizedText = sanitizeSvg.sanitizeSvgText(decoder.decode(rawData));
        return encoder.encode(sanitizedText);
    },
    /**
     * Load an SVG string and "sanitize" it. This is more aggressive than the handling in
     * fixup-svg-string.js, and thus more risky; there are known examples of SVGs that
     * it will clobber. We use DOMPurify's svg profile, which restricts many types of tag.
     * @param rawSvgText unsanitized SVG string
     * @returns sanitized SVG text
     */
    sanitizeSvgText (rawSvgText: string): string {
        let sanitizedText = DOMPurify.sanitize(rawSvgText, {
            USE_PROFILES: {svg: true},
            FORBID_TAGS: ['a', 'audio', 'canvas', 'video'],
            // Allow data URI in image tags (e.g. SVGs converted from bitmap)
            ADD_DATA_URI_TAGS: ['image']
        });

        // Remove partial XML comment that is sometimes left in the HTML
        const badTag = sanitizedText.indexOf(']&gt;');
        if (badTag >= 0) {
            sanitizedText = sanitizedText.substring(5, sanitizedText.length);
        }

        // also use our custom fixup rules
        sanitizedText = fixupSvgString(sanitizedText);
        return sanitizedText;
    }
};

export default sanitizeSvg;
