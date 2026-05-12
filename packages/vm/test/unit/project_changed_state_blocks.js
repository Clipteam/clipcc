import {test} from '../fixtures/jest-tap-bridge.js';
import path from 'path';
import {readFileToBuffer} from '../fixtures/readProjectFile.js';
import makeTestStorage from '../fixtures/make-test-storage.js';
import VirtualMachine from '../../src/virtual-machine.js';

let vm;
let projectChanged;
let blockContainer;

beforeEach(() => {
    const projectUri = path.resolve(__dirname, '../fixtures/default.sb2');
    const project = readFileToBuffer(projectUri);

    vm = new VirtualMachine();

    vm.runtime.addListener('PROJECT_CHANGED', () => {
        projectChanged = true;
    });

    vm.attachStorage(makeTestStorage());
    return vm.loadProject(project).then(() => {
        blockContainer = vm.editingTarget.blocks;

        // Add mock blocks to use for tests
        blockContainer.createBlock({
            id: 'a parent block',
            opcode: 'my_testParentBlock',
            fields: {},
            inputs: {}
        });


        blockContainer.createBlock({
            id: 'a new block',
            opcode: 'my_testBlock',
            topLevel: true,
            x: -10,
            y: 35,
            fields: {
                A_FIELD: {
                    name: 'A_FIELD',
                    value: 10
                }
            },
            inputs: {},
            parent: 'a block'
        });

        // Reset project changes from new blocks
        projectChanged = false;

    });
});

test('Creating a block should emit a project changed event', t => {
    blockContainer.createBlock({
        id: 'another block',
        opcode: 'my_testBlock',
        topLevel: true
    });

    t.equal(projectChanged, true);
    t.end();
});

test('Deleting a block should emit a project changed event', t => {
    blockContainer.deleteBlock('a new block');

    t.equal(projectChanged, true);
    t.end();
});

test('Changing a block should emit a project changed event', t => {
    blockContainer.changeBlock({
        element: 'field',
        id: 'a new block',
        name: 'A_FIELD',
        value: 300
    });

    t.equal(projectChanged, true);
    projectChanged = false;

    blockContainer.changeBlock({
        element: 'checkbox',
        id: 'a new block',
        value: true
    });

    t.equal(projectChanged, true);
    projectChanged = false;

    blockContainer.changeBlock({
        element: 'mutation',
        id: 'a new block',
        value: '{"someMutationAttribute": "someValue"}'
    });

    t.equal(projectChanged, true);

    t.end();
});

test('Moving a block to a new position should emit a project changed event', t => {
    blockContainer.moveBlock({
        id: 'a new block',
        newCoordinate: {
            x: -40,
            y: 350
        }
    });

    t.equal(projectChanged, true);
    t.end();
});

test('Connecting a block to a new parent should emit a project changed event', t => {
    blockContainer.createBlock({
        id: 'another block',
        opcode: 'my_testBlock'
    });

    projectChanged = false;

    blockContainer.moveBlock({
        id: 'a new block',
        newParent: 'another block'
    });

    t.equal(projectChanged, true);
    t.end();
});

test('Disconnecting a block from another should emit a project changed event', t => {
    blockContainer.moveBlock({
        id: 'a new block',
        oldParent: 'a parent block'
    });

    t.equal(projectChanged, true);
    t.end();
});

test('Creating a local variable should emit a project changed event', t => {
    blockContainer.blocklyListen({
        type: 'var_create',
        varId: 'a new variable',
        varName: 'foo',
        varType: '',
        isLocal: true,
        isCloud: false
    });

    t.equal(projectChanged, true);

    projectChanged = false;

    // Creating the same variable twice should not emit a project changed event
    blockContainer.blocklyListen({
        type: 'var_create',
        varId: 'a new variable',
        varName: 'foo',
        varType: '',
        isLocal: true,
        isCloud: false
    });

    t.equal(projectChanged, false);

    t.end();
});

