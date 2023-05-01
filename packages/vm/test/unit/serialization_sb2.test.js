const path = require('path');
const extractProjectJson = require('../fixtures/readProjectFile').extractProjectJson;

const RenderedTarget = require('../../src/sprites/rendered-target');
const Runtime = require('../../src/engine/runtime');
const sb2 = require('../../src/serialization/sb2');

test('spec', () => {
    expect(typeof sb2).toBe('object');
    expect(typeof sb2.deserialize).toBe('function');
});

test('default', done => {
    // Get SB2 JSON (string)
    const uri = path.resolve(__dirname, '../fixtures/default.sb2');
    const json = extractProjectJson(uri);

    // Create runtime instance & load SB2 into it
    const rt = new Runtime();
    sb2.deserialize(json, rt).then(({targets}) => {
        // Test
        expect(typeof json).toBe('object');
        expect(typeof rt).toBe('object');
        expect(typeof targets).toBe('object');

        expect(targets[0] instanceof RenderedTarget).toBeTruthy();
        expect(typeof targets[0].id).toBe('string');
        expect(typeof targets[0].blocks).toBe('object');
        expect(typeof targets[0].variables).toBe('object');
        expect(typeof targets[0].comments).toBe('object');

        expect(targets[0].isOriginal).toBe(true);
        expect(targets[0].currentCostume).toBe(0);
        expect(targets[0].isOriginal).toBe(true);
        expect(targets[0].isStage).toBe(true);

        expect(targets[1] instanceof RenderedTarget).toBeTruthy();
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

test('data scoping', done => {
    // Get SB2 JSON (string)
    const uri = path.resolve(__dirname, '../fixtures/data.sb2');
    const json = extractProjectJson(uri);

    // Create runtime instance & load SB2 into it
    const rt = new Runtime();
    sb2.deserialize(json, rt).then(({targets}) => {
        const globalVariableIds = Object.keys(targets[0].variables);
        const localVariableIds = Object.keys(targets[1].variables);
        expect(targets[0].variables[globalVariableIds[0]].name).toBe('foo');
        expect(targets[1].variables[localVariableIds[0]].name).toBe('local');
        done();
    });
});

test('whenclicked blocks imported separately', done => {
    // This sb2 fixture has a single "whenClicked" block on both sprite and stage
    const uri = path.resolve(__dirname, '../fixtures/when-clicked.sb2');
    const json = extractProjectJson(uri);

    // Create runtime instance & load SB2 into it
    const rt = new Runtime();
    sb2.deserialize(json, rt).then(({targets}) => {
        const stage = targets[0];
        expect(stage.isStage).toBe(true); // Make sure we have the correct target
        const stageOpcode = stage.blocks.getBlock(stage.blocks.getScripts()[0]).opcode;
        expect(stageOpcode).toBe('event_whenstageclicked');

        const sprite = targets[1];
        expect(sprite.isStage).toBe(false); // Make sure we have the correct target
        const spriteOpcode = sprite.blocks.getBlock(sprite.blocks.getScripts()[0]).opcode;
        expect(spriteOpcode).toBe('event_whenthisspriteclicked');

        done();
    });
});

test('Ordering', done => {
    // This SB2 has 3 sprites that have been reordered in scratch 2
    // so the order in the file is not the order specified by the indexInLibrary property.
    const uri = path.resolve(__dirname, '../fixtures/ordering.sb2');
    const json = extractProjectJson(uri);
    const rt = new Runtime();
    sb2.deserialize(json, rt).then(({targets}) => {
        // Would fail with any other ordering.
        expect(targets[1].sprite.name).toBe('First');
        expect(targets[2].sprite.name).toBe('Second');
        expect(targets[3].sprite.name).toBe('Third');
        done();
    });
});
