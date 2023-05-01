const path = require('path');
const VirtualMachine = require('../../src/index');
const Runtime = require('../../src/engine/runtime');
const sb3 = require('../../src/serialization/sb3');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const exampleProjectPath = path.resolve(__dirname, '../fixtures/clone-cleanup.sb2');
const commentsSB2ProjectPath = path.resolve(__dirname, '../fixtures/comments.sb2');
const commentsSB3ProjectPath = path.resolve(__dirname, '../fixtures/comments.sb3');
const commentsSB3NoDupeIds = path.resolve(__dirname, '../fixtures/comments_no_duplicate_id_serialization.sb3');
const variableReporterSB2ProjectPath = path.resolve(__dirname, '../fixtures/top-level-variable-reporter.sb2');
const topLevelReportersProjectPath = path.resolve(__dirname, '../fixtures/top-level-reporters.sb3');
const draggableSB3ProjectPath = path.resolve(__dirname, '../fixtures/draggable.sb3');
const originSB3ProjectPath = path.resolve(__dirname, '../fixtures/origin.sb3');
const originAbsentSB3ProjectPath = path.resolve(__dirname, '../fixtures/origin-absent.sb3');
const FakeRenderer = require('../fixtures/fake-renderer');

test('serialize', done => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(exampleProjectPath))
        .then(() => {
            const result = sb3.serialize(vm.runtime);
            // @todo Analyze
            expect(typeof JSON.stringify(result)).toBe('string');
            done();
        });
});

test('deserialize', done => {
    const vm = new VirtualMachine();
    sb3.deserialize('', vm.runtime).then(({targets}) => {
        // @todo Analyze
        expect(typeof targets).toBe('object');
        done();
    });
});


test('serialize sb2 project with comments as sb3', done => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(commentsSB2ProjectPath))
        .then(() => {
            const result = sb3.serialize(vm.runtime);

            expect(typeof JSON.stringify(result)).toBe('string');
            expect(typeof result.targets).toBe('object');
            expect(Array.isArray(result.targets)).toBe(true);
            expect(result.targets.length).toBe(2);

            const stage = result.targets[0];
            expect(stage.isStage).toBe(true);
            // The stage has 0 blocks, and 1 workspace comment
            expect(typeof stage.blocks).toBe('object');
            expect(Object.keys(stage.blocks).length).toBe(0);
            expect(typeof stage.comments).toBe('object');
            expect(Object.keys(stage.comments).length).toBe(1);
            const stageBlockComments = Object.values(stage.comments).filter(comment => !!comment.blockId);
            const stageWorkspaceComments = Object.values(stage.comments).filter(comment => comment.blockId === null);
            expect(stageBlockComments.length).toBe(0);
            expect(stageWorkspaceComments.length).toBe(1);

            const sprite = result.targets[1];
            expect(sprite.isStage).toBe(false);
            expect(typeof sprite.blocks).toBe('object');
            // Sprite 1 has 6 blocks, 5 block comments, and 1 workspace comment
            expect(Object.keys(sprite.blocks).length).toBe(6);
            expect(typeof sprite.comments).toBe('object');
            expect(Object.keys(sprite.comments).length).toBe(6);

            const spriteBlockComments = Object.values(sprite.comments).filter(comment => !!comment.blockId);
            const spriteWorkspaceComments = Object.values(sprite.comments).filter(comment => comment.blockId === null);
            expect(spriteBlockComments.length).toBe(5);
            expect(spriteWorkspaceComments.length).toBe(1);

            done();
        });
});

test('deserialize sb3 project with comments', done => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(commentsSB3ProjectPath))
        .then(() => {
            const runtime = vm.runtime;

            expect(typeof runtime.targets).toBe('object');
            expect(Array.isArray(runtime.targets)).toBe(true);
            expect(runtime.targets.length).toBe(2);

            const stage = runtime.targets[0];
            expect(stage.isStage).toBe(true);
            // The stage has 0 blocks, and 1 workspace comment
            expect(typeof stage.blocks).toBe('object');
            expect(Object.keys(stage.blocks._blocks).length).toBe(0);
            expect(typeof stage.comments).toBe('object');
            expect(Object.keys(stage.comments).length).toBe(1);
            const stageBlockComments = Object.values(stage.comments).filter(comment => !!comment.blockId);
            const stageWorkspaceComments = Object.values(stage.comments).filter(comment => comment.blockId === null);
            expect(stageBlockComments.length).toBe(0);
            expect(stageWorkspaceComments.length).toBe(1);

            const sprite = runtime.targets[1];
            expect(sprite.isStage).toBe(false);
            expect(typeof sprite.blocks).toBe('object');
            // Sprite 1 has 6 blocks, 5 block comments, and 1 workspace comment
            expect(Object.values(sprite.blocks._blocks).filter(block => !block.shadow).length).toBe(6);
            expect(typeof sprite.comments).toBe('object');
            expect(Object.keys(sprite.comments).length).toBe(6);

            const spriteBlockComments = Object.values(sprite.comments).filter(comment => !!comment.blockId);
            const spriteWorkspaceComments = Object.values(sprite.comments).filter(comment => comment.blockId === null);
            expect(spriteBlockComments.length).toBe(5);
            expect(spriteWorkspaceComments.length).toBe(1);

            done();
        });
});

