const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const projectUri = path.resolve(__dirname, '../fixtures/block-to-workspace-comments-without-scripts.sb2');
const project = readFileToBuffer(projectUri);

/* eslint-disable-next-line max-len */
test('importing sb2 project where block comment is converted to workspace comment and block is deleted, and there are no scripts on the workspace', done => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', e => {
        const threads = JSON.parse(e.threads);
        expect(threads.length).toBe(0);

        const target = vm.runtime.targets[1];

        // Sprite 1 has 1 comments, a workspace comment which was
        // originally created via a block comment to workspace comment conversion in Scratch 2.0.
        // What differentiates this test from above is that there are no scripts in this project.
        const targetComments = Object.values(target.comments);
        expect(targetComments.length).toBe(1);
        const spriteWorkspaceComments = targetComments.filter(comment => comment.blockId === null);
        expect(spriteWorkspaceComments.length).toBe(1);

        // Test the sprite block comments
        const blockComments = targetComments.filter(comment => !!comment.blockId);
        expect(blockComments.length).toBe(0);

        // There should not be any comments where blockId is a number
        const invalidComments = targetComments.filter(comment => typeof comment.blockId === 'number');
        expect(invalidComments.length).toBe(0);

        const targetBlocks = Object.values(target.blocks._blocks);
        expect(targetBlocks.length).toBe(0);

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
