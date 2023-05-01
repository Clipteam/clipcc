const VirtualMachine = require('../../src/virtual-machine');
const Sprite = require('../../src/sprites/sprite');
const Variable = require('../../src/engine/variable');
const adapter = require('../../src/engine/adapter');
const events = require('../fixtures/events.json');
const Renderer = require('../fixtures/fake-renderer');
const Runtime = require('../../src/engine/runtime');
const RenderedTarget = require('../../src/sprites/rendered-target');

test('deleteSound returns function after deleting or null if nothing was deleted', t => {
    const vm = new VirtualMachine();
    const rt = new Runtime();
    const sprite = new Sprite(null, rt);
    sprite.sounds = [{id: 1}, {id: 2}, {id: 3}];
    const target = new RenderedTarget(sprite, rt);
    vm.editingTarget = target;

    const addFun = vm.deleteSound(1);
    expect(sprite.sounds.length).toBe(2);
    expect(sprite.sounds[0].id).toBe(1);
    expect(sprite.sounds[1].id).toBe(3);
    expect(typeof addFun).toBe('function');

    const noAddFun = vm.deleteSound(2);
    expect(sprite.sounds.length).toBe(2);
    expect(sprite.sounds[0].id).toBe(1);
    expect(sprite.sounds[1].id).toBe(3);
    expect(noAddFun).toBe(null);

    t.end();
});

test('deleteCostume returns function after deleting or null if nothing was deleted', t => {
    const vm = new VirtualMachine();
    const rt = new Runtime();
    const sprite = new Sprite(null, rt);
    sprite.costumes = [{id: 1}, {id: 2}, {id: 3}];
    sprite.currentCostume = 0;
    const target = new RenderedTarget(sprite, rt);
    vm.editingTarget = target;

    const addFun = vm.deleteCostume(1);
    expect(sprite.costumes.length).toBe(2);
    expect(sprite.costumes[0].id).toBe(1);
    expect(sprite.costumes[1].id).toBe(3);
    expect(typeof addFun).toBe('function');

    const noAddFun = vm.deleteCostume(2);
    expect(sprite.costumes.length).toBe(2);
    expect(sprite.costumes[0].id).toBe(1);
    expect(sprite.costumes[1].id).toBe(3);
    expect(noAddFun).toBe(null);

    t.end();
});


test('addSprite throws on invalid string', t => {
    const vm = new VirtualMachine();
    vm.addSprite('this is not a sprite')
        .catch(e => {
            expect(e.startsWith('Sprite Upload Error:')).toBe(true);
            t.end();
        });
});

test('renameSprite throws when there is no sprite with that id', t => {
    const vm = new VirtualMachine();
    vm.runtime.getTargetById = () => null;
    expect((() => vm.renameSprite('id', 'name'))).toThrowError(new Error('No target with the provided id.'));
    t.end();
});

test('renameSprite throws when used on a non-sprite target', t => {
    const vm = new VirtualMachine();
    const fakeTarget = {
        isSprite: () => false
    };
    vm.runtime.getTargetById = () => (fakeTarget);
    expect((() => vm.renameSprite('id', 'name'))).toThrowError(new Error('Cannot rename non-sprite targets.'));
    t.end();
});

test('renameSprite throws when there is no sprite for given target', t => {
    const vm = new VirtualMachine();
    const fakeTarget = {
        sprite: null,
        isSprite: () => true
    };
    vm.runtime.getTargetById = () => (fakeTarget);
    expect((() => vm.renameSprite('id', 'name'))).toThrowError(new Error('No sprite associated with this target.'));
    t.end();
});

test('renameSprite sets the sprite name', t => {
    const vm = new VirtualMachine();
    const fakeTarget = {
        sprite: {name: 'original'},
        isSprite: () => true
    };
    vm.runtime.getTargetById = () => (fakeTarget);
    vm.renameSprite('id', 'not-original');
    expect(fakeTarget.sprite.name).toBe('not-original');
    t.end();
});

test('renameSprite does not set sprite names to an empty string', t => {
    const vm = new VirtualMachine();
    const fakeTarget = {
        sprite: {name: 'original'},
        isSprite: () => true
    };
    vm.runtime.getTargetById = () => (fakeTarget);
    vm.renameSprite('id', '');
    expect(fakeTarget.sprite.name).toBe('original');
    t.end();
});

test('renameSprite does not set sprite names to reserved names', t => {
    const vm = new VirtualMachine();
    const fakeTarget = {
        sprite: {name: 'original'},
        isSprite: () => true
    };
    vm.runtime.getTargetById = () => (fakeTarget);
    vm.renameSprite('id', '_mouse_');
    expect(fakeTarget.sprite.name).toBe('original');
    t.end();
});

