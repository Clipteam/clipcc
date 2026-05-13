import StageLayering from '../engine/stage-layering';
import type Runtime from '../engine/runtime';

export interface VideoProvider {
    /** Requests camera access from the user, and upon success, enables the video feed */
    enableVideo: () => Promise<unknown>;
    /** Turns off the video feed */
    disableVideo: () => void;
    /** Return frame data from the video feed in specified dimensions, format, and mirroring. */
    getFrame: (frameInfo: {
        dimensions: [number, number];
        mirror: boolean;
        format: string;
        cacheTimeout: number;
    }) => ImageData | null;
    videoReady: boolean;
    /** Set the dimensions of the video stream, usually called when stage size changed. */
    setDimensions: (width: number, height: number) => void;
}

class Video {
    runtime: Runtime;

    provider: VideoProvider | null = null;

    /**
     * Id representing a Scratch Renderer skin the video is rendered to for
     * previewing.
     */
    _skinId = -1;

    /**
     * Id for a drawable using the video's skin that will render as a video
     * preview.
     */
    _drawable = -1;

    /**
     * Store the last state of the video transparency ghost effect
     */
    _ghost = 0;

    /**
     * Store a flag that allows the preview to be forced transparent.
     */
    _forceTransparentPreview = false;

    _frameCacheTimeout?: number;

    _renderPreviewFrame: (() => void) | null = null;

    _renderPreviewTimeout?: ReturnType<typeof setTimeout>;

    mirror?: boolean;

    constructor (runtime: Runtime) {
        this.runtime = runtime;
    }

    static get FORMAT_IMAGE_DATA () {
        return 'image-data' as const;
    }

    static get FORMAT_CANVAS () {
        return 'canvas' as const;
    }

    /**
     * Dimensions the video stream is analyzed at after its rendered to the
     * sample canvas.
     * @deprecated Now follows actual stage size
     */
    static get DIMENSIONS (): [number, number] {
        return [480, 360];
    }

    /**
     * Order preview drawable is inserted at in the renderer.
     */
    static get ORDER (): number {
        return 1;
    }

    /**
     * Set a video provider for this device. A default implementation of
     * a video provider can be found in scratch-gui/src/lib/video/video-provider
     * @param provider - Video provider to use
     */
    setProvider (provider: VideoProvider) {
        this.provider = provider;
    }

    /**
     * Request video be enabled.  Sets up video, creates video skin and enables preview.
     *
     * ioDevices.video.requestVideo()
     *
     * @returns resolves a promise to this IO device when video is ready.
     */
    enableVideo (){
        if (!this.provider) return null;
        return this.provider.enableVideo().then(() => this._setupPreview());
    }

    /**
     * Disable video stream (turn video off)
     */
    disableVideo () {
        this._disablePreview();
        if (!this.provider) return;
        this.provider.disableVideo();
    }

    /**
     * Return frame data from the video feed in a specified dimensions, format, and mirroring.
     *
     * @param frameInfo A descriptor of the frame you would like to receive.
     * @param frameInfo.dimensions [width, height] array of numbers.  Defaults to [480,360]
     * @param frameInfo.mirror If you specificly want a mirror/non-mirror frame, defaults to the global
     *                         mirror state (ioDevices.video.mirror)
     * @param frameInfo.format Requested video format, available formats are 'image-data' and 'canvas'.
     * @param frameInfo.cacheTimeout Will reuse previous image data if the time since capture is less than
     *                               the cacheTimeout.  Defaults to 16ms.
     *
     * @returns Frame data in requested format, null when errors.
     */
    getFrame ({
        dimensions = [this.runtime.stageWidth, this.runtime.stageHeight],
        mirror = this.mirror,
        format = Video.FORMAT_IMAGE_DATA,
        cacheTimeout = this._frameCacheTimeout
    }: {
        dimensions?: [number, number];
        mirror?: boolean;
        format?: string;
        cacheTimeout?: number;
    }) {
        if (this.provider) {
            return this.provider.getFrame({dimensions, mirror: mirror!, format, cacheTimeout: cacheTimeout!});
        }
        return null;
    }

    /**
     * Set the preview ghost effect
     * @param ghost from 0 (visible) to 100 (invisible) - ghost effect
     */
    setPreviewGhost (ghost: number) {
        this._ghost = ghost;
        // Confirm that the default value has been changed to a valid id for the drawable
        if (this._drawable !== -1) {
            this.runtime.renderer!.updateDrawableEffect(
                this._drawable,
                'ghost',
                this._forceTransparentPreview ? 100 : ghost
            );
        }
    }

    _disablePreview () {
        if (this._skinId !== -1) {
            this.runtime.renderer!.updateBitmapSkin(
                this._skinId,
                new ImageData(this.runtime.stageWidth, this.runtime.stageHeight),
                1,
                null
            );
            this.runtime.renderer!.updateDrawableVisible(this._drawable, false);
        }
        this._renderPreviewFrame = null;
    }

    _setupPreview () {
        const {renderer} = this.runtime;
        if (!renderer) return;

        if (this._skinId === -1 && this._drawable === -1) {
            this._skinId = renderer.createBitmapSkin(
                new ImageData(this.runtime.stageWidth, this.runtime.stageHeight),
                1
            );
            this._drawable = renderer.createDrawable(StageLayering.VIDEO_LAYER);
            renderer.updateDrawableSkinId(this._drawable, this._skinId);
        }

        // if we haven't already created and started a preview frame render loop, do so
        if (!this._renderPreviewFrame) {
            renderer.updateDrawableEffect(this._drawable, 'ghost', this._forceTransparentPreview ? 100 : this._ghost);
            renderer.updateDrawableVisible(this._drawable, true);

            this._renderPreviewFrame = () => {
                clearTimeout(this._renderPreviewTimeout);
                if (!this._renderPreviewFrame) {
                    return;
                }

                this._renderPreviewTimeout = setTimeout(this._renderPreviewFrame, this.runtime.currentStepTime!);

                const imageData = this.getFrame({
                    format: Video.FORMAT_IMAGE_DATA,
                    cacheTimeout: this.runtime.currentStepTime!
                });

                if (!imageData) {
                    renderer.updateBitmapSkin(
                        this._skinId,
                        new ImageData(this.runtime.stageWidth, this.runtime.stageHeight),
                        1,
                        null
                    );
                    return;
                }

                renderer.updateBitmapSkin(this._skinId, imageData, 1, null);
                this.runtime.requestRedraw();
            };

            this._renderPreviewFrame();
        }
    }

    get videoReady () {
        if (this.provider) return this.provider.videoReady;
        return false;
    }

    /**
     * Method implemented by all IO devices to allow external changes.
     * The only change available externally is hiding the preview, used e.g. to
     * prevent drawing the preview into project thumbnails.
     * @param data passed to this IO device.
     * @param data.forceTransparentPreview - whether the preview should be forced transparent.
     */
    postData ({forceTransparentPreview}: {forceTransparentPreview: boolean}) {
        this._forceTransparentPreview = forceTransparentPreview;
        // Setting the ghost to the current value will pick up the forceTransparentPreview
        // flag and override the current ghost. The complexity is to prevent blocks
        // from overriding forceTransparentPreview
        this.setPreviewGhost(this._ghost);
    }
}

export default Video;
