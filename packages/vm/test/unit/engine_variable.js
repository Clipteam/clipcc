const test = require('tap').test;
const Variable = require('../../src/engine/variable');
const htmlparser = require('htmlparser2');

test('spec', t => {
    t.type(typeof Variable.SCALAR_TYPE, typeof Variable.LIST_TYPE);
    t.type(typeof Variable.SCALAR_TYPE, typeof Variable.BROADCAST_MESSAGE_TYPE);

    const varId = 'varId';
    const varName = 'varName';
    const varIsCloud = false;
    let v = new Variable(
        varId,
        varName,
        Variable.SCALAR_TYPE,
        varIsCloud
    );

    t.type(Variable, 'function');
    t.type(v, 'object');
    t.ok(v instanceof Variable);

    t.equal(v.id, varId);
    t.equal(v.name, varName);
    t.equal(v.type, Variable.SCALAR_TYPE);
    t.type(v.value, 'number');
    t.equal(v.isCloud, varIsCloud);

    t.type(v.toJSON, 'function');

    v = new Variable(
        varId,
        varName,
        Variable.LIST_TYPE,
        varIsCloud
    );
    t.ok(Array.isArray(v.value));

    v = new Variable(
        varId,
        varName,
        Variable.BROADCAST_MESSAGE_TYPE,
        varIsCloud
    );
    t.equal(v.value, 'varName');

    t.end();
});

test('toJSON', t => {
    const varId = 'varId';
    const varName = 'varName';
    const varIsCloud = false;
    const varIsLocal = false;
    const v = new Variable(
        varId,
        varName,
        Variable.SCALAR_TYPE,
        varIsCloud
    );

    const varState = v.toJSON(false);
    t.euqal(varState.type, Variable.SCALAR_TYPE);
    t.equal(varState.id, varId);
    t.equal(varState.isCloud, varIsCloud);
    t.equal(varState.isLocal, varIsLocal);
    
    t.end();
});
