const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const Thread = require('../../src/engine/thread');
const Runtime = require('../../src/engine/runtime');
const execute = require('../../src/engine/execute.js');

const projectUri = path.resolve(__dirname, '../fixtures/timer-greater-than-hat.sb2');
const project = readFileToBuffer(projectUri);

const checkIsHatThread = (t, vm, hatThread) => {
    expect(hatThread.stackClick).toBe(false);
    expect(hatThread.updateMonitor).toBe(false);
    const blockContainer = hatThread.target.blocks;
    const opcode = blockContainer.getOpcode(blockContainer.getBlock(hatThread.topBlock));
    expect(vm.runtime.getIsEdgeActivatedHat(opcode)).toBeTruthy();
};

const checkIsStackClickThread = (t, vm, stackClickThread) => {
    expect(stackClickThread.stackClick).toBe(true);
    expect(stackClickThread.updateMonitor).toBe(false);
};

/**
 * timer-greater-than-hat.sb2 contains a single stack
 *     when timer > -1
 *         change color effect by 25
 * The intention is to make sure that the hat block condition is evaluated
 * on each frame.
 */
test('edge activated hat thread runs once every frame', done => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    expect(() => {
        // Note: don't run vm.start(), we handle calling _step() manually in this test
        vm.runtime.currentStepTime = Runtime.THREAD_STEP_INTERVAL;
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);

        vm.loadProject(project).then(() => {
            expect(vm.runtime.threads.length).toBe(0);

            vm.runtime._step();
            let threads = vm.runtime._lastStepDoneThreads;
            expect(vm.runtime.threads.length).toBe(0);
            expect(threads.length).toBe(1);
            checkIsHatThread(t, vm, threads[0]);
            expect(threads[0].status === Thread.STATUS_DONE).toBeTruthy();

            // Check that the hat thread is added again when another step is taken
            vm.runtime._step();
            threads = vm.runtime._lastStepDoneThreads;
            expect(vm.runtime.threads.length).toBe(0);
            expect(threads.length).toBe(1);
            checkIsHatThread(t, vm, threads[0]);
            expect(threads[0].status === Thread.STATUS_DONE).toBeTruthy();
            done();
        });
    }).not.toThrow();
});

/**
 * When a hat is added it should run in the next frame. Any block related
 * caching should be reset.
 */
test('edge activated hat thread runs after being added to previously executed target', done => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    expect(() => {
        // Note: don't run vm.start(), we handle calling _step() manually in this test
        vm.runtime.currentStepTime = Runtime.THREAD_STEP_INTERVAL;
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);

        vm.loadProject(project).then(() => {
            expect(vm.runtime.threads.length).toBe(0);

            vm.runtime._step();
            let threads = vm.runtime._lastStepDoneThreads;
            expect(vm.runtime.threads.length).toBe(0);
            expect(threads.length).toBe(1);
            checkIsHatThread(t, vm, threads[0]);
            expect(threads[0].status === Thread.STATUS_DONE).toBeTruthy();

            // Add a second hat that should create a second thread
            const hatBlock = threads[0].target.blocks.getBlock(threads[0].topBlock);
            threads[0].target.blocks.createBlock(Object.assign(
                {}, hatBlock, {id: 'hatblock2', next: null}
            ));

            // Check that the hat thread is added again when another step is taken
            vm.runtime._step();
            threads = vm.runtime._lastStepDoneThreads;
            expect(vm.runtime.threads.length).toBe(0);
            expect(threads.length).toBe(2);
            checkIsHatThread(t, vm, threads[0]);
            checkIsHatThread(t, vm, threads[1]);
            expect(threads[0].status === Thread.STATUS_DONE).toBeTruthy();
            expect(threads[1].status === Thread.STATUS_DONE).toBeTruthy();
            done();
        });
    }).not.toThrow();
});

/**
 * If the hat doesn't finish evaluating within one frame, it shouldn't be added again
 * on the next frame. (We skip execution by setting the step time to 0)
 */
