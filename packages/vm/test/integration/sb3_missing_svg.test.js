/**
 * This test ensures that the VM gracefully handles an sb3 project with
 * a missing vector costume. The VM should handle this safely by displaying
 * a Gray Question Mark, but keeping track of the original costume data
 * and serializing the original costume data back out. The saved project.json
 * should not reflect that the costume is broken and should therefore re-attempt
 * to load the costume if the saved project is re-loaded.
 */
const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const FakeRenderer = require('../fixtures/fake-renderer');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const {serializeCostumes} = require('../../src/serialization/serialize-assets');

const projectUri = path.resolve(__dirname, '../fixtures/missing_svg.sb3');
const project = readFileToBuffer(projectUri);

const missingCostumeAssetId = 'a267f8b97ee9cf8aa9832aa0b4cfd9eb';

let vm;

beforeEach(() => {
    const storage = makeTestStorage();

    vm = new VirtualMachine();
    vm.attachStorage(storage);
    vm.attachRenderer(new FakeRenderer());

    return vm.loadProject(project);
});



test('loading sb3 project with missing vector costume file', done => {
    expect(vm.runtime.targets.length).toBe(2);

    const stage = vm.runtime.targets[0];
    expect(stage.isStage).toBeTruthy();

    const blueGuySprite = vm.runtime.targets[1];
    expect(blueGuySprite.getName()).toBe('Blue Square Guy');
    expect(blueGuySprite.getCostumes().length).toBe(1);

    const missingCostume = blueGuySprite.getCostumes()[0];
    expect(missingCostume.name).toBe('costume1');
    // Costume should have both default cosutme (e.g. Gray Question Mark) data and original data
    const defaultVectorAssetId = vm.runtime.storage.defaultAssetId.ImageVector;
    expect(missingCostume.assetId).toBe(defaultVectorAssetId);
    expect(missingCostume.dataFormat).toBe('svg');
    // Runtime should have info about broken asset
    expect(missingCostume.broken).toBeTruthy();
    expect(missingCostume.broken.assetId).toBe(missingCostumeAssetId);

    done();
});

test('load and then save sb3 project with missing costume file', done => {
    const resavedProject = JSON.parse(vm.toJSON());

    expect(resavedProject.targets.length).toBe(2);

    const stage = resavedProject.targets[0];
    expect(stage.isStage).toBeTruthy();

    const blueGuySprite = resavedProject.targets[1];
    expect(blueGuySprite.name).toBe('Blue Square Guy');
    expect(blueGuySprite.costumes.length).toBe(1);

    const missingCostume = blueGuySprite.costumes[0];
    expect(missingCostume.name).toBe('costume1');
    // Costume should have both default cosutme (e.g. Gray Question Mark) data and original data
    expect(missingCostume.assetId).toBe(missingCostumeAssetId);
    expect(missingCostume.dataFormat).toBe('svg');
    // Test that we didn't save any data about the costume being broken
    expect(missingCostume.broken).toBeFalsy();

    done();
});

test('serializeCostume does not save data for missing costume', done => {
    const costumeDescs = serializeCostumes(vm.runtime);

    expect(costumeDescs.length).toBe(1); // Should only have one costume, the backdrop
    expect(costumeDescs[0].fileName).not.toBe(`${missingCostumeAssetId}.svg`);

    done();
});
