const path = require('path');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const makeTestStorage = require('../fixtures/make-test-storage');
const VirtualMachine = require('../../src/virtual-machine');

let vm;
let projectChanged;

tap.beforeEach(() => {
    const projectUri = path.resolve(__dirname, '../fixtures/default.sb2');
    const project = readFileToBuffer(projectUri);

    vm = new VirtualMachine();

    vm.runtime.addListener('PROJECT_CHANGED', () => {
        projectChanged = true;
    });

    vm.attachStorage(makeTestStorage());
    return vm.loadProject(project).then(() => {
        // The test in project_load_changed_state.js tests
        // that loading a project does not emit a project changed
        // event. This setup tries to be agnostic of whether that
        // test is passing or failing.
        projectChanged = false;
    });
});

const test = tap.test;

test('Adding a sprite (from sprite2) should emit a project changed event', t => {
    const sprite2Uri = path.resolve(__dirname, '../fixtures/cat.sprite2');
    const sprite2 = readFileToBuffer(sprite2Uri);

    vm.addSprite(sprite2).then(() => {
        expect(projectChanged).toBe(true);
        t.end();
    });
});

test('Adding a sprite (from sprite3) should emit a project changed event', t => {
    const sprite3Uri = path.resolve(__dirname, '../fixtures/cat.sprite3');
    const sprite3 = readFileToBuffer(sprite3Uri);

    vm.addSprite(sprite3).then(() => {
        expect(projectChanged).toBe(true);
        t.end();
    });
});

test('Adding a costume should emit a project changed event', t => {
    const newCostume = {
        name: 'costume1',
        baseLayerID: 0,
        baseLayerMD5: 'f9a1c175dbe2e5dee472858dd30d16bb.svg',
        bitmapResolution: 1,
        rotationCenterX: 47,
        rotationCenterY: 55
    };

    vm.addCostume('f9a1c175dbe2e5dee472858dd30d16bb.svg', newCostume).then(() => {
        expect(projectChanged).toBe(true);
        t.end();
    });
});

test('Adding a costume from library should emit a project changed event', t => {
    const newCostume = {
        name: 'costume1',
        baseLayerID: 0,
        baseLayerMD5: 'f9a1c175dbe2e5dee472858dd30d16bb.svg',
        bitmapResolution: 1,
        rotationCenterX: 47,
        rotationCenterY: 55
    };

    vm.addCostumeFromLibrary('f9a1c175dbe2e5dee472858dd30d16bb.svg', newCostume).then(() => {
        expect(projectChanged).toBe(true);
        t.end();
    });
});

test('Adding a backdrop should emit a project changed event', t => {
    const newCostume = {
        name: 'costume1',
        baseLayerID: 0,
        baseLayerMD5: 'f9a1c175dbe2e5dee472858dd30d16bb.svg',
        bitmapResolution: 1,
        rotationCenterX: 47,
        rotationCenterY: 55
    };

    vm.addBackdrop('f9a1c175dbe2e5dee472858dd30d16bb.svg', newCostume).then(() => {
        expect(projectChanged).toBe(true);
        t.end();
    });
});

test('Adding a sound should emit a project changed event', t => {
    const newSound = {
        soundName: 'meow',
        soundID: 0,
        md5: '83c36d806dc92327b9e7049a565c6bff.wav',
        sampleCount: 18688,
        rate: 22050
    };

    vm.addSound(newSound).then(() => {
        expect(projectChanged).toBe(true);
        t.end();
    });
});

test('Deleting a sprite should emit a project changed event', t => {
    const spriteId = vm.editingTarget.id;

    vm.deleteSprite(spriteId);
    expect(projectChanged).toBe(true);
    t.end();
});

test('Deleting a costume should emit a project changed event', t => {
    vm.deleteCostume(0);

    expect(projectChanged).toBe(true);
    t.end();
});

test('Deleting a sound should emit a project changed event', t => {
    vm.deleteSound(0);

    expect(projectChanged).toBe(true);
    t.end();
});

test('Reordering a sprite should emit a project changed event', t => {
    const sprite3Uri = path.resolve(__dirname, '../fixtures/cat.sprite3');
    const sprite3 = readFileToBuffer(sprite3Uri);

    // Add a new sprite so we have 2 to reorder
    vm.addSprite(sprite3).then(() => {
        // Reset the project changed flag to ignore change from adding new sprite
        projectChanged = false;
        expect(vm.runtime.targets.filter(target => !target.isStage).length).toBe(2);
        vm.reorderTarget(2, 1);
        expect(projectChanged).toBe(true);
        t.end();
    });
});

test('Reordering a costume should emit a project changed event', t => {
    expect(vm.editingTarget.sprite.costumes.length).toBe(2);
    const spriteId = vm.editingTarget.id;
    const reordered = vm.reorderCostume(spriteId, 1, 0);
    expect(reordered).toBe(true);
    expect(projectChanged).toBe(true);
    t.end();
});

test('Reordering a sound should emit a project changed event', t => {
    const spriteId = vm.editingTarget.id;
    const newSound = {
        soundName: 'meow',
        soundID: 0,
        md5: '83c36d806dc92327b9e7049a565c6bff.wav',
        sampleCount: 18688,
        rate: 22050
    };
    vm.addSound(newSound).then(() => {
        // Reset the project changed flag to ignore change from adding new sound
        projectChanged = false;
        expect(vm.editingTarget.sprite.sounds.length).toBe(2);
        const reordered = vm.reorderSound(spriteId, 1, 0);
        expect(reordered).toBe(true);
        expect(projectChanged).toBe(true);
        t.end();
    });
});

test('Renaming a sprite should emit a project changed event', t => {
    const spriteId = vm.editingTarget.id;
    vm.renameSprite(spriteId, 'My Sprite');
    expect(projectChanged).toBe(true);
    t.end();
});

test('Renaming a costume should emit a project changed event', t => {
    vm.renameCostume(0, 'My Costume');
    expect(projectChanged).toBe(true);
    t.end();
});

test('Renaming a sound should emit a project changed event', t => {
    vm.renameSound(0, 'My Sound');

    expect(projectChanged).toBe(true);
    t.end();
});

test('Changing sprite info should emit a project changed event', t => {
    const newSpritePosition = {
        x: 10,
        y: 100
    };

    vm.postSpriteInfo(newSpritePosition);
    expect(projectChanged).toBe(true);
    projectChanged = false;

    const newSpriteDirection = {
        direction: -30
    };

    vm.postSpriteInfo(newSpriteDirection);
    expect(projectChanged).toBe(true);
    projectChanged = false;

    t.end();

});

test('Editing a vector costume should emit a project changed event', t => {
    const mockSvg = 'svg';
    const mockRotationX = -13;
    const mockRotationY = 25;

    vm.updateSvg(0, mockSvg, mockRotationX, mockRotationY);
    expect(projectChanged).toBe(true);
    t.end();
});

test('Editing a sound should emit a project changed event', t => {
    const mockSoundBuffer = [];
    const mockSoundEncoding = [];

    vm.updateSoundBuffer(0, mockSoundBuffer, mockSoundEncoding);
    expect(projectChanged).toBe(true);
    t.end();
});
