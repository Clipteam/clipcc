/** @module RenderConstants */

/**
 * Various constants meant for use throughout the renderer.
 * @enum
 */
module.exports = {
    /**
     * The ID value to use for "no item" or when an object has been disposed.
     * @constant {int}
     */
    ID_NONE: -1,

    /**
     * Optimize for fewer than this number of Drawables sharing the same Skin.
     * Going above this may cause middleware warnings or a performance penalty but should otherwise behave correctly.
     * @constant {int}
     */
    SKIN_SHARE_SOFT_LIMIT: 301,

    /**
     * @enum {string}
     */
    Events: {
        /**
         * NativeSizeChanged event, which related to stage size change.
         * @constant {string}
         */
        NativeSizeChanged: 'NativeSizeChanged',
        /**
         * CanvasSizeChanged event, which related to actual canvas size change.
         * @constant {string}
         */
        CanvasSizeChanged: 'CanvasSizeChanged',
        /**
         * UseHighQualityPenChanged event, which related to high quality pen use change.
         * @constant {string}
         */
        UseHighQualityPenChanged: 'UseHighQualityPenChanged'
    }
};