test('renameSprite increments from existing sprite names', t => {
    const vm = new VirtualMachine();
    vm.emitTargetsUpdate = () => {};

    const spr1 = new Sprite(null, vm.runtime);
    const target1 = spr1.createClone();
    const spr2 = new Sprite(null, vm.runtime);
    const target2 = spr2.createClone();

    vm.runtime.targets = [target1, target2];
    vm.renameSprite(target1.id, 'foo');
    expect(vm.runtime.targets[0].sprite.name).toBe('foo');
    vm.renameSprite(target2.id, 'foo');
    expect(vm.runtime.targets[1].sprite.name).toBe('foo2');
    t.end();
});

test('renameSprite does not increment when renaming to the same name', t => {
    const vm = new VirtualMachine();
    vm.emitTargetsUpdate = () => {};

    const spr = new Sprite(null, vm.runtime);
    spr.name = 'foo';
    const target = spr.createClone();

    vm.runtime.targets = [target];

    expect(vm.runtime.targets[0].sprite.name).toBe('foo');
    vm.renameSprite(target.id, 'foo');
    expect(vm.runtime.targets[0].sprite.name).toBe('foo');

    t.end();
});

test('deleteSprite throws when used on a non-sprite target', t => {
    const vm = new VirtualMachine();
    vm.runtime.targets = [{
        id: 'id',
        isSprite: () => false
    }];
    expect((() => vm.deleteSprite('id'))).toThrowError(new Error('Cannot delete non-sprite targets.'));
    t.end();
});

test('deleteSprite throws when there is no sprite for the given target', t => {
    const vm = new VirtualMachine();
    vm.runtime.targets = [{
        id: 'id',
        isSprite: () => true,
        sprite: null
    }];
    expect((() => vm.deleteSprite('id'))).toThrowError(new Error('No sprite associated with this target.'));
    t.end();
});

test('deleteSprite throws when there is no target with given id', t => {
    const vm = new VirtualMachine();
    vm.runtime.targets = [{
        id: 'id',
        isSprite: () => true,
        sprite: {
            name: 'this name'
        }
    }];
    expect((() => vm.deleteSprite('id1'))).toThrowError(new Error('No target with the provided id.'));
    t.end();
});

test('deleteSprite deletes a sprite when given id is associated with a known sprite', t => {
    const vm = new VirtualMachine();
    const spr = new Sprite(null, vm.runtime);
    const currTarget = spr.createClone();

    vm.runtime.targets = [currTarget];

    expect(currTarget.sprite.clones.length).toBe(1);
    vm.deleteSprite(currTarget.id);
    expect(currTarget.sprite.clones.length).toBe(0);
    t.end();
});

// eslint-disable-next-line max-len
test('deleteSprite sets editing target as null when given sprite is current editing target, and the only target in the runtime', t => {
    const vm = new VirtualMachine();
    const spr = new Sprite(null, vm.runtime);
    const currTarget = spr.createClone();

    vm.editingTarget = currTarget;
    vm.runtime.targets = [currTarget];

    vm.deleteSprite(currTarget.id);

    expect(vm.runtime.targets.length).toBe(0);
    expect(vm.editingTarget).toBe(null);
    t.end();
});

// eslint-disable-next-line max-len
test('deleteSprite updates editingTarget when sprite being deleted is current editing target, and there is another target in the runtime', t => {
    const vm = new VirtualMachine();
    const spr1 = new Sprite(null, vm.runtime);
    const spr2 = new Sprite(null, vm.runtime);
    const currTarget = spr1.createClone();
    const otherTarget = spr2.createClone();

    vm.emitWorkspaceUpdate = () => null;

    vm.runtime.targets = [currTarget, otherTarget];
    vm.editingTarget = currTarget;

    expect(vm.runtime.targets.length).toBe(2);
    vm.deleteSprite(currTarget.id);
    expect(vm.runtime.targets.length).toBe(1);
    expect(vm.editingTarget.id).toBe(otherTarget.id);

    // now let's try them in the other order in the runtime.targets list

    // can't reuse deleted targets
    const currTarget2 = spr1.createClone();
    const otherTarget2 = spr2.createClone();

    vm.runtime.targets = [otherTarget2, currTarget2];
    vm.editingTarget = currTarget2;

    expect(vm.runtime.targets.length).toBe(2);
    vm.deleteSprite(currTarget2.id);
    expect(vm.editingTarget.id).toBe(otherTarget2.id);
    expect(vm.runtime.targets.length).toBe(1);

    t.end();
});

