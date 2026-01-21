/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2016 Massachusetts Institute of Technology
 * All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Blockly from 'blockly/core';

/**
 * Default colours for clipcc-block theme.
 */
export const Colours = {
  text: '#FFFFFF',
  workspace: '#F9F9F9',
  toolboxHover: '#4C97FF',
  toolboxHoverStroke: '#4280D7',
  toolboxSelected: '#3373CC',
  toolboxText: '#575E75',
  toolbox: '#FFFFFF',
  flyout: '#F9F9F9',
  scrollbar: '#CECDCE',
  scrollbarHover: '#CECDCE',
  textField: '#FFFFFF',
  textFieldText: '#575E75',
  insertionMarker: '#000000',
  insertionMarkerOpacity: 0.2,
  dragShadowOpacity: 0.3,
  stackGlow: '#FFF200',
  stackGlowSize: 4,
  stackGlowOpacity: 1,
  replacementGlow: '#FFFFFF',
  replacementGlowSize: 2,
  replacementGlowOpacity: 1,
  colourPickerStroke: '#FFFFFF',
  // CSS colours: support RGBA
  flyoutBorder: 'hsla(0, 0%, 0%, 0.15)',
  flyoutText: '#575E75',
  flyoutHover: 'white',
  toolboxBorder: 'hsla(0, 0%, 0%, 0.15)',
  fieldShadow: 'rgba(0,0,0,0.1)',
  dropDownShadow: 'rgba(0, 0, 0, .3)',
  numPadBackground: '#547AB2',
  numPadBorder: '#435F91',
  numPadActiveBackground: '#435F91',
  numPadText: 'white', // Do not use hex here, it cannot be inlined with data-uri SVG
  valueReportBackground: '#FFFFFF',
  valueReportBorder: '#AAAAAA',
  menu: '#FFFFFF',
  menuText: '#000',
  menuHover: 'rgba(76, 151, 255, 0.2)',
  dropdownRadius: '.2em'
} as const;

const colorMap: Record<string, Partial<typeof Colours>> = {};

/**
 * Inject CSS variables for clipcc-block colors to injection div.
 * @param workspace The workspace to inject CSS variables for.
 */
export function injectCssVariables(workspace: Blockly.WorkspaceSvg): void {
  const wsRoot = workspace.getInjectionDiv();
  let root = wsRoot.querySelector('#clipcc-block-theme');
  if (!root) {
    root = document.createElement('style');
    root.id = 'clipcc-block-theme';
    wsRoot.appendChild(root);
  }

  const cssVars: string[] = [];
  const themeName = workspace.getTheme().name;
  const mergedColours = themeName ? Object.assign({}, Colours, colorMap[themeName]) : Colours;
  cssVars.push(':root {');
  for (const prop in mergedColours) {
    if (!Object.prototype.hasOwnProperty.call(mergedColours, prop)) {
      continue;
    }
    cssVars.push(`  --clipcc-block-${prop}: ${mergedColours[prop as keyof typeof Colours]};`);
  }
  cssVars.push('}');

  root.textContent = cssVars.join('\n');
}

export interface ThemeDefinition {
  blockStyles?: {
    [key: string]: Partial<Blockly.Theme.BlockStyle>;
  };
  categoryStyles?: {
    [key: string]: Blockly.Theme.CategoryStyle;
  };
  componentStyles?: Blockly.Theme.ComponentStyle;
  colours?: Partial<typeof Colours>;
  fontStyle?: Blockly.Theme.FontStyle;
  startHats?: boolean;
  base?: string | Blockly.Theme;
  name?: string;
}

const defaultBlockStyles: Record<string, Partial<Blockly.Theme.BlockStyle>> = {
  motion: {
    colourPrimary: '#4C97FF',
    colourSecondary: '#4280D7',
    colourTertiary: '#3373CC'
  },
  looks: {
    colourPrimary: '#9966FF',
    colourSecondary: '#855CD6',
    colourTertiary: '#774DCB'
  },
  sounds: {
    colourPrimary: '#CF63CF',
    colourSecondary: '#C94FC9',
    colourTertiary: '#BD42BD'
  },
  control: {
    colourPrimary: '#FFAB19',
    colourSecondary: '#EC9C13',
    colourTertiary: '#CF8B17'
  },
  event: {
    colourPrimary: '#FFBF00',
    colourSecondary: '#E6AC00',
    colourTertiary: '#CC9900'
  },
  sensing: {
    colourPrimary: '#5CB1D6',
    colourSecondary: '#47A8D1',
    colourTertiary: '#2E8EB8'
  },
  pen: {
    colourPrimary: '#0fBD8C',
    colourSecondary: '#0DA57A',
    colourTertiary: '#0B8E69'
  },
  operators: {
    colourPrimary: '#59C059',
    colourSecondary: '#46B946',
    colourTertiary: '#389438'
  },
  data: {
    colourPrimary: '#FF8C1A',
    colourSecondary: '#FF8000',
    colourTertiary: '#DB6E00'
  },
  data_lists: {
    colourPrimary: '#FF661A',
    colourSecondary: '#FF5500',
    colourTertiary: '#E64D00'
  },
  more: {
    colourPrimary: '#FF6680',
    colourSecondary: '#FF4D6A',
    colourTertiary: '#FF3355'
  },
  argument: {
    colourPrimary: '#F47983',
    colourSecondary: '#F15764',
    colourTertiary: '#EE3645'
  },
  textField: {
    colourPrimary: '#FFFFFF'
  }
};

