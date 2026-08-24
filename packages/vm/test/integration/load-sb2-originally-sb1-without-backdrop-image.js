import path from 'path';
import {test} from '../fixtures/jest-tap-bridge.js';
import makeTestStorage from '../fixtures/make-test-storage.js';
import {readFileToBuffer} from '../fixtures/readProjectFile.js';
import VirtualMachine from '../../src/virtual-machine.js';

const projectUri = path.resolve(__dirname, '../fixtures/sb2-from-sb1-missing-backdrop-image.sb2');
const project = readFileToBuffer(projectUri);

const vm = new VirtualMachine();

test('sb2 project (originally from Scratch 1.4) with missing backdrop image should load', t => {
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', e => {
        const threads = JSON.parse(e.threads);
        t.ok(threads.length === 0);
        vm.quit();
        t.end();
    });

    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    t.doesNotThrow(() => {
        vm.loadProject(project).then(() => {

            t.equal(vm.runtime.targets.length, 2); // stage and default sprite

            vm.greenFlag();

            setTimeout(() => {
                vm.getPlaygroundData();
                vm.stopAll();
            }, 1000);
        });
    });
});
