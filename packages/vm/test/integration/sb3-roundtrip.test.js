const Blocks = require('../../src/engine/blocks');
const Clone = require('../../src/util/clone');
const {loadCostume} = require('../../src/import/load-costume');
const {loadSound} = require('../../src/import/load-sound');
const makeTestStorage = require('../fixtures/make-test-storage');
const Runtime = require('../../src/engine/runtime');
const sb3 = require('../../src/serialization/sb3');
const Sprite = require('../../src/sprites/sprite');

const defaultCostumeInfo = {
    bitmapResolution: 1,
    rotationCenterX: 0,
    rotationCenterY: 0
};

const defaultSoundInfo = {
};

test('sb3-roundtrip', () => {
    const runtime1 = new Runtime();
    runtime1.attachStorage(makeTestStorage());

    const runtime2 = new Runtime();
    runtime2.attachStorage(makeTestStorage());

    const testRuntimeState = (label, runtime) => {
        expect(runtime.targets.length).toBe(2);
        const [stageClone, spriteClone] = runtime.targets;

        expect(stageClone.isOriginal).toBe(true);
        expect(stageClone.isStage).toBe(true);

        const stage = stageClone.sprite;
        expect(stage.name).toBe('Stage');
        expect(stage.clones.length).toBe(1);
        expect(stage.clones[0]).toBe(stageClone);

        expect(stage.costumes.length).toBe(1);
        const [building] = stage.costumes;
        expect(building.assetId).toBe('fe5e3566965f9de793beeffce377d054');
        expect(building.dataFormat).toBe('jpg');

        expect(stage.sounds.length).toBe(0);

        expect(spriteClone.isOriginal).toBe(true);
        expect(spriteClone.isStage).toBe(false);

        const sprite = spriteClone.sprite;
        expect(sprite.name).toBe('Sprite');
        expect(sprite.clones.length).toBe(1);
        expect(sprite.clones[0]).toBe(spriteClone);

        expect(sprite.costumes.length).toBe(2);
        const [cat, squirrel] = sprite.costumes;
        expect(cat.assetId).toBe('f88bf1935daea28f8ca098462a31dbb0');
        expect(cat.dataFormat).toBe('svg');
        expect(squirrel.assetId).toBe('7e24c99c1b853e52f8e7f9004416fa34');
        expect(squirrel.dataFormat).toBe('png');

        expect(sprite.sounds.length).toBe(1);
        const [meow] = sprite.sounds;
        expect(meow.md5).toBe('83c36d806dc92327b9e7049a565c6bff.wav');
    };

    const loadThings = Promise.all([
        loadCostume('fe5e3566965f9de793beeffce377d054.jpg', Clone.simple(defaultCostumeInfo), runtime1),
        loadCostume('f88bf1935daea28f8ca098462a31dbb0.svg', Clone.simple(defaultCostumeInfo), runtime1),
        loadCostume('7e24c99c1b853e52f8e7f9004416fa34.png', Clone.simple(defaultCostumeInfo), runtime1),
        loadSound(Object.assign({md5: '83c36d806dc92327b9e7049a565c6bff.wav'}, defaultSoundInfo), runtime1)
    ]);

    const installThings = loadThings.then(results => {
        const [building, cat, squirrel, meow] = results;

        const stageBlocks = new Blocks(runtime1);
        const stage = new Sprite(stageBlocks, runtime1);
        stage.name = 'Stage';
        stage.costumes = [building];
        stage.sounds = [];
        const stageClone = stage.createClone();
        stageClone.isStage = true;

        const spriteBlocks = new Blocks(runtime1);
        const sprite = new Sprite(spriteBlocks, runtime1);
        sprite.name = 'Sprite';
        sprite.costumes = [cat, squirrel];
        sprite.sounds = [meow];
        const spriteClone = sprite.createClone();

        runtime1.targets = [stageClone, spriteClone];

        testRuntimeState('original', runtime1);
    });

    const serializeAndDeserialize = installThings.then(() => {
        // Doing a JSON `stringify` and `parse` here more accurately simulate a save/load cycle. In particular:
        // 1. it ensures that any non-serializable data is thrown away, and
        // 2. `sb3.deserialize` and its helpers do some `hasOwnProperty` checks which fail on the object returned by
        //    `sb3.serialize` but succeed if that object is "flattened" in this way.
        const serializedState = JSON.parse(JSON.stringify(sb3.serialize(runtime1)));
        return sb3.deserialize(serializedState, runtime2);
    });

    return serializeAndDeserialize.then(({targets}) => {
        runtime2.targets = targets;
        testRuntimeState('copy', runtime2);
    });
});
