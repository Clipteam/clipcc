const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const Variable = require('../../src/engine/variable');
const StringUtil = require('../../src/util/string-util');
const VariableUtil = require('../../src/util/variable-util');

const projectUri = path.resolve(__dirname, '../fixtures/broadcast_special_chars.sb3');
const project = readFileToBuffer(projectUri);

test('importing sb3 project with special chars in message names', done => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', e => {
        const threads = JSON.parse(e.threads);
        expect(threads.length).toBe(0);

        expect(vm.runtime.targets.length).toBe(2);

        const stage = vm.runtime.targets[0];
        const cat = vm.runtime.targets[1];

        const allBroadcastFields = VariableUtil.getAllVarRefsForTargets(vm.runtime.targets, true);

        const abMessageId = Object.keys(stage.variables).filter(k => stage.variables[k].name === 'a&b')[0];
        const abMessage = stage.variables[abMessageId];
        // Check for unsafe characters, replaceUnsafeChars should just result in the original string
        // (e.g. there was nothing to replace)
        // Check that the message ID does not have any unsafe characters
        expect(StringUtil.replaceUnsafeChars(abMessageId)).toBe(abMessageId);

        // Check that the message still has the correct info
        expect(StringUtil.replaceUnsafeChars(abMessage.id)).toBe(abMessage.id);
        expect(abMessage.id).toBe(abMessageId);
        expect(abMessage.type).toBe(Variable.BROADCAST_MESSAGE_TYPE);
        expect(abMessage.value).toBe('a&b');


        const ltPerfectMessageId = Object.keys(stage.variables).filter(k => stage.variables[k].name === '< perfect')[0];
        const ltPerfectMessage = stage.variables[ltPerfectMessageId];
        // Check for unsafe characters, replaceUnsafeChars should just result in the original string
        // (e.g. there was nothing to replace)
        // Check that the message ID does not have any unsafe characters
        expect(StringUtil.replaceUnsafeChars(ltPerfectMessageId)).toBe(ltPerfectMessageId);

        // Check that the message still has the correct info
        expect(StringUtil.replaceUnsafeChars(ltPerfectMessage.id)).toBe(ltPerfectMessage.id);
        expect(ltPerfectMessage.id).toBe(ltPerfectMessageId);
        expect(ltPerfectMessage.type).toBe(Variable.BROADCAST_MESSAGE_TYPE);
        expect(ltPerfectMessage.value).toBe('< perfect');

        // Find all the references for these messages, and verify they have the correct ID
        expect(allBroadcastFields[ltPerfectMessageId].length).toBe(1);
        expect(allBroadcastFields[abMessageId].length).toBe(1);
        const catBlocks = Object.keys(cat.blocks._blocks).map(blockId => cat.blocks._blocks[blockId]);
        const catMessageBlocks = catBlocks.filter(block => block.fields.hasOwnProperty('BROADCAST_OPTION'));
        expect(catMessageBlocks.length).toBe(2);
        expect(catMessageBlocks[0].fields.BROADCAST_OPTION.id).toBe(ltPerfectMessageId);
        expect(catMessageBlocks[1].fields.BROADCAST_OPTION.id).toBe(abMessageId);

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
