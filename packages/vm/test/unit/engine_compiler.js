const test = require('tap');

const Compiler = require('../../src/engine/compiler');
const Runtime = require('../../src/engine/runtime');

test('spec', t => {
    t.type(Compiler, 'function');
    
    const r = new Runtime();
    const c = new Compiler(r);

    t.type(c, 'object');
    t.ok(s instanceof Compiler);
    
    t.type(c.compileThread, 'function');

    t.end();
})
const randomString = function () {
    const top = Math.random().toString(36);
    return top.substring(7);
};