test('edge activated hat thread not added twice', done => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    expect(() => {
        // Note: don't run vm.start(), we handle calling _step() manually in this test
        vm.runtime.currentStepTime = 0;
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);

        vm.loadProject(project).then(() => {
            expect(vm.runtime.threads.length).toBe(0);

            vm.runtime._step();
            let doneThreads = vm.runtime._lastStepDoneThreads;
            expect(vm.runtime.threads.length).toBe(1);
            expect(doneThreads.length).toBe(0);
            const prevThread = vm.runtime.threads[0];
            checkIsHatThread(t, vm, vm.runtime.threads[0]);
            expect(vm.runtime.threads[0].status === Thread.STATUS_RUNNING).toBeTruthy();

            // Check that no new threads are added when another step is taken
            vm.runtime._step();
            doneThreads = vm.runtime._lastStepDoneThreads;
            // There should now be one done hat thread and one new hat thread to run
            expect(vm.runtime.threads.length).toBe(1);
            expect(doneThreads.length).toBe(0);
            checkIsHatThread(t, vm, vm.runtime.threads[0]);
            expect(vm.runtime.threads[0] === prevThread).toBeTruthy();
            done();
        });
    }).not.toThrow();
});


/**
 * Duplicating a sprite should also track duplicated edge activated hat in
 * runtime's _edgeActivatedHatValues map.
 */
test('edge activated hat should trigger for both sprites when sprite is duplicated', done => {

    // Project that is similar to timer-greater-than-hat.sb2, but has code on the sprite so that
    // the sprite can be duplicated
    const projectWithSpriteUri = path.resolve(__dirname, '../fixtures/edge-triggered-hat.sb3');
    const projectWithSprite = readFileToBuffer(projectWithSpriteUri);

    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    expect(() => {
        // Note: don't run vm.start(), we handle calling _step() manually in this test
        vm.runtime.currentStepTime = 0;
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);

        vm.loadProject(projectWithSprite).then(() => {
            expect(vm.runtime.threads.length).toBe(0);

            vm.runtime._step();
            expect(vm.runtime.threads.length).toBe(1);
            checkIsHatThread(t, vm, vm.runtime.threads[0]);
            expect(vm.runtime.threads[0].status === Thread.STATUS_RUNNING).toBeTruthy();
            let numTargetEdgeHats = vm.runtime.targets.reduce((val, target) =>
                val + Object.keys(target._edgeActivatedHatValues).length, 0);
            expect(numTargetEdgeHats).toBe(1);

            vm.duplicateSprite(vm.runtime.targets[1].id).then(() => {
                vm.runtime._step();
                // Check that the runtime's _edgeActivatedHatValues object has two separate keys
                // after execute is run on each thread
                numTargetEdgeHats = vm.runtime.targets.reduce((val, target) =>
                    val + Object.keys(target._edgeActivatedHatValues).length, 0);
                expect(numTargetEdgeHats).toBe(2);
                done();
            });

        });
    }).not.toThrow();
});

/**
 * Cloning a sprite should also track cloned edge activated hat separately
 * runtime's _edgeActivatedHatValues map.
 */
test('edge activated hat should trigger for both sprites when sprite is cloned', done => {

    // Project that is similar to loudness-hat-block.sb2, but has code on the sprite so that
    // the sprite can be duplicated
    const projectWithSpriteUri = path.resolve(__dirname, '../fixtures/edge-triggered-hat.sb3');
    const projectWithSprite = readFileToBuffer(projectWithSpriteUri);

    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    expect(() => {
        // Note: don't run vm.start(), we handle calling _step() manually in this test
        vm.runtime.currentStepTime = 0;
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);

        vm.loadProject(projectWithSprite).then(() => {
            expect(vm.runtime.threads.length).toBe(0);

            vm.runtime._step();
            expect(vm.runtime.threads.length).toBe(1);
            checkIsHatThread(t, vm, vm.runtime.threads[0]);
            expect(vm.runtime.threads[0].status === Thread.STATUS_RUNNING).toBeTruthy();
            // Run execute on the thread to populate the runtime's
            // _edgeActivatedHatValues object
            execute(vm.runtime.sequencer, vm.runtime.threads[0]);
            let numTargetEdgeHats = vm.runtime.targets.reduce((val, target) =>
                val + Object.keys(target._edgeActivatedHatValues).length, 0);
            expect(numTargetEdgeHats).toBe(1);

            const cloneTarget = vm.runtime.targets[1].makeClone();
            vm.runtime.addTarget(cloneTarget);

            vm.runtime._step();
            // Check that the runtime's _edgeActivatedHatValues object has two separate keys
            // after execute is run on each thread
            vm.runtime.threads.forEach(thread => execute(vm.runtime.sequencer, thread));
            numTargetEdgeHats = vm.runtime.targets.reduce((val, target) =>
                val + Object.keys(target._edgeActivatedHatValues).length, 0);
            expect(numTargetEdgeHats).toBe(2);
            done();
        });
    }).not.toThrow();
});

