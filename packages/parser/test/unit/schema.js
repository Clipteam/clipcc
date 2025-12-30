const Ajv = require('ajv').default;
const addFormats = require('ajv-formats').default;
const test = require('tap').test;
const schema = require('../../lib/sb2_schema.json');
const sb2Defs = require('../../lib/sb2_definitions.json');
const sb3Defs = require('../../lib/sb3_definitions.json');

test('spec', t => {
    t.type(schema, 'object');
    t.end();
});

test('is valid', t => {
    // Validate that the schema compiles successfully
    // ajv v8 has draft-07 meta-schema built-in
    const ajv = new Ajv({strict: false});
    addFormats(ajv);
    
    // Add the definition schemas that sb2_schema references
    ajv.addSchema(sb2Defs);
    ajv.addSchema(sb3Defs);
    
    t.doesNotThrow(() => {
        ajv.compile(schema);
    }, 'schema should compile without errors');
    
    t.end();
});
