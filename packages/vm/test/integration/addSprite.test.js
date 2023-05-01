const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;

const VirtualMachine = require('../../src/virtual-machine');
const RenderedTarget = require('../../src/sprites/rendered-target');

const projectUri = path.resolve(__dirname, '../fixtures/default.sb2');
const project = readFileToBuffer(projectUri);

const vm = new VirtualMachine();

test('spec', () => {
    expect(typeof vm.addSprite, 'function');
});

test('default cat', done => {
    // Get default cat from .sprite2
    const uri = path.resolve(__dirname, '../fixtures/example_sprite.sprite2');
    const sprite = readFileToBuffer(uri);

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

            // Add another sprite
            vm.addSprite(sprite).then(() => {
                const targets = vm.runtime.targets;

                // Test
                expect(typeof targets).toBe('object');
                expect(targets.length).toBe(3);

                const newTarget = targets[2];

                expect(newTarget instanceof RenderedTarget).toBeTruthy();
                expect(typeof newTarget.id).toBe('string');
                expect(typeof newTarget.blocks).toBe('object');
                expect(typeof newTarget.variables).toBe('object');
                const varIds = Object.keys(newTarget.variables);
                expect(varIds.length).toBe(1);
                const variable = newTarget.variables[varIds[0]];
                expect(variable.name).toBe('foo');
                expect(variable.value).toBe(0);

                expect(newTarget.isOriginal).toBe(true);
                expect(newTarget.currentCostume).toBe(0);
                expect(newTarget.isOriginal).toBe(true);
                expect(newTarget.isStage).toBe(false);
                expect(newTarget.sprite.name).toBe('Apple');

                vm.greenFlag();

                setTimeout(() => {
                    expect(variable.value).toBe(10);
                    vm.getPlaygroundData();
                    vm.stopAll();
                }, 1000);
            });
        });
    }).not.toThrow();
});
