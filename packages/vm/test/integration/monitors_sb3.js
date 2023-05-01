const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const Variable = require('../../src/engine/variable');

const projectUri = path.resolve(__dirname, '../fixtures/monitors.sb3');
const project = readFileToBuffer(projectUri);

test('importing sb3 project with monitors', done => {
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
        expect(lastStepUpdatedMonitorThreads.length).toBe(17);

        // There should be one additional hidden monitor that is in the monitorState but
        // does not start a thread.
        expect(vm.runtime._monitorState.size).toBe(18);

        const stage = vm.runtime.targets[0];
        const shirtSprite = vm.runtime.targets[1];
        const heartSprite = vm.runtime.targets[2];

        // Global variable named "my variable" exists
        let variableId = Object.keys(stage.variables).filter(k => stage.variables[k].name === 'my variable')[0];
        let monitorRecord = vm.runtime._monitorState.get(variableId);
        let monitorBlock = vm.runtime.monitorBlocks.getBlock(variableId);
        expect(monitorRecord.opcode).toBe('data_variable');
        expect(monitorRecord.mode).toBe('default');
        // The following few properties are imported for all monitors, just check once.
        expect(monitorRecord.sliderMin).toBe(0);
        expect(monitorRecord.sliderMax).toBe(100);
        expect(monitorRecord.isDiscrete).toBe(true); // The default if not present
        expect(monitorRecord.x).toBe(10);
        expect(monitorRecord.y).toBe(62);
        // Height and width are only used for list monitors and should default to 0
        // for all other monitors
        expect(monitorRecord.width).toBe(0);
        expect(monitorRecord.height).toBe(0);
        expect(monitorRecord.visible).toBe(true);
        expect(typeof monitorRecord.params).toBe('object');
        // The variable name should be stored in the monitor params
        expect(monitorRecord.params.VARIABLE).toBe('my variable');
        // Test that the monitor block and its fields were constructed correctly
        expect(monitorBlock.fields.VARIABLE.value).toBe('my variable');
        expect(monitorBlock.fields.VARIABLE.name).toBe('VARIABLE');
        expect(monitorBlock.fields.VARIABLE.id).toBe(variableId);
        expect(monitorBlock.fields.VARIABLE.variableType).toBe(Variable.SCALAR_TYPE);

        // There is a global variable named 'secret_slide' which has a hidden monitor
        variableId = Object.keys(stage.variables).filter(k => stage.variables[k].name === 'secret_slide')[0];
        monitorRecord = vm.runtime._monitorState.get(variableId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(variableId);
        expect(monitorRecord.opcode).toBe('data_variable');
        expect(monitorRecord.mode).toBe('slider');
        expect(monitorRecord.visible).toBe(false);
        expect(monitorRecord.sliderMin).toBe(0);
        expect(monitorRecord.sliderMax).toBe(100);
        expect(typeof monitorRecord.params).toBe('object');
        expect(monitorRecord.params.VARIABLE).toBe('secret_slide');
        // Test that the monitor block and its fields were constructed correctly
        expect(monitorBlock.fields.VARIABLE.value).toBe('secret_slide');
        expect(monitorBlock.fields.VARIABLE.name).toBe('VARIABLE');
        expect(monitorBlock.fields.VARIABLE.id).toBe(variableId);
        expect(monitorBlock.fields.VARIABLE.variableType).toBe(Variable.SCALAR_TYPE);


        // Shirt sprite has a local list named "fashion"
        variableId = Object.keys(shirtSprite.variables).filter(k => shirtSprite.variables[k].name === 'fashion')[0];
        monitorRecord = vm.runtime._monitorState.get(variableId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(variableId);
        expect(monitorRecord.opcode).toBe('data_listcontents');
        expect(monitorRecord.mode).toBe('list');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.height).toBe(122);
        expect(monitorRecord.width).toBe(104);
        expect(typeof monitorRecord.params).toBe('object');
        expect(monitorRecord.params.LIST).toBe('fashion'); // The list name should be stored in the monitor params
        // Test that the monitor block and its fields were constructed correctly
        expect(monitorBlock.fields.LIST.value).toBe('fashion');
        expect(monitorBlock.fields.LIST.name).toBe('LIST');
        expect(monitorBlock.fields.LIST.id).toBe(variableId);
        expect(monitorBlock.fields.LIST.variableType).toBe(Variable.LIST_TYPE);

        // Shirt sprite has a local variable named "tee"
        variableId = Object.keys(shirtSprite.variables).filter(k => shirtSprite.variables[k].name === 'tee')[0];
        monitorRecord = vm.runtime._monitorState.get(variableId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(variableId);
        expect(monitorRecord.opcode).toBe('data_variable');
        expect(monitorRecord.mode).toBe('slider');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.sliderMin).toBe(0);
        expect(monitorRecord.sliderMax).toBe(100);
        expect(typeof monitorRecord.params).toBe('object');
        expect(monitorRecord.params.VARIABLE).toBe('tee');
        // Test that the monitor block and its fields were constructed correctly
        expect(monitorBlock.fields.VARIABLE.value).toBe('tee');
        expect(monitorBlock.fields.VARIABLE.name).toBe('VARIABLE');
        expect(monitorBlock.fields.VARIABLE.id).toBe(variableId);
        expect(monitorBlock.fields.VARIABLE.variableType).toBe(Variable.SCALAR_TYPE);

        // Heart sprite has a local list named "hearty"
        variableId = Object.keys(heartSprite.variables).filter(k => heartSprite.variables[k].name === 'hearty')[0];
        monitorRecord = vm.runtime._monitorState.get(variableId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(variableId);
        expect(monitorRecord.opcode).toBe('data_variable');
        expect(monitorRecord.mode).toBe('default');
        expect(monitorRecord.visible).toBe(true);
        expect(typeof monitorRecord.params).toBe('object');
        expect(monitorRecord.params.VARIABLE).toBe('hearty'); // The variable name should be stored in the monitor params
        // Test that the monitor block and its fields were constructed correctly
        expect(monitorBlock.fields.VARIABLE.value).toBe('hearty');
        expect(monitorBlock.fields.VARIABLE.name).toBe('VARIABLE');
        expect(monitorBlock.fields.VARIABLE.id).toBe(variableId);
        expect(monitorBlock.fields.VARIABLE.variableType).toBe(Variable.SCALAR_TYPE);

        // Backdrop name monitor is visible, not sprite specific
        // should get imported with id that references the name parameter
        // via '_name' at the end since the 3.0 block has a dropdown.
        let monitorId = 'backdropnumbername_name';
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        expect(monitorRecord.opcode).toBe('looks_backdropnumbername');
        expect(monitorRecord.mode).toBe('default');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.spriteName).toBe(null);
        expect(monitorRecord.targetId).toBe(null);
        // Test that the monitor block and its fields were constructed correctly
        expect(monitorBlock.fields.NUMBER_NAME.value).toBe('name');

        // Backdrop name monitor is visible, not sprite specific
        // should get imported with id that references the name parameter
        // via '_number' at the end since the 3.0 block has a dropdown.
        monitorId = 'backdropnumbername_number';
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        expect(monitorRecord.opcode).toBe('looks_backdropnumbername');
        expect(monitorRecord.mode).toBe('default');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.spriteName).toBe(null);
        expect(monitorRecord.targetId).toBe(null);
        // Test that the monitor block and its fields were constructed correctly
        expect(monitorBlock.fields.NUMBER_NAME.value).toBe('number');

        // x position monitor is in large mode, specific to shirt sprite
        monitorId = `${shirtSprite.id}_xposition`;
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        expect(monitorRecord.opcode).toBe('motion_xposition');
        expect(monitorRecord.mode).toBe('large');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.spriteName).toBe('Shirt-T');
        expect(monitorRecord.targetId).toBe(shirtSprite.id);

        // y position monitor is in large mode, specific to shirt sprite
        monitorId = `${shirtSprite.id}_yposition`;
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        expect(monitorRecord.opcode).toBe('motion_yposition');
        expect(monitorRecord.mode).toBe('large');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.spriteName).toBe('Shirt-T');
        expect(monitorRecord.targetId).toBe(shirtSprite.id);

        // direction monitor is in large mode, specific to shirt sprite
        monitorId = `${shirtSprite.id}_direction`;
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        expect(monitorRecord.opcode).toBe('motion_direction');
        expect(monitorRecord.mode).toBe('large');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.spriteName).toBe('Shirt-T');
        expect(monitorRecord.targetId).toBe(shirtSprite.id);

        monitorId = `${shirtSprite.id}_size`;
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        expect(monitorRecord.opcode).toBe('looks_size');
        expect(monitorRecord.mode).toBe('large');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.spriteName).toBe('Shirt-T');
        expect(monitorRecord.targetId).toBe(shirtSprite.id);

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

        monitorId = 'current_year';
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        expect(monitorRecord.opcode).toBe('sensing_current');
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        expect(monitorBlock.fields.CURRENTMENU.value).toBe('YEAR');
        expect(monitorRecord.mode).toBe('default');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.spriteName).toBe(null);
        expect(monitorRecord.targetId).toBe(null);

        monitorId = 'current_month';
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        expect(monitorRecord.opcode).toBe('sensing_current');
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        expect(monitorBlock.fields.CURRENTMENU.value).toBe('MONTH');
        expect(monitorRecord.mode).toBe('default');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.spriteName).toBe(null);
        expect(monitorRecord.targetId).toBe(null);

        // Extension Monitors
        monitorId = 'music_getTempo';
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        expect(monitorRecord.opcode).toBe('music_getTempo');
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        expect(monitorRecord.mode).toBe('default');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.spriteName).toBe(null);
        expect(monitorRecord.targetId).toBe(null);
        expect(vm.extensionManager.isExtensionLoaded('music')).toBe(true);

        monitorId = 'ev3_getDistance';
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        expect(monitorRecord.opcode).toBe('ev3_getDistance');
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        expect(monitorRecord.mode).toBe('default');
        expect(monitorRecord.visible).toBe(true);
        expect(monitorRecord.spriteName).toBe(null);
        expect(monitorRecord.targetId).toBe(null);
        expect(vm.extensionManager.isExtensionLoaded('ev3')).toBe(true);

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
