/**
 * This test mocks render breaking on loading a corrupted bitmap costume.
 * The VM should handle this safely by displaying a Gray Question Mark,
 * but keeping track of the original costume data and serializing the
 * original costume data back out. The saved project.json should not
 * reflect that the costume is broken and should therefore re-attempt
 * to load the costume if the saved project is re-loaded.
 */
const path = require('path');
const md5 = require('js-md5');
const makeTestStorage = require('../fixtures/make-test-storage');
const FakeRenderer = require('../fixtures/fake-renderer');
const FakeBitmapAdapter = require('../fixtures/fake-bitmap-adapter');
const {extractAsset, readFileToBuffer} = require('../fixtures/readProjectFile');
const VirtualMachine = require('../../src/index');
const {serializeCostumes} = require('../../src/serialization/serialize-assets');

const projectUri = path.resolve(__dirname, '../fixtures/corrupt_png.sb3');
const project = readFileToBuffer(projectUri);
const costumeFileName = 'e1320c21995dcf6de10119be7f08c26b.png';
const originalCostume = extractAsset(projectUri, costumeFileName);
// We need to get the actual md5 because we hand modified the png to corrupt it
// after we downloaded the project from Scratch
// Loading the project back into the VM will correct the assetId and md5
const brokenCostumeMd5 = md5(originalCostume);

global.Image = function () {
    const image = {
        width: 1,
        height: 1
    };
    setTimeout(() => {
        const base64Image = image.src.split(',')[1];
        const decodedText = Buffer.from(base64Image, 'base64').toString();
        if (decodedText.includes('Here is some')) {
            image.onerror();
        } else {
            image.onload();
        }
    }, 1000);
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
let defaultBitmapAssetId;

tap.beforeEach(() => {
    const storage = makeTestStorage();

    vm = new VirtualMachine();
    vm.attachStorage(storage);
    defaultBitmapAssetId = vm.runtime.storage.defaultAssetId.ImageBitmap;

    vm.attachRenderer(new FakeRenderer());
    vm.attachV2BitmapAdapter(new FakeBitmapAdapter());

    return vm.loadProject(project);
});

const test = tap.test;

test('load sb3 project with corrupted bitmap costume file', t => {
    expect(vm.runtime.targets.length).toBe(2);

    const stage = vm.runtime.targets[0];
    expect(stage.isStage).toBeTruthy();

    const greenGuySprite = vm.runtime.targets[1];
    expect(greenGuySprite.getName()).toBe('Green Guy');
    expect(greenGuySprite.getCostumes().length).toBe(1);

    const corruptedCostume = greenGuySprite.getCostumes()[0];
    expect(corruptedCostume.name).toBe('Green Guy');
    expect(corruptedCostume.assetId).toBe(defaultBitmapAssetId);
    expect(corruptedCostume.dataFormat).toBe('png');
    // Runtime should have info about broken asset
    expect(corruptedCostume.broken).toBeTruthy();
    expect(corruptedCostume.broken.assetId).toBe(brokenCostumeMd5);
    // Verify that we saved the original asset data
    expect(md5(corruptedCostume.broken.asset.data)).toBe(brokenCostumeMd5);

    t.end();
});

test('load and then save project with corrupted bitmap costume file', t => {
    const resavedProject = JSON.parse(vm.toJSON());

    expect(resavedProject.targets.length).toBe(2);

    const stage = resavedProject.targets[0];
    expect(stage.isStage).toBeTruthy();

    const greenGuySprite = resavedProject.targets[1];
    expect(greenGuySprite.name).toBe('Green Guy');
    expect(greenGuySprite.costumes.length).toBe(1);

    const corruptedCostume = greenGuySprite.costumes[0];
    expect(corruptedCostume.name).toBe('Green Guy');
    // Resaved project costume should have the metadata that corresponds to the original broken costume
    expect(corruptedCostume.assetId).toBe(brokenCostumeMd5);
    expect(corruptedCostume.dataFormat).toBe('png');
    // Test that we didn't save any data about the costume being broken
    expect(corruptedCostume.broken).toBeFalsy();

    t.end();
});

test('serializeCostume saves orignal broken costume', t => {
    const costumeDescs = serializeCostumes(vm.runtime, vm.runtime.targets[1].id);
    expect(costumeDescs.length).toBe(1);
    const costume = costumeDescs[0];
    expect(costume.fileName).toBe(`${brokenCostumeMd5}.png`);
    expect(md5(costume.fileContent)).toBe(brokenCostumeMd5);
    t.end();
});