test('deserialize sb3 project with comments - no duplicate id serialization', done => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(commentsSB3NoDupeIds))
        .then(() => {
            const runtime = vm.runtime;

            expect(typeof runtime.targets).toBe('object');
            expect(Array.isArray(runtime.targets)).toBe(true);
            expect(runtime.targets.length).toBe(2);

            const stage = runtime.targets[0];
            expect(stage.isStage).toBe(true);
            // The stage has 0 blocks, and 0 workspace comment
            expect(typeof stage.blocks).toBe('object');
            expect(Object.keys(stage.blocks._blocks).length).toBe(0);
            expect(typeof stage.comments).toBe('object');
            expect(Object.keys(stage.comments).length).toBe(0);

            const sprite = runtime.targets[1];
            expect(sprite.isStage).toBe(false);
            expect(typeof sprite.blocks).toBe('object');
            // Sprite1 has 1 blocks, 1 block comment, and 1 workspace comment
            expect(Object.values(sprite.blocks._blocks).filter(block => !block.shadow).length).toBe(1);
            expect(typeof sprite.comments).toBe('object');
            expect(Object.keys(sprite.comments).length).toBe(2);

            const spriteBlockComments = Object.values(sprite.comments).filter(comment => !!comment.blockId);
            const spriteWorkspaceComments = Object.values(sprite.comments).filter(comment => comment.blockId === null);
            expect(spriteBlockComments.length).toBe(1);
            expect(spriteWorkspaceComments.length).toBe(1);

            done();
        });
});

test('serializing and deserializing sb3 preserves sprite layer order', done => {
    const vm = new VirtualMachine();
    vm.attachRenderer(new FakeRenderer());
    return vm.loadProject(readFileToBuffer(path.resolve(__dirname, '../fixtures/ordering.sb2')))
        .then(() => {
            // Target get layer order needs a renderer,
            // fake the numbers we would get back from the
            // renderer in order to test that they are serialized
            // correctly
            vm.runtime.targets[0].getLayerOrder = () => 0;
            vm.runtime.targets[1].getLayerOrder = () => 20;
            vm.runtime.targets[2].getLayerOrder = () => 10;
            vm.runtime.targets[3].getLayerOrder = () => 30;

            const result = sb3.serialize(vm.runtime);

            expect(typeof JSON.stringify(result)).toBe('string');
            expect(typeof result.targets).toBe('object');
            expect(Array.isArray(result.targets)).toBe(true);
            expect(result.targets.length).toBe(4);

            // First check that the sprites are ordered correctly (as they would
            // appear in the target pane)
            expect(result.targets[0].name).toBe('Stage');
            expect(result.targets[1].name).toBe('First');
            expect(result.targets[2].name).toBe('Second');
            expect(result.targets[3].name).toBe('Third');

            // Check that they are in the correct layer order (as they would render
            // back to front on the stage)
            expect(result.targets[0].layerOrder).toBe(0);
            expect(result.targets[1].layerOrder).toBe(2);
            expect(result.targets[2].layerOrder).toBe(1);
            expect(result.targets[3].layerOrder).toBe(3);

            return result;
        })
        .then(serializedObject =>
            sb3.deserialize(
                JSON.parse(JSON.stringify(serializedObject)), new Runtime(), null, false)
                .then(({targets}) => {
                    // First check that the sprites are ordered correctly (as they would
                    // appear in the target pane)
                    expect(targets[0].sprite.name).toBe('Stage');
                    expect(targets[1].sprite.name).toBe('First');
                    expect(targets[2].sprite.name).toBe('Second');
                    expect(targets[3].sprite.name).toBe('Third');

                    // Check that they are in the correct layer order (as they would render
                    // back to front on the stage)
                    expect(targets[0].layerOrder).toBe(0);
                    expect(targets[1].layerOrder).toBe(2);
                    expect(targets[2].layerOrder).toBe(1);
                    expect(targets[3].layerOrder).toBe(3);

                    done();
                }));
});

test('serializeBlocks', done => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(commentsSB3ProjectPath))
        .then(() => {
            const blocks = vm.runtime.targets[1].blocks._blocks;
            const result = sb3.serializeBlocks(blocks);
            // @todo Analyze
            expect(typeof result[0]).toBe('object');
            expect(Object.keys(result[0]).length < Object.keys(blocks).length).toBeTruthy();
            expect(Array.isArray(result[1])).toBeTruthy();
            done();
        });
});

