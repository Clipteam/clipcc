const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;

const VirtualMachine = require('../../src/virtual-machine');
// const RenderedTarget = require('../../src/sprites/rendered-target');

const projectUri = path.resolve(__dirname, '../fixtures/default.sb2');
const project = readFileToBuffer(projectUri);

const vm = new VirtualMachine();

test('spec', () => {
    expect(typeof vm.deleteSprite).toBe('function');
});

test('default cat', done => {
    // Get default cat from .sprite2
    // const uri = path.resolve(__dirname, '../fixtures/example_sprite.sprite2');
    // const sprite = readFileToBuffer(uri);

    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', e => {
        const threads = JSON.parse(e.threads);
        expect(threads.length === 0).toBeTruthy();
        vm.quit();
        done();
    });

    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    expect(() => {
        vm.loadProject(project).then(() => {

            expect(vm.runtime.targets.length).toBe(2); // stage and default sprite

            const defaultSprite = vm.runtime.targets[1];

            // Delete the sprite
            const addSpriteBack = vm.deleteSprite(vm.runtime.targets[1].id);

            expect(vm.runtime.targets.length).toBe(1);

            expect(typeof addSpriteBack).toBe('function');

            addSpriteBack().then(() => {
                expect(vm.runtime.targets.length).toBe(2);
                expect(vm.runtime.targets[1].getName()).toBe(defaultSprite.getName());

                vm.greenFlag();

                setTimeout(() => {
                    vm.getPlaygroundData();
                    vm.stopAll();
                }, 1000);
            });
        });
    }).not.toThrow();
});
