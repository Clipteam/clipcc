declare module 'decode-html' {
    function decodeHtml(html: string): string;
    export default decodeHtml;
}

declare module 'clipcc-sb1-convertor' {
    class SB1File {
        constructor (input: string | ArrayBuffer | ArrayBufferView<ArrayBufferLike>): SB1File;
        json: Record<string, unknown>;
        zip: JSZip;
    }

    class ValidationError extends Error {}

    export {SB1File, ValidationError};
}