test('serializeBlocks serializes x and y for topLevel blocks with x,y of 0,0', done => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(topLevelReportersProjectPath))
        .then(() => {
            // Verify that there are 2 blocks and they are both top level
            const blocks = vm.runtime.targets[1].blocks._blocks;
            const blockIds = Object.keys(blocks);
            expect(blockIds.length).toBe(2);
            const blocksArray = blockIds.map(key => blocks[key]);
            expect(blocksArray.every(b => b.topLevel)).toBe(true);
            // Simulate cleaning up the blocks by resetting x and y positions to 0
            blockIds.forEach(blockId => {
                blocks[blockId].x = 0;
                blocks[blockId].y = 0;
            });
            const result = sb3.serializeBlocks(blocks);
            const serializedBlocks = result[0];

            expect(typeof serializedBlocks).toBe('object');
            const serializedBlockIds = Object.keys(serializedBlocks);
            expect(serializedBlockIds.length).toBe(2);
            const firstBlock = serializedBlocks[serializedBlockIds[0]];
            const secondBlock = serializedBlocks[serializedBlockIds[1]];
            expect(firstBlock.x).toBe(0);
            expect(firstBlock.y).toBe(0);
            expect(secondBlock.x).toBe(0);
            expect(secondBlock.y).toBe(0);

            done();
        });
});

test('deserializeBlocks', done => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(commentsSB3ProjectPath))
        .then(() => {
            const blocks = vm.runtime.targets[1].blocks._blocks;
            const serialized = sb3.serializeBlocks(blocks)[0];
            const deserialized = sb3.deserializeBlocks(serialized);
            expect(Object.keys(deserialized).length).toBe(Object.keys(blocks).length);
            done();
        });
});

test('deserializeBlocks on already deserialized input', done => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(commentsSB3ProjectPath))
        .then(() => {
            const blocks = vm.runtime.targets[1].blocks._blocks;
            const serialized = sb3.serializeBlocks(blocks)[0];
            const deserialized = sb3.deserializeBlocks(serialized);
            const deserializedAgain = sb3.deserializeBlocks(deserialized);
            expect(deserialized).toEqual(deserializedAgain);
            done();
        });
});

test('getExtensionIdForOpcode', () => {
    expect(sb3.getExtensionIdForOpcode('wedo_loopy')).toBe('wedo');

    // does not consider CORE to be extensions
    expect(sb3.getExtensionIdForOpcode('control_loopy')).toBeFalsy();

    // only considers things before the first underscore
    expect(sb3.getExtensionIdForOpcode('hello_there_loopy')).toBe('hello');

    // does not return anything for opcodes with no extension
    expect(sb3.getExtensionIdForOpcode('hello')).toBeFalsy();

    // forbidden characters must be replaced with '-'
    expect(sb3.getExtensionIdForOpcode('hi:there/happy_people')).toBe('hi-there-happy');
});

test('(#1608) serializeBlocks maintains top level variable reporters', done => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(variableReporterSB2ProjectPath))
        .then(() => {
            const blocks = vm.runtime.targets[0].blocks._blocks;
            const result = sb3.serialize(vm.runtime);
            // Project should have 1 block, a top-level variable reporter
            expect(Object.keys(blocks).length).toBe(1);
            expect(Object.keys(result.targets[0].blocks).length).toBe(1);

            // Make sure deserializing these blocks works
            expect(() => {
                sb3.deserialize(JSON.parse(JSON.stringify(result)), vm.runtime);
            }).not.toThrow();
            done();
        });
});

test('(#1850) sprite draggability state read when loading SB3 file', done => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(draggableSB3ProjectPath))
        .then(() => {
            const sprite1Obj = vm.runtime.targets.find(target => target.sprite.name === 'Sprite1');
            // Sprite1 in project should have draggable set to true
            expect(sprite1Obj.draggable).toBe(true);
            done();
        });
});

test('load origin value from SB3 file json metadata', done => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(originSB3ProjectPath))
        .then(() => {
            expect(typeof vm.runtime.origin).toBe('string');
        })
        .then(() => vm.loadProject(readFileToBuffer(originAbsentSB3ProjectPath)))
        .then(() => {
            // After loading a project with an origin, then loading one without an origin,
            // origin value should no longer be set.
            expect(vm.runtime.origin).toBe(null);
            done();
        });
});

test('serialize origin value if it is present', done => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(originSB3ProjectPath))
        .then(() => {
            const result = sb3.serialize(vm.runtime);
            expect(typeof result.meta.origin).toBe('string');
            done();
        });
});

test('do not serialize origin value if it is not present', done => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(originAbsentSB3ProjectPath))
        .then(() => {
            const result = sb3.serialize(vm.runtime);
            expect(result.meta.origin).toBe(undefined);
            done();
        });
});
