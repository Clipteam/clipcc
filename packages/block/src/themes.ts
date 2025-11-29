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

export const Colours: Record<string, Record<string, string> | string | number> = {
  text: '#FFFFFF',
  workspace: '#F9F9F9',
  toolboxHover: '#4C97FF',
  toolboxSelected: '#e9eef2',
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
  fieldShadow: 'rgba(0,0,0,0.1)',
  dropDownShadow: 'rgba(0, 0, 0, .3)',
  numPadBackground: '#547AB2',
  numPadBorder: '#435F91',
  numPadActiveBackground: '#435F91',
  numPadText: 'white', // Do not use hex here, it cannot be inlined with data-uri SVG
  valueReportBackground: '#FFFFFF',
  valueReportBorder: '#AAAAAA',
  menuHover: 'rgba(76, 151, 255, 0.2)'
};

/**
 * Inject CSS variables for clipcc-block colors.
 */
export function injectCssVariables(): void {
  let root = document.querySelector('#clipcc-block-theme');
  if (!root) {
    root = document.createElement('style');
    root.id = 'clipcc-block-theme';
    document.head.appendChild(root);

    const cssVars: string[] = [];
    cssVars.push(':root {');
    for (const prop in Colours) {
      if (!Object.prototype.hasOwnProperty.call(Colours, prop)) {
        continue;
      }
      cssVars.push(`  --clipcc-block-${prop}: ${Colours[prop]};`);
    }
    cssVars.push('}');

    root.textContent = cssVars.join('\n');
  }
}

const blockStyles: {[key: string]: Partial<Blockly.Theme.BlockStyle>} = {
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
 * @returns The category styles.
 */
function buildCategoryStyles(): {[key: string]: Blockly.Theme.CategoryStyle} {
  const keys = [
    'motion', 'looks', 'sounds', 'control', 'event',
    'sensing', 'operators', 'data', 'more'
  ];
  const categoryStyles: {[key: string]: Blockly.Theme.CategoryStyle} = {};
  for (const key of keys) {
    if (key in blockStyles && blockStyles[key].colourPrimary) {
      categoryStyles[key] = {
        colour: blockStyles[key].colourPrimary
      };
    }
  }
  return categoryStyles;
}

/**
 * Override the colours in Colours with new values basded on the
 * given dictionary.
 * @param colours Dictionary of colour properties and new values.
 * @package
 */
export function overrideColours(colours?: typeof Colours) {
  // Colour overrides provided by the injection
  if (!colours) return;

  for (const colourProperty in colours) {
    if (Object.prototype.hasOwnProperty.call(colours, colourProperty) &&
      Object.prototype.hasOwnProperty.call(Colours, colourProperty)) {
      // If a property is in both colours option and Colours,
      // set the Colours value to the override.
      // Override Blockly category color object properties with those
      // provided.
      const colourPropertyValue = colours[colourProperty];
      if (typeof colourPropertyValue === 'object') {
        for (const colourSequence in colourPropertyValue) {
          if (Object.prototype.hasOwnProperty.call(colourPropertyValue, colourSequence) &&
            typeof Colours[colourProperty] === 'object' &&
            Object.prototype.hasOwnProperty.call(Colours[colourProperty], colourSequence)) {
            Colours[colourProperty][colourSequence] =
              colourPropertyValue[colourSequence];
          }
        }
      } else {
        Colours[colourProperty] = colourPropertyValue;
      }
    }
  }

  // Refresh CSS variables.
  injectCssVariables();
};

/**
 * Create the scratch theme.
 * @returns The newly created theme.
 */
export function createTheme(): Blockly.Theme {
  return Blockly.Theme.defineTheme('scratch', {
    name: 'scratch',
    blockStyles,
    categoryStyles: buildCategoryStyles(),
    componentStyles: {
      selectedGlowColour: 'transparent',
      insertionMarkerColour: 'transparent',
      insertionMarkerOpacity: Colours.insertionMarkerOpacity as number,
      replacementGlowColour: Colours.replacementGlow as string,
      scrollbarColour: Colours.scrollbar as string,
      toolboxBackgroundColour: Colours.toolbox as string,
      toolboxForegroundColour: Colours.toolboxText as string,
      flyoutBackgroundColour: Colours.flyout as string,
      workspaceBackgroundColour: Colours.workspace as string
    },
    startHats: true
  });
}
