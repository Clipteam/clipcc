// eslint-disable-next-line import/no-mutable-exports
export let ScratchPaintModule: typeof import('clipcc-paint') | null = null;

/**
 * Check if the ScratchPaint module is loaded.
 * @returns True if the ScratchPaint module is loaded, false otherwise.
 */
export function isScratchPaintLoaded () {
    return !!ScratchPaintModule;
}

/**
 * Get the ScratchPaint module, which is loaded asynchronously to reduce the initial bundle size.
 * @returns A promise that resolves to the ScratchPaint module.
 */
export async function getScratchPaint () {
    if (!ScratchPaintModule) {
        // eslint-disable-next-line require-atomic-updates
        ScratchPaintModule = await import(
            /* webpackChunkName: "clipcc-paint" */
            'clipcc-paint'
        );
    }
    return ScratchPaintModule;
}