test('duplicateSprite throws when there is no target with given id', t => {
    const vm = new VirtualMachine();
    vm.runtime.targets = [{
        id: 'id',
        isSprite: () => true,
        sprite: {
            name: 'this name'
        }
    }];
    expect((() => vm.duplicateSprite('id1'))).toThrowError(new Error('No target with the provided id'));
    t.end();
});

test('duplicateSprite throws when used on a non-sprite target', t => {
    const vm = new VirtualMachine();
    vm.runtime.targets = [{
        id: 'id',
        isSprite: () => false
    }];
    expect((() => vm.duplicateSprite('id'))).toThrowError(new Error('Cannot duplicate non-sprite targets.'));
    t.end();
});

test('duplicateSprite throws when there is no sprite for the given target', t => {
    const vm = new VirtualMachine();
    vm.runtime.targets = [{
        id: 'id',
        isSprite: () => true,
        sprite: null
    }];
    expect((() => vm.duplicateSprite('id'))).toThrowError(new Error('No sprite associated with this target.'));
    t.end();
});

test('duplicateSprite duplicates a sprite when given id is associated with known sprite', t => {
    const vm = new VirtualMachine();
    const spr = new Sprite(null, vm.runtime);
    const currTarget = spr.createClone();
    vm.editingTarget = currTarget;

    vm.emitWorkspaceUpdate = () => null;

    vm.runtime.targets = [currTarget];
    expect(vm.runtime.targets.length).toBe(1);
    vm.duplicateSprite(currTarget.id).then(() => {
        expect(vm.runtime.targets.length).toBe(2);
        t.end();
    });

});

test('duplicateSprite assigns duplicated sprite a fresh name', t => {
    const vm = new VirtualMachine();
    const spr = new Sprite(null, vm.runtime);
    spr.name = 'sprite1';
    const currTarget = spr.createClone();
    vm.editingTarget = currTarget;

    vm.emitWorkspaceUpdate = () => null;

    vm.runtime.targets = [currTarget];
    expect(vm.runtime.targets.length).toBe(1);
    vm.duplicateSprite(currTarget.id).then(() => {
        expect(vm.runtime.targets.length).toBe(2);
        expect(vm.runtime.targets[0].sprite.name).toBe('sprite1');
        expect(vm.runtime.targets[1].sprite.name).toBe('sprite2');
        t.end();
    });

});

test('reorderCostume', t => {
    const vm = new VirtualMachine();
    vm.emitTargetsUpdate = () => {};

    const spr = new Sprite(null, vm.runtime);
    spr.name = 'foo';
    const target = spr.createClone();

    // Stub out reorder on target, tested in rendered-target tests.
    // Just want to know if it is called with the right params.
    let costumeIndex = null;
    let newIndex = null;
    target.reorderCostume = (_costumeIndex, _newIndex) => {
        costumeIndex = _costumeIndex;
        newIndex = _newIndex;
        return true; // Do not need all the logic about if a reorder occurred.
    };

    vm.runtime.targets = [target];

    expect(vm.reorderCostume('not-a-target', 0, 3)).toBe(false);
    expect(costumeIndex).toBe(null);
    expect(newIndex).toBe(null);

    expect(vm.reorderCostume(target.id, 0, 3)).toBe(true);
    expect(costumeIndex).toBe(0);
    expect(newIndex).toBe(3);

    t.end();
});

test('reorderSound', t => {
    const vm = new VirtualMachine();
    vm.emitTargetsUpdate = () => {};

    const spr = new Sprite(null, vm.runtime);
    spr.name = 'foo';
    const target = spr.createClone();

    // Stub out reorder on target, tested in rendered-target tests.
    // Just want to know if it is called with the right params.
    let soundIndex = null;
    let newIndex = null;
    target.reorderSound = (_soundIndex, _newIndex) => {
        soundIndex = _soundIndex;
        newIndex = _newIndex;
        return true; // Do not need all the logic about if a reorder occurred.
    };

    vm.runtime.targets = [target];

    expect(vm.reorderSound('not-a-target', 0, 3)).toBe(false);
    expect(soundIndex).toBe(null); // Make sure reorder function was not called somehow.
    expect(newIndex).toBe(null);

    expect(vm.reorderSound(target.id, 0, 3)).toBe(true);
    expect(soundIndex).toBe(0); // Make sure reorder function was called correctly.
    expect(newIndex).toBe(3);

    t.end();
});

