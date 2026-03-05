const fs = require('fs');
const path = require('path');
const test = require('tap').test;
const JSZip = require('jszip');
const unpack = require('../../lib/unpack');

const fixtures = {
    sb: path.resolve(__dirname, '../fixtures/data/_example.sb'),
    sb2: path.resolve(__dirname, '../fixtures/data/_example.sb2'),
    json: path.resolve(__dirname, '../fixtures/data/_example.json')
};

for (const i in fixtures) {
    fixtures[i] = fs.readFileSync(fixtures[i]);
}

test('spec', t => {
    t.type(unpack, 'function');
    t.end();
});

test('sb', t => {
    const buffer = new Buffer(fixtures.sb);
    unpack(buffer, false, (err, res) => {
        t.type(err, 'string');
        t.type(res, 'undefined');
        t.end();
    });
});

test('sb2', t => {
    const buffer = new Buffer(fixtures.sb2);
    unpack(buffer, false, (err, res) => {
        t.equal(err, null);
        t.equal(Array.isArray(res), true);
        t.type(res[0], 'string');
        t.doesNotThrow(() => {
            JSON.parse(res[0]);
        });
        t.equal(res[1] instanceof JSZip, true);
        t.end();
    });
});

test('sb2 does not validate as sprite', t => {
    const buffer = new Buffer(fixtures.sb2);
    unpack(buffer, true, (err, res) => {
        t.type(err, 'string');
        t.type(res, 'undefined');
        t.end();
    });
});

test('json', t => {
    const buffer = new Buffer(fixtures.json);
    unpack(buffer, false, (err, res) => {
        t.equal(err, null);
        t.equal(Array.isArray(res), true);
        t.type(res[0], 'string');
        t.doesNotThrow(() => {
            JSON.parse(res[0]);
        });
        t.equal(res[1], null);
        t.end();
    });
});

test('json utf-8 string', t => {
    const buffer = new Buffer(fixtures.json);
    unpack(buffer.toString('utf-8'), false, (err, res) => {
        t.equal(err, null);
        t.equal(Array.isArray(res), true);
        t.type(res[0], 'string');
        t.doesNotThrow(() => {
            JSON.parse(res[0]);
        });
        t.equal(res[1], null);
        t.end();
    });
});

test('invalid string', t => {
    unpack('this is not json', false, (err, res) => {
        t.equal(err, null);
        t.equal(Array.isArray(res), true);
        t.type(res[0], 'string');
        t.throws(() => {
            JSON.parse(res[0]);
        });
        t.equal(res[1], null);
    });
    unpack('this is not json', true, (err, res) => {
        t.equal(err, null);
        t.equal(Array.isArray(res), true);
        t.type(res[0], 'string');
        t.throws(() => {
            JSON.parse(res[0]);
        });
        t.equal(res[1], null);
        t.end();
    });
});

test('undefined', t => {
    let foo;
    unpack(false, foo, (err, res) => {
        t.type(err, 'string');
        t.type(res, 'undefined');
        t.end();
    });
});

test('null', t => {
    unpack(false, null, (err, obj) => {
        t.type(err, 'string');
        t.type(obj, 'undefined');
        t.end();
    });
});

test('object', t => {
    unpack(false, {}, (err, obj) => {
        t.type(err, 'string');
        t.type(obj, 'undefined');
        t.end();
    });
});
