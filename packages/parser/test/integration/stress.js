const test = require('tap').test;
const JSZip = require('jszip');
const data = require('../fixtures/data');
const parser = require('../../index');

test('sb', t => {
    const set = data.sb;
    t.plan(set.length * 2);
    for (const i in data.sb) {
        parser(data.sb[i], false, (err, res) => {
            t.type(err, 'string');
            t.type(res, 'undefined');
        });
    }
});

test('sb2', t => {
    const set = data.sb2;
    t.plan(set.length * 5);
    for (const i in data.sb2) {
        parser(data.sb2[i], false, (err, result) => {
            t.equal(err, null);
            t.equal(Array.isArray(result), true);
            const res = result[0];
            const possibleZip = result[1];
            t.type(res, 'object');
            t.type(res.info, 'object');
            t.equal(possibleZip instanceof JSZip, true);
        });
    }
});

test('sb3', t => {
    const set = data.sb3;
    t.plan(set.length * 5);
    for (const i in data.sb3) {
        parser(data.sb3[i], false, (err, result) => {
            t.equal(err, null);
            t.equal(Array.isArray(result), true);
            const res = result[0];
            const possibleZip = result[1];
            t.type(res, 'object');
            t.type(res.targets, 'object');
            t.equal(possibleZip instanceof JSZip, true);
        });
    }
});

test('json', t => {
    const set = data.json;
    t.plan(set.length * 6);
    for (const i in data.json) {
        parser(data.json[i], false, (err, result) => {
            t.equal(err, null);
            t.equal(Array.isArray(result), true);
            const res = result[0];
            const possibleZip = result[1];
            t.type(res, 'object');
            t.type(res.projectVersion, 'number');
            if (res.projectVersion === 2) {
                t.type(res.info, 'object');
            } else if (res.projectVersion === 3) {
                t.type(res.info, 'undefined');
            }
            t.equal(possibleZip, null);
        });
    }
});

test('json string', t => {
    const set = data.json;
    t.plan(set.length * 6);
    for (const i in data.json) {
        parser(data.json[i].toString('utf-8'), false, (err, result) => {
            t.equal(err, null);
            t.equal(Array.isArray(result), true);
            const res = result[0];
            const possibleZip = result[1];
            t.type(res, 'object');
            t.type(res.projectVersion, 'number');
            if (res.projectVersion === 2) {
                t.type(res.info, 'object');
            } else if (res.projectVersion === 3) {
                t.type(res.info, 'undefined');
            }
            t.equal(possibleZip, null);
        });
    }
});
