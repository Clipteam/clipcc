export const enum StageLayer {
    BACKGROUND = 'background',
    VIDEO = 'video',
    PEN = 'pen',
    SPRITE = 'sprite'
}

class StageLayering {
    static get BACKGROUND_LAYER () {
        return StageLayer.BACKGROUND;
    }

    static get VIDEO_LAYER () {
        return StageLayer.VIDEO;
    }

    static get PEN_LAYER () {
        return StageLayer.PEN;
    }

    static get SPRITE_LAYER () {
        return StageLayer.SPRITE;
    }

    // Order of layer groups relative to each other,
    static get LAYER_GROUPS () {
        return [
            StageLayering.BACKGROUND_LAYER,
            StageLayering.VIDEO_LAYER,
            StageLayering.PEN_LAYER,
            StageLayering.SPRITE_LAYER
        ];
    }
}

export default StageLayering;