test('shareCostumeToTarget', t => {
    const vm = new VirtualMachine();
    const spr1 = new Sprite(null, vm.runtime);
    spr1.name = 'foo';
    const target1 = spr1.createClone();
    const costume1 = {name: 'costume1'};
    target1.addCostume(costume1);

    const spr2 = new Sprite(null, vm.runtime);
    spr2.name = 'foo';
    const target2 = spr2.createClone();
    const costume2 = {name: 'another costume'};
    target2.addCostume(costume2);

    vm.runtime.targets = [target1, target2];
    vm.editingTarget = vm.runtime.targets[0];
    vm.emitWorkspaceUpdate = () => null;

    vm.shareCostumeToTarget(0, target2.id).then(() => {
        expect(target2.currentCostume).toBe(1);
        expect(target2.getCostumes()[1].name).toBe('costume1');
        t.end();
    });
});

test('shareSoundToTarget', t => {
    const vm = new VirtualMachine();
    const spr1 = new Sprite(null, vm.runtime);
    spr1.name = 'foo';
    const target1 = spr1.createClone();
    const sound1 = {name: 'sound1'};
    target1.addSound(sound1);

    const spr2 = new Sprite(null, vm.runtime);
    spr2.name = 'foo';
    const target2 = spr2.createClone();
    const sound2 = {name: 'another sound'};
    target2.addSound(sound2);

    vm.runtime.targets = [target1, target2];
    vm.editingTarget = vm.runtime.targets[0];
    vm.emitWorkspaceUpdate = () => null;

    vm.shareSoundToTarget(0, target2.id).then(() => {
        expect(target2.getSounds()[1].name).toBe('sound1');
        t.end();
    });
});

test('reorderTarget', t => {
    const vm = new VirtualMachine();
    vm.emitTargetsUpdate = () => {};

    vm.runtime.targets = ['a', 'b', 'c', 'd'];

    expect(vm.reorderTarget(2, 2)).toBe(false);
    expect(vm.runtime.targets).toEqual(['a', 'b', 'c', 'd']);

    // Make sure clamping works
    expect(vm.reorderTarget(-100, -5)).toBe(false);
    expect(vm.runtime.targets).toEqual(['a', 'b', 'c', 'd']);

    // Reorder upwards
    expect(vm.reorderTarget(0, 2)).toBe(true);
    expect(vm.runtime.targets).toEqual(['b', 'c', 'a', 'd']);

    // Reorder downwards
    expect(vm.reorderTarget(3, 1)).toBe(true);
    expect(vm.runtime.targets).toEqual(['b', 'd', 'c', 'a']);

    t.end();
});

test('emitWorkspaceUpdate', t => {
    const vm = new VirtualMachine();
    const blocksToXML = comments => {
        let blockString = 'blocks\n';
        if (comments) {
            for (const commentId in comments) {
                const comment = comments[commentId];
                blockString += `A Block Comment: ${comment.toXML()}`;
            }

        }
        return blockString;
    };
    vm.runtime.targets = [
        {
            isStage: true,
            variables: {
                global: {
                    toXML: () => 'global'
                }
            },
            blocks: {
                toXML: blocksToXML
            },
            comments: {
                aStageComment: {
                    toXML: () => 'aStageComment',
                    blockId: null
                }
            }
        }, {
            variables: {
                unused: {
                    toXML: () => 'unused'
                }
            },
            blocks: {
                toXML: blocksToXML
            },
            comments: {
                someBlockComment: {
                    toXML: () => 'someBlockComment',
                    blockId: 'someBlockId'
                }
            }
        }, {
            variables: {
                local: {
                    toXML: () => 'local'
                }
            },
            blocks: {
                toXML: blocksToXML
            },
            comments: {
                someOtherComment: {
                    toXML: () => 'someOtherComment',
                    blockId: null
                },
                aBlockComment: {
                    toXML: () => 'aBlockComment',
                    blockId: 'a block'
                }
            }
        }
    ];
    vm.editingTarget = vm.runtime.targets[2];

    let xml = null;
    vm.emit = (event, data) => (xml = data.xml);
    vm.emitWorkspaceUpdate();
    expect(xml.indexOf('global')).not.toBe(-1);
    expect(xml.indexOf('local')).not.toBe(-1);
    expect(xml.indexOf('unused')).toBe(-1);
    expect(xml.indexOf('blocks')).not.toBe(-1);
    expect(xml.indexOf('aStageComment')).toBe(-1);
    expect(xml.indexOf('someBlockComment')).toBe(-1);
    expect(xml.indexOf('someOtherComment')).not.toBe(-1);
    expect(xml.indexOf('A Block Comment: aBlockComment')).not.toBe(-1);
    t.end();
});

