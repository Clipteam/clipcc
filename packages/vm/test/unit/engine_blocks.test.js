const Blocks = require('../../src/engine/blocks');
const Variable = require('../../src/engine/variable');
const adapter = require('../../src/engine/adapter');
const events = require('../fixtures/events.json');
const Runtime = require('../../src/engine/runtime');

test('spec', () => {
    const b = new Blocks(new Runtime());

    expect(typeof Blocks).toBe('function');
    expect(typeof b).toBe('object');
    expect(b instanceof Blocks).toBeTruthy();

    expect(typeof b._blocks).toBe('object');
    expect(typeof b._scripts).toBe('object');
    expect(Array.isArray(b._scripts)).toBeTruthy();

    expect(typeof b.createBlock).toBe('function');
    expect(typeof b.moveBlock).toBe('function');
    expect(typeof b.changeBlock).toBe('function');
    expect(typeof b.deleteBlock).toBe('function');
    expect(typeof b.getBlock).toBe('function');
    expect(typeof b.getScripts).toBe('function');
    expect(typeof b.getNextBlock).toBe('function');
    expect(typeof b.getBranch).toBe('function');
    expect(typeof b.getOpcode).toBe('function');
    expect(typeof b.mutationToXML).toBe('function');
    expect(typeof b.updateSensingOfReference).toBe('function');
});

// Getter tests
test('getBlock', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });
    const block = b.getBlock('foo');
    expect(typeof block).toBe('object');
    const notBlock = b.getBlock('?');
    expect(typeof notBlock).toBe('undefined');
});

test('getScripts', () => {
    const b = new Blocks(new Runtime());
    let scripts = b.getScripts();
    expect(typeof scripts).toBe('object');
    expect(scripts.length).toBe(0);
    // Create two top-level blocks and one not.
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });
    b.createBlock({
        id: 'foo2',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });
    b.createBlock({
        id: 'foo3',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: false
    });

    scripts = b.getScripts();
    expect(typeof scripts).toBe('object');
    expect(scripts.length).toBe(2);
    expect(scripts.indexOf('foo') > -1).toBeTruthy();
    expect(scripts.indexOf('foo2') > -1).toBeTruthy();
    expect(scripts.indexOf('foo3')).toBe(-1);
});

test('getNextBlock', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });

    let next = b.getNextBlock('foo');
    expect(next).toBe(null);

    // Add a block with "foo" as its next.
    b.createBlock({
        id: 'foo2',
        opcode: 'TEST_BLOCK',
        next: 'foo',
        fields: {},
        inputs: {},
        topLevel: true
    });

    next = b.getNextBlock('foo2');
    expect(next).toBe('foo');

    // Block that doesn't exist.
    const noBlock = b.getNextBlock('?');
    expect(noBlock).toBe(null);
});

test('getBranch', () => {
    const b = new Blocks(new Runtime());
    // Single branch
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {
            SUBSTACK: {
                name: 'SUBSTACK',
                block: 'foo2',
                shadow: null
            }
        },
        topLevel: true
    });
    b.createBlock({
        id: 'foo2',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: false
    });

    const branch = b.getBranch('foo');
    expect(branch).toBe('foo2');

    const notBranch = b.getBranch('?');
    expect(notBranch).toBe(null);
});

test('getBranch2', () => {
    const b = new Blocks(new Runtime());
    // Second branch
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {
            SUBSTACK: {
                name: 'SUBSTACK',
                block: 'foo2',
                shadow: null
            },
            SUBSTACK2: {
                name: 'SUBSTACK2',
                block: 'foo3',
                shadow: null
            }
        },
        topLevel: true
    });
    b.createBlock({
        id: 'foo2',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: false
    });
    b.createBlock({
        id: 'foo3',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: false
    });

    const branch1 = b.getBranch('foo', 1);
    const branch2 = b.getBranch('foo', 2);
    expect(branch1).toBe('foo2');
    expect(branch2).toBe('foo3');
});

test('getBranch with none', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });
    const noBranch = b.getBranch('foo');
    expect(noBranch).toBe(null);
});

