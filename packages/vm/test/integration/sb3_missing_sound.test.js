/**
 * This test ensures that the VM gracefully handles an sb3 project with
 * a missing sound. The project should load without error.
 * TODO: handle missing or corrupted sounds by replacing the missing sound data
 * with the empty sound file but keeping the info about the original missing / corrupted sound
 * so that user data does not get overwritten / lost.
 */
const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const {serializeSounds} = require('../../src/serialization/serialize-assets');

const projectUri = path.resolve(__dirname, '../fixtures/missing_sound.sb3');
const project = readFileToBuffer(projectUri);

const missingSoundAssetId = '78618aadd225b1db7bf837fa17dc0568';

let vm;

beforeEach(() => {
    const storage = makeTestStorage();

    vm = new VirtualMachine();
    vm.attachStorage(storage);

    return vm.loadProject(project);
});



test('loading sb3 project with missing sound file', done => {
    expect(vm.runtime.targets.length).toBe(2);

    const stage = vm.runtime.targets[0];
    expect(stage.isStage).toBeTruthy();

    const catSprite = vm.runtime.targets[1];
    expect(catSprite.getSounds().length).toBe(1);

    const missingSound = catSprite.getSounds()[0];
    expect(missingSound.name).toBe('Boop Sound Recording');
    // Sound should have original data but no asset
    const defaultSoundAssetId = vm.runtime.storage.defaultAssetId.Sound;
    expect(missingSound.assetId).toBe(defaultSoundAssetId);
    expect(missingSound.dataFormat).toBe('wav');

    // Runtime should have info about broken asset
    expect(missingSound.broken).toBeTruthy();
    expect(missingSound.broken.assetId).toBe(missingSoundAssetId);

    done();
});

test('load and then save sb3 project with missing sound file', done => {
    const resavedProject = JSON.parse(vm.toJSON());

    expect(resavedProject.targets.length).toBe(2);

    const stage = resavedProject.targets[0];
    expect(stage.isStage).toBeTruthy();

    const catSprite = resavedProject.targets[1];
    expect(catSprite.name).toBe('Sprite1');
    expect(catSprite.sounds.length).toBe(1);

    const missingSound = catSprite.sounds[0];
    expect(missingSound.name).toBe('Boop Sound Recording');
    // Costume should have both default sound data (e.g. "Gray Question Sound" ^_^) and original data
    expect(missingSound.assetId).toBe(missingSoundAssetId);
    expect(missingSound.dataFormat).toBe('wav');
    // Test that we didn't save any data about the costume being broken
    expect(missingSound.broken).toBeFalsy();

    done();
});

test('serializeCostume does not save data for missing costume', done => {
    const soundDescs = serializeSounds(vm.runtime);

    expect(soundDescs.length).toBe(1); // Should only have one sound, the pop sound for the stage
    expect(soundDescs[0].fileName).not.toBe(`${missingSoundAssetId}.wav`);

    done();
});
