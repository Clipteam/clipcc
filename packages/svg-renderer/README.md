# clipcc-svg-renderer

A class built for importing SVGs into [ClipCC](https://github.com/Clipteam/clipcc). Imports an SVG
string to a DOM element or an HTML canvas. Handles some of the quirks with Scratch 2.0 / ClipCC 1.x SVGs, which sometimes misreport
their width, height and view box.

## Installation

This requires you to have Git and Node.js installed.

To install as a dependency for your own application:

```bash
pnpm install clipcc-svg-renderer
```

> you may need to follow root [contribution guide](../../CONTRIBUTING.md) to set up the development environment first.

## How to include in a Node.js App

```js
import SvgRenderer from 'clipcc-svg-renderer';

const svgRenderer = new SvgRenderer();

const svgData = "<svg>...</svg>";
const scale = 1;
const quirksMode = false; // If true, emulate Scratch 2.0 SVG rendering "quirks"
function doSomethingWith(canvas) {...};

svgRenderer.loadSVG(svgData, quirksMode, () => {
    svgRenderer.draw(scale);
    doSomethingWith(svgRenderer.canvas);
});
```

## How to run locally as part of clipcc-gui

Just run `pnpm start` in the root of the repository to start a GUI development server, which will automatically build and include the latest version of this package. You can then test your changes in the GUI.
