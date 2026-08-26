declare module 'decode-html' {
    function decodeHtml(html: string): string;
    export default decodeHtml;
}

/**
 * Compile-time injected clipcc global metadata
 */
declare const clipcc: {
    VERSION?: string,
    BUILD_TIME?: number
    DEFAULT_TRANSLATE_SERVICE_URL: string,
    DEFAULT_TTS_SERVICE_URL: string
};
