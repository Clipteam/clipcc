import {
    blockColors as darkBlockColors
} from './dark';
import {
    blockColors as highContrastBlockColors
} from './high-contrast';

const convertColorsToBlocklyTheme = colors => {
    const blockStyles = {};
    const categoryStyles = {};
    const componentStyles = {};

    Object.keys(colors).forEach(key => {
        const value = colors[key];
        if (typeof value === 'object') {
            // It's a category/block style (e.g. motion)
            if (value.primary) {
                blockStyles[key] = {
                    colourPrimary: value.primary,
                    colourSecondary: value.secondary,
                    colourTertiary: value.tertiary,
                    colourQuaternary: value.quaternary
                };
                categoryStyles[key] = {
                    colour: value.primary
                };
            }
        } else {
            // It's a component style or property
            // We need to map some specific keys to Blockly component styles
            // Note: naming might differ.
        }
    });

    if (colors.workspace) componentStyles.workspaceBackgroundColour = colors.workspace;
    if (colors.flyout) componentStyles.flyoutBackgroundColour = colors.flyout;
    if (colors.toolbox) componentStyles.toolboxBackgroundColour = colors.toolbox;
    if (colors.toolboxText) {
        componentStyles.toolboxForegroundColour = colors.toolboxText;
        componentStyles.flyoutForegroundColour = colors.toolboxText;
    }
    if (colors.scrollbar) componentStyles.scrollbarColour = colors.scrollbar;
    if (colors.insertionMarker) componentStyles.insertionMarkerColour = colors.insertionMarker;
    if (colors.insertionMarkerOpacity) componentStyles.insertionMarkerOpacity = colors.insertionMarkerOpacity;

    return {
        blockStyles,
        categoryStyles,
        componentStyles,
        colours: colors
    };
};

const defineBlockThemes = ScratchBlocks => {
    if (!ScratchBlocks.Theme || !ScratchBlocks.Theme.createTheme) return;

    // Default (scratch) is usually already defined.

    const darkThemeDef = convertColorsToBlocklyTheme(darkBlockColors);
    ScratchBlocks.Theme.createTheme('dark', darkThemeDef);

    const highContrastThemeDef = convertColorsToBlocklyTheme(highContrastBlockColors);
    ScratchBlocks.Theme.createTheme('high-contrast', highContrastThemeDef);
};

export {
    defineBlockThemes
};
