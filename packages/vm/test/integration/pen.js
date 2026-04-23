const path = require('path');
const test = require('tap').test;

const Scratch3PenBlocks = require('../../src/extensions/scratch3_pen/index.js');
const VirtualMachine = require('../../src/index');

const makeTestStorage = require('../fixtures/make-test-storage');
const attachExtensionManager = require('../fixtures/attach-extension-manager.js');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;

const uri = path.resolve(__dirname, '../fixtures/pen.sb2');
const project = readFileToBuffer(uri);

test('pen', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());
    attachExtensionManager(vm);

    // Evaluate playground data and exit
    vm.on('playgroundData', () => {
        // @todo Additional tests

        const catSprite = vm.runtime.targets[1].sprite;
        const [originalCat, cloneCat] = catSprite.clones;
        t.not(originalCat, cloneCat);

        /** @type {PenState} */
        const originalPenState = originalCat.getCustomState(Scratch3PenBlocks.STATE_KEY);

        /** @type {PenState} */
        const clonePenState = cloneCat.getCustomState(Scratch3PenBlocks.STATE_KEY);

        t.not(originalPenState, clonePenState);
        t.equal(originalPenState.penAttributes.diameter, 51);
        t.equal(clonePenState.penAttributes.diameter, 42);

        vm.quit();
        t.end();
    });

    // Start VM, load project, and run
    t.doesNotThrow(() => {
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
    });
});
