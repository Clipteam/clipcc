const Target = require('../../src/engine/target');
const Runtime = require('../../src/engine/runtime');
const VariableUtil = require('../../src/util/variable-util');

let target1;
let target2;

beforeEach(() => {
    const runtime = new Runtime();
    target1 = new Target(runtime);
    target1.blocks.createBlock({
        id: 'a block',
        fields: {
            VARIABLE: {
                id: 'id1',
                value: 'foo'
            }
        }
    });
    target1.blocks.createBlock({
        id: 'another block',
        fields: {
            TEXT: {
                value: 'not a variable'
            }
        }
    });

    target2 = new Target(runtime);
    target2.blocks.createBlock({
        id: 'a different block',
        fields: {
            VARIABLE: {
                id: 'id2',
                value: 'bar'
            }
        }
    });
    target2.blocks.createBlock({
        id: 'another var block',
        fields: {
            VARIABLE: {
                id: 'id1',
                value: 'foo'
            }
        }
    });

    return Promise.resolve(null);
});

test('get all var refs', done => {
    const allVarRefs = VariableUtil.getAllVarRefsForTargets([target1, target2]);
    expect(Object.keys(allVarRefs).length).toBe(2);
    expect(allVarRefs.id1.length).toBe(2);
    expect(allVarRefs.id2.length).toBe(1);
    expect(allVarRefs['not a variable']).toBe(undefined);
    done();
});

test('merge variable ids', done => {
    // Redo the id for the variable with 'id1'
    VariableUtil.updateVariableIdentifiers(target1.blocks.getAllVariableAndListReferences().id1, 'renamed id');
    const varField = target1.blocks.getBlock('a block').fields.VARIABLE;
    expect(varField.id).toBe('renamed id');
    expect(varField.value).toBe('foo');
    done();
});

test('merge variable ids but with new name too', done => {
    // Redo the id for the variable with 'id1'
    VariableUtil.updateVariableIdentifiers(target1.blocks.getAllVariableAndListReferences().id1, 'renamed id', 'baz');
    const varField = target1.blocks.getBlock('a block').fields.VARIABLE;
    expect(varField.id).toBe('renamed id');
    expect(varField.value).toBe('baz');
    done();
});
