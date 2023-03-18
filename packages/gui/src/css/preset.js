/**
 * @fileoverview Scratch's preset theme
 */
 
export default {
    /*
        Colors
    /
    uiPrimary: 'hsla(215, 100%, 95%, 1)', /* #E5F0FF */
    uiSecondary: 'hsla(215, 75%, 95%, 1)', /* #E9F1FC */
    uiTertiary: 'hsla(215, 50%, 90%, 1)', /* #D9E3F2 */

    uiModalOverlay: 'hsla(215, 100%, 65%, 0.9)', /* 90% transparent version of motion-primary */

    uiWhite: 'hsla(0, 100%, 100%, 1)', /* #FFFFFF */
    uiWhiteDim: 'hsla(0, 100%, 100%, 0.75)', /* 25% transparent version of ui-white */
    uiWhiteTransparent: 'hsla(0, 100%, 100%, 0.25)', /* 25% transparent version of ui-white */
    uiTransparent: 'hsla(0, 100%, 100%, 0)', /* 25% transparent version of ui-white */

    uiBlackTransparent: 'hsla(0, 0%, 0%, 0.15)', /* 15% transparent version of black */

    textPrimary: 'hsla(225, 15%, 40%, 1)', /* #575E75 */
    textPrimaryTransparent: 'hsla(225, 15%, 40%, 0.75)',

    motionPrimary: 'hsla(215, 100%, 65%, 1)', /* #4C97FF */
    motionTertiary: 'hsla(215, 60%, 50%, 1)', /* #3373CC */
    motionTransparent: 'hsla(215, 100%, 65%, 0.35)', /* 35% transparent version of motion-primary */
    motionLightTransparent: 'hsla(215, 100%, 65%, 0.15)', /* 15% transparent version of motion-primary */

    redPrimary: 'hsla(20, 100%, 55%, 1)', /* #FF661A */
    redTertiary: 'hsla(20, 100%, 45%, 1)', /* #E64D00 */

    soundPrimary: 'hsla(300, 53%, 60%, 1)', /* #CF63CF */
    soundTertiary: 'hsla(300, 48%, 50%, 1)', /* #BD42BD */

    controlPrimary: 'hsla(38, 100%, 55%, 1)', /* #FFAB19 */

    dataPrimary: 'hsla(30, 100%, 55%, 1)', /* #FF8C1A */

    penPrimary: 'hsla(163, 85%, 40%, 1)', /* #0FBD8C */
    penTransparent: 'hsla(163, 85%, 40%, 0.25)', /* #0FBD8C */

    errorPrimary: 'hsla(30, 100%, 55%, 1)', /* #FF8C1A */
    errorLight: 'hsla(30, 100%, 70%, 1)', /* #FFB366 */
    errorTransparent: 'hsla(30, 100%, 55%, 0.25)', /* #FF8C1A */

    extensionsPrimary: 'hsla(163, 85%, 40%, 1)', /* #0FBD8C */
    extensionsTertiary: 'hsla(163, 85%, 30%, 1)', /* #0B8E69 */
    extensionsTransparent: 'hsla(163, 85%, 40%, 0.35)', /* 35% transparent version of extensions-primary */
    extensionsLight: 'hsla(163, 57%, 85%, 1)', /* opaque version of extensions-transparent, on white bg */

    dropHighlight: 'hsla(215, 100%, 77%, 1)', /* lighter than motion-primary */
    /*
        Units
        make sure to keep these in sync with other constants,
        e.g. STAGE_DIMENSION_DEFAULTS in lib/screen-utils.js
    */

    space: '0.5rem',
    spritesPerRow: 5,
    menuBarHeight: '3rem',
    languageSelectorWidth: '3rem',
    spriteInfoHeight: '6rem',
    stageMenuHeight: '2.75rem',
    
    libraryHeaderHeight: '3.125rem',
    libraryFilterBarHeight: '2.5rem',

    stageStandardBorderWidth: '0.0625rem',
    stageFullScreenBorderWidth: '0.1875rem',
    stageFullScreenStagePadding: '0.1875rem',

    formRadius: 'calc(var(--space) / 2)',

    /* layout contants from `layout-constants.js` */
    fullSize: '1095px',
    fullSizePaint: '1249px',

    menuBarStandardFontSize: '0.75rem',
    menuBarLargeFontSize: '0.875rem',
    menuBarButtonSize: '2rem',

    menuBarItemMaxWidth: '12rem',
    /*
        Z-Index
        Contains constants for the z-index values of elements that are part of the global stack context.
        In other words, z-index values that are "inside" a component are not added here.
        This prevents conflicts between identical z-index values in different components.
    */
    zIndexExtensionButton: 42,
    zIndexStageIndicator: 45,
    zIndexAddButton: 46,
    zIndexTooltip: 47, /* tooltips should go over add buttons if they overlap */
    zIndexMonitor: 48, /* monitors go over add buttons */
    zIndexStageQuestion: 49, /* "ask" block text input goes above monitors */

    zIndexCard: 480,
    zIndexAlerts: 490,
    zIndexMenuBar: 491, /* menu-bar should go over monitors, alerts and tutorials */
    zIndexLoader: 500,
    zIndexModal: 510,

    zIndexDragLayer: 1000,
    /* Block drag z-index: 1000, default 50 is overriden in blocks.css */
    zIndexMonitorDragging: 1010,
    zIndexDraggingSprite: 1020, /* so it is draggable into other panes */

    zIndexStageColorPickerBackground: 2000,
    zIndexStageWithColorPicker: 2010,
    zIndexStageHeader: 5000,
    zIndexStageWrapperOverlay: 5000,

    /* in most interfaces, the context menu is always on top */
    zIndexContextMenu: 10000
};
