# clipcc-paint
#### ClipCC-paint provides a paint editor React component that takes and outputs SVGs or PNGs. It can convert between vector and bitmap modes.

### Installation
It will be easiest if you develop on Mac or Linux. If you are using Windows, I recommend using Ubuntu on Windows, which will allow you to use Linux commands on Windows. You will need administrator permissions.

- https://docs.microsoft.com/en-us/windows/wsl/install-win10

> ClipCC Paint requires you to have Git and Node.js installed.
> you may need to follow root [contribution guide](../../CONTRIBUTING.md) to set up the development environment first.

### Running locally (stand-alone)
You can try out your own copy of the paint editor by running the development server.

In the cloned `clipcc` and now in paint directory, run:
```bash
pnpm run build
pnpm start
```

Then go to [http://localhost:8078/playground/](http://localhost:8078/playground/). 8078 is BLOB upside-down. The True Name of this repo is scratch-blobs.

*(Note that the `pnpm run build` step above seems like it's only necessary for some user and environments, and not others; check for yourself if the server that `pnpm start` starts is hot-reloading correctly.)*

### Running locally (as part of Scratch)

Just run `pnpm gui start` in project root, then go to [http://localhost:8601](http://localhost:8601). 601 is supposed to look like GUI (it's okay, I don't really see it either.) The Costumes tab should be running your local copy of clipcc-paint!

### How to include in your own Node.js App
If you want to use clipcc-paint in your own Node environment/application, add it with:
```bash
pnpm install --save clipcc-paint
```

For an example of how to use clipcc-paint as a library, check out the `clipcc-paint/src/playground` directory.

In your parent component:
```
import PaintEditor from 'clipcc-paint';
...
<PaintEditor
    image={optionalImage}
    imageId={optionalId}
    imageFormat='svg'
    rotationCenterX={optionalCenterPointX}
    rotationCenterY={optionalCenterPointY}
    rtl={true|false}
    onUpdateImage={handleUpdateImageFunction}
    zoomLevelId={optionalZoomLevelId}
/>
```

`image`: may either be nothing, an SVG string or a base64 data URI)
SVGs of up to size 480 x 360 will fit into the view window of the paint editor, while bitmaps of size up to 960 x 720 will fit into the paint editor. One unit of an SVG will appear twice as tall and wide as one unit of a bitmap. This quirky import behavior comes from needing to support legacy projects in Scratch.

`imageId`: If this parameter changes, then the paint editor will be cleared, the undo stack reset, and the image re-imported.

`imageFormat`: 'svg', 'png', or 'jpg'. Other formats are currently not supported.

`rotationCenterX`: x coordinate relative to the top left corner of the sprite of the point that should be centered. If left undefined, image will be horizontally centered.

`rotationCenterY`: y coordinate relative to the top left corner of the sprite of the point that should be centered. If left undefined, image will be vertcally centered.

`rtl`: True if the paint editor should be laid out right to left (meant for right to left languages)

`onUpdateImage`: A handler called with the new image (either an SVG string or an ImageData) each time the drawing is edited.

`zoomLevelId`: All costumes with the same zoom level ID will share the same saved zoom level. When a new zoom level ID is encountered, the paint editor will zoom to fit the current costume comfortably. Leave undefined to perform no zoom to fit.


In the top-level combineReducers function:
```
import {ScratchPaintReducer} from 'clipcc-paint';
...
combineReducers({
	...
    scratchPaint: ScratchPaintReducer
});
```
Note that clipcc-paint expects its state to be in `state.scratchPaint`, so the name must be exact.

Clipcc-paint shares state with its parent component because it expects to share the parent's `IntlProvider`, which inserts translations into the state. See the `IntlProvider` setup in `clipcc-gui` [here](https://github.com/LLK/clipcc-gui/blob/f017ed72201bf63334dced161441ef6f154b1c74/src/lib/app-state-hoc.jsx).

### Code organization
We use React and Redux. If you're just getting started with them, here are some good tutorials:
[https://egghead.io/courses/getting-started-with-redux](https://egghead.io/courses/getting-started-with-redux)

- Under `/src`, our React/Redux code is divided mainly between `components` (presentational components), `containers` (container components), and `reducers`.

- `css` contains only shared css. Most of the css is stored alongside its component.

- `helper` contains pure javascript used by the containers. If you want to change how something works, it's probably here. For instance, the brush tool is in `helper/blob-tools/`, and the code that's run when you click the group button is in `helper/group.js`.

### Testing
```bash
pnpm run test
```

Just unit tests:
```bash
pnpm run unit
```

An individual unit test: (run from `clipcc-paint` directory)
```bash
./node_modules/.bin/jest ./test/unit/undo-reducer.test.js
```