/**
 * When adding a stack click thread first, make sure that the edge activated hat thread and
 * the stack click thread are both pushed and run (despite having the same top block)
 */
test('edge activated hat thread does not interrupt stack click thread', done => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    expect(() => {
        // Note: don't run vm.start(), we handle calling _step() manually in this test
        vm.runtime.currentStepTime = Runtime.THREAD_STEP_INTERVAL;
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);

        vm.loadProject(project).then(() => {
            expect(vm.runtime.threads.length).toBe(0);

            vm.runtime._step();
            let doneThreads = vm.runtime._lastStepDoneThreads;
            expect(vm.runtime.threads.length).toBe(0);
            expect(doneThreads.length).toBe(1);
            checkIsHatThread(t, vm, doneThreads[0]);
            expect(doneThreads[0].status === Thread.STATUS_DONE).toBeTruthy();

            // Add stack click thread on this hat
            vm.runtime.toggleScript(doneThreads[0].topBlock, {stackClick: true});

            // Check that the hat thread is added again when another step is taken
            vm.runtime._step();
            doneThreads = vm.runtime._lastStepDoneThreads;
            expect(vm.runtime.threads.length).toBe(0);
            expect(doneThreads.length).toBe(2);
            let hatThread;
            let stackClickThread;
            if (doneThreads[0].stackClick) {
                stackClickThread = doneThreads[0];
                hatThread = doneThreads[1];
            } else {
                stackClickThread = doneThreads[1];
                hatThread = doneThreads[0];
            }
            checkIsHatThread(t, vm, hatThread);
            checkIsStackClickThread(t, vm, stackClickThread);
            expect(doneThreads[0].status === Thread.STATUS_DONE).toBeTruthy();
            expect(doneThreads[1].status === Thread.STATUS_DONE).toBeTruthy();
            done();
        });
    }).not.toThrow();
});

/**
 * When adding the hat thread first, make sure that the edge activated hat thread and
 * the stack click thread are both pushed and run (despite having the same top block)
 */
test('edge activated hat thread does not interrupt stack click thread', done => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    expect(() => {
        // Note: don't run vm.start(), we handle calling _step() manually in this test
        vm.runtime.currentStepTime = 0;
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);

        vm.loadProject(project).then(() => {
            expect(vm.runtime.threads.length).toBe(0);

            vm.runtime._step();
            let doneThreads = vm.runtime._lastStepDoneThreads;
            expect(vm.runtime.threads.length).toBe(1);
            expect(doneThreads.length).toBe(0);
            checkIsHatThread(t, vm, vm.runtime.threads[0]);
            expect(vm.runtime.threads[0].status === Thread.STATUS_RUNNING).toBeTruthy();

            vm.runtime.currentStepTime = Runtime.THREAD_STEP_INTERVAL;

            // Add stack click thread on this hat
            vm.runtime.toggleScript(vm.runtime.threads[0].topBlock, {stackClick: true});

            // Check that the hat thread is added again when another step is taken
            vm.runtime._step();
            doneThreads = vm.runtime._lastStepDoneThreads;
            expect(vm.runtime.threads.length).toBe(0);
            expect(doneThreads.length).toBe(2);
            let hatThread;
            let stackClickThread;
            if (doneThreads[0].stackClick) {
                stackClickThread = doneThreads[0];
                hatThread = doneThreads[1];
            } else {
                stackClickThread = doneThreads[1];
                hatThread = doneThreads[0];
            }
            checkIsHatThread(t, vm, hatThread);
            checkIsStackClickThread(t, vm, stackClickThread);
            expect(doneThreads[0].status === Thread.STATUS_DONE).toBeTruthy();
            expect(doneThreads[1].status === Thread.STATUS_DONE).toBeTruthy();
            done();
        });
    }).not.toThrow();
});
