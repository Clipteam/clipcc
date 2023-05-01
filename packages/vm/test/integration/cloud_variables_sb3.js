const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const cloudVarSimpleUri = path.resolve(__dirname, '../fixtures/cloud_variables_simple.sb3');
const cloudVarLimitUri = path.resolve(__dirname, '../fixtures/cloud_variables_limit.sb3');
const cloudVarExceededLimitUri = path.resolve(__dirname, '../fixtures/cloud_variables_exceeded_limit.sb3');
const cloudVarLocalUri = path.resolve(__dirname, '../fixtures/cloud_variables_local.sb3');

const cloudVarSimple = readFileToBuffer(cloudVarSimpleUri);
const cloudVarLimit = readFileToBuffer(cloudVarLimitUri);
const cloudVarExceededLimit = readFileToBuffer(cloudVarExceededLimitUri);
const cloudVarLocal = readFileToBuffer(cloudVarLocalUri);

test('importing an sb3 project with cloud variables', done => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(cloudVarSimple).then(() => {
        expect(vm.runtime.hasCloudData()).toBe(true);

        const stage = vm.runtime.targets[0];
        const stageVars = Object.values(stage.variables);
        expect(stageVars.length).toBe(1);

        const variable = stageVars[0];
        expect(variable.name).toBe('☁ firstCloud');
        expect(Number(variable.value)).toBe(100);
        expect(variable.isCloud).toBe(true);

        vm.quit();
        done();
    });
});

test('importing an sb3 project with cloud variables at the limit for a project', done => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(cloudVarLimit).then(() => {
        expect(vm.runtime.hasCloudData()).toBe(true);

        const stage = vm.runtime.targets[0];
        const stageVars = Object.values(stage.variables);

        expect(stageVars.length).toBe(10);
        // All of the 10 stage variables should be cloud variables
        expect(stageVars.filter(v => v.isCloud).length).toBe(10);

        vm.quit();
        done();
    });
});

test('importing an sb3 project with cloud variables exceeding the limit for a project', done => {
    // This tests a hacked project where additional cloud variables exceeding
    // the project limit have been added.
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(cloudVarExceededLimit).then(() => {
        expect(vm.runtime.hasCloudData()).toBe(true);

        const stage = vm.runtime.targets[0];
        const stageVars = Object.values(stage.variables);

        expect(stageVars.length).toBe(15);
        // Only 8 of the variables should have the isCloud flag set to true
        expect(stageVars.filter(v => v.isCloud).length).toBe(10);

        vm.quit();
        done();
    });
});

test('importing one project after the other resets cloud variable limit', done => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(cloudVarExceededLimit).then(() => {
        expect(vm.runtime.canAddCloudVariable()).toBe(false);

        vm.loadProject(cloudVarSimple).then(() => {
            const stage = vm.runtime.targets[0];
            const stageVars = Object.values(stage.variables);
            expect(stageVars.length).toBe(1);

            const variable = stageVars[0];
            expect(variable.name).toBe('☁ firstCloud');
            expect(Number(variable.value)).toBe(100);
            expect(variable.isCloud).toBe(true);

            expect(vm.runtime.canAddCloudVariable()).toBe(true);

            vm.quit();
            done();
        });
    });
});

test('local cloud variables get imported as regular variables', done => {
    // This tests a hacked project where a sprite-local variable is
    // has the cloud variable flag set.
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(cloudVarLocal).then(() => {
        expect(vm.runtime.hasCloudData()).toBe(false);

        const stage = vm.runtime.targets[0];
        const stageVars = Object.values(stage.variables);

        expect(stageVars.length).toBe(0);

        const sprite = vm.runtime.targets[1];
        const spriteVars = Object.values(sprite.variables);

        expect(spriteVars.length).toBe(1);
        expect(spriteVars[0].isCloud).toBe(false);

        vm.quit();
        done();
    });
});
