import path from 'path';
import {test} from '../fixtures/jest-tap-bridge.js';
import makeTestStorage from '../fixtures/make-test-storage.js';
import {extractProjectJson} from '../fixtures/readProjectFile.js';
import renderedTarget from '../../src/sprites/rendered-target';
import runtime from '../../src/engine/runtime';
import {deserialize} from '../../src/serialization/sb2.js';

test('spec', t => {
    t.type(deserialize, 'function');
    t.end();
});

test('default', t => {
    // Get SB2 JSON (string)
    const uri = path.resolve(__dirname, '../fixtures/default.sb2');
    const json = extractProjectJson(uri);

    // Create runtime instance & load SB2 into it
    const rt = new runtime();
    rt.attachStorage(makeTestStorage());
    deserialize(json, rt).then(({targets}) => {
        // Test
        t.type(json, 'object');
        t.type(rt, 'object');
        t.type(targets, 'object');

        t.ok(targets[0] instanceof renderedTarget);
        t.type(targets[0].id, 'string');
        t.type(targets[0].blocks, 'object');
        t.type(targets[0].variables, 'object');
        t.type(targets[0].comments, 'object');

        t.equal(targets[0].isOriginal, true);
        t.equal(targets[0].currentCostume, 0);
        t.equal(targets[0].isOriginal, true);
        t.equal(targets[0].isStage, true);

        t.ok(targets[1] instanceof renderedTarget);
        t.type(targets[1].id, 'string');
        t.type(targets[1].blocks, 'object');
        t.type(targets[1].variables, 'object');
        t.type(targets[1].comments, 'object');

        t.equal(targets[1].isOriginal, true);
        t.equal(targets[1].currentCostume, 0);
        t.equal(targets[1].isOriginal, true);
        t.equal(targets[1].isStage, false);
        t.end();
    });
});
