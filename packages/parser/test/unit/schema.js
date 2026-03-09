const ajv = require('ajv')();
const test = require('tap').test;
const meta = require('../fixtures/meta.json');
const schema = require('../../lib/sb2_schema.json');

test('spec', t => {
    t.type(schema, 'object');
    t.end();
});

test('is valid', t => {
    // Validate schema against the JSON meta schema:
    // http://json-schema.org/draft-04/schema#
    const validate = ajv.compile(meta);
    const valid = validate(schema);

    t.equal(valid, true);
    t.end();
});
