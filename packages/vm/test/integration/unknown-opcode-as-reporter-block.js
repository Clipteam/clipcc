const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const uri = path.resolve(__dirname, '../fixtures/unknown-opcode-as-reporter-block.sb2');
const project = readFileToBuffer(uri);

test('unknown opcode', done => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(project).then(() => {
        vm.greenFlag();

        // The project has 4 blocks in a single stack:
        //      when green flag
        //      if "unknown block"
        //      set volume to "unknown block"
        //      play sound "unknown block"
        // the "unknown block" has unknown opcode and was created by
        // dragging a discontinued extension.
        // It should be parsed in without error and a shadow block
        // should be created where appropriate.
        const blocks = vm.runtime.targets[0].blocks;
        const topBlockId = blocks.getScripts()[0];
        const secondBlockId = blocks.getNextBlock(topBlockId);
        const thirdBlockId = blocks.getNextBlock(secondBlockId);
        const fourthBlockId = blocks.getNextBlock(thirdBlockId);

        expect(blocks.getBlock(topBlockId).opcode).toBe('event_whenflagclicked');
        expect(blocks.getBlock(secondBlockId).opcode).toBe('control_wait_until');
        expect(blocks.getBlock(thirdBlockId).opcode).toBe('sound_setvolumeto');
        expect(blocks.getBlock(fourthBlockId).opcode).toBe('sound_play');

        const secondBlockInputId = blocks.getBlock(secondBlockId).inputs.CONDITION.block;
        const thirdBlockInputId = blocks.getBlock(thirdBlockId).inputs.VOLUME.block;
        const fourthBlockInputId = blocks.getBlock(fourthBlockId).inputs.SOUND_MENU.block;

        expect(secondBlockInputId).toBe(null);
        expect(blocks.getBlock(thirdBlockInputId).shadow).toBeTruthy();
        expect(blocks.getBlock(thirdBlockInputId).opcode).toBe('math_number');
        expect(blocks.getBlock(fourthBlockInputId).shadow).toBeTruthy();
        expect(blocks.getBlock(fourthBlockInputId).opcode).toBe('sound_sounds_menu');

        vm.quit();
        done();
    });
});
