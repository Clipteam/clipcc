// eslint-disable-next-line import/no-mutable-exports
export let ScratchPaintModule = null;
let loadingPromise = null;

/**
 * Check if the ScratchPaint module is loaded.
 * @returns {boolean} True if the ScratchPaint module is loaded, false otherwise.
 */
export const isScratchPaintLoaded = function () {
    return !!ScratchPaintModule;
};

/**
 * Get the ScratchPaint module, which is loaded asynchronously to reduce the initial bundle size.
 * @returns {Promise<typeof import('clipcc-paint')>} A promise that resolves to the ScratchPaint module.
 */
export const getScratchPaint = function () {
    if (!loadingPromise) {
        loadingPromise = import(
            /* webpackChunkName: "clipcc-paint" */
            'clipcc-paint'
        ).then(module => {
            ScratchPaintModule = module;
            return module;
        });
    }
    return loadingPromise;
};