/**
 * Build category styles from existing block styles.
 * @param blockStyles The block styles to build from.
 * @returns The category styles.
 */
function buildCategoryStyles(
  blockStyles: Record<string, Partial<Blockly.Theme.BlockStyle>>
): Record<string, Blockly.Theme.CategoryStyle> {
  const keys = [
    'motion', 'looks', 'sounds', 'control', 'event',
    'sensing', 'operators', 'data', 'more'
  ];
  const categoryStyles: Record<string, Blockly.Theme.CategoryStyle> = {};
  for (const key of keys) {
    if (key in blockStyles && blockStyles[key].colourPrimary) {
      categoryStyles[key] = {
        colour: blockStyles[key].colourPrimary
      };
    }
  }
  return categoryStyles;
}

const scratchTheme = {
  name: 'scratch',
  blockStyles: defaultBlockStyles,
  categoryStyles: buildCategoryStyles(defaultBlockStyles),
  componentStyles: {
    selectedGlowColour: 'transparent',
    insertionMarkerColour: Colours.insertionMarker as string,
    insertionMarkerOpacity: Colours.insertionMarkerOpacity as number,
    replacementGlowColour: Colours.replacementGlow as string,
    scrollbarColour: Colours.scrollbar as string,
    toolboxBackgroundColour: Colours.toolbox as string,
    toolboxForegroundColour: Colours.toolboxText as string,
    flyoutBackgroundColour: Colours.flyout as string,
    flyoutForegroundColour: Colours.flyoutText as string,
    workspaceBackgroundColour: Colours.workspace as string
  },
  fontStyle: {
    weight: '500'
  },
  startHats: true
};

/**
 * Create a custom theme based on the scratch theme.
 * @param name Name of the theme.
 * @param themeDef The theme object to override default scratch theme.
 * @returns The newly created theme.
 */
export function createTheme(name: string, themeDef: ThemeDefinition): Blockly.Theme {
  if (themeDef.blockStyles) {
    themeDef.categoryStyles = Object.assign(
      buildCategoryStyles(themeDef.blockStyles),
      themeDef.categoryStyles || {}
    );
  }
  if (!themeDef.name) themeDef.name = name;
  if (!themeDef.base) themeDef.base = 'scratch';
  if (!Object.prototype.hasOwnProperty.call(themeDef, 'startHats')) {
    themeDef.startHats = true;
  }

  colorMap[name] = themeDef.colours || {};
  const theme = Blockly.Theme.defineTheme(name, themeDef as Required<ThemeDefinition>);
  Blockly.registry.register(Blockly.registry.Type.THEME, name, theme, true);
  return theme;
}

/**
 * Get a defined theme by name.
 * @param name Name of the theme.
 * @returns The theme object, or null if not found.
 */
export function getTheme(name: string): Blockly.Theme | null {
  return Blockly.registry.getObject(Blockly.registry.Type.THEME, name);
}

/**
 * Set the theme of the workspace.
 * @param name The theme's name.
 * @param workspace The workspace to set the theme to. use main workspace by default.
 */
export function setTheme(name: string, workspace?: Blockly.WorkspaceSvg) {
  if (!workspace) {
    workspace = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
    if (!workspace.rendered) return;
  }
  const theme = getTheme(name) ?? getTheme('scratch')!;
  workspace.setTheme(theme);
  // Refresh CSS variables.
  injectCssVariables(workspace);
}

export type BlockStyle = Blockly.Theme.BlockStyle;
export type CategoryStyle = Blockly.Theme.CategoryStyle;
export type ComponentStyle = Blockly.Theme.ComponentStyle;
export type FontStyle = Blockly.Theme.FontStyle;
export const Scratch = Blockly.Theme.defineTheme('scratch', scratchTheme);
