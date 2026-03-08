// eslint-disable-next-line import/no-mutable-exports
export let ScratchBlocksModule: typeof import('clipcc-block') | null = null;

/**
 * Check if the ScratchBlocks module is loaded.
 * @returns True if the ScratchBlocks module is loaded, false otherwise.
 */
export function isScratchBlocksLoaded () {
    return !!ScratchBlocksModule;
}

/**
 * Get the ScratchBlocks module, which is loaded asynchronously to reduce the initial bundle size.
 * @returns A promise that resolves to the ScratchBlocks module.
 */
export async function getScratchBlocks () {
    if (!ScratchBlocksModule) {
        // eslint-disable-next-line require-atomic-updates
        ScratchBlocksModule = await import(
            /* webpackChunkName: "clipcc-block" */
            'clipcc-block'
        );
    }
    return ScratchBlocksModule;
}
