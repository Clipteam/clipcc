/**
 * @fileoverview Convert 2.0 fonts to 3.0 fonts.
 */

/**
 * Given an SVG, replace Scratch 2.0 fonts with new 3.0 fonts. Add defaults where there are none.
 * @param svgTag The SVG dom object
 */
const convertFonts = function (svgTag: SVGElement) {
    // Collect all text elements into a list.
    const textElements: Element[] = [];
    const collectText = (domElement: Element | Node) => {
        if (domElement instanceof Element && domElement.localName === 'text') {
            textElements.push(domElement);
        }
        for (let i = 0; i < domElement.childNodes.length; i++) {
            collectText(domElement.childNodes[i]);
        }
    };
    collectText(svgTag);
    // If there's an old font-family, switch to the new one.
    for (const textElement of textElements) {
        // If there's no font-family provided, provide one.
        if (!textElement.getAttribute('font-family') ||
            textElement.getAttribute('font-family') === 'Helvetica') {
            textElement.setAttribute('font-family', 'Sans Serif');
        } else if (textElement.getAttribute('font-family') === 'Mystery') {
            textElement.setAttribute('font-family', 'Curly');
        } else if (textElement.getAttribute('font-family') === 'Gloria') {
            textElement.setAttribute('font-family', 'Handwriting');
        } else if (textElement.getAttribute('font-family') === 'Donegal') {
            textElement.setAttribute('font-family', 'Serif');
        }
    }
};

export default convertFonts;
