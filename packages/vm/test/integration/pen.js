import Worker from 'tiny-worker';
import path from 'path';
import {test} from '../fixtures/jest-tap-bridge.js';
import Scratch3PenBlocks from '../../src/extensions/scratch3_pen/index.js';
import VirtualMachine from '../../src/index.js';
import dispatch from '../../src/dispatch/central-dispatch.js';
import makeTestStorage from '../fixtures/make-test-storage.js';
import {readFileToBuffer} from '../fixtures/readProjectFile.js';

const uri = path.resolve(__dirname, '../fixtures/pen.sb2');
const project = readFileToBuffer(uri);

// By default Central Dispatch works with the Worker class built into the browser. Tell it to use TinyWorker instead.
dispatch.workerClass = Worker;

test('pen', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

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
