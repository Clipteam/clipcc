export function xmlEscape (str: any): string {
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
