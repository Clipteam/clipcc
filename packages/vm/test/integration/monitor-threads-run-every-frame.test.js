const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const Thread = require('../../src/engine/thread');
const Runtime = require('../../src/engine/runtime');

const projectUri = path.resolve(__dirname, '../fixtures/timer-monitor.sb3');
const project = readFileToBuffer(projectUri);

const checkMonitorThreadPresent = (t, threads) => {
    expect(threads.length).toBe(1);
    const monitorThread = threads[0];
    expect(monitorThread.stackClick).toBe(false);
    expect(monitorThread.updateMonitor).toBe(true);
    expect(monitorThread.topBlock.toString()).toBe('timer');
};

/**
 * Creates a monitor and then checks if it gets run every frame.
 */
test('monitor thread runs every frame', done => {
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
            checkMonitorThreadPresent(t, doneThreads);
            expect(doneThreads[0].status === Thread.STATUS_DONE).toBeTruthy();

            // Check that both are added again when another step is taken
            vm.runtime._step();
            doneThreads = vm.runtime._lastStepDoneThreads;
            expect(vm.runtime.threads.length).toBe(0);
            expect(doneThreads.length).toBe(1);
            checkMonitorThreadPresent(t, doneThreads);
            expect(doneThreads[0].status === Thread.STATUS_DONE).toBeTruthy();
            done();
        });
    }).not.toThrow();
});

/**
 * If the monitor doesn't finish evaluating within one frame, it shouldn't be added again
 * on the next frame. (We skip execution by setting the step time to 0)
 */
test('monitor thread not added twice', done => {
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
            checkMonitorThreadPresent(t, vm.runtime.threads);
            expect(vm.runtime.threads[0].status === Thread.STATUS_RUNNING).toBeTruthy();
            const prevThread = vm.runtime.threads[0];

            // Check that both are added again when another step is taken
            vm.runtime._step();
            doneThreads = vm.runtime._lastStepDoneThreads;
            expect(vm.runtime.threads.length).toBe(1);
            expect(doneThreads.length).toBe(0);
            checkMonitorThreadPresent(t, vm.runtime.threads);
            expect(vm.runtime.threads[0]).toBe(prevThread);
            done();
        });
    }).not.toThrow();
});
