const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;

const VirtualMachine = require('../../src/virtual-machine');

const projectUri = path.resolve(__dirname, '../fixtures/sb2-from-sb1-missing-backdrop-image.sb2');
const project = readFileToBuffer(projectUri);

const vm = new VirtualMachine();

test('sb2 project (originally from Scratch 1.4) with missing backdrop image should load', done => {
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

            vm.greenFlag();

            setTimeout(() => {
                vm.getPlaygroundData();
                vm.stopAll();
            }, 1000);
        });
    }).not.toThrow();
});
