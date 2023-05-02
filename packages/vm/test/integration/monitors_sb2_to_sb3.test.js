const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

let vm;

beforeEach(() => {
    const projectUri = path.resolve(__dirname, '../fixtures/monitors.sb2');
    const project = readFileToBuffer(projectUri);

    vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // TODO figure out why running threads doesn't work in this test
    // vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);

    return vm.loadProject(project);
});


test('saving and loading sb2 project with monitors preserves sliderMin and sliderMax', done => {

    vm.on('playgroundData', e /* eslint-disable-line no-unused-vars */ => {
        // TODO related to above TODO, comment these back in when we figure out
        // why running threads doesn't work with this test

        // const threads = JSON.parse(e.threads);
        // All monitors should create threads that finish during the step and
        // are revoved from runtime.threads.
        // t.equal(threads.length, 0);

        // we care that the last step updated the right number of monitors
        // we don't care whether the last step ran other threads or not
        // const lastStepUpdatedMonitorThreads = vm.runtime._lastStepDoneThreads.filter(thread => thread.updateMonitor);
        // t.equal(lastStepUpdatedMonitorThreads.length, 8);

        // There should be one additional hidden monitor that is in the monitorState but
        // does not start a thread.
        expect(vm.runtime._monitorState.size).toBe(9);

        const stage = vm.runtime.targets[0];
        const target = vm.runtime.targets[1];

        // Global variable named "global" is a slider
        let variableId = Object.keys(stage.variables).filter(k => stage.variables[k].name === 'global')[0];
        // Used later when checking save and load of slider min/max
        let monitorRecord = vm.runtime._monitorState.get(variableId);
        expect(monitorRecord.opcode).toBe('data_variable');
        expect(monitorRecord.mode).toBe('slider');
        expect(monitorRecord.sliderMin).toBe(-200); // Make sure these are imported for sliders.
        expect(monitorRecord.sliderMax).toBe(30);
        expect(monitorRecord.isDiscrete).toBe(false);
        expect(monitorRecord.x).toBe(5); // These are imported for all monitors, just check once.
        expect(monitorRecord.y).toBe(59);
        expect(monitorRecord.visible).toBe(true);

        // Global variable named "global list" is a list
        variableId = Object.keys(stage.variables).filter(k => stage.variables[k].name === 'global list')[0];
        monitorRecord = vm.runtime._monitorState.get(variableId);
        expect(monitorRecord.opcode).toBe('data_listcontents');
        expect(monitorRecord.mode).toBe('list');
        expect(monitorRecord.visible).toBe(true);

        // Local variable named "local" is hidden
        variableId = Object.keys(target.variables).filter(k => target.variables[k].name === 'local')[0];
        monitorRecord = vm.runtime._monitorState.get(variableId);
        expect(monitorRecord.opcode).toBe('data_variable');
        expect(monitorRecord.mode).toBe('default');
        expect(monitorRecord.visible).toBe(false);

        // Local list named "local list" is visible
        variableId = Object.keys(target.variables).filter(k => target.variables[k].name === 'local list')[0];
        monitorRecord = vm.runtime._monitorState.get(variableId);
        expect(monitorRecord.opcode).toBe('data_listcontents');
        expect(monitorRecord.mode).toBe('list');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.width).toBe(106); // Make sure these are imported from lists.
        expect(monitorRecord.height).toBe(206);

        // Backdrop name monitor is visible, not sprite specific
        // should get imported with id that references the name parameter
        // via '_name' at the end since the 3.0 block has a dropdown.
        monitorRecord = vm.runtime._monitorState.get('backdropnumbername_name');
        expect(monitorRecord.opcode).toBe('looks_backdropnumbername');
        expect(monitorRecord.mode).toBe('default');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.spriteName).toBe(null);
        expect(monitorRecord.targetId).toBe(null);

        // x position monitor is in large mode, specific to sprite 1
        monitorRecord = vm.runtime._monitorState.get(`${target.id}_xposition`);
        expect(monitorRecord.opcode).toBe('motion_xposition');
        expect(monitorRecord.mode).toBe('large');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.spriteName).toBe('Sprite1');
        expect(monitorRecord.targetId).toBe(target.id);


        let monitorId;
        let monitorBlock;

        // The monitor IDs for the sensing_current block should be unique
        // to the parameter that is selected on the block being monitored.
        // The paramater portion of the id should be lowercase even
        // though the field value on the block is uppercase.

        monitorId = 'current_date';
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        expect(monitorRecord.opcode).toBe('sensing_current');
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        expect(monitorBlock.fields.CURRENTMENU.value).toBe('DATE');
        expect(monitorRecord.mode).toBe('default');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.spriteName).toBe(null);
        expect(monitorRecord.targetId).toBe(null);

        monitorId = 'current_minute';
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        expect(monitorRecord.opcode).toBe('sensing_current');
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        expect(monitorBlock.fields.CURRENTMENU.value).toBe('MINUTE');
        expect(monitorRecord.mode).toBe('default');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.spriteName).toBe(null);
        expect(monitorRecord.targetId).toBe(null);

        monitorId = 'current_dayofweek';
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        expect(monitorRecord.opcode).toBe('sensing_current');
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        expect(monitorBlock.fields.CURRENTMENU.value).toBe('DAYOFWEEK');
        expect(monitorRecord.mode).toBe('default');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.spriteName).toBe(null);
        expect(monitorRecord.targetId).toBe(null);

        done();
    });

    // Start VM, load project, and run
    expect(() => {
        const sb3ProjectJson = vm.toJSON();
        return vm.loadProject(sb3ProjectJson).then(() => {
            setTimeout(() => {
                vm.getPlaygroundData();
                vm.stopAll();
            }, 100);
        });
    }).not.toThrow();
});
