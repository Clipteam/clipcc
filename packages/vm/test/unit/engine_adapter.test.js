const adapter = require('../../src/engine/adapter');
const events = require('../fixtures/events.json');

test('spec', () => {
    expect(typeof adapter).toBe('function');
});

test('invalid inputs', () => {
    let nothing = adapter('not an object');
    expect(typeof nothing).toBe('undefined');
    nothing = adapter({noxmlproperty: true});
    expect(typeof nothing).toBe('undefined');
});

test('create event', () => {
    const result = adapter(events.create);

    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBe(2);

    // Outer block
    expect(typeof result[0].id).toBe('string');
    expect(typeof result[0].opcode).toBe('string');
    expect(typeof result[0].comment).toBe('undefined');
    expect(typeof result[0].fields).toBe('object');
    expect(typeof result[0].inputs).toBe('object');
    expect(typeof result[0].inputs.DURATION).toBe('object');
    expect(typeof result[0].topLevel).toBe('boolean');
    expect(result[0].topLevel).toBe(true);

    // Enclosed shadow block
    expect(typeof result[1].id).toBe('string');
    expect(typeof result[1].opcode).toBe('string');
    expect(typeof result[1].fields).toBe('object');
    expect(typeof result[1].inputs).toBe('object');
    expect(typeof result[1].fields.NUM).toBe('object');
    expect(Number(result[1].fields.NUM.value)).toBe(10);
    expect(typeof result[1].topLevel).toBe('boolean');
    expect(result[1].topLevel).toBe(false);
});

test('create with comment', () => {
    const result = adapter(events.createComment);

    // This test should be the same as above except that it also has a comment.

    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBe(2);

    expect(typeof result[0].comment).toBe('string');
    expect(result[0].comment).toBe('aCommentId');
});

test('create with branch', () => {
    const result = adapter(events.createbranch);
    // Outer block
    expect(typeof result[0].id).toBe('string');
    expect(typeof result[0].opcode).toBe('string');
    expect(typeof result[0].fields).toBe('object');
    expect(typeof result[0].inputs).toBe('object');
    expect(typeof result[0].inputs.SUBSTACK).toBe('object');
    expect(typeof result[0].topLevel).toBe('boolean');
    expect(result[0].topLevel).toBe(true);
    // In branch
    const branchBlockId = result[0].inputs.SUBSTACK.block;
    const branchShadowId = result[0].inputs.SUBSTACK.shadow;
    expect(typeof branchBlockId).toBe('string');
    expect(branchShadowId).toBe(null);
    // Find actual branch block
    let branchBlock = null;
    for (let i = 0; i < result.length; i++) {
        if (result[i].id === branchBlockId) {
            branchBlock = result[i];
        }
    }
    expect(typeof branchBlock).toBe('object');
});

test('create with two branches', () => {
    const result = adapter(events.createtwobranches);
    // Outer block
    expect(typeof result[0].id).toBe('string');
    expect(typeof result[0].opcode).toBe('string');
    expect(typeof result[0].fields).toBe('object');
    expect(typeof result[0].inputs).toBe('object');
    expect(typeof result[0].inputs.SUBSTACK).toBe('object');
    expect(typeof result[0].inputs.SUBSTACK2).toBe('object');
    expect(typeof result[0].topLevel).toBe('boolean');
    expect(result[0].topLevel).toBe(true);
    // In branchs
    const firstBranchBlockId = result[0].inputs.SUBSTACK.block;
    const secondBranchBlockId = result[0].inputs.SUBSTACK2.block;
    expect(typeof firstBranchBlockId).toBe('string');
    expect(typeof secondBranchBlockId).toBe('string');
    const firstBranchShadowBlockId = result[0].inputs.SUBSTACK.shadow;
    const secondBranchShadowBlockId = result[0].inputs.SUBSTACK2.shadow;
    expect(firstBranchShadowBlockId).toBe(null);
    expect(secondBranchShadowBlockId).toBe(null);
    // Find actual branch blocks
    let firstBranchBlock = null;
    let secondBranchBlock = null;
    for (let i = 0; i < result.length; i++) {
        if (result[i].id === firstBranchBlockId) {
            firstBranchBlock = result[i];
        }
        if (result[i].id === secondBranchBlockId) {
            secondBranchBlock = result[i];
        }
    }
    expect(typeof firstBranchBlock).toBe('object');
    expect(typeof secondBranchBlock).toBe('object');
});

test('create with top-level shadow', () => {
    const result = adapter(events.createtoplevelshadow);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBe(1);

    // Outer block
    expect(typeof result[0].id).toBe('string');
    expect(typeof result[0].opcode).toBe('string');
    expect(typeof result[0].fields).toBe('object');
    expect(typeof result[0].inputs).toBe('object');
    expect(typeof result[0].topLevel).toBe('boolean');
    expect(result[0].topLevel).toBe(true);
});

test('create with next connection', () => {
    const result = adapter(events.createwithnext);

    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBe(2);

    // First block
    expect(typeof result[0].id).toBe('string');
    expect(typeof result[0].opcode).toBe('string');
    expect(typeof result[0].fields).toBe('object');
    expect(typeof result[0].inputs).toBe('object');
    expect(typeof result[0].topLevel).toBe('boolean');
    expect(result[0].topLevel).toBe(true);
    expect(typeof result[0].next).toBe('string');
    expect(result[0].next).toBe(result[1].id);

    // Second block
    expect(typeof result[1].id).toBe('string');
    expect(typeof result[1].opcode).toBe('string');
    expect(typeof result[1].fields).toBe('object');
    expect(typeof result[1].inputs).toBe('object');
    expect(typeof result[1].topLevel).toBe('boolean');
    expect(result[1].topLevel).toBe(false);
    expect(result[1].next).toBe(null);
});

test('create with obscured shadow', () => {
    const result = adapter(events.createobscuredshadow);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBe(4);
});

test('create variable with entity in name', () => {
    const result = adapter(events.createvariablewithentity);

    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBe(1);

    expect(typeof result[0].id).toBe('string');
    expect(typeof result[0].opcode).toBe('string');
    expect(typeof result[0].fields).toBe('object');
    expect(typeof result[0].fields.VARIABLE).toBe('object');
    expect(typeof result[0].fields.VARIABLE.value).toBe('string');
    expect(result[0].fields.VARIABLE.value).toBe('this & that');
    expect(typeof result[0].inputs).toBe('object');
    expect(typeof result[0].topLevel).toBe('boolean');
    expect(result[0].topLevel).toBe(true);
});

test('create with invalid block xml', () => {
    // Entirely invalid block XML
    const result = adapter(events.createinvalid);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBe(0);

    // Invalid grandchild tag
    const result2 = adapter(events.createinvalidgrandchild);
    expect(Array.isArray(result2)).toBeTruthy();
    expect(result2.length).toBe(1);
    expect(typeof result2[0].id).toBe('string');
    expect(Object.keys(result2[0].inputs).length).toBe(0);
    expect(Object.keys(result2[0].fields).length).toBe(0);
});

test('create with invalid xml', () => {
    const result = adapter(events.createbadxml);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBe(0);
});

test('create with empty field', () => {
    const result = adapter(events.createemptyfield);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBe(3);
});
