const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const projectUri = path.resolve(__dirname, '../fixtures/list-monitor-rename.sb3');
const project = readFileToBuffer(projectUri);

test('importing sb3 project with incorrect list monitor name', done => {
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
            expect(monitorRecord.opcode).toBe('data_listcontents');

            // The list name should be properly renamed
            expect(monitorRecord.params.LIST).toBe(renamedListName);
            expect(monitorBlock.fields.LIST.value).toBe(renamedListName);
        }

        vm.quit();
        done();
    });

    // Start VM, load project, and run
    expect(() => {
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
    }).not.toThrow();
});