test('getOpcode', () => {
    const b = new Blocks(new Runtime());
    const block = {
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    };
    b.createBlock(block);
    const opcode = b.getOpcode(block);
    expect(opcode).toBe('TEST_BLOCK');
    const undefinedBlock = b.getBlock('?');
    const undefinedOpcode = b.getOpcode(undefinedBlock);
    expect(undefinedOpcode).toBe(null);
});

test('mutationToXML', () => {
    const b = new Blocks(new Runtime());
    const testStringRaw = '"arbitrary" & \'complicated\' test string';
    const testStringEscaped = '\\&quot;arbitrary\\&quot; &amp; &apos;complicated&apos; test string';
    const mutation = {
        tagName: 'mutation',
        children: [],
        blockInfo: {
            text: testStringRaw
        }
    };
    const xml = b.mutationToXML(mutation);
    expect(xml).toBe(
        `<mutation blockInfo="{&quot;text&quot;:&quot;${testStringEscaped}&quot;}"></mutation>`
    );
});

// Block events tests
test('create', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });

    expect(typeof b._blocks.foo).toBe('object');
    expect(b._blocks.foo.opcode).toBe('TEST_BLOCK');
    expect(b._scripts.indexOf('foo')).not.toBe(-1);
});

test('move', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });
    b.createBlock({
        id: 'bar',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });

    // Attach 'bar' to the end of 'foo'
    b.moveBlock({
        id: 'bar',
        newParent: 'foo'
    });
    expect(b._scripts.length).toBe(1);
    expect(Object.keys(b._blocks).length).toBe(2);
    expect(b._blocks.foo.next).toBe('bar');

    // Detach 'bar' from 'foo'
    b.moveBlock({
        id: 'bar',
        oldParent: 'foo'
    });
    expect(b._scripts.length).toBe(2);
    expect(Object.keys(b._blocks).length).toBe(2);
    expect(b._blocks.foo.next).toBe(null);
});

test('move into empty', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });
    b.createBlock({
        id: 'bar',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });
    b.moveBlock({
        id: 'bar',
        newInput: 'fooInput',
        newParent: 'foo'
    });
    expect(b._blocks.foo.inputs.fooInput.block).toBe('bar');
});

test('move no obscure shadow', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {
            fooInput: {
                name: 'fooInput',
                block: 'x',
                shadow: 'y'
            }
        },
        topLevel: true
    });
    b.createBlock({
        id: 'bar',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });
    b.moveBlock({
        id: 'bar',
        newInput: 'fooInput',
        newParent: 'foo'
    });
    expect(b._blocks.foo.inputs.fooInput.block).toBe('bar');
    expect(b._blocks.foo.inputs.fooInput.shadow).toBe('y');
});

test('move - attaching new shadow', () => {
    const b = new Blocks(new Runtime());
    // Block/shadow are null to mimic state right after a procedure_call block
    // is mutated by adding an input. The "move" will attach the new shadow.
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {
            fooInput: {
                name: 'fooInput',
                block: null,
                shadow: null
            }
        },
        topLevel: true
    });
    b.createBlock({
        id: 'bar',
        opcode: 'TEST_BLOCK',
        shadow: true,
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });
    b.moveBlock({
        id: 'bar',
        newInput: 'fooInput',
        newParent: 'foo'
    });
    expect(b._blocks.foo.inputs.fooInput.block).toBe('bar');
    expect(b._blocks.foo.inputs.fooInput.shadow).toBe('bar');
});

test('change', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {
            someField: {
                name: 'someField',
                value: 'initial-value'
            }
        },
        inputs: {},
        topLevel: true
    });

    // Test that the field is updated
    expect(b._blocks.foo.fields.someField.value).toBe('initial-value');

    b.changeBlock({
        element: 'field',
        id: 'foo',
        name: 'someField',
        value: 'final-value'
    });

    expect(b._blocks.foo.fields.someField.value).toBe('final-value');

    // Invalid cases
    // No `element`
    b.changeBlock({
        id: 'foo',
        name: 'someField',
        value: 'invalid-value'
    });
    expect(b._blocks.foo.fields.someField.value).toBe('final-value');

    // No block ID
    b.changeBlock({
        element: 'field',
        name: 'someField',
        value: 'invalid-value'
    });
    expect(b._blocks.foo.fields.someField.value).toBe('final-value');

    // No such field
    b.changeBlock({
        element: 'field',
        id: 'foo',
        name: 'someWrongField',
        value: 'final-value'
    });
    expect(b._blocks.foo.fields.someField.value).toBe('final-value');
});

