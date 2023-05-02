const newBlockIds = require('../../src/util/new-block-ids');
const simpleStack = require('../fixtures/simple-stack');

let originals;
let newBlocks;

beforeEach(() => {
    originals = simpleStack;
    // Will be mutated so make a copy first
    newBlocks = JSON.parse(JSON.stringify(simpleStack));
    newBlockIds(newBlocks);
});


/**
 * The structure of the simple stack is:
 *      moveTo (looks_size) -> stopAllSounds
 * The list of blocks is
 *      0: moveTo (TO input block: 1, shadow: 2)
 *      1: looks_size (parent: 0)
 *      2: obscured shadow for moveTo input (parent: 0)
 *      3: stopAllSounds (parent: 0)
 * Inspect fixtures/simple-stack for the full object.
 */

test('top-level block IDs have all changed', () => {
    newBlocks.forEach((block, i) => {
        expect(block.id).not.toBe(originals[i].id);
    });
});

test('input reference is maintained on parent for attached block', () => {
    expect(newBlocks[0].inputs.TO.block).toBe(newBlocks[1].id);
});

test('input reference is maintained on parent for obscured shadow', () => {
    expect(newBlocks[0].inputs.TO.shadow).toBe(newBlocks[2].id);
});

test('parent reference is maintained for attached input', () => {
    expect(newBlocks[1].parent).toBe(newBlocks[0].id);
});

test('parent reference is maintained for obscured shadow', () => {
    expect(newBlocks[2].parent).toBe(newBlocks[0].id);
});

test('parent reference is maintained for next block', () => {
    expect(newBlocks[3].parent).toBe(newBlocks[0].id);
});

test('next reference is maintained for previous block', () => {
    expect(newBlocks[0].next).toBe(newBlocks[3].id);
});
