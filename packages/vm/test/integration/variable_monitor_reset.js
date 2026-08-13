import path from 'path';
import {test} from '../fixtures/jest-tap-bridge.js';
import makeTestStorage from '../fixtures/make-test-storage.js';
import {readFileToBuffer} from '../fixtures/readProjectFile.js';
import VirtualMachine from '../../src/index.js';

const projectUri = path.resolve(__dirname, '../fixtures/monitored_variables.sb3');
const project = readFileToBuffer(projectUri);

const anotherProjectUri = path.resolve(__dirname, '../fixtures/default.sb2');
const anotherProject = readFileToBuffer(anotherProjectUri);

test('importing one project after the other resets monitored variables', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(project).then(() => {
        const refSprite = vm.runtime.targets[1];
        const refVarId = Object.keys(refSprite.variables)[0];
        const refBlock = vm.runtime.monitorBlocks.getBlock(refVarId);
        t.ok(refBlock);
        const jamalSprite = vm.runtime.targets[2];
        const jamalVarId = Object.keys(jamalSprite.variables)[0];
        const jamalBlock = vm.runtime.monitorBlocks.getBlock(jamalVarId);
        t.ok(jamalBlock);
        vm.loadProject(anotherProject).then(() => {
            // Blocks from the previously loaded project should be gone.
            const refVarBlock = vm.runtime.monitorBlocks.getBlock(refVarId);
            t.notOk(refVarBlock);
            const jamalVarBlock = vm.runtime.monitorBlocks.getBlock(jamalVarId);
            t.notOk(jamalVarBlock);

            vm.quit();
            t.end();
        });
    });
});