test('delete', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });
    b.deleteBlock('foo');

    expect(typeof b._blocks.foo).toBe('undefined');
    expect(b._scripts.indexOf('foo')).toBe(-1);
});

test('delete chain', () => {
    // Create a chain of connected blocks and delete the top one.
    // All of them should be deleted.
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: 'foo2',
        fields: {},
        inputs: {},
        topLevel: true
    });
    b.createBlock({
        id: 'foo2',
        opcode: 'TEST_BLOCK',
        next: 'foo3',
        fields: {},
        inputs: {},
        topLevel: false
    });
    b.createBlock({
        id: 'foo3',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: false
    });
    b.deleteBlock('foo');
    expect(typeof b._blocks.foo).toBe('undefined');
    expect(typeof b._blocks.foo2).toBe('undefined');
    expect(typeof b._blocks.foo3).toBe('undefined');
    expect(b._scripts.indexOf('foo')).toBe(-1);
    expect(Object.keys(b._blocks).length).toBe(0);
    expect(b._scripts.length).toBe(0);
});

test('delete inputs', () => {
    // Create a block with two inputs, one of which has its own input.
    // Delete the block - all of them should be deleted.
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {
            input1: {
                name: 'input1',
                block: 'foo2',
                shadow: 'foo2'
            },
            SUBSTACK: {
                name: 'SUBSTACK',
                block: 'foo3',
                shadow: null
            }
        },
        topLevel: true
    });
    b.createBlock({
        id: 'foo2',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: false
    });
    b.createBlock({
        id: 'foo5',
        opcode: 'TEST_OBSCURED_SHADOW',
        next: null,
        fields: {},
        inputs: {},
        topLevel: false
    });
    b.createBlock({
        id: 'foo3',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {
            subinput: {
                name: 'subinput',
                block: 'foo4',
                shadow: 'foo5'
            }
        },
        topLevel: false
    });
    b.createBlock({
        id: 'foo4',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: false
    });
    b.deleteBlock('foo');
    expect(typeof b._blocks.foo).toBe('undefined');
    expect(typeof b._blocks.foo2).toBe('undefined');
    expect(typeof b._blocks.foo3).toBe('undefined');
    expect(typeof b._blocks.foo4).toBe('undefined');
    expect(typeof b._blocks.foo5).toBe('undefined');
    expect(b._scripts.indexOf('foo')).toBe(-1);
    expect(Object.keys(b._blocks).length).toBe(0);
    expect(b._scripts.length).toBe(0);
});

test('updateAssetName function updates name in sound field', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'foo',
        fields: {
            SOUND_MENU: {
                name: 'SOUND_MENU',
                value: 'name1'
            }
        }
    });
    expect(b.getBlock('foo').fields.SOUND_MENU.value).toBe('name1');
    b.updateAssetName('name1', 'name2', 'sound');
    expect(b.getBlock('foo').fields.SOUND_MENU.value).toBe('name2');
});

test('updateAssetName function updates name in costume field', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'foo',
        fields: {
            COSTUME: {
                name: 'COSTUME',
                value: 'name1'
            }
        }
    });
    expect(b.getBlock('foo').fields.COSTUME.value).toBe('name1');
    b.updateAssetName('name1', 'name2', 'costume');
    expect(b.getBlock('foo').fields.COSTUME.value).toBe('name2');
});

test('updateAssetName function updates name in backdrop field', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'foo',
        fields: {
            BACKDROP: {
                name: 'BACKDROP',
                value: 'name1'
            }
        }
    });
    expect(b.getBlock('foo').fields.BACKDROP.value).toBe('name1');
    b.updateAssetName('name1', 'name2', 'backdrop');
    expect(b.getBlock('foo').fields.BACKDROP.value).toBe('name2');
});

