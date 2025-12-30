const test = require('tap').test;
const JSZip = require('jszip');
const data = require('../fixtures/data');
const parser = require('../../index');

test('sb', t => {
    parser(data.empty.sb, false, (err, res) => {
        t.type(err, 'string');
        t.type(res, 'undefined');
        t.end();
    });
});

test('sb2', t => {
    parser(data.empty.sb2, false, (err, result) => {
        t.equal(err, null);
        t.equal(Array.isArray(result), true);
        const res = result[0];
        const possibleZip = result[1];
        t.type(res, 'object');
        t.type(res.info, 'object');
        t.equal(possibleZip instanceof JSZip, true);
        t.end();
    });
});

test('json', t => {
    parser(data.empty.json, false, (err, result) => {
        t.equal(err, null);
        t.equal(Array.isArray(result), true);
        const res = result[0];
        const possibleZip = result[1];
        t.type(res, 'object');
        t.type(res.info, 'object');
        t.equal(possibleZip, null);
        t.end();
    });
});

test('json string', t => {
    parser(data.empty.json.toString('utf-8'), false, (err, result) => {
        t.equal(err, null);
        t.equal(Array.isArray(result), true);
        const res = result[0];
        const possibleZip = result[1];
        t.type(res, 'object');
        t.type(res.info, 'object');
        t.equal(possibleZip, null);
        t.end();
    });
});