test('drag IO redirect', t => {
    const vm = new VirtualMachine();
    const sprite1Info = [];
    const sprite2Info = [];
    vm.runtime.targets = [
        {
            id: 'sprite1',
            postSpriteInfo: data => sprite1Info.push(data)
        }, {
            id: 'sprite2',
            postSpriteInfo: data => sprite2Info.push(data),
            startDrag: () => {},
            stopDrag: () => {}
        }
    ];
    vm.editingTarget = vm.runtime.targets[0];
    // Stub emitWorkspace/TargetsUpdate, it needs data we don't care about here
    vm.emitWorkspaceUpdate = () => null;
    vm.emitTargetsUpdate = () => null;

    // postSpriteInfo should go to the editing target by default``
    vm.postSpriteInfo('sprite1 info');
    expect(sprite1Info[0]).toBe('sprite1 info');

    // postSprite info goes to the drag target if it exists
    vm.startDrag('sprite2');
    vm.postSpriteInfo('sprite2 info');
    expect(sprite2Info[0]).toBe('sprite2 info');

    // stop drag should set the editing target
    vm.stopDrag('sprite2');
    expect(vm.editingTarget.id).toBe('sprite2');

    // Then postSpriteInfo should continue posting to the new editing target
    vm.postSpriteInfo('sprite2 info 2');
    expect(sprite2Info[1]).toBe('sprite2 info 2');
    t.end();
});

test('select original after dragging clone', t => {
    const vm = new VirtualMachine();
    let newEditingTargetId = null;
    vm.setEditingTarget = id => {
        newEditingTargetId = id;
    };
    vm.runtime.targets = [
        {
            id: 'sprite1_clone',
            sprite: {clones: [{id: 'sprite1_original'}]},
            stopDrag: () => {}
        }, {
            id: 'sprite2',
            stopDrag: () => {}
        }
    ];

    // Stop drag on a bare target selects that target
    vm.stopDrag('sprite2');
    expect(newEditingTargetId).toBe('sprite2');

    // Stop drag on target with parent sprite selects the 0th clone of that sprite
    vm.stopDrag('sprite1_clone');
    expect(newEditingTargetId).toBe('sprite1_original');
    t.end();
});

test('setVariableValue', t => {
    const vm = new VirtualMachine();
    const spr = new Sprite(null, vm.runtime);
    const target = spr.createClone();
    target.createVariable('a-variable', 'a-name', Variable.SCALAR_TYPE);

    vm.runtime.targets = [target];

    // Returns false if there is no variable to set
    expect(vm.setVariableValue(target.id, 'not-a-variable', 100)).toBe(false);

    // Returns false if there is no target with that id
    expect(vm.setVariableValue('not-a-target', 'a-variable', 100)).toBe(false);

    // Returns true and updates the value if variable is present
    expect(vm.setVariableValue(target.id, 'a-variable', 100)).toBe(true);
    expect(target.lookupVariableById('a-variable').value).toBe(100);

    t.end();
});

test('setVariableValue requests update for cloud variable', t => {
    const vm = new VirtualMachine();
    const spr = new Sprite(null, vm.runtime);
    const target = spr.createClone();
    target.isStage = true;
    target.createVariable('a-variable', 'a-name', Variable.SCALAR_TYPE, true /* isCloud */);

    vm.runtime.targets = [target];

    // Mock cloud io device requestUpdateVariable function
    let requestUpdateVarWasCalled = false;
    let varName;
    let varValue;
    vm.runtime.ioDevices.cloud.requestUpdateVariable = (name, value) => {
        requestUpdateVarWasCalled = true;
        varName = name;
        varValue = value;
    };

    vm.setVariableValue(target.id, 'not-a-variable', 100);
    expect(requestUpdateVarWasCalled).toBe(false);

    vm.setVariableValue(target.id, 'a-variable', 100);
    expect(requestUpdateVarWasCalled).toBe(true);
    expect(varName).toBe('a-name');
    expect(varValue).toBe(100);

    t.end();
});

test('getVariableValue', t => {
    const vm = new VirtualMachine();
    const spr = new Sprite(null, vm.runtime);
    const target = spr.createClone();
    target.createVariable('a-variable', 'a-name', Variable.SCALAR_TYPE);

    vm.runtime.targets = [target];

    // Returns null if there is no variable with that id
    expect(vm.getVariableValue(target.id, 'not-a-variable')).toBe(null);

    // Returns null if there is no target with that id
    expect(vm.getVariableValue('not-a-target', 'a-variable')).toBe(null);

    // Returns true and updates the value if variable is present
    expect(vm.getVariableValue(target.id, 'a-variable')).toBe(0);
    vm.setVariableValue(target.id, 'a-variable', 'string');
    expect(vm.getVariableValue(target.id, 'a-variable')).toBe('string');

    t.end();
});

