import base64js from 'base64-js';

type ResolutionConvertCallback = (error: string | null, dataURI?: string) => void;

/**
 * Adapts Scratch 2.0 bitmaps for use in scratch 3.0
 */
class BitmapAdapter {
    private _makeImage: () => HTMLImageElement;
    private _makeCanvas: () => HTMLCanvasElement;
    stageWidth = 480;
    stageHeight = 360;
    /**
     * @param makeImage HTML image constructor. Tests can provide this.
     * @param makeCanvas HTML canvas constructor. Tests can provide this.
     */
    constructor (makeImage?: () => HTMLImageElement, makeCanvas?: () => HTMLCanvasElement) {
        this._makeImage = makeImage ? makeImage : () => new Image();
        this._makeCanvas = makeCanvas ? makeCanvas : () => document.createElement('canvas');
    }

    /**
     * Set current stage size.
     * @param width The stage width.
     * @param height The stage height.
     */
    setStageSize (width: number, height: number) {
        this.stageWidth = width;
        this.stageHeight = height;
    }

    /**
     * Return a canvas with the resized version of the given image, done using nearest-neighbor interpolation
     * @param image The image to resize
     * @param newWidth The desired post-resize width of the image
     * @param newHeight The desired post-resize height of the image
     * @returns A canvas with the resized image drawn on it.
     */
    resize (image: Exclude<CanvasImageSource, VideoFrame | SVGImageElement>, newWidth: int, newHeight: int): HTMLCanvasElement {
        // We want to always resize using nearest-neighbor interpolation. However, canvas implementations are free to
        // use linear interpolation (or other "smooth" interpolation methods) when downscaling:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1360415
        // It seems we can get around this by resizing in two steps: first width, then height. This will always result
        // in nearest-neighbor interpolation, even when downscaling.
        const stretchWidthCanvas = this._makeCanvas();
        stretchWidthCanvas.width = newWidth;
        stretchWidthCanvas.height = image.height;
        let context = stretchWidthCanvas.getContext('2d')!;
        context.imageSmoothingEnabled = false;
        context.drawImage(image, 0, 0, stretchWidthCanvas.width, stretchWidthCanvas.height);
        const stretchHeightCanvas = this._makeCanvas();
        stretchHeightCanvas.width = newWidth;
        stretchHeightCanvas.height = newHeight;
        context = stretchHeightCanvas.getContext('2d')!;
        context.imageSmoothingEnabled = false;
        context.drawImage(stretchWidthCanvas, 0, 0, stretchHeightCanvas.width, stretchHeightCanvas.height);
        return stretchHeightCanvas;
    }

    /**
     * Scratch 2.0 had resolution 1 and 2 bitmaps. All bitmaps in Scratch 3.0 are equivalent
     * to resolution 2 bitmaps. Therefore, converting a resolution 1 bitmap means doubling
     * it in width and height.
     * @param dataURI Base 64 encoded image data of the bitmap
     * @param callback Node-style callback that returns updated dataURI if conversion succeeded
     */
    convertResolution1Bitmap (dataURI: string, callback: ResolutionConvertCallback) {
        const image = this._makeImage();
        image.src = dataURI;
        image.onload = () => {
            callback(null, this.resize(image, image.width * 2, image.height * 2).toDataURL());
        };
        image.onerror = () => {
            callback('Image load failed');
        };
    }

    /**
     * Given width/height of an uploaded item, return width/height the image will be resized
     * to in Scratch 3.0
     * @param oldWidth original width
     * @param oldHeight original height
     * @returns Array of new width, new height
     */
    getResizedWidthHeight (oldWidth: number, oldHeight: number) {
        const STAGE_RATIO = this.stageWidth / this.stageHeight;

        // If both dimensions are smaller than or equal to corresponding stage dimension,
        // double both dimensions
        if ((oldWidth <= this.stageWidth) && (oldHeight <= this.stageHeight)) {
            return {width: oldWidth * 2, height: oldHeight * 2};
        }

        // If neither dimension is larger than 2x corresponding stage dimension,
        // this is an in-between image, return it as is
        if ((oldWidth <= this.stageWidth * 2) && (oldHeight <= this.stageHeight * 2)) {
            return {width: oldWidth, height: oldHeight};
        }

        const imageRatio = oldWidth / oldHeight;
        // Otherwise, figure out how to resize
        if (imageRatio >= STAGE_RATIO) {
            // Wide Image
            return {width: this.stageWidth * 2, height: this.stageWidth * 2 / imageRatio};
        }
        // In this case we have either:
        // - A wide image, but not with as big a ratio between width and height,
        // making it so that fitting the width to double stage size would leave
        // the height too big to fit in double the stage height
        // - A square image that's still larger than the double at least
        // one of the stage dimensions, so pick the smaller of the two dimensions (to fit)
        // - A tall image
        // In any of these cases, resize the image to fit the height to double the stage height
        return {width: this.stageHeight * 2 * imageRatio, height: this.stageHeight * 2};
    }

    /**
     * Given bitmap data, resize as necessary.
     * @param fileData Base 64 encoded image data of the bitmap
     * @param fileType The MIME type of this file
     * @returns Resolves to resized image data Uint8Array
     */
    importBitmap (fileData: ArrayBuffer | string, fileType: string) {
        let dataURI = fileData;
        if (fileData instanceof ArrayBuffer) {
            dataURI = this.convertBinaryToDataURI(fileData, fileType);
        }
        return new Promise((resolve, reject) => {
            const image = this._makeImage();
            image.src = dataURI as string;
            image.onload = () => {
                const newSize = this.getResizedWidthHeight(image.width, image.height);
                if (newSize.width === image.width && newSize.height === image.height) {
                    // No change
                    resolve(this.convertDataURIToBinary(dataURI as string));
                } else {
                    const resizedDataURI = this.resize(image, newSize.width, newSize.height).toDataURL();
                    resolve(this.convertDataURIToBinary(resizedDataURI));
                }
            };
            image.onerror = () => {
                // TODO: reject with an Error (breaking API change!)
                // eslint-disable-next-line prefer-promise-reject-errors
                reject('Image load failed');
            };
        });
    }

    // TODO consolidate with scratch-vm/src/util/base64-util.js
    // From https://gist.github.com/borismus/1032746
    convertDataURIToBinary (dataURI: string) {
        const BASE64_MARKER = ';base64,';
        const base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
        const base64 = dataURI.substring(base64Index);
        const raw = window.atob(base64);
        const rawLength = raw.length;
        const array = new Uint8Array(new ArrayBuffer(rawLength));

        for (let i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
        }
        return array;
    }

    convertBinaryToDataURI (arrayBuffer: ArrayBuffer, contentType: string) {
        return `data:${contentType};base64,${base64js.fromByteArray(new Uint8Array(arrayBuffer))}`;
    }
}

export default BitmapAdapter;
