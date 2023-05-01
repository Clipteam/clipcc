const path = require('path');
const makeTestStorage = require('../fixtures/make-test-storage');
const extractProjectJson = require('../fixtures/readProjectFile').extractProjectJson;

const renderedTarget = require('../../src/sprites/rendered-target');
const runtime = require('../../src/engine/runtime');
const sb2 = require('../../src/serialization/sb2');

test('spec', () => {
    expect(typeof sb2.deserialize).toBe('function');
});

test('default', done => {
    // Get SB2 JSON (string)
    const uri = path.resolve(__dirname, '../fixtures/default.sb2');
    const json = extractProjectJson(uri);

    // Create runtime instance & load SB2 into it
    const rt = new runtime();
    rt.attachStorage(makeTestStorage());
    sb2.deserialize(json, rt).then(({targets}) => {
        // Test
        expect(typeof json).toBe('object');
        expect(typeof rt).toBe('object');
        expect(typeof targets).toBe('object');

        expect(targets[0] instanceof renderedTarget).toBeTruthy();
        expect(typeof targets[0].id).toBe('string');
        expect(typeof targets[0].blocks).toBe('object');
        expect(typeof targets[0].variables).toBe('object');
        expect(typeof targets[0].comments).toBe('object');

        expect(targets[0].isOriginal).toBe(true);
        expect(targets[0].currentCostume).toBe(0);
        expect(targets[0].isOriginal).toBe(true);
        expect(targets[0].isStage).toBe(true);

        expect(targets[1] instanceof renderedTarget).toBeTruthy();
        expect(typeof targets[1].id).toBe('string');
        expect(typeof targets[1].blocks).toBe('object');
        expect(typeof targets[1].variables).toBe('object');
        expect(typeof targets[1].comments).toBe('object');

        expect(targets[1].isOriginal).toBe(true);
        expect(targets[1].currentCostume).toBe(0);
        expect(targets[1].isOriginal).toBe(true);
        expect(targets[1].isStage).toBe(false);
        done();
    });
});