// Block Listener tests for comment
test('comment_create event updates comment with null position', t => {
    const vm = new VirtualMachine();
    const spr = new Sprite(null, vm.runtime);
    const target = spr.createClone();

    target.createComment('a comment', null, 'some text',
        null, null, 200, 300, false);
    vm.runtime.targets = [target];
    vm.editingTarget = target;
    vm.runtime.setEditingTarget(target);

    const comment = target.comments['a comment'];
    expect(comment.x).toBe(null);
    expect(comment.y).toBe(null);

    vm.blockListener(events.createcommentUpdatePosition);

    expect(comment.x).toBe(10);
    expect(comment.y).toBe(20);

    t.end();
});

test('shareBlocksToTarget shares global variables without any name changes', t => {
    const vm = new VirtualMachine();
    const runtime = vm.runtime;
    const spr1 = new Sprite(null, runtime);
    const stage = spr1.createClone();
    stage.isStage = true;

    const spr2 = new Sprite(null, runtime);
    const target = spr2.createClone();

    runtime.targets = [stage, target];
    vm.editingTarget = target;
    vm.runtime.setEditingTarget(target);

    stage.createVariable('mock var id', 'a mock variable', Variable.SCALAR_TYPE);
    expect(Object.keys(target.variables).length).toBe(0);
    expect(Object.keys(stage.variables).length).toBe(1);
    expect(stage.variables['mock var id'].name).toBe('a mock variable');


    vm.setVariableValue(stage.id, 'mock var id', 10);
    expect(vm.getVariableValue(stage.id, 'mock var id')).toBe(10);

    target.blocks.createBlock(adapter(events.mockVariableBlock)[0]);

    // Verify the block exists on the target, and that it references the global variable
    expect(typeof target.blocks.getBlock('a block')).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields.VARIABLE).toBe('object');
    expect(target.blocks.getBlock('a block').fields.VARIABLE.id).toBe('mock var id');

    // Verify that the block does not exist on the stage
    expect(typeof stage.blocks.getBlock('a block')).toBe('undefined');

    // Share the block to the stage
    vm.shareBlocksToTarget([target.blocks.getBlock('a block')], stage.id, target.id).then(() => {

        // Verify that the block now exists on the target as well as the stage
        expect(typeof target.blocks.getBlock('a block')).toBe('object');
        expect(typeof target.blocks.getBlock('a block').fields).toBe('object');
        expect(typeof target.blocks.getBlock('a block').fields.VARIABLE).toBe('object');
        expect(target.blocks.getBlock('a block').fields.VARIABLE.id).toBe('mock var id');

        const newBlockId = Object.keys(stage.blocks._blocks)[0];
        expect(typeof stage.blocks.getBlock(newBlockId)).toBe('object');
        expect(typeof stage.blocks.getBlock(newBlockId).fields).toBe('object');
        expect(typeof stage.blocks.getBlock(newBlockId).fields.VARIABLE).toBe('object');
        expect(stage.blocks.getBlock(newBlockId).fields.VARIABLE.id).toBe('mock var id');

        // Verify the shared block id is different
        expect(newBlockId).not.toBe('a block');

        // Verify that the variables haven't changed, the variable still exists on the
        // stage, it should still have the same name and value, and there should be
        // no variables on the target.
        expect(Object.keys(target.variables).length).toBe(0);
        expect(Object.keys(stage.variables).length).toBe(1);
        expect(stage.variables['mock var id'].name).toBe('a mock variable');
        expect(vm.getVariableValue(stage.id, 'mock var id')).toBe(10);

        t.end();
    });
});

