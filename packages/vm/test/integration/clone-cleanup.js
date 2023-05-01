const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const projectUri = path.resolve(__dirname, '../fixtures/clone-cleanup.sb2');
const project = readFileToBuffer(projectUri);

test('clone-cleanup', done => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    /**
     * Track which step of the project is currently under test.
     * @type {number}
     */
    let testStep = -1;

    const verifyCounts = (expectedClones, extraThreads) => {
        // stage plus one sprite, plus clones
        expect(vm.runtime.targets.length).toBe(2 + expectedClones);

        // the stage should never have any clones
        expect(vm.runtime.targets[0].sprite.clones.length).toBe(1);

        // check sprite clone count (+1 for original)
        expect(vm.runtime.targets[1].sprite.clones.length).toBe(1 + expectedClones);

        // thread count isn't directly tied to clone count since threads can end
        expect(vm.runtime.threads.length).toBe(extraThreads + (2 * expectedClones));
    };

    const testNextStep = () => {
        ++testStep;
        switch (testStep) {
        case 0:
            // Project has started, main thread running, no clones yet
            verifyCounts(0, 1);
            break;

        case 1:
            // 10 clones have been created, main thread still running
            verifyCounts(10, 1);
            break;

        case 2:
            // The first batch of clones has deleted themselves; main thread still running
            verifyCounts(0, 1);
            break;

        case 3:
            // The second batch of clones has been created and the main thread is about to end
            verifyCounts(10, 1);

            // After the main thread ends, do one last test step
            setTimeout(() => testNextStep(), 1000);
            break;

        case 4:
            // The second batch of clones has deleted themselves; everything is finished
            verifyCounts(0, 0);

            vm.quit();
            done();
            break;
        }
    };

    // Start VM, load project, and run
    expect(() => {
        vm.start();
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);
        vm.loadProject(project).then(() => {

            // Verify initial state: no clones, nothing running ("step -1")
            verifyCounts(0, 0);

            vm.greenFlag();

            // Let the project control the pace of the tests
            vm.runtime.on('SAY', () => testNextStep());
        });
    }).not.toThrow();

});
