import inlineSvgFonts from './font-inliner';

/**
 * Serialize a given SVG DOM to a string.
 * @param svgTag The SVG element to serialize.
 * @param shouldInjectFonts True if fonts should be included in the SVG as
 *     base64 data.
 * @returns String representing current SVG data.
 */
const serializeSvgToString = (svgTag: SVGElement, shouldInjectFonts?: boolean): string => {
    const serializer = new XMLSerializer();
    let string = serializer.serializeToString(svgTag);
    if (shouldInjectFonts) {
        string = inlineSvgFonts(string);
    }
    return string;
};

export default serializeSvgToString;
