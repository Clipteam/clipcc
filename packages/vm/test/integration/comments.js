const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const projectUri = path.resolve(__dirname, '../fixtures/comments.sb2');
const project = readFileToBuffer(projectUri);

test('importing sb2 project with comments', done => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', e => {
        const threads = JSON.parse(e.threads);
        expect(threads.length).toBe(0);

        const stage = vm.runtime.targets[0];
        const target = vm.runtime.targets[1];

        const stageComments = Object.values(stage.comments);

        // Stage has 1 comment, and it is minimized.
        expect(stageComments.length).toBe(1);
        expect(stageComments[0].minimized).toBe(true);
        expect(stageComments[0].text).toBe('A minimized stage comment.');
        // The stage comment is a workspace comment
        expect(stageComments[0].blockId).toBe(null);

        // Sprite 1 has 6 Comments, 1 workspace comment, and 5 block comments
        const targetComments = Object.values(target.comments);
        expect(targetComments.length).toBe(6);
        const spriteWorkspaceComments = targetComments.filter(comment => comment.blockId === null);
        expect(spriteWorkspaceComments.length).toBe(1);
        expect(spriteWorkspaceComments[0].minimized).toBe(false);
        expect(spriteWorkspaceComments[0].text).toBe('This is a workspace comment.');

        // Test the sprite block comments
        const blockComments = targetComments.filter(comment => !!comment.blockId);
        expect(blockComments.length).toBe(5);

        expect(blockComments[0].minimized).toBe(true);
        expect(blockComments[0].text).toBe('1. Green Flag Comment.');
        const greenFlagBlock = target.blocks.getBlock(blockComments[0].blockId);
        expect(greenFlagBlock.comment).toBe(blockComments[0].id);
        expect(greenFlagBlock.opcode).toBe('event_whenflagclicked');

        expect(blockComments[1].minimized).toBe(true);
        expect(blockComments[1].text).toBe('2. Turn 15 Degrees Comment.');
        const turnRightBlock = target.blocks.getBlock(blockComments[1].blockId);
        expect(turnRightBlock.comment).toBe(blockComments[1].id);
        expect(turnRightBlock.opcode).toBe('motion_turnright');

        expect(blockComments[2].minimized).toBe(false);
        expect(blockComments[2].text).toBe('3. Comment for a loop.');
        const repeatBlock = target.blocks.getBlock(blockComments[2].blockId);
        expect(repeatBlock.comment).toBe(blockComments[2].id);
        expect(repeatBlock.opcode).toBe('control_repeat');

        expect(blockComments[3].minimized).toBe(false);
        expect(blockComments[3].text).toBe('4. Comment for a block nested in a loop.');
        const changeColorBlock = target.blocks.getBlock(blockComments[3].blockId);
        expect(changeColorBlock.comment).toBe(blockComments[3].id);
        expect(changeColorBlock.opcode).toBe('looks_changeeffectby');

        expect(blockComments[4].minimized).toBe(false);
        expect(blockComments[4].text).toBe('5. Comment for a block outside of a loop.');
        const stopAllBlock = target.blocks.getBlock(blockComments[4].blockId);
        expect(stopAllBlock.comment).toBe(blockComments[4].id);
        expect(stopAllBlock.opcode).toBe('control_stop');

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