test('Creating a global variable should emit a project changed event', t => {
    blockContainer.blocklyListen({
        type: 'var_create',
        varId: 'a new variable',
        varName: 'foo',
        varType: '',
        isLocal: false,
        isCloud: false
    });

    t.equal(projectChanged, true);

    projectChanged = false;

    // Creating the same variable twice should not emit a project changed event
    blockContainer.blocklyListen({
        type: 'var_create',
        varId: 'a new variable',
        varName: 'foo',
        varType: '',
        isLocal: false,
        isCloud: false
    });

    t.equal(projectChanged, false);

    t.end();
});

test('Renaming a variable should emit a project changed event', t => {
    blockContainer.blocklyListen({
        type: 'var_create',
        varId: 'a new variable',
        varName: 'foo',
        varType: '',
        isLocal: false,
        isCloud: false
    });

    projectChanged = false;

    blockContainer.blocklyListen({
        type: 'var_rename',
        varId: 'a new variable',
        oldName: 'foo',
        newName: 'bar'
    });

    t.equal(projectChanged, true);
    t.end();
});

test('Deleting a variable should emit a project changed event', t => {
    blockContainer.blocklyListen({
        type: 'var_create',
        varId: 'a new variable',
        varName: 'foo',
        varType: '',
        isLocal: false,
        isCloud: false
    });

    projectChanged = false;

    blockContainer.blocklyListen({
        type: 'var_delete',
        varId: 'a new variable',
        varName: 'foo',
        varType: '',
        isLocal: false,
        isCloud: false
    });

    t.equal(projectChanged, true);
    t.end();
});

test('Creating a block comment should emit a project changed event', t => {
    blockContainer.blocklyListen({
        type: 'block_comment_create',
        blockId: 'a new block',
        commentId: 'a new comment'
    });
    blockContainer.blocklyListen({
        type: 'change',
        blockId: 'a new block',
        element: 'comment',
        name: 'a new comment',
        newValue: 'comment'
    });

    t.equal(projectChanged, true);
    t.end();
});

test('Creating a workspace comment should emit a project changed event', t => {
    blockContainer.blocklyListen({
        type: 'comment_create',
        commentId: 'a new comment',
        json: {
            height: 250,
            width: 400,
            x: -40,
            y: 27,
            collapsed: false,
            text: 'comment'
        }
    });

    t.equal(projectChanged, true);
    t.end();
});

test('Changing a workspace comment should emit a project changed event', t => {
    blockContainer.blocklyListen({
        type: 'comment_create',
        commentId: 'a new comment',
        json: {
            height: 250,
            width: 400,
            x: -40,
            y: 27,
            collapsed: false,
            text: 'comment'
        }
    });

    projectChanged = false;

    blockContainer.blocklyListen({
        type: 'comment_collapse',
        commentId: 'a new comment',
        newCollapsed: true
    });

    t.equal(projectChanged, true);

    projectChanged = false;

    blockContainer.blocklyListen({
        type: 'comment_resize',
        commentId: 'a new comment',
        newSize: {width: 300, height: 100},
        oldSize: {width: 200, height: 200}
    });

    t.equal(projectChanged, true);

    projectChanged = false;

    blockContainer.blocklyListen({
        type: 'comment_change',
        blockId: null,
        commentId: 'a new comment',
        newContents_: 'comment',
        oldContents_: 'commant'
    });

    t.equal(projectChanged, true);

    t.end();
});

test('Changing a block comment should emit a project changed event', t => {
    blockContainer.blocklyListen({
        type: 'block_comment_create',
        blockId: 'a new block',
        commentId: 'a new comment'
    });
    blockContainer.blocklyListen({
        type: 'change',
        element: 'comment',
        blockId: 'a new block',
        name: 'a new comment',
        newValue: ''
    });

    projectChanged = false;

    blockContainer.blocklyListen({
        type: 'change',
        element: 'comment',
        blockId: 'a new block',
        name: 'a new comment',
        newValue: 'comment',
        oldValue: ''
    });

    t.equal(projectChanged, true);

    projectChanged = false;

    blockContainer.blocklyListen({
        type: 'block_comment_resize',
        blockId: 'a new block',
        commentId: 'a new comment',
        newSize: {width: 300, height: 100},
        oldSize: {width: 200, height: 200}
    });

    t.equal(projectChanged, true);

    projectChanged = false;

    blockContainer.blocklyListen({
        type: 'block_comment_move',
        blockId: 'a new block',
        commentId: 'a new comment',
        newCoordinate_: {x: -35, y: 50},
        oldCoordinate_: {x: -40, y: 27}
    });

    t.equal(projectChanged, true);

    projectChanged = false;

    blockContainer.blocklyListen({
        type: 'block_comment_collapse',
        blockId: 'a new block',
        commentId: 'a new comment',
        newCollapsed: true
    });

    t.equal(projectChanged, true);
    t.end();
});

