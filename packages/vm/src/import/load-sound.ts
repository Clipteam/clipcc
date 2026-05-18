import StringUtil from '../util/string-util';
import log from '../util/log';
import type {Sound} from '../sprites/sprite';
import type {Asset, DataFormat} from 'clipcc-storage';
import type Runtime from '../engine/runtime';
import type SoundBank from '../../../audio/dist/types/SoundBank';
/**
 * Initialize a sound from an asset asynchronously.
 * @param  sound - the Scratch sound object.
 * @param  soundAsset - the asset loaded from storage.
 * @param runtime - Scratch runtime, used to access the storage module.
 * @param soundBank - Scratch Audio SoundBank to add sounds to.
 * @returns A promise which will resolve to the sound when ready.
 */
const loadSoundFromAsset = function (sound: Sound, soundAsset: Asset, runtime: Runtime, soundBank: SoundBank | null) {
    sound.assetId = soundAsset.assetId!;
    if (!runtime.audioEngine) {
        log.warn('No audio engine present; cannot load sound asset: ', sound.md5);
        return Promise.resolve(sound);
    }
    return runtime.audioEngine.decodeSoundPlayer(Object.assign(
        {},
        sound,
        {data: soundAsset.data as {buffer: ArrayBuffer}}
    ))!.then(soundPlayer => {
        sound.soundId = soundPlayer.id;
        // Set the sound sample rate and sample count based on the
        // the audio buffer from the audio engine since the sound
        // gets resampled by the audio engine
        const soundBuffer = soundPlayer.buffer;
        sound.rate = soundBuffer.sampleRate;
        sound.sampleCount = soundBuffer.length;

        if (soundBank !== null) {
            soundBank.addSoundPlayer(soundPlayer);
        }

        return sound;
    });
};

// Handle sound loading errors by replacing the runtime sound with the
// default sound from storage, but keeping track of the original sound metadata
// in a `broken` field
const handleSoundLoadError = function (sound: Sound, runtime: Runtime, soundBank: SoundBank | null) {
    // Keep track of the old asset information until we're done loading the default sound
    const oldAsset = sound.asset; // could be null
    const oldAssetId = sound.assetId;
    const oldSample = sound.sampleCount;
    const oldRate = sound.rate;
    const oldFormat = sound.format;
    const oldDataFormat = sound.dataFormat;

    // Use default asset if original fails to load
    sound.assetId = runtime.storage!.defaultAssetId.Sound;
    sound.asset = runtime.storage!.get(sound.assetId)!;
    sound.md5 = `${sound.assetId}.${sound.asset.dataFormat}`;

    return loadSoundFromAsset(sound, sound.asset, runtime, soundBank).then(loadedSound => {
        loadedSound.broken = {
            assetId: oldAssetId,
            // Should be null if we got here because the sound was missing
            asset: oldAsset,
            format: oldFormat,
            md5: `${oldAssetId}.${oldDataFormat}`,
            dataFormat: oldDataFormat,
            rate: oldRate,
            sampleCount: oldSample
        };

        return loadedSound;
    });
};

/**
 * Load a sound's asset into memory asynchronously.
 * @param sound - the Scratch sound object.
 * @param  runtime - Scratch runtime, used to access the storage module.
 * @param soundBank - Scratch Audio SoundBank to add sounds to.
 * @returns A promise which will resolve to the sound when ready.
 */
let loadSound = function (sound: Sound, runtime: Runtime, soundBank: SoundBank | null) {
    if (!runtime.storage) {
        log.warn('No storage module present; cannot load sound asset: ', sound.md5);
        return Promise.resolve(sound);
    }
    const idParts = StringUtil.splitFirst(sound.md5, '.');
    const md5 = idParts[0];
    const ext = idParts[1]!.toLowerCase() as DataFormat;
    sound.dataFormat = ext;
    return (
        (sound.asset && Promise.resolve(sound.asset)) ||
        runtime.storage.load(runtime.storage.AssetType.Sound, md5, ext)
    )
        .then(soundAsset => {
            sound.asset = soundAsset;

            if (!soundAsset) {
                log.warn('Failed to find sound data: ', sound.md5);
                return handleSoundLoadError(sound, runtime, soundBank);
            }

            return loadSoundFromAsset(sound, soundAsset, runtime, soundBank);
        })
        .catch(e => {
            log.warn(`Failed to load sound: ${sound.md5} with error: ${e}`);
            return handleSoundLoadError(sound, runtime, soundBank);
        });
};

/**
 * Override the default loadSound function with a new one. This is used for testing purposes.
 * @param newLoadSound - The new loadSound function to use.
 */
const overrideLoadSound = function (newLoadSound: typeof loadSound) {
    loadSound = newLoadSound;
};

export {
    loadSound,
    overrideLoadSound,
    loadSoundFromAsset
};