test('shareBlocksToTarget shares a local variable to the stage, creating a global variable with a new name', t => {
    const vm = new VirtualMachine();
    const runtime = vm.runtime;
    const spr1 = new Sprite(null, runtime);
    const stage = spr1.createClone();
    stage.isStage = true;

    const spr2 = new Sprite(null, runtime);
    const target = spr2.createClone();

    runtime.targets = [stage, target];
    vm.editingTarget = target;
    vm.runtime.setEditingTarget(target);

    target.createVariable('mock var id', 'a mock variable', Variable.SCALAR_TYPE);
    expect(Object.keys(stage.variables).length).toBe(0);
    expect(Object.keys(target.variables).length).toBe(1);
    expect(target.variables['mock var id'].name).toBe('a mock variable');


    vm.setVariableValue(target.id, 'mock var id', 10);
    expect(vm.getVariableValue(target.id, 'mock var id')).toBe(10);

    target.blocks.createBlock(adapter(events.mockVariableBlock)[0]);

    // Verify the block exists on the target, and that it references the global variable
    expect(typeof target.blocks.getBlock('a block')).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields.VARIABLE).toBe('object');
    expect(target.blocks.getBlock('a block').fields.VARIABLE.id).toBe('mock var id');

    // Verify that the block does not exist on the stage
    expect(typeof stage.blocks.getBlock('a block')).toBe('undefined');

    // Share the block to the stage
    vm.shareBlocksToTarget([target.blocks.getBlock('a block')], stage.id, target.id).then(() => {
        // Verify that the block still exists on the target and remains unchanged
        expect(typeof target.blocks.getBlock('a block')).toBe('object');
        expect(typeof target.blocks.getBlock('a block').fields).toBe('object');
        expect(typeof target.blocks.getBlock('a block').fields.VARIABLE).toBe('object');
        expect(target.blocks.getBlock('a block').fields.VARIABLE.id).toBe('mock var id');

        const newBlockId = Object.keys(stage.blocks._blocks)[0];
        expect(typeof stage.blocks.getBlock(newBlockId)).toBe('object');
        expect(typeof stage.blocks.getBlock(newBlockId).fields).toBe('object');
        expect(typeof stage.blocks.getBlock(newBlockId).fields.VARIABLE).toBe('object');
        expect(stage.blocks.getBlock(newBlockId).fields.VARIABLE.id).toBe('StageVarFromLocal_mock var id');

        // Verify that a new global variable was created, the old one still exists on
        // the target and still has the same name and value, and the new one has
        // a new name and value 0.
        expect(Object.keys(target.variables).length).toBe(1);
        expect(target.variables['mock var id'].name).toBe('a mock variable');
        expect(vm.getVariableValue(target.id, 'mock var id')).toBe(10);

        // Verify that a new variable was created on the stage, with a new name and new id
        expect(Object.keys(stage.variables).length).toBe(1);
        expect(typeof stage.variables['mock var id']).toBe('undefined');
        const newGlobalVar = Object.values(stage.variables)[0];
        expect(newGlobalVar.name).toBe('Stage: a mock variable');
        const newId = newGlobalVar.id;
        expect(newId).not.toBe('mock var id');
        expect(vm.getVariableValue(stage.id, newId)).toBe(0);

        t.end();
    });
});

test('shareBlocksToTarget chooses a fresh name for a new global variable checking for conflicts on all sprites', t => {
    const vm = new VirtualMachine();
    const runtime = vm.runtime;
    const spr1 = new Sprite(null, runtime);
    const stage = spr1.createClone();
    stage.isStage = true;

    const spr2 = new Sprite(null, runtime);
    const target = spr2.createClone();

    const spr3 = new Sprite(null, runtime);
    const otherTarget = spr3.createClone();

    runtime.targets = [stage, target, otherTarget];
    vm.editingTarget = target;
    vm.runtime.setEditingTarget(target);

    target.createVariable('mock var id', 'a mock variable', Variable.SCALAR_TYPE);
    expect(Object.keys(stage.variables).length).toBe(0);
    expect(Object.keys(target.variables).length).toBe(1);
    expect(target.variables['mock var id'].name).toBe('a mock variable');


    vm.setVariableValue(target.id, 'mock var id', 10);
    expect(vm.getVariableValue(target.id, 'mock var id')).toBe(10);

    target.blocks.createBlock(adapter(events.mockVariableBlock)[0]);

    // Verify the block exists on the target, and that it references the global variable
    expect(typeof target.blocks.getBlock('a block')).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields.VARIABLE).toBe('object');
    expect(target.blocks.getBlock('a block').fields.VARIABLE.id).toBe('mock var id');

    // Verify that the block does not exist on the stage
    expect(typeof stage.blocks.getBlock('a block')).toBe('undefined');

    // Create a variable that conflicts with what will be the new name for the
    // new global variable to ensure a fresh name is chosen
    otherTarget.createVariable('a different var', 'Stage: a mock variable', Variable.SCALAR_TYPE);

    // Share the block to the stage
    vm.shareBlocksToTarget([target.blocks.getBlock('a block')], stage.id, target.id).then(() => {
        // Verify that the block still exists on the target and remains unchanged
        expect(typeof target.blocks.getBlock('a block')).toBe('object');
        expect(typeof target.blocks.getBlock('a block').fields).toBe('object');
        expect(typeof target.blocks.getBlock('a block').fields.VARIABLE).toBe('object');
        expect(target.blocks.getBlock('a block').fields.VARIABLE.id).toBe('mock var id');

        const newBlockId = Object.keys(stage.blocks._blocks)[0];
        expect(typeof stage.blocks.getBlock(newBlockId)).toBe('object');
        expect(typeof stage.blocks.getBlock(newBlockId).fields).toBe('object');
        expect(typeof stage.blocks.getBlock(newBlockId).fields.VARIABLE).toBe('object');
        expect(stage.blocks.getBlock(newBlockId).fields.VARIABLE.id).toBe('StageVarFromLocal_mock var id');

        // Verify that a new global variable was created, the old one still exists on
        // the target and still has the same name and value, and the new one has
        // a new name and value 0.
        expect(Object.keys(target.variables).length).toBe(1);
        expect(target.variables['mock var id'].name).toBe('a mock variable');
        expect(vm.getVariableValue(target.id, 'mock var id')).toBe(10);

        // Verify that a new variable was created on the stage, with a new name and new id
        expect(Object.keys(stage.variables).length).toBe(1);
        expect(typeof stage.variables['mock var id']).toBe('undefined');
        const newGlobalVar = Object.values(stage.variables)[0];
        expect(newGlobalVar.name).toBe('Stage: a mock variable2');
        const newId = newGlobalVar.id;
        expect(newId).not.toBe('mock var id');
        expect(vm.getVariableValue(stage.id, newId)).toBe(0);

        t.end();
    });
});

