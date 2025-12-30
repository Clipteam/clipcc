const test = require('tap').test;
const data = require('../fixtures/data');
const validate = require('../../lib/validate');

test('spec', t => {
    t.type(validate, 'function');
    t.end();
});

test('valid sb2 project', t => {
    validate(false, JSON.parse(data.example.json), (err, res) => {
        t.equal(err, null);
        t.type(res, 'object');
        t.end();
    });
});

test('valid sprite2', t => {
    validate(true, JSON.parse(data.sprites.default_cat_sprite2_json), (err, res) => {
        t.equal(err, null);
        t.type(res, 'object');
        t.end();
    });
});

// Note, the way the sb2/sprite2 validation is written, a valid sb2 project can actually
// validate as a sprite2 file. The opposite should not be true.

test('valid sprite2 is not a valid project', t => {
    validate(false, JSON.parse(data.sprites.default_cat_sprite2_json), (err, res) => {
        t.type(err, 'object');
        t.type(err.validationError, 'string');
        const sb2Errs = err.sb2Errors;
        t.equal(Array.isArray(sb2Errs), true);
        t.type(res, 'undefined');
        t.end();
    });
});

test('invalid, whole project', t => {
    validate(false, {foo: 1}, (err, res) => {
        t.type(err, 'object');
        t.type(err.validationError, 'string');
        const sb2Errs = err.sb2Errors;
        t.equal(Array.isArray(sb2Errs), true);
        t.type(res, 'undefined');
        t.type(sb2Errs[0], 'object');
        t.type(sb2Errs[0].keyword, 'string');
        t.type(sb2Errs[0].instancePath, 'string');
        t.type(sb2Errs[0].schemaPath, 'string');
        t.type(sb2Errs[0].message, 'string');
        t.type(sb2Errs[0].params, 'object');
        t.type(sb2Errs[0].params.missingProperty, 'string');
        t.end();
    });
});

test('invalid, sprite', t => {
    validate(true, {foo: 1}, (err, res) => {
        t.type(err, 'object');
        t.type(err.validationError, 'string');
        const sb2Errs = err.sb2Errors;
        t.equal(Array.isArray(sb2Errs), true);
        t.type(res, 'undefined');
        t.type(sb2Errs[0], 'object');
        t.type(sb2Errs[0].keyword, 'string');
        t.type(sb2Errs[0].instancePath, 'string');
        t.type(sb2Errs[0].schemaPath, 'string');
        t.type(sb2Errs[0].message, 'string');
        t.type(sb2Errs[0].params, 'object');
        t.type(sb2Errs[0].params.missingProperty, 'string');
        t.end();
    });
});

// Test layer order rules
test('sb3 json with valid layerOrder props for stage and sprites', t => {
    validate(false, JSON.parse(data.layerOrderSB3Json), (err, res) => {
        t.equal(err, null);
        t.type(res, 'object');
        t.end();
    });
});

test('sb3 json with invalid layerOrder prop for stage', t => {
    validate(false, JSON.parse(data.invalidStageLayerSB3Json), (err, res) => {
        t.type(err, 'object');
        t.type(res, 'undefined');
        t.end();
    });
});

test('sb3 json with invalid layerOrder prop for sprite', t => {
    validate(false, JSON.parse(data.invalidSpriteLayerSB3Json), (err, res) => {
        t.type(err, 'object');
        t.type(res, 'undefined');
        t.end();
    });
});

// Sprites should not be named _stage_
test('sb3 json with invalid sprite name', t => {
    validate(false, JSON.parse(data.invalidSpriteNameSB3Json), (err, res) => {
        t.type(err, 'object');
        t.type(res, 'undefined');
        t.end();
    });
});
