const test = require('tap').test;
const JSZip = require('jszip');
const data = require('../fixtures/data');
const parser = require('../../index');

test('sb', t => {
    parser(data.example.sb, false, (err, res) => {
        t.type(err, 'string');
        t.type(res, 'undefined');
        t.end();
    });
});

test('sb2', t => {
    parser(data.example.sb2, false, (err, result) => {
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
    parser(data.example.json, false, (err, result) => {
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
    parser(data.example.json.toString('utf-8'), false, (err, result) => {
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

test('invalid empty project archive', t => {
    const msg = 'Failed to unzip and extract project.json, with error: ';
    parser(data.example.invalidEmpty, false, (err, result) => {
        t.type(err, 'string');
        t.equal(err.startsWith(msg), true);
        t.type(result, 'undefined');
        t.end();
    });
});
