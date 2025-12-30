const test = require('tap').test;
const JSZip = require('jszip');
const data = require('../fixtures/data');
const parser = require('../../index');

test('comments sb3', t => {
    parser(data.sb3_comments.comments, false, (err, result) => {
        t.equal(err, null);
        t.equal(Array.isArray(result), true);
        const res = result[0];
        const possibleZip = result[1];
        t.type(res, 'object');
        t.equal(res.projectVersion, 3);
        t.equal(possibleZip instanceof JSZip, true);

        t.type(res.targets[0].comments, 'object');
        t.equal(Object.values(res.targets[0].comments).length, 1);

        t.type(res.targets[1].comments, 'object');
        t.equal(Object.values(res.targets[1].comments).length, 6);

        t.end();
    });
});

test('invalid comments sb3', t => {
    parser(data.sb3_comments.invalid_comments, false, (err, result) => {
        t.type(err, 'object');
        t.type(err.validationError, 'string');

        const sb3Errors = err.sb3Errors;
        t.type(sb3Errors, 'object');
        t.type(sb3Errors[0].keyword, 'string');
        t.type(sb3Errors[0].instancePath, 'string');
        t.match(sb3Errors[0].instancePath, /^\/targets\/1\/comments\/.*\/width$/);
        t.type(sb3Errors[0].schemaPath, 'string');
        t.type(sb3Errors[0].message, 'string');
        t.equal(sb3Errors[0].message, 'must be number');
        t.type(sb3Errors[0].params, 'object');
        t.type(result, 'undefined');

        t.end();
    });
});
