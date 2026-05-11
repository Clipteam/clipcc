import RenderedTarget from './rendered-target.js';
import Blocks from '../engine/blocks.js';
import {loadSoundFromAsset} from '../import/load-sound.js';
import {loadCostumeFromAsset} from '../import/load-costume.js';
import newBlockIds from '../util/new-block-ids';
import StringUtil from '../util/string-util';
import StageLayering from '../engine/stage-layering';
import type {StageLayer} from '../engine/stage-layering';
import type Runtime from '../engine/runtime.js';
import type SoundBank from '../../../audio/dist/types/SoundBank';
import type {Asset} from 'clipcc-storage';
import type {VMBlock} from '../serialization/schema';

export interface Costume {
    skinId: number;
    name: string;
    md5: string;
    bitmapResolution: number;
    rotationCenterX: number;
    rotationCenterY: number;
}

export interface Sound {
    soundId: string;
    rate: number;
    sampleCount: number;
    asset: Asset;
    md5: string;
}

/**
 * Sprite to be used on the Scratch stage.
 * All clones of a sprite have shared blocks, shared costumes, shared variables,
 * shared sounds, etc.
 */
class Sprite {
    /**
     * Shared blocks object for all clones of sprite.
     */
    blocks: Blocks;
    /**
     * Human-readable name for this sprite (and all clones).
     */
    name = '';
    /**
     * List of costumes for this sprite.
     */
    costumes_: Costume[] = [];
    /**
     * List of sounds for this sprite.
     */
    sounds: Sound[] = [];
    /**
     * List of clones for this sprite, including the original.
     */
    clones: RenderedTarget[] = [];
    soundBank: SoundBank | null = null;
    constructor (
        blocks: Blocks | null,
        /**
         * Reference to the runtime.
         */
        public runtime: Runtime
    ) {
        if (!blocks) {
            // Shared set of blocks for all clones.
            blocks = new Blocks(runtime);
        }
        this.blocks = blocks;

        if (this.runtime && this.runtime.audioEngine) {
            this.soundBank = this.runtime.audioEngine.createBank();
        }
    }

    /**
     * Add an array of costumes, taking care to avoid duplicate names.
     * @param costumes Array of objects representing costumes.
     */
    set costumes (costumes) {
        this.costumes_ = [];
        for (const costume of costumes) {
            this.addCostumeAt(costume, this.costumes_.length);
        }
    }

    /**
     * Get full costume list
     * @returns {object[]} list of costumes. Note that mutating the returned list will not
     *     mutate the list on the sprite. The sprite list should be mutated by calling
     *     addCostumeAt, deleteCostumeAt, or setting costumes.
     */
    get costumes () {
        return this.costumes_;
    }

    /**
     * Add a costume at the given index, taking care to avoid duplicate names.
     * @param costumeObject Object representing the costume.
     * @param index Index at which to add costume
     */
    addCostumeAt (costumeObject: Costume, index: number) {
        if (!costumeObject.name) {
            costumeObject.name = '';
        }
        const usedNames = this.costumes_.map(costume => costume.name);
        costumeObject.name = StringUtil.unusedName(costumeObject.name, usedNames);
        this.costumes_.splice(index, 0, costumeObject);
    }

    /**
     * Delete a costume by index.
     * @param index Costume index to be deleted
     * @returns The deleted costume
     */
    deleteCostumeAt (index: number) {
        return this.costumes_.splice(index, 1)[0];
    }

    /**
     * Create a clone of this sprite.
     * @param optLayerGroup Optional layer group the clone's drawable should be added to
     * Defaults to the sprite layer group
     * @returns Newly created clone.
     */
    createClone (optLayerGroup: StageLayer) {
        const newClone = new RenderedTarget(this, this.runtime);
        newClone.isOriginal = this.clones.length === 0;
        this.clones.push(newClone);
        newClone.initAudio();
        if (newClone.isOriginal) {
            // Default to the sprite layer group if optLayerGroup is not provided
            const layerGroup = typeof optLayerGroup === 'string' ? optLayerGroup : StageLayering.SPRITE_LAYER;
            newClone.initDrawable(layerGroup);
            this.runtime.fireTargetWasCreated(newClone);
        } else {
            this.runtime.fireTargetWasCreated(newClone, this.clones[0]);
        }
        return newClone;
    }

    /**
     * Disconnect a clone from this sprite. The clone is unmodified.
     * In particular, the clone's dispose() method is not called.
     * @param clone - the clone to be removed.
     */
    removeClone (clone: RenderedTarget) {
        this.runtime.fireTargetWasRemoved(clone);
        const cloneIndex = this.clones.indexOf(clone);
        if (cloneIndex >= 0) {
            this.clones.splice(cloneIndex, 1);
        }
    }

    duplicate () {
        const newSprite = new Sprite(null, this.runtime);
        const blocksContainer = this.blocks._blocks;
        const originalBlocks = Object.keys(blocksContainer).map(key => blocksContainer[key]);
        const copiedBlocks = JSON.parse(JSON.stringify(originalBlocks)) as VMBlock[];
        newBlockIds(copiedBlocks);
        copiedBlocks.forEach(block => {
            newSprite.blocks.createBlock(block);
        });


        const allNames = this.runtime.targets.map(t => t.sprite.name);
        newSprite.name = StringUtil.unusedName(this.name, allNames);

        const assetPromises: Promise<unknown>[] = [];

        newSprite.costumes = this.costumes_.map(costume => {
            const newCostume = Object.assign({}, costume);
            assetPromises.push(loadCostumeFromAsset(newCostume, this.runtime));
            return newCostume;
        });

        newSprite.sounds = this.sounds.map(sound => {
            const newSound = Object.assign({}, sound);
            const soundAsset = sound.asset;
            assetPromises.push(loadSoundFromAsset(newSound, soundAsset, this.runtime, newSprite.soundBank));
            return newSound;
        });

        return Promise.all(assetPromises).then(() => newSprite);
    }

    dispose () {
        if (this.soundBank) {
            this.soundBank.dispose();
        }
    }
}

export default Sprite;
