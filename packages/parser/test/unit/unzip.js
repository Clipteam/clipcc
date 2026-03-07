const fs = require('fs');
const path = require('path');
const test = require('tap').test;
const JSZip = require('jszip');
const unzip = require('../../lib/unzip');

const fixtures = {
    sb: path.resolve(__dirname, '../fixtures/data/_example.sb'),
    sb2: path.resolve(__dirname, '../fixtures/data/_example.sb2'),
    zipFakeProjectJSON:
        path.resolve(__dirname, '../fixtures/data/_zipFakeProjectJson.zip'),
    zipNoProjectJSON:
        path.resolve(__dirname, '../fixtures/data/_zipNoProjectJson.zip'),
    sb2Nested: path.resolve(__dirname, '../fixtures/data/_nestedFolder.sb2')
};

for (const i in fixtures) {
    fixtures[i] = fs.readFileSync(fixtures[i]);
}

const errorMessage = 'Failed to unzip and extract project.json';

test('spec', t => {
    t.type(unzip, 'function');
    t.end();
});

test('sb', t => {
    const buffer = new Buffer(fixtures.sb);
    unzip(buffer, false, (err, res) => {
        t.type(err, 'string');
        t.equal(err.startsWith(errorMessage), true);
        t.type(res, 'undefined');
        t.end();
    });
});

test('sb2', t => {
    const buffer = new Buffer(fixtures.sb2);
    unzip(buffer, false, (err, res) => {
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

test('sb2 with nested folder', t => {
    const buffer = new Buffer(fixtures.sb2Nested);
    unzip(buffer, false, (err, res) => {
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

test('zip without project json', t => {
    const buffer = new Buffer(fixtures.zipNoProjectJSON);
    unzip(buffer, false, (err, res) => {
        t.type(err, 'string');
        t.equal(err.startsWith(errorMessage), true);
        t.type(res, 'undefined');
        t.end();
    });
});

test('zip with fake project json', t => {
    const buffer = new Buffer(fixtures.zipFakeProjectJSON);
    unzip(buffer, false, (err, res) => {
        t.equal(err, null);
        t.equal(Array.isArray(res), true);
        t.type(res[0], 'string');
        t.equal(res[0], 'this is not json\n');
        t.throws(() => {
            JSON.parse(res[0]);
        });
        t.equal(res[1] instanceof JSZip, true);
        t.end();
    });
});

const randomString = 'this is not a zip';

test('random string instead of zip, whole project', t => {
    unzip(randomString, false, (err, res) => {
        t.type(err, 'string');
        t.equal(err.startsWith(errorMessage), true);
        t.type(res, 'undefined');
        t.end();
    });
});

test('random string instead of zip, sprite', t => {
    unzip(randomString, true, (err, res) => {
        t.type(err, 'string');
        t.equal(err.startsWith(errorMessage), true);
        t.type(res, 'undefined');
        t.end();
    });
});

test('undefined', t => {
    let foo;
    unzip(foo, false, (err, obj) => {
        t.type(err, 'string');
        t.equal(err.startsWith(errorMessage), true);
        t.type(obj, 'undefined');
        t.end();
    });
});

test('null instead of zip, whole project', t => {
    unzip(null, false, (err, obj) => {
        t.type(err, 'string');
        t.equal(err.startsWith(errorMessage), true);
        t.type(obj, 'undefined');
        t.end();
    });
});

test('null instead of zip, sprite', t => {
    unzip(null, true, (err, obj) => {
        t.type(err, 'string');
        t.equal(err.startsWith(errorMessage), true);
        t.type(obj, 'undefined');
        t.end();
    });
});

test('object instead of zip, whole project', t => {
    unzip({}, false, (err, obj) => {
        t.type(err, 'string');
        t.equal(err.startsWith(errorMessage), true);
        t.type(obj, 'undefined');
        t.end();
    });
});

test('object instead of zip, sprite', t => {
    unzip({}, true, (err, obj) => {
        t.type(err, 'string');
        t.equal(err.startsWith(errorMessage), true);
        t.type(obj, 'undefined');
        t.end();
    });
});