test('updateAssetName function updates name in all sprite fields', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'id1',
        fields: {
            TOWARDS: {
                name: 'TOWARDS',
                value: 'name1'
            }
        }
    });
    b.createBlock({
        id: 'id2',
        fields: {
            TO: {
                name: 'TO',
                value: 'name1'
            }
        }
    });
    b.createBlock({
        id: 'id3',
        fields: {
            OBJECT: {
                name: 'OBJECT',
                value: 'name1'
            }
        }
    });
    b.createBlock({
        id: 'id4',
        fields: {
            VIDEOONMENU2: {
                name: 'VIDEOONMENU2',
                value: 'name1'
            }
        }
    });
    b.createBlock({
        id: 'id5',
        fields: {
            DISTANCETOMENU: {
                name: 'DISTANCETOMENU',
                value: 'name1'
            }
        }
    });
    b.createBlock({
        id: 'id6',
        fields: {
            TOUCHINGOBJECTMENU: {
                name: 'TOUCHINGOBJECTMENU',
                value: 'name1'
            }
        }
    });
    b.createBlock({
        id: 'id7',
        fields: {
            CLONE_OPTION: {
                name: 'CLONE_OPTION',
                value: 'name1'
            }
        }
    });
    expect(b.getBlock('id1').fields.TOWARDS.value).toBe('name1');
    expect(b.getBlock('id2').fields.TO.value).toBe('name1');
    expect(b.getBlock('id3').fields.OBJECT.value).toBe('name1');
    expect(b.getBlock('id4').fields.VIDEOONMENU2.value).toBe('name1');
    expect(b.getBlock('id5').fields.DISTANCETOMENU.value).toBe('name1');
    expect(b.getBlock('id6').fields.TOUCHINGOBJECTMENU.value).toBe('name1');
    expect(b.getBlock('id7').fields.CLONE_OPTION.value).toBe('name1');
    b.updateAssetName('name1', 'name2', 'sprite');
    expect(b.getBlock('id1').fields.TOWARDS.value).toBe('name2');
    expect(b.getBlock('id2').fields.TO.value).toBe('name2');
    expect(b.getBlock('id3').fields.OBJECT.value).toBe('name2');
    expect(b.getBlock('id4').fields.VIDEOONMENU2.value).toBe('name2');
    expect(b.getBlock('id5').fields.DISTANCETOMENU.value).toBe('name2');
    expect(b.getBlock('id6').fields.TOUCHINGOBJECTMENU.value).toBe('name2');
    expect(b.getBlock('id7').fields.CLONE_OPTION.value).toBe('name2');
});

test('updateAssetName function updates name according to asset type', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'id1',
        fields: {
            SOUND_MENU: {
                name: 'SOUND_MENU',
                value: 'name1'
            }
        }
    });
    b.createBlock({
        id: 'id2',
        fields: {
            COSTUME: {
                name: 'COSTUME',
                value: 'name1'
            }
        }
    });
    expect(b.getBlock('id1').fields.SOUND_MENU.value).toBe('name1');
    expect(b.getBlock('id2').fields.COSTUME.value).toBe('name1');
    b.updateAssetName('name1', 'name2', 'sound');
    // only sound should get renamed
    expect(b.getBlock('id1').fields.SOUND_MENU.value).toBe('name2');
    expect(b.getBlock('id2').fields.COSTUME.value).toBe('name1');
});

test('updateAssetName only updates given name', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'id1',
        fields: {
            COSTUME: {
                name: 'COSTUME',
                value: 'name1'
            }
        }
    });
    b.createBlock({
        id: 'id2',
        fields: {
            COSTUME: {
                name: 'COSTUME',
                value: 'foo'
            }
        }
    });
    expect(b.getBlock('id1').fields.COSTUME.value).toBe('name1');
    expect(b.getBlock('id2').fields.COSTUME.value).toBe('foo');
    b.updateAssetName('name1', 'name2', 'costume');
    expect(b.getBlock('id1').fields.COSTUME.value).toBe('name2');
    expect(b.getBlock('id2').fields.COSTUME.value).toBe('foo');
});

