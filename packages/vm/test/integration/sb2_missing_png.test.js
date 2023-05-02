/**
 * This test ensures that the VM gracefully handles an sb2 project with
 * a missing bitmap costume. The VM should handle this safely by displaying
 * a Gray Question Mark, but keeping track of the original costume data
 * and serializing the original costume data back out. The saved project.json
 * should not reflect that the costume is broken and should therefore re-attempt
 * to load the costume if the saved project is re-loaded.
 */
const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const FakeRenderer = require('../fixtures/fake-renderer');
const FakeBitmapAdapter = require('../fixtures/fake-bitmap-adapter');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const {serializeCostumes} = require('../../src/serialization/serialize-assets');

const projectUri = path.resolve(__dirname, '../fixtures/missing_png.sb2');
const project = readFileToBuffer(projectUri);


const missingCostumeAssetId = 'aadce129bfe4e57f0dd81478f3ed82aa';

global.Image = function () {
    const image = {
        width: 1,
        height: 1
    };
    setTimeout(() => image.onload(), 1000);
    return image;
};

global.document = {
    createElement: () => ({
        // Create mock canvas
        getContext: () => ({
            drawImage: () => ({})
        })
    })
};

let vm;

beforeEach(() => {
    const storage = makeTestStorage();

    vm = new VirtualMachine();
    vm.attachStorage(storage);
    vm.attachRenderer(new FakeRenderer());
    vm.attachV2BitmapAdapter(new FakeBitmapAdapter());

    return vm.loadProject(project);
});



test('loading sb2 project with missing bitmap costume file', done => {
    expect(vm.runtime.targets.length).toBe(2);

    const stage = vm.runtime.targets[0];
    expect(stage.isStage).toBeTruthy();

    const greenGuySprite = vm.runtime.targets[1];
    expect(greenGuySprite.getName()).toBe('GreenGuy');
    expect(greenGuySprite.getCostumes().length).toBe(1);

    const missingCostume = greenGuySprite.getCostumes()[0];
    expect(missingCostume.name).toBe('GreenGuy');
    // Costume should have both default cosutme (e.g. Gray Question Mark) data and original data
    const defaultVectorAssetId = vm.runtime.storage.defaultAssetId.ImageBitmap;
    expect(missingCostume.assetId).toBe(defaultVectorAssetId);
    expect(missingCostume.dataFormat).toBe('png');
    // Runtime should have info about broken asset
    expect(missingCostume.broken).toBeTruthy();
    expect(missingCostume.broken.assetId).toBe(missingCostumeAssetId);

    done();
});

test('load and then save sb2 project with missing costume file', done => {
    const resavedProject = JSON.parse(vm.toJSON());

    expect(resavedProject.targets.length).toBe(2);

    const stage = resavedProject.targets[0];
    expect(stage.isStage).toBeTruthy();

    const greenGuySprite = resavedProject.targets[1];
    expect(greenGuySprite.name).toBe('GreenGuy');
    expect(greenGuySprite.costumes.length).toBe(1);

    const missingCostume = greenGuySprite.costumes[0];
    expect(missingCostume.name).toBe('GreenGuy');
    // Costume should have both default cosutme (e.g. Gray Question Mark) data and original data
    expect(missingCostume.assetId).toBe(missingCostumeAssetId);
    expect(missingCostume.dataFormat).toBe('png');
    // Test that we didn't save any data about the costume being broken
    expect(missingCostume.broken).toBeFalsy();

    done();
});

test('serializeCostume does not save data for missing costume', done => {
    const costumeDescs = serializeCostumes(vm.runtime);

    expect(costumeDescs.length).toBe(1); // Should only have one costume, the backdrop
    expect(costumeDescs[0].fileName).not.toBe(`${missingCostumeAssetId}.png`);

    done();
});
