const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const Variable = require('../../src/engine/variable');
const StringUtil = require('../../src/util/string-util');
const VariableUtil = require('../../src/util/variable-util');

const projectUri = path.resolve(__dirname, '../fixtures/variable_characters.sb3');
const project = readFileToBuffer(projectUri);

test('importing sb3 project with special chars in variable names', done => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', e => {
        const threads = JSON.parse(e.threads);
        // All monitors should create threads that finish during the step and
        // are revoved from runtime.threads.
        expect(threads.length).toBe(0);

        // we care that the last step updated the right number of monitors
        // we don't care whether the last step ran other threads or not
        const lastStepUpdatedMonitorThreads = vm.runtime._lastStepDoneThreads.filter(thread => thread.updateMonitor);
        expect(lastStepUpdatedMonitorThreads.length).toBe(3);

        expect(vm.runtime.targets.length).toBe(3);

        const stage = vm.runtime.targets[0];
        const cat = vm.runtime.targets[1];
        const bananas = vm.runtime.targets[2];

        const allVarListFields = VariableUtil.getAllVarRefsForTargets(vm.runtime.targets);

        const abVarId = Object.keys(stage.variables).filter(k => stage.variables[k].name === 'a&b')[0];
        const abVar = stage.variables[abVarId];
        const abMonitor = vm.runtime._monitorState.get(abVarId);
        // Check for unsafe characters, replaceUnsafeChars should just result in the original string
        // (e.g. there was nothing to replace)
        // Check that the variable ID does not have any unsafe characters
        expect(StringUtil.replaceUnsafeChars(abVarId)).toBe(abVarId);
        // Check that the monitor record ID does not have any unsafe characters
        expect(StringUtil.replaceUnsafeChars(abMonitor.id)).toBe(abMonitor.id);

        // Check that the variable still has the correct info
        expect(StringUtil.replaceUnsafeChars(abVar.id)).toBe(abVar.id);
        expect(abVar.id).toBe(abVarId);
        expect(abVar.type).toBe(Variable.LIST_TYPE);
        expect(abVar.value[0]).toBe('thing');
        expect(abVar.value[1]).toBe('thing\'1');

        // Find all the references for this list, and verify they have the correct ID
        // There should be 3 fields, 2 on the stage, and one on the cat
        expect(allVarListFields[abVarId].length).toBe(3);
        const stageBlocks = Object.keys(stage.blocks._blocks).map(blockId => stage.blocks._blocks[blockId]);
        const stageListBlocks = stageBlocks.filter(block => block.fields.hasOwnProperty('LIST'));
        expect(stageListBlocks.length).toBe(2);
        expect(stageListBlocks[0].fields.LIST.id).toBe(abVarId);
        expect(stageListBlocks[1].fields.LIST.id).toBe(abVarId);
        const catBlocks = Object.keys(cat.blocks._blocks).map(blockId => cat.blocks._blocks[blockId]);
        const catListBlocks = catBlocks.filter(block => block.fields.hasOwnProperty('LIST'));
        expect(catListBlocks.length).toBe(1);
        expect(catListBlocks[0].fields.LIST.id).toBe(abVarId);

        const fooVarId = Object.keys(stage.variables).filter(k => stage.variables[k].name === '"foo')[0];
        const fooVar = stage.variables[fooVarId];
        const fooMonitor = vm.runtime._monitorState.get(fooVarId);
        // Check for unsafe characters, replaceUnsafeChars should just result in the original string
        // (e.g. there was nothing to replace)
        // Check that the variable ID does not have any unsafe characters
        expect(StringUtil.replaceUnsafeChars(fooVarId)).toBe(fooVarId);
        // Check that the monitor record ID does not have any unsafe characters
        expect(StringUtil.replaceUnsafeChars(fooMonitor.id)).toBe(fooMonitor.id);

        // Check that the variable still has the correct info
        expect(StringUtil.replaceUnsafeChars(fooVar.id)).toBe(fooVar.id);
        expect(fooVar.id).toBe(fooVarId);
        expect(fooVar.type).toBe(Variable.SCALAR_TYPE);
        expect(fooVar.value).toBe('foo');

        // Find all the references for this variable, and verify they have the correct ID
        // There should be only two, one on the stage and one on bananas
        expect(allVarListFields[fooVarId].length).toBe(2);
        const stageVarBlocks = stageBlocks.filter(block => block.fields.hasOwnProperty('VARIABLE'));
        expect(stageVarBlocks.length).toBe(1);
        expect(stageVarBlocks[0].fields.VARIABLE.id).toBe(fooVarId);
        const catVarBlocks = catBlocks.filter(block => block.fields.hasOwnProperty('VARIABLE'));
        expect(catVarBlocks.length).toBe(1);
        expect(catVarBlocks[0].fields.VARIABLE.id).toBe(fooVarId);

        const ltPerfectVarId = Object.keys(bananas.variables).filter(k => bananas.variables[k].name === '< Perfect')[0];
        const ltPerfectVar = bananas.variables[ltPerfectVarId];
        const ltPerfectMonitor = vm.runtime._monitorState.get(ltPerfectVarId);
        // Check for unsafe characters, replaceUnsafeChars should just result in the original string
        // (e.g. there was nothing to replace)
        // Check that the variable ID does not have any unsafe characters
        expect(StringUtil.replaceUnsafeChars(ltPerfectVarId)).toBe(ltPerfectVarId);
        // Check that the monitor record ID does not have any unsafe characters
        expect(StringUtil.replaceUnsafeChars(ltPerfectMonitor.id)).toBe(ltPerfectMonitor.id);

        // Check that the variable still has the correct info
        expect(StringUtil.replaceUnsafeChars(ltPerfectVar.id)).toBe(ltPerfectVar.id);
        expect(ltPerfectVar.id).toBe(ltPerfectVarId);
        expect(ltPerfectVar.type).toBe(Variable.SCALAR_TYPE);
        expect(ltPerfectVar.value).toBe('> perfect');

        // Find all the references for this variable, and verify they have the correct ID
        // There should be one
        expect(allVarListFields[ltPerfectVarId].length).toBe(1);
        const bananasBlocks = Object.keys(bananas.blocks._blocks).map(blockId => bananas.blocks._blocks[blockId]);
        const bananasVarBlocks = bananasBlocks.filter(block => block.fields.hasOwnProperty('VARIABLE'));
        expect(bananasVarBlocks.length).toBe(1);
        expect(bananasVarBlocks[0].fields.VARIABLE.id).toBe(ltPerfectVarId);

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