test('updateAssetName doesn\'t update name if name isn\'t being used', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'id1',
        fields: {
            BACKDROP: {
                name: 'BACKDROP',
                value: 'foo'
            }
        }
    });
    expect(b.getBlock('id1').fields.BACKDROP.value).toBe('foo');
    b.updateAssetName('name1', 'name2', 'backdrop');
    expect(b.getBlock('id1').fields.BACKDROP.value).toBe('foo');
});

test('updateSensingOfReference renames variables in sensing_of block', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'id1',
        opcode: 'sensing_of',
        fields: {
            PROPERTY: {
                name: 'PROPERTY',
                value: 'foo'
            }
        },
        inputs: {
            OBJECT: {
                name: 'OBJECT',
                block: 'id2',
                shadow: 'id2'
            }
        }
    });
    b.createBlock({
        id: 'id2',
        fields: {
            OBJECT: {
                name: 'OBJECT',
                value: '_stage_'
            }
        }
    });
    expect(b.getBlock('id1').fields.PROPERTY.value).toBe('foo');
    b.updateSensingOfReference('foo', 'bar', '_stage_');
    expect(b.getBlock('id1').fields.PROPERTY.value).toBe('bar');
});

test('updateSensingOfReference doesn\'t rename if block is inserted', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'id1',
        opcode: 'sensing_of',
        fields: {
            PROPERTY: {
                name: 'PROPERTY',
                value: 'foo'
            }
        },
        inputs: {
            OBJECT: {
                name: 'OBJECT',
                block: 'id3',
                shadow: 'id2'
            }
        }
    });
    b.createBlock({
        id: 'id2',
        fields: {
            OBJECT: {
                name: 'OBJECT',
                value: '_stage_'
            }
        }
    });
    b.createBlock({
        id: 'id3',
        opcode: 'answer'
    });
    expect(b.getBlock('id1').fields.PROPERTY.value).toBe('foo');
    b.updateSensingOfReference('foo', 'bar', '_stage_');
    expect(b.getBlock('id1').fields.PROPERTY.value).toBe('foo');
});

test('updateSensingOfReference doesn\'t rename if name is not being used', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'id1',
        opcode: 'sensing_of',
        fields: {
            PROPERTY: {
                name: 'PROPERTY',
                value: 'foo'
            }
        },
        inputs: {
            OBJECT: {
                name: 'OBJECT',
                block: 'id2',
                shadow: 'id2'
            }
        }
    });
    b.createBlock({
        id: 'id2',
        fields: {
            OBJECT: {
                name: 'OBJECT',
                value: '_stage_'
            }
        }
    });
    expect(b.getBlock('id1').fields.PROPERTY.value).toBe('foo');
    b.updateSensingOfReference('meow', 'meow2', '_stage_');
    expect(b.getBlock('id1').fields.PROPERTY.value).toBe('foo');
});

test('updateSensingOfReference doesn\'t rename other targets\' variables', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'id1',
        opcode: 'sensing_of',
        fields: {
            PROPERTY: {
                name: 'PROPERTY',
                value: 'foo'
            }
        },
        inputs: {
            OBJECT: {
                name: 'OBJECT',
                block: 'id2',
                shadow: 'id2'
            }
        }
    });
    b.createBlock({
        id: 'id2',
        fields: {
            OBJECT: {
                name: 'OBJECT',
                value: '_stage_'
            }
        }
    });
    expect(b.getBlock('id1').fields.PROPERTY.value).toBe('foo');
    b.updateSensingOfReference('foo', 'bar', 'Cat');
    expect(b.getBlock('id1').fields.PROPERTY.value).toBe('foo');
});

