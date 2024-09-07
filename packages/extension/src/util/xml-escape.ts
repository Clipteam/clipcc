/**
 * Escape unsafe xml characters.
 * @param str The string, or other things.
 * @returns The safe xml string.
 */
export function xmlEscape (str: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
    return String(str).replace(/[<>&'"]/g, char => {
        switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return char;
        }
    });
}
