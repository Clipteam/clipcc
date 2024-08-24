import loadSvgString from './load-svg-string';
import serializeSvgToString from './serialize-svg-to-string';

/**
 * A measured SVG "viewbox"
 */
interface SvgMeasurements {
    /**
     * The left edge of the SVG viewbox.
     */
    x: number;
    /**
     * The top edge of the SVG viewbox.
     */
    y: number;
    /**
     * The width of the SVG viewbox.
     */
    width: number;
    /**
     * The height of the SVG viewbox.
     */
    height: number;
}

/**
 * Main quirks-mode SVG rendering code.
 * @deprecated Call into individual methods exported from this library instead.
 */
class SvgRenderer {
    private _canvas: HTMLCanvasElement;
    private _context: CanvasRenderingContext2D;
    private _measurements: SvgMeasurements;
    private _cachedImage: HTMLImageElement | null;
    private _svgTag?: SVGElement;
    loaded: boolean;
    /**
     * Create a quirks-mode SVG renderer for a particular canvas.
     * @param {HTMLCanvasElement} [canvas] An optional canvas element to draw to. If this is not provided, the renderer
     * will create a new canvas.
     * @constructor
     */
    constructor (canvas: HTMLCanvasElement) {
        /**
         * The canvas that this SVG renderer will render to.
         * @type {HTMLCanvasElement}
         * @private
         */
        this._canvas = canvas || document.createElement('canvas');
        this._context = this._canvas.getContext('2d')!;

        /**
         * The measurement box of the currently loaded SVG.
         */
        this._measurements = {x: 0, y: 0, width: 0, height: 0};

        /**
         * The `<img>` element with the contents of the currently loaded SVG.
         */
        this._cachedImage = null;

        /**
         * True if this renderer's current SVG is loaded and can be rendered to the canvas.
         */
        this.loaded = false;
    }

    get canvas () {
        return this._canvas;
    }

    /**
     * @return the natural size, in Scratch units, of this SVG.
     */
    get size (): [number, number] {
        return [this._measurements.width, this._measurements.height];
    }

    /**
     * @return {Array<number>} the offset (upper left corner) of the SVG's view box.
     */
    get viewOffset () {
        return [this._measurements.x, this._measurements.y];
    }

    /**
     * Load an SVG string and normalize it. All the steps before drawing/measuring.
     * @param {!string} svgString String of SVG data to draw in quirks-mode.
     * @param {?boolean} fromVersion2 True if we should perform conversion from
     *     version 2 to version 3 svg.
     */
    loadString (svgString: string, fromVersion2?: boolean) {
        // New svg string invalidates the cached image
        this._cachedImage = null;
        const svgTag = loadSvgString(svgString, fromVersion2);

        this._svgTag = svgTag;
        this._measurements = {
            width: svgTag.viewBox.baseVal.width,
            height: svgTag.viewBox.baseVal.height,
            x: svgTag.viewBox.baseVal.x,
            y: svgTag.viewBox.baseVal.y
        };
    }

    /**
     * Load an SVG string, normalize it, and prepare it for (synchronous) rendering.
     * @param svgString String of SVG data to draw in quirks-mode.
     * @param fromVersion2 True if we should perform conversion from version 2 to version 3 svg.
     * @param onFinish - An optional callback to call when the SVG is loaded and can be rendered.
     */
    loadSVG (svgString: string, fromVersion2: boolean | undefined, onFinish: () => void) {
        this.loadString(svgString, fromVersion2);
        this._createSVGImage(onFinish);
    }

    /**
     * Creates an <img> element for the currently loaded SVG string, then calls the callback once it's loaded.
     * @param {Function} [onFinish] - An optional callback to call when the <img> has loaded.
     */
    _createSVGImage (onFinish: () => void) {
        if (this._cachedImage === null) this._cachedImage = new Image();
        const img = this._cachedImage;

        img.onload = () => {
            this.loaded = true;
            if (onFinish) onFinish();
        };
        const svgText = this.toString(true /* shouldInjectFonts */);
        img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svgText)}`;
        this.loaded = false;
    }

    /**
     * Serialize the active SVG DOM to a string.
     * @param {?boolean} shouldInjectFonts True if fonts should be included in the SVG as
     *     base64 data.
     * @returns {string} String representing current SVG data.
     * @deprecated Use the standalone `serializeSvgToString` export instead.
     */
    toString (shouldInjectFonts?: boolean) {
        if (!this._svgTag) {
            throw new Error('SVG not loaded');
        }
        return serializeSvgToString(this._svgTag, shouldInjectFonts);
    }

    /**
     * Synchronously draw the loaded SVG to this renderer's `canvas`.
     * @param {number} [scale] - Optionally, also scale the image by this factor.
     */
    draw (scale: number) {
        if (!this.loaded) throw new Error('SVG image has not finished loading');
        this._drawFromImage(scale);
    }

    /**
     * Draw to the canvas from a loaded image element.
     * @param {number} [scale] - Optionally, also scale the image by this factor.
     **/
    _drawFromImage (scale: number) {
        if (this._cachedImage === null) return;

        const ratio = Number.isFinite(scale) ? scale : 1;
        const bbox = this._measurements;
        this._canvas.width = bbox.width * ratio;
        this._canvas.height = bbox.height * ratio;
        // Even if the canvas at the current scale has a nonzero size, the image's dimensions are floored pre-scaling.
        // e.g. if an image has a width of 0.4 and is being rendered at 3x scale, the canvas will have a width of 1, but
        // the image's width will be rounded down to 0 on some browsers (Firefox) prior to being drawn at that scale.
        if (
            this._canvas.width <= 0 ||
            this._canvas.height <= 0 ||
            this._cachedImage.naturalWidth <= 0 ||
            this._cachedImage.naturalHeight <= 0
        ) return;
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._context.setTransform(ratio, 0, 0, ratio, 0, 0);
        this._context.drawImage(this._cachedImage, 0, 0);
    }
}

export default SvgRenderer;