test('updateTargetSpecificBlocks changes sprite clicked hat to stage clicked for stage', () => {
    const b = new Blocks(new Runtime());
    b.createBlock({
        id: 'originallySpriteClicked',
        opcode: 'event_whenthisspriteclicked'
    });
    b.createBlock({
        id: 'originallyStageClicked',
        opcode: 'event_whenstageclicked'
    });

    // originallySpriteClicked does not update when on a non-stage target
    b.updateTargetSpecificBlocks(false /* isStage */);
    expect(b.getBlock('originallySpriteClicked').opcode).toBe('event_whenthisspriteclicked');

    // originallySpriteClicked does update when on a stage target
    b.updateTargetSpecificBlocks(true /* isStage */);
    expect(b.getBlock('originallySpriteClicked').opcode).toBe('event_whenstageclicked');

    // originallyStageClicked does not update when on a stage target
    b.updateTargetSpecificBlocks(true /* isStage */);
    expect(b.getBlock('originallyStageClicked').opcode).toBe('event_whenstageclicked');

    // originallyStageClicked does update when on a non-stage target
    b.updateTargetSpecificBlocks(false/* isStage */);
    expect(b.getBlock('originallyStageClicked').opcode).toBe('event_whenthisspriteclicked');
});

test('getAllVariableAndListReferences returns an empty map references when variable blocks do not exist', () => {
    const b = new Blocks(new Runtime());
    expect(Object.keys(b.getAllVariableAndListReferences()).length).toBe(0);
});

test('getAllVariableAndListReferences returns references when variable blocks exist', () => {
    const b = new Blocks(new Runtime());

    let varListRefs = b.getAllVariableAndListReferences();
    expect(Object.keys(varListRefs).length).toBe(0);

    b.createBlock(adapter(events.mockVariableBlock)[0]);
    b.createBlock(adapter(events.mockListBlock)[0]);

    varListRefs = b.getAllVariableAndListReferences();
    expect(Object.keys(varListRefs).length).toBe(2);
    expect(Array.isArray(varListRefs['mock var id'])).toBe(true);
    expect(varListRefs['mock var id'].length).toBe(1);
    expect(varListRefs['mock var id'][0].type).toBe(Variable.SCALAR_TYPE);
    expect(varListRefs['mock var id'][0].referencingField.value).toBe('a mock variable');
    expect(Array.isArray(varListRefs['mock list id'])).toBe(true);
    expect(varListRefs['mock list id'].length).toBe(1);
    expect(varListRefs['mock list id'][0].type).toBe(Variable.LIST_TYPE);
    expect(varListRefs['mock list id'][0].referencingField.value).toBe('a mock list');
});

test('getAllVariableAndListReferences does not return broadcast blocks if the flag is left out', () => {
    const b = new Blocks(new Runtime());
    b.createBlock(adapter(events.mockBroadcastBlock)[0]);
    b.createBlock(adapter(events.mockBroadcastBlock)[1]);

    expect(Object.keys(b.getAllVariableAndListReferences()).length).toBe(0);
});

test('getAllVariableAndListReferences returns broadcast when we tell it to', () => {
    const b = new Blocks(new Runtime());

    b.createBlock(adapter(events.mockVariableBlock)[0]);
    // Make the broadcast block and its shadow (which includes the actual broadcast field).
    b.createBlock(adapter(events.mockBroadcastBlock)[0]);
    b.createBlock(adapter(events.mockBroadcastBlock)[1]);

    const varListRefs = b.getAllVariableAndListReferences(null, true);

    expect(Object.keys(varListRefs).length).toBe(2);
    expect(Array.isArray(varListRefs['mock var id'])).toBe(true);
    expect(varListRefs['mock var id'].length).toBe(1);
    expect(varListRefs['mock var id'][0].type).toBe(Variable.SCALAR_TYPE);
    expect(varListRefs['mock var id'][0].referencingField.value).toBe('a mock variable');
    expect(Array.isArray(varListRefs['mock broadcast message id'])).toBe(true);
    expect(varListRefs['mock broadcast message id'].length).toBe(1);
    expect(varListRefs['mock broadcast message id'][0].type).toBe(Variable.BROADCAST_MESSAGE_TYPE);
    expect(varListRefs['mock broadcast message id'][0].referencingField.value).toBe('my message');
});