test('Attempting to change a comment that does not exist should not emit a project changed event', t => {
    blockContainer.blocklyListen({
        type: 'comment_change',
        blockId: null,
        commentId: 'a new comment',
        newContents_: 'comment',
        oldContents_: ''
    });
    blockContainer.blocklyListen({
        type: 'comment_resize',
        blockId: null,
        commentId: 'a new comment',
        newSize: {width: 300, height: 100},
        oldSize: {width: 200, height: 200}
    });
    blockContainer.blocklyListen({
        type: 'comment_move',
        blockId: null,
        commentId: 'a new comment',
        newCoordinate_: {x: -35, y: 50},
        oldCoordinate_: {x: -40, y: 27}
    });
    blockContainer.blocklyListen({
        type: 'comment_collapse',
        blockId: null,
        commentId: 'a new comment',
        newCollapsed: true
    });

    t.equal(projectChanged, false);
    t.end();
});

test('Deleting a block comment should emit a project changed event', t => {
    blockContainer.blocklyListen({
        type: 'block_comment_create',
        blockId: 'a new block',
        commentId: 'a new comment'
    });
    blockContainer.blocklyListen({
        type: 'change',
        element: 'comment',
        blockId: 'a new block',
        name: 'a new comment',
        newValue: ''
    });

    projectChanged = false;

    blockContainer.blocklyListen({
        type: 'block_comment_delete',
        blockId: 'a new block',
        commentId: 'a new comment'
    });
    blockContainer.blocklyListen({
        type: 'change',
        element: 'comment',
        blockId: 'a new block',
        name: 'a new comment',
        newValue: null
    });

    t.equal(projectChanged, true);
    t.end();
});

test('Deleting a workspace comment should emit a project changed event', t => {
    blockContainer.blocklyListen({
        type: 'comment_create',
        commentId: 'a new comment',
        json: {
            height: 250,
            width: 400,
            x: -40,
            y: 27,
            collapsed: false,
            text: 'comment'
        }
    });

    projectChanged = false;

    blockContainer.blocklyListen({
        type: 'comment_delete',
        commentId: 'a new comment',
        json: {
            height: 250,
            width: 400,
            x: -40,
            y: 27,
            collapsed: false,
            text: 'comment'
        }
    });

    t.equal(projectChanged, true);
    t.end();
});

test('Deleting a comment that does not exist should not emit a project changed event', t => {
    blockContainer.blocklyListen({
        type: 'comment_delete',
        commentId: 'a new comment',
        json: {
            height: 250,
            width: 400,
            x: -40,
            y: 27,
            collapsed: false,
            text: 'comment'
        }
    });

    t.equal(projectChanged, false);
    t.end();
});

test('Moving a comment should emit a project changed event', t => {
    blockContainer.blocklyListen({
        type: 'comment_create',
        blockId: null,
        commentId: 'a new comment',
        json: {
            height: 250,
            width: 400,
            x: -40,
            y: 27,
            collapsed: false,
            text: 'comment'
        }
    });

    projectChanged = false;

    blockContainer.blocklyListen({
        type: 'comment_move',
        commentId: 'a new comment',
        newCoordinate_: {x: -35, y: 50},
        oldCoordinate_: {x: -40, y: 27}
    });

    t.equal(projectChanged, true);
    t.end();
});
