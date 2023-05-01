const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const uri = path.resolve(__dirname, '../fixtures/unknown-opcode.sb2');
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

        // The project has 3 blocks in a single stack:
        //      play sound => "undefined" => play sound
        // the "undefined" block has opcode "0" and was found in the wild.
        // It should be parsed in without error and it should bridge together
        // the two play sound blocks, so there should not be a third block.
        const blocks = vm.runtime.targets[0].blocks;
        const topBlockId = blocks.getScripts()[0];
        const secondBlockId = blocks.getNextBlock(topBlockId);
        const thirdBlockId = blocks.getNextBlock(secondBlockId);

        expect(blocks.getBlock(topBlockId).opcode).toBe('sound_play');
        expect(blocks.getBlock(secondBlockId).opcode).toBe('sound_play');
        expect(thirdBlockId).toBe(null);

        const target = vm.runtime.targets[0];
        const topCommentId = blocks.getBlock(topBlockId).comment;
        const secondCommentId = blocks.getBlock(secondBlockId).comment;

        expect(target.comments[topCommentId].text).toBe('pop1 comment');
        expect(target.comments[secondCommentId].text).toBe('pop2 comment');

        // The comment previously attached to the undefined block should become
        // a workspace comment, at 0/0, with the same text as it had.
        const undefinedCommentId = Object.keys(target.comments).filter(id =>
            id !== topCommentId && id !== secondCommentId)[0];
        const undefinedComment = target.comments[undefinedCommentId];
        expect(undefinedComment.blockId).toBe(null);
        expect(undefinedComment.text).toBe('undefined comment');
        expect(undefinedComment.x).toBe(0);
        expect(undefinedComment.y).toBe(0);

        vm.quit();
        done();
    });
});
