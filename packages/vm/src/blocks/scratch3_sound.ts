import MathUtil from '../util/math-util';
import Cast from '../util/cast';
import Clone from '../util/clone';
import type {BlockArgs, CategoryPrototype} from './category_prototype';
import type Runtime from '../engine/runtime';
import type BlockUtility from '../engine/block-utility';
import type RenderedTarget from '../sprites/rendered-target';

/**
 * Occluded boolean value to make its use more understandable.
 */
const STORE_WAITING = true;

/**
 * The sound-related state, to be stored on a target.
 */
interface SoundState {
    effects: {
        [key: string]: number;
        pitch: number;
        pan: number;
    };
}

interface TargetWithSoundState extends RenderedTarget {
    soundEffects?: SoundState['effects'];
}

class Scratch3SoundBlocks implements CategoryPrototype {
    private waitingSounds: Record<string, Set<string>> = {};

    constructor (
        /**
         * The runtime instantiating this block package.
         */
        public runtime: Runtime
    ) {
        // // Clear sound effects on green flag and stop button events.
        this.stopAllSounds = this.stopAllSounds.bind(this);
        this._stopWaitingSoundsForTarget = this._stopWaitingSoundsForTarget.bind(this);
        this._clearEffectsForAllTargets = this._clearEffectsForAllTargets.bind(this);
        if (this.runtime) {
            this.runtime.on('PROJECT_STOP_ALL', this.stopAllSounds);
            this.runtime.on('PROJECT_STOP_ALL', this._clearEffectsForAllTargets);
            this.runtime.on('STOP_FOR_TARGET', this._stopWaitingSoundsForTarget);
            this.runtime.on('PROJECT_START', this._clearEffectsForAllTargets);
        }

        this._onTargetCreated = this._onTargetCreated.bind(this);
        if (this.runtime) {
            runtime.on('targetWasCreated', this._onTargetCreated);
        }
    }

    /**
     * The key to load & store a target's sound-related state.
     */
    static get STATE_KEY () {
        return 'Scratch.sound' as const;
    }

    /**
     * The default sound-related state, to be used when a target has no existing sound state.
     */
    static get DEFAULT_SOUND_STATE (): SoundState {
        return {
            effects: {
                pitch: 0,
                pan: 0
            }
        };
    }

    /**
     * The minimum and maximum MIDI note numbers, for clamping the input to play note.
     */
    static get MIDI_NOTE_RANGE () {
        return {min: 36, max: 96} as const; // C2 to C7
    }

    /**
     * The minimum and maximum beat values, for clamping the duration of play note, play drum and rest.
     * 100 beats at the default tempo of 60bpm is 100 seconds.
     */
    static get BEAT_RANGE () {
        return {min: 0, max: 100} as const;
    }

    /**
     * The minimum and maximum tempo values, in bpm.
     */
    static get TEMPO_RANGE () {
        return {min: 20, max: 500} as const;
    }

    /**
     * The minimum and maximum values for each sound effect.
     */
    get EFFECT_RANGE (): {[key: string]: {min: number, max: number}} {
        if (this.runtime.limitOptions.unlimitedSoundStuffs) {
            return {
                pitch: {min: -Infinity, max: Infinity}, // Unlimited
                pan: {min: -100, max: 100} // 100% left to 100% right
            };
        }
        return {
            pitch: {min: -360, max: 360}, // -3 to 3 octaves
            pan: {min: -100, max: 100} // 100% left to 100% right
        };
    }

    /**
     * Collect sound state for this target.
     * @param target - the target to get the sound state for.
     * @returns the mutable sound state associated with that target. This will be created if necessary.
     */
    _getSoundState (target: RenderedTarget): SoundState {
        let soundState: SoundState = target.getCustomState(Scratch3SoundBlocks.STATE_KEY);
        if (!soundState) {
            soundState = Clone.simple(Scratch3SoundBlocks.DEFAULT_SOUND_STATE);
            target.setCustomState(Scratch3SoundBlocks.STATE_KEY, soundState);
            (target as TargetWithSoundState).soundEffects = soundState.effects;
        }
        return soundState;
    }

