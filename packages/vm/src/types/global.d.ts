declare global {
    type int = number;

    const clipcc: {
        VERSION?: string;
        BUILD_TIME?: number;
        DEFAULT_TRANSLATE_SERVICE_URL: string;
        DEFAULT_TTS_SERVICE_URL: string;
    };
}
