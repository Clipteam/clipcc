const test = require('tap').test;
const JSZip = require('jszip');
const data = require('../fixtures/data');
const parser = require('../../index');

test('default cat sprite2', t => {
    parser(data.sprites.default_cat_sprite2, true, (err, result) => {
        t.equal(err, null);
        t.equal(Array.isArray(result), true);
        const res = result[0];
        const possibleZip = result[1];
        t.type(res, 'object');
        t.equal(res.projectVersion, 2);
        t.equal(possibleZip instanceof JSZip, true);
        t.end();
    });
});

test('example sprite2', t => {
    parser(data.sprites.example_sprite2, true, (err, result) => {
        t.equal(err, null);
        t.equal(Array.isArray(result), true);
        const res = result[0];
        const possibleZip = result[1];
        t.type(res, 'object');
        t.equal(res.projectVersion, 2);
        t.equal(possibleZip instanceof JSZip, true);
        t.end();
    });
});

test('banana sprite2, no sounds', t => {
    parser(data.sprites.bananas_sprite2, true, (err, result) => {
        t.equal(err, null);
        t.equal(Array.isArray(result), true);
        const res = result[0];
        const possibleZip = result[1];
        t.type(res, 'object');
        t.equal(res.projectVersion, 2);
        t.equal(possibleZip instanceof JSZip, true);
        t.end();
    });
});

test('nested banana sprite2', t => {
    parser(data.sprites.bananas_nested_sprite2, true, (err, result) => {
        t.equal(err, null);
        t.equal(Array.isArray(result), true);
        const res = result[0];
        const possibleZip = result[1];
        t.type(res, 'object');
        t.equal(res.projectVersion, 2);
        t.equal(possibleZip instanceof JSZip, true);
        t.end();
    });
});

test('default cat sprite2 json', t => {
    parser(data.sprites.default_cat_sprite2_json, true, (err, result) => {
        t.equal(err, null);
        t.equal(Array.isArray(result), true);
        const res = result[0];
        const possibleZip = result[1];
        t.type(res, 'object');
        t.equal(res.projectVersion, 2);
        t.equal(possibleZip, null);
        t.end();
    });
});

test('default cat sprite2 json', t => {
    parser(data.sprites.example_sprite2_json, true, (err, result) => {
        t.equal(err, null);
        t.equal(Array.isArray(result), true);
        const res = result[0];
        const possibleZip = result[1];
        t.type(res, 'object');
        t.equal(res.projectVersion, 2);
        t.equal(possibleZip, null);
        t.end();
    });
});