test('shareBlocksToTarget loads extensions that have not yet been loaded', t => {
    const vm = new VirtualMachine();
    const runtime = vm.runtime;
    const spr1 = new Sprite(null, runtime);
    const stage = spr1.createClone();
    runtime.targets = [stage];

    const fakeBlocks = [
        {opcode: 'loaded_fakeblock'},
        {opcode: 'notloaded_fakeblock'}
    ];

    // Stub the extension manager
    const loadedIds = [];
    vm.extensionManager = {
        isExtensionLoaded: id => id === 'loaded',
        loadExtensionURL: id => new Promise(resolve => {
            loadedIds.push(id);
            resolve();
        })
    };

    vm.shareBlocksToTarget(fakeBlocks, stage.id).then(() => {
        // Verify that only the not-loaded extension gets loaded
        expect(loadedIds).toEqual(['notloaded']);
        t.end();
    });
});

test('Setting turbo mode emits events', t => {
    let turboMode = null;

    const vm = new VirtualMachine();

    vm.addListener('TURBO_MODE_ON', () => {
        turboMode = true;
    });
    vm.addListener('TURBO_MODE_OFF', () => {
        turboMode = false;
    });

    vm.setTurboMode(true);
    expect(turboMode).toBe(true);

    vm.setTurboMode(false);
    expect(turboMode).toBe(false);

    t.end();
});

test('Getting the renderer returns the renderer', t => {
    const renderer = new Renderer();
    const vm = new VirtualMachine();
    vm.attachRenderer(renderer);
    expect(vm.renderer).toBe(renderer);
    t.end();
});

test('Starting the VM emits an event', t => {
    let started = false;
    const vm = new VirtualMachine();
    vm.addListener('RUNTIME_STARTED', () => {
        started = true;
    });
    vm.start();
    expect(started).toBe(true);
    vm.quit();
    t.end();
});

test('vm.greenFlag() emits a PROJECT_START event', t => {
    let greenFlagged = false;
    const vm = new VirtualMachine();
    vm.addListener('PROJECT_START', () => {
        greenFlagged = true;
    });
    vm.greenFlag();
    expect(greenFlagged).toBe(true);
    t.end();
});

test('toJSON encodes Infinity/NaN as 0, not null', t => {
    const vm = new VirtualMachine();
    const runtime = vm.runtime;
    const spr1 = new Sprite(null, runtime);
    const stage = spr1.createClone();
    stage.isStage = true;
    stage.volume = Infinity;
    stage.tempo = NaN;
    stage.createVariable('id1', 'name1', '');
    stage.variables.id1.value = Infinity;
    stage.createVariable('id2', 'name2', '');
    stage.variables.id1.value = -Infinity;
    stage.createVariable('id3', 'name3', '');
    stage.variables.id1.value = NaN;

    runtime.targets = [stage];

    const json = JSON.parse(vm.toJSON());
    expect(json.targets[0].volume).toBe(0);
    expect(json.targets[0].tempo).toBe(0);
    expect(json.targets[0].variables.id1[1]).toBe(0);
    expect(json.targets[0].variables.id2[1]).toBe(0);
    expect(json.targets[0].variables.id3[1]).toBe(0);

    t.end();
});

test('clearFlyoutBlocks removes all of the flyout blocks', t => {
    const vm = new VirtualMachine();
    const flyoutBlocks = vm.runtime.flyoutBlocks;

    flyoutBlocks.createBlock(adapter(events.mockVariableBlock)[0]);
    expect(Object.keys(flyoutBlocks._blocks).length).toBe(1);

    vm.clearFlyoutBlocks();
    expect(Object.keys(flyoutBlocks._blocks).length).toBe(0);

    t.end();
});
