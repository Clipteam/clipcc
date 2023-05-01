const Worker = require('tiny-worker');
const path = require('path');

const Scratch3PenBlocks = require('../../src/extensions/scratch3_pen/index.js');
const VirtualMachine = require('../../src/index');
const dispatch = require('../../src/dispatch/central-dispatch');

const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;

const uri = path.resolve(__dirname, '../fixtures/pen.sb2');
const project = readFileToBuffer(uri);

// By default Central Dispatch works with the Worker class built into the browser. Tell it to use TinyWorker instead.
dispatch.workerClass = Worker;

test('pen', done => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', () => {
        // @todo Additional tests

        const catSprite = vm.runtime.targets[1].sprite;
        const [originalCat, cloneCat] = catSprite.clones;
        expect(originalCat).not.toBe(cloneCat);

        /** @type {PenState} */
        const originalPenState = originalCat.getCustomState(Scratch3PenBlocks.STATE_KEY);

        /** @type {PenState} */
        const clonePenState = cloneCat.getCustomState(Scratch3PenBlocks.STATE_KEY);

        expect(originalPenState).not.toBe(clonePenState);
        expect(originalPenState.penAttributes.diameter).toBe(51);
        expect(clonePenState.penAttributes.diameter).toBe(42);

        vm.quit();
        done();
    });

    // Start VM, load project, and run
    expect(() => {
        vm.start();
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);
        vm.loadProject(project)
            .then(() => {
                vm.greenFlag();

                // After two seconds, get playground data and stop
                setTimeout(() => {
                    vm.getPlaygroundData();
                    vm.stopAll();
                }, 2000);
            });
    }).not.toThrow();
});
