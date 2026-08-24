import path from 'path';
import {test} from '../fixtures/jest-tap-bridge.js';
import makeTestStorage from '../fixtures/make-test-storage.js';
import {readFileToBuffer} from '../fixtures/readProjectFile.js';
import VirtualMachine from '../../src/index.js';

const projectUri = path.resolve(__dirname, '../fixtures/list-monitor-rename.sb3');
const project = readFileToBuffer(projectUri);

test('importing sb3 project with incorrect list monitor name', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', () => {
        const stage = vm.runtime.targets[0];
        const cat = vm.runtime.targets[1];

        for (const {target, renamedListName} of [
            {target: stage, renamedListName: 'renamed global'},
            {target: cat, renamedListName: 'renamed local'}
        ]) {
            const listId = Object.keys(target.variables).find(k => target.variables[k].name === renamedListName);

            const monitorRecord = vm.runtime._monitorState.get(listId);
            const monitorBlock = vm.runtime.monitorBlocks.getBlock(listId);
            t.equal(monitorRecord.opcode, 'data_listcontents');

            // The list name should be properly renamed
            t.equal(monitorRecord.params.LIST, renamedListName);
            t.equal(monitorBlock.fields.LIST.value, renamedListName);
        }

        vm.quit();
        t.end();
    });

    // Start VM, load project, and run
    t.doesNotThrow(() => {
        vm.start();
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);
        vm.loadProject(project).then(() => {
            vm.greenFlag();
            setTimeout(() => {
                vm.getPlaygroundData();
                vm.stopAll();
            }, 100);
        });
    });
});