    /**
     * When a Target is cloned, clone the sound state.
     * @param newTarget - the newly created target.
     * @param sourceTarget - the target used as a source for the new clone, if any.
     * @listens Runtime#event:targetWasCreated
     */
    _onTargetCreated (newTarget: RenderedTarget, sourceTarget?: RenderedTarget) {
        if (sourceTarget) {
            const soundState = sourceTarget.getCustomState(Scratch3SoundBlocks.STATE_KEY);
            if (soundState && newTarget) {
                newTarget.setCustomState(Scratch3SoundBlocks.STATE_KEY, Clone.simple(soundState));
                this._syncEffectsForTarget(newTarget);
            }
        }
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @returns Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            sound_play: this.playSound,
            sound_playuntildone: this.playSoundAndWait,
            sound_stopallsounds: this.stopAllSounds,
            sound_seteffectto: this.setEffect,
            sound_changeeffectby: this.changeEffect,
            sound_cleareffects: this.clearEffects,
            sound_sounds_menu: this.soundsMenu,
            sound_beats_menu: this.beatsMenu,
            sound_effects_menu: this.effectsMenu,
            sound_setvolumeto: this.setVolume,
            sound_changevolumeby: this.changeVolume,
            sound_volume: this.getVolume
        };
    }

    getMonitored () {
        return {
            sound_volume: {
                isSpriteSpecific: true,
                getId: (targetId?: string) => `${targetId}_volume`
            }
        };
    }

    playSound (args: BlockArgs, util: BlockUtility) {
        // Don't return the promise, it's the only difference for AndWait
        this._playSound(args, util);
    }

    playSoundAndWait (args: BlockArgs, util: BlockUtility) {
        return this._playSound(args, util, STORE_WAITING);
    }

    _playSound (args: BlockArgs, util: BlockUtility, storeWaiting?: boolean) {
        const index = this._getSoundIndex(args.SOUND_MENU, util);
        if (index >= 0) {
            const {target} = util;
            const {sprite} = target;
            const {soundId} = sprite.sounds[index];
            if (sprite.soundBank) {
                if (storeWaiting === STORE_WAITING) {
                    this._addWaitingSound(target.id, soundId);
                } else {
                    this._removeWaitingSound(target.id, soundId);
                }
                return sprite.soundBank.playSound(target, soundId);
            }
        }
    }

    _addWaitingSound (targetId: string, soundId: string) {
        if (!this.waitingSounds[targetId]) {
            this.waitingSounds[targetId] = new Set();
        }
        this.waitingSounds[targetId].add(soundId);
    }

    _removeWaitingSound (targetId: string, soundId: string) {
        if (!this.waitingSounds[targetId]) {
            return;
        }
        this.waitingSounds[targetId].delete(soundId);
    }

    _getSoundIndex (soundName: string, util: BlockUtility): number {
        // if the sprite has no sounds, return -1
        const len = util.target.sprite.sounds.length;
        if (len === 0) {
            return -1;
        }

        // look up by name first
        const index = this.getSoundIndexByName(soundName, util);
        if (index !== -1) {
            return index;
        }

        // then try using the sound name as a 1-indexed index
        const oneIndexedIndex = parseInt(soundName, 10);
        if (!isNaN(oneIndexedIndex)) {
            return MathUtil.wrapClamp(oneIndexedIndex - 1, 0, len - 1);
        }

        // could not be found as a name or converted to index, return -1
        return -1;
    }

    getSoundIndexByName (soundName: string, util: BlockUtility): number {
        const sounds = util.target.sprite.sounds;
        for (let i = 0; i < sounds.length; i++) {
            if (sounds[i].name === soundName) {
                return i;
            }
        }
        // if there is no sound by that name, return -1
        return -1;
    }

    stopAllSounds () {
        if (this.runtime.targets === null) return;
        const allTargets = this.runtime.targets;
        for (let i = 0; i < allTargets.length; i++) {
            this._stopAllSoundsForTarget(allTargets[i]);
        }
    }

    _stopAllSoundsForTarget (target: RenderedTarget) {
        if (target.sprite.soundBank) {
            target.sprite.soundBank.stopAllSounds(target);
            if (this.waitingSounds[target.id]) {
                this.waitingSounds[target.id].clear();
            }
        }
    }

    _stopWaitingSoundsForTarget (target: RenderedTarget) {
        if (target.sprite.soundBank) {
            if (this.waitingSounds[target.id]) {
                for (const soundId of this.waitingSounds[target.id].values()) {
                    target.sprite.soundBank.stop(target, soundId);
                }
                this.waitingSounds[target.id].clear();
            }
        }
    }

    setEffect (args: BlockArgs, util: BlockUtility) {
        return this._updateEffect(args, util, false);
    }

    changeEffect (args: BlockArgs, util: BlockUtility) {
        return this._updateEffect(args, util, true);
    }

    _updateEffect (args: BlockArgs, util: BlockUtility, change: boolean) {
        const effect = Cast.toString(args.EFFECT).toLowerCase();
        const value = Cast.toNumber(args.VALUE);

        const soundState = this._getSoundState(util.target);
        if (!Object.prototype.hasOwnProperty.call(soundState.effects, effect)) return;

        if (change) {
            soundState.effects[effect] += value;
        } else {
            soundState.effects[effect] = value;
        }

        const {min, max} = this.EFFECT_RANGE[effect];
        soundState.effects[effect] = MathUtil.clamp(soundState.effects[effect], min, max);

        this._syncEffectsForTarget(util.target);
        // Yield until the next tick.
        return Promise.resolve();
    }

    _syncEffectsForTarget (target: TargetWithSoundState) {
        if (!target || !target.sprite.soundBank) return;
        target.soundEffects = this._getSoundState(target).effects;

        target.sprite.soundBank.setEffects(target);
    }

    clearEffects (args: BlockArgs, util: BlockUtility) {
        this._clearEffectsForTarget(util.target);
    }

    _clearEffectsForTarget (target: RenderedTarget) {
        const soundState = this._getSoundState(target);
        for (const effect in soundState.effects) {
            if (!Object.prototype.hasOwnProperty.call(soundState.effects, effect)) continue;
            soundState.effects[effect] = 0;
        }
        this._syncEffectsForTarget(target);
    }

    _clearEffectsForAllTargets () {
        if (this.runtime.targets === null) return;
        const allTargets = this.runtime.targets;
        for (let i = 0; i < allTargets.length; i++) {
            this._clearEffectsForTarget(allTargets[i]);
        }
    }

    setVolume (args: BlockArgs, util: BlockUtility) {
        const volume = Cast.toNumber(args.VOLUME);
        return this._updateVolume(volume, util);
    }

    changeVolume (args: BlockArgs, util: BlockUtility) {
        const volume = Cast.toNumber(args.VOLUME) + util.target.volume;
        return this._updateVolume(volume, util);
    }

    _updateVolume (volume: number, util: BlockUtility) {
        volume = MathUtil.clamp(volume, 0, 100);
        util.target.volume = volume;
        this._syncEffectsForTarget(util.target);

        // Yield until the next tick.
        return Promise.resolve();
    }

    getVolume (args: BlockArgs, util: BlockUtility) {
        return util.target.volume;
    }

    soundsMenu (args: BlockArgs) {
        return args.SOUND_MENU;
    }

    beatsMenu (args: BlockArgs) {
        return args.BEATS;
    }

    effectsMenu (args: BlockArgs) {
        return args.EFFECT;
    }
}

export default Scratch3SoundBlocks;
