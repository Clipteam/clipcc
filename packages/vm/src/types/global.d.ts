declare module 'decode-html' {
    function decodeHtml(html: string): string;
    export default decodeHtml;
}

declare global {
    type int = number;
}

/**
 * Compile-time injected clipcc global metadata
 */
declare const clipcc: { VERSION?: string };
