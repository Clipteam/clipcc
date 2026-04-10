// @ts-check

import mainConfig from './webpack.main.mjs';
import preloadConfig from './webpack.preload.mjs';
import rendererConfig from './webpack.renderer.mjs';

/**
 * Select configs by target.
 * @param {{target?: string}} env Build environment flags.
 * @returns {import('webpack').Configuration | import('webpack').Configuration[]} Target-specific config or all configs.
 */
export default env => {
    const target = env?.target;

    switch (target) {
    case 'main':
        return mainConfig;
    case 'preload':
        return preloadConfig;
    case 'renderer':
        return rendererConfig;
    default:
        return [mainConfig, preloadConfig, rendererConfig];
    }
};
